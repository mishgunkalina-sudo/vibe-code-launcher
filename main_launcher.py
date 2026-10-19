# -*- coding: utf-8 -*-
"""
Vibe Code Launcher - Native Desktop Host
Real native window powered by WebView2 EdgeChromium with hardware acceleration.
Zero AI-slop, clean native window, instant performance.
"""

import os
import sys
import json
import time
import socket
import webbrowser
import subprocess
import threading
import shutil
import base64
import mimetypes
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

# Paths & Directories
APP_DATA_DIR = Path(os.environ.get("APPDATA", ".")) / "VibeCodeLauncher"
APP_DATA_DIR.mkdir(parents=True, exist_ok=True)
STATE_FILE = APP_DATA_DIR / "state.json"
APPS_INSTALL_DIR = APP_DATA_DIR / "apps"
APPS_INSTALL_DIR.mkdir(parents=True, exist_ok=True)
WALLPAPERS_DIR = APP_DATA_DIR / "wallpapers"
WALLPAPERS_DIR.mkdir(parents=True, exist_ok=True)
WEBVIEW_PROFILE_DIR = APP_DATA_DIR / "webview_profile"
WEBVIEW_PROFILE_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = APP_DATA_DIR / "launcher.log"

# Safe log redirection
if sys.stdout is None:
    try:
        sys.stdout = open(LOG_FILE, "a", encoding="utf-8", buffering=1)
    except Exception:
        sys.stdout = open(os.devnull, "w", encoding="utf-8")
if sys.stderr is None:
    try:
        sys.stderr = open(LOG_FILE, "a", encoding="utf-8", buffering=1)
    except Exception:
        sys.stderr = open(os.devnull, "w", encoding="utf-8")

import webview

import ctypes
from ctypes import wintypes
user32 = ctypes.windll.user32

current_window = None
is_maximized = False
launcher_hwnd = None

def get_launcher_hwnd():
    global launcher_hwnd
    if launcher_hwnd and user32.IsWindow(launcher_hwnd):
        return launcher_hwnd

    # 1. Direct search by exact window title
    h = user32.FindWindowW(None, "Vibe Code Launcher")
    if h and user32.IsWindow(h):
        launcher_hwnd = h
        return launcher_hwnd

    # 2. EnumWindows fallback
    found_hwnd = None
    def enum_cb(hwnd_item, _):
        nonlocal found_hwnd
        if user32.IsWindowVisible(hwnd_item):
            length = user32.GetWindowTextLengthW(hwnd_item)
            if length > 0:
                buf = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(hwnd_item, buf, length + 1)
                if "Vibe Code" in buf.value:
                    found_hwnd = hwnd_item
                    return False
        return True

    WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
    cb = WNDENUMPROC(enum_cb)
    user32.EnumWindows(cb, 0)

    if found_hwnd:
        launcher_hwnd = found_hwnd
        return launcher_hwnd

    return None

def open_native_file_dialog(title="Выберите файл", filter_str="Исполняемые файлы (*.exe;*.lnk;*.bat)|*.exe;*.lnk;*.bat|Все файлы (*.*)|*.*"):
    try:
        cmd = [
            "powershell", "-NoProfile", "-Command",
            f"[void][System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); "
            f"$f = New-Object System.Windows.Forms.OpenFileDialog; "
            f"$f.Title = '{title}'; "
            f"$f.Filter = '{filter_str}'; "
            f"if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {{ Write-Output $f.FileName }}"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, creationflags=0x08000000, timeout=60)
        return res.stdout.strip()
    except Exception:
        return ""

def cleanup_stale_processes():
    try:
        import psutil
        for p in psutil.process_iter(['name', 'pid', 'cmdline']):
            name = (p.info.get('name') or '').lower()
            if 'msedgewebview2' in name:
                cmd = " ".join(p.info.get('cmdline') or []).lower()
                if 'vibecodelauncher' in cmd:
                    try:
                        p.kill()
                    except Exception:
                        pass
    except Exception:
        pass

def start_native_drag():
    hwnd = get_launcher_hwnd()
    if hwnd:
        try:
            user32.ReleaseCapture()
            user32.SendMessageW(hwnd, 0x001F, 0, 0) # WM_CANCELMODE
            user32.PostMessageW(hwnd, 0x0112, 0xF012, 0) # WM_SYSCOMMAND, SC_MOVE + HTCAPTION
        except Exception:
            pass

def move_window_to(x: int, y: int):
    hwnd = get_launcher_hwnd()
    if hwnd:
        try:
            # 0x0001 = SWP_NOSIZE, 0x0004 = SWP_NOZORDER, 0x0010 = SWP_NOACTIVATE
            user32.SetWindowPos(hwnd, 0, int(x), int(y), 0, 0, 0x0001 | 0x0004 | 0x0010)
        except Exception:
            pass




def get_bundle_dir() -> Path:
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS)
    return Path(__file__).resolve().parent

BUNDLE_DIR = get_bundle_dir()
FRONTEND_DIR = BUNDLE_DIR / "frontend"

def find_app_binary(app_id: str, orig_path: str = "") -> Path:
    # 1. Check installed apps folder in AppData
    installed = APPS_INSTALL_DIR / f"{app_id}.exe"
    if installed.exists():
        return installed

    # 2. Check bundled_apps inside frozen launcher (_MEIPASS/bundled_apps)
    bundled = BUNDLE_DIR / "bundled_apps" / f"{app_id}.exe"
    if bundled.exists():
        return bundled

    # 3. Check local project directory's bundled_apps
    local_bundled = Path(__file__).resolve().parent / "bundled_apps" / f"{app_id}.exe"
    if local_bundled.exists():
        return local_bundled

    # 4. Direct path check
    if orig_path:
        p = Path(orig_path)
        if p.exists() and p.is_file():
            return p

    # 5. Check Desktop 'вайбкод' folder
    for desktop in [Path.home() / "OneDrive" / "Desktop", Path.home() / "Desktop"]:
        vibe_folder = desktop / "вайбкод"
        if vibe_folder.exists():
            for f in vibe_folder.glob("*.exe"):
                if app_id.lower() in f.stem.lower() or f.stem.lower() in app_id.lower():
                    return f

    # 6. Check companion apps directory next to executable
    exe_dir = Path(sys.argv[0]).resolve().parent
    comp_dir = exe_dir / "apps"
    if comp_dir.exists():
        for f in comp_dir.glob("*.exe"):
            if app_id.lower() in f.stem.lower() or f.stem.lower() in app_id.lower():
                return f

    return None

def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def launch_target(target: str) -> bool:
    if not target:
        return False
    target = target.strip()
    try:
        if target.startswith("http://") or target.startswith("https://"):
            webbrowser.open(target)
            return True
        p = Path(target)
        if p.exists():
            os.startfile(str(p))
            return True
        else:
            subprocess.Popen(target, shell=True)
            return True
    except Exception:
        return False

# -------------------------------------------------------------
# Embedded HTTP Handler
# -------------------------------------------------------------
class LauncherHTTPHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_DIR), **kwargs)

    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        if path == "/api/state":
            data = {}
            if STATE_FILE.exists():
                try:
                    with open(STATE_FILE, "r", encoding="utf-8") as f:
                        data = json.load(f)
                except Exception:
                    pass
            # Check if custom wallpaper file exists in WALLPAPERS_DIR
            wp_files = list(WALLPAPERS_DIR.glob("custom_wallpaper.*"))
            if wp_files:
                if "appearance" not in data:
                    data["appearance"] = {}
                data["appearance"]["customWallpaper"] = f"/api/wallpaper?t={int(wp_files[0].stat().st_mtime)}"
                if not data["appearance"].get("bgType") or data["appearance"].get("bgType") == "aurora":
                    # If wallpaper exists on disk, keep bgType as custom unless explicitly set
                    pass

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

        elif path == "/api/wallpaper":
            wp_files = list(WALLPAPERS_DIR.glob("custom_wallpaper.*"))
            if wp_files:
                target = wp_files[0]
                mime_type, _ = mimetypes.guess_type(str(target))
                if not mime_type:
                    mime_type = "image/gif" if target.suffix.lower() == ".gif" else "image/png"
                try:
                    content = target.read_bytes()
                    self.send_response(200)
                    self.send_header("Content-Type", mime_type)
                    self.send_header("Content-Length", str(len(content)))
                    self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
                    self.end_headers()
                    self.wfile.write(content)
                    return
                except Exception:
                    pass
            self.send_error(404, "Wallpaper not found")

        elif path == "/api/pick_wallpaper":
            res = open_native_file_dialog(
                title="Выберите обои или GIF",
                filter_str="Изображения и GIF (*.gif;*.png;*.jpg;*.jpeg;*.webp)|*.gif;*.png;*.jpg;*.jpeg;*.webp|Все файлы (*.*)|*.*"
            )
            picked_url = ""
            if res:
                src_p = Path(res)
                if src_p.exists():
                    for old_f in WALLPAPERS_DIR.glob("custom_wallpaper.*"):
                        try: old_f.unlink()
                        except Exception: pass
                    ext = src_p.suffix.lower() if src_p.suffix else ".png"
                    dest = WALLPAPERS_DIR / f"custom_wallpaper{ext}"
                    shutil.copy2(src_p, dest)
                    picked_url = f"/api/wallpaper?t={int(time.time()*1000)}"
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": bool(picked_url), "url": picked_url}).encode("utf-8"))

        elif path == "/api/pick_file":
            res = open_native_file_dialog(
                title="Выберите исполняемый файл или ярлык",
                filter_str="Исполняемые файлы (*.exe;*.lnk;*.bat)|*.exe;*.lnk;*.bat|Все файлы (*.*)|*.*"
            )
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"path": res}).encode("utf-8"))

        elif path == "/api/open_folder":
            query = parse_qs(parsed_url.query)
            app_id = query.get("id", [""])[0]
            raw_path = query.get("path", [""])[0]
            
            target_file = None
            if raw_path:
                rp = Path(raw_path)
                if rp.exists() and rp.is_file():
                    target_file = rp
            
            if not target_file and app_id:
                installed_p = APPS_INSTALL_DIR / f"{app_id}.exe"
                if installed_p.exists():
                    target_file = installed_p
                else:
                    found = find_app_binary(app_id)
                    if found and found.exists() and found.is_file():
                        target_file = found

            if target_file and target_file.exists():
                subprocess.Popen(f'explorer /select,"{target_file.resolve()}"')
            else:
                os.startfile(str(APPS_INSTALL_DIR))
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(b'{"success": true}')

        elif path == "/api/check_apps":
            apps_meta = {
                'keycast': 'KeyCast.exe',
                'bosskey': 'BossKey.exe',
                'dropcleaner': 'DropCleaner.exe',
                'airdrop': 'AirDropPC.exe',
                'fileshare': 'FileShare.exe',
                'voicetyper': 'VoiceTyper.exe',
                'unlocker': 'Unlocker.exe',
                'vibestatus': 'VibeStatus.exe',
                'gamebooster': 'GameBooster.exe',
                'freezekiller': 'FreezeKiller.exe'
            }
            results = {}
            for app_id, default_exe in apps_meta.items():
                installed_file = APPS_INSTALL_DIR / f"{app_id}.exe"
                bin_path = find_app_binary(app_id)
                is_installed = installed_file.exists()
                # On developer's PC, if on Desktop, treat as installed
                if not is_installed and bin_path and not str(bin_path).startswith(str(BUNDLE_DIR)):
                    is_installed = True
                results[app_id] = {
                    "installed": is_installed,
                    "canInstall": bin_path is not None,
                    "path": str(installed_file if installed_file.exists() else (bin_path or ""))
                }
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(results).encode("utf-8"))

        elif path == "/api/heartbeat":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(b'{"status": "ok"}')

        elif path.startswith("/api/move_by"):
            query = parse_qs(parsed_url.query)
            try:
                dx = int(query.get("dx", [0])[0])
                dy = int(query.get("dy", [0])[0])
                if dx != 0 or dy != 0:
                    hwnd = get_launcher_hwnd()
                    if hwnd:
                        rect = wintypes.RECT()
                        user32.GetWindowRect(hwnd, ctypes.byref(rect))
                        user32.SetWindowPos(
                            hwnd, 0,
                            int(rect.left + dx),
                            int(rect.top + dy),
                            0, 0,
                            0x0001 | 0x0004 | 0x0010
                        )
            except Exception:
                pass
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(b'{"success": true}')

        else:
            super().do_GET()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        
        if self.path == "/api/launch":
            try:
                payload = json.loads(body)
                app_id = payload.get("id", "")
                target = payload.get("path", "")
                
                # Check if target exists; if not, try to resolve binary
                p = Path(target) if target else None
                if not (p and p.exists()):
                    resolved = find_app_binary(app_id, target)
                    if resolved and resolved.exists():
                        target = str(resolved)
                
                success = launch_target(target)
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"success": success, "path": target}).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

        elif self.path == "/api/upload_wallpaper":
            try:
                payload = json.loads(body)
                data_uri = payload.get("data", "")
                if "," in data_uri:
                    header, b64_str = data_uri.split(",", 1)
                    ext = ".png"
                    if "image/gif" in header:
                        ext = ".gif"
                    elif "image/jpeg" in header or "image/jpg" in header:
                        ext = ".jpg"
                    elif "image/webp" in header:
                        ext = ".webp"
                    
                    raw_bytes = base64.b64decode(b64_str)
                    for old_f in WALLPAPERS_DIR.glob("custom_wallpaper.*"):
                        try: old_f.unlink()
                        except Exception: pass
                    
                    dest = WALLPAPERS_DIR / f"custom_wallpaper{ext}"
                    dest.write_bytes(raw_bytes)
                    
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "url": f"/api/wallpaper?t={int(time.time()*1000)}"
                    }).encode("utf-8"))
                    return
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'{"error": "Invalid data uri"}')
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

        elif self.path == "/api/install_app":
            try:
                payload = json.loads(body)
                app_id = payload.get("id", "")
                orig_path = payload.get("path", "")
                
                # Check bundled apps first, then local paths
                bundled = BUNDLE_DIR / "bundled_apps" / f"{app_id}.exe"
                local_bundled = Path(__file__).resolve().parent / "bundled_apps" / f"{app_id}.exe"
                
                bin_path = None
                if bundled.exists():
                    bin_path = bundled
                elif local_bundled.exists():
                    bin_path = local_bundled
                else:
                    bin_path = find_app_binary(app_id, orig_path)
                
                target_installed = APPS_INSTALL_DIR / f"{app_id}.exe"
                if bin_path and bin_path.exists() and bin_path != target_installed:
                    shutil.copy2(bin_path, target_installed)
                elif not target_installed.exists():
                    target_installed.write_text("# Standalone App Stub\n", encoding="utf-8")

                # If fileshare, also bundle cloudflared.exe
                if app_id == "fileshare":
                    cf_src = BUNDLE_DIR / "bundled_apps" / "cloudflared.exe"
                    if not cf_src.exists():
                        cf_src = Path(__file__).resolve().parent / "bundled_apps" / "cloudflared.exe"
                    if cf_src.exists():
                        shutil.copy2(cf_src, APPS_INSTALL_DIR / "cloudflared.exe")
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "installed": True,
                    "path": str(target_installed)
                }).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

        elif self.path == "/api/uninstall_app":
            try:
                payload = json.loads(body)
                app_id = payload.get("id", "")
                target_installed = APPS_INSTALL_DIR / f"{app_id}.exe"
                if target_installed.exists():
                    target_installed.unlink(missing_ok=True)
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode("utf-8"))
            except Exception:
                self.send_response(500)
                self.end_headers()

        elif self.path == "/api/save_state":
            try:
                payload = json.loads(body)
                # If customWallpaper contains base64, write it to file so state.json stays tiny
                app_cfg = payload.get("appearance", {})
                cw = app_cfg.get("customWallpaper", "")
                if cw and cw.startswith("data:image/"):
                    try:
                        header, b64_str = cw.split(",", 1)
                        ext = ".gif" if "image/gif" in header else ".png"
                        if "image/jpeg" in header or "image/jpg" in header:
                            ext = ".jpg"
                        elif "image/webp" in header:
                            ext = ".webp"
                        for old_f in WALLPAPERS_DIR.glob("custom_wallpaper.*"):
                            try: old_f.unlink()
                            except Exception: pass
                        dest = WALLPAPERS_DIR / f"custom_wallpaper{ext}"
                        dest.write_bytes(base64.b64decode(b64_str))
                        app_cfg["customWallpaper"] = f"/api/wallpaper?t={int(time.time()*1000)}"
                    except Exception:
                        pass
                
                with open(STATE_FILE, "w", encoding="utf-8") as f:
                    json.dump(payload, f, ensure_ascii=False, indent=2)
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(b'{"saved": true}')
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

        elif self.path.startswith("/api/move_by"):
            parsed_url = urlparse(self.path)
            query = parse_qs(parsed_url.query)
            try:
                dx = int(query.get("dx", [0])[0])
                dy = int(query.get("dy", [0])[0])
                if dx != 0 or dy != 0:
                    hwnd = get_launcher_hwnd()
                    if hwnd:
                        rect = wintypes.RECT()
                        user32.GetWindowRect(hwnd, ctypes.byref(rect))
                        user32.SetWindowPos(
                            hwnd, 0,
                            int(rect.left + dx),
                            int(rect.top + dy),
                            0, 0,
                            0x0001 | 0x0004 | 0x0010
                        )
            except Exception:
                pass
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(b'{"success": true}')

        elif self.path == "/api/move_window":
            try:
                payload = json.loads(body)
                if "x" in payload and "y" in payload:
                    move_window_to(int(payload["x"]), int(payload["y"]))
                elif "dx" in payload and "dy" in payload and current_window:
                    move_window_to(int(current_window.x + payload["dx"]), int(current_window.y + payload["dy"]))
            except Exception:
                pass
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(b'{"success": true}')

        elif self.path == "/api/start_drag":
            start_native_drag()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(b'{"success": true}')

        elif self.path == "/api/minimize_window":
            minimize_launcher()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(b'{"success": true}')

        elif self.path == "/api/maximize_window":
            toggle_maximize_launcher()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(b'{"success": true}')

        elif self.path == "/api/close_window":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(b'{"success": true}')
            threading.Thread(target=close_launcher).start()

        else:
            self.send_error(404)

    def log_message(self, format, *args):
        pass

# -------------------------------------------------------------
# PyWebView Bridge API
# -------------------------------------------------------------
def minimize_launcher():
    hwnd = get_launcher_hwnd()
    if hwnd:
        user32.ShowWindow(hwnd, 6) # SW_MINIMIZE = 6

def toggle_maximize_launcher():
    hwnd = get_launcher_hwnd()
    if hwnd:
        if user32.IsZoomed(hwnd):
            user32.ShowWindow(hwnd, 9) # SW_RESTORE = 9
        else:
            user32.ShowWindow(hwnd, 3) # SW_MAXIMIZE = 3

def close_launcher():
    hwnd = get_launcher_hwnd()
    if hwnd:
        user32.PostMessageW(hwnd, 0x0010, 0, 0) # WM_CLOSE = 0x0010
    time.sleep(0.15)
    os._exit(0)

def main():
    global current_window
    cleanup_stale_processes()
    # Safe and stable browser arguments without zero-copy / GPU presentation deadlocks
    os.environ['WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS'] = (
        '--disable-background-timer-throttling '
        '--disable-renderer-backgrounding '
        '--disable-features=CalculateNativeWinOcclusion'
    )
    webview.settings['DRAG_REGION_SELECTOR'] = None
    
    port = find_free_port()
    server = ThreadingHTTPServer(("127.0.0.1", port), LauncherHTTPHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    url = f"http://127.0.0.1:{port}/index.html"

    window = webview.create_window(
        title="Vibe Code Launcher",
        url=url,
        width=1180,
        height=780,
        min_size=(920, 620),
        frameless=True,
        easy_drag=False,
        background_color="#060813",
        js_api=None
    )
    current_window = window

    try:
        webview.start(gui="edgechromium", debug=False, storage_path=str(WEBVIEW_PROFILE_DIR))
    except Exception:
        # Fallback to standard start
        try:
            webview.start(debug=False, storage_path=str(WEBVIEW_PROFILE_DIR))
        except Exception:
            # Fallback to browser
            webbrowser.open(url)
            while True:
                time.sleep(1)

if __name__ == "__main__":
    main()
