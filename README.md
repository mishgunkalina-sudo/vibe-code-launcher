# ⚡ Vibe Code Launcher

<div align="center">

![Vibe Code Launcher Icon](launcher.ico)

**Ультрабыстрый, нативный игровой и рабочий лаунчер для Windows в стиле Liquid Obsidian & Glassmorphism.**

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-blue?style=for-the-badge&logo=windows)](https://github.com)
[![Engine](https://img.shields.io/badge/Engine-WebView2%20%2B%20Python-cyan?style=for-the-badge)](https://developer.microsoft.com/microsoft-edge/webview2/)
[![Framerate](https://img.shields.io/badge/UI%20Refresh-144Hz%20Fluid-purple?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)]()

</div>

---

## 🌟 Особенности

- 💎 **Liquid Obsidian & Glassmorphism UI:** Эстетичный полупрозрачный интерфейс с размытием заднего плана, акцентным свечением и поддержкой живых Canvas Аврор и кастомных GIF-обоев.
- 🚀 **Hardware Accelerated:** Построен на базе Microsoft Edge Chromium WebView2 с аппаратным ускорением GPU, отзывчивостью 144Hz и нулевым лагом.
- 🛡️ **Zero Hang / Crash-Proof:** Архитектура полностью разделена между браузерным движком и фоновым loopback HTTP-сервером на Python. Отсутствуют блокировки COM/GIL и подвисания потока сообщений Windows.
- 🪟 **Нативное управление окном:**
  - Плавное перетаскивание окна мышью по верхней панели с Pointer Capture.
  - Нативное сворачивание, разворачивание на весь экран и закрытие через системный Win32 API.
  - Поддержка горячих клавиш (`Escape`, `Enter`, `Space`) для мгновенного входа.
- 🎧 **Встроенный ASMR Sound Engine:** Синтезированные звуковые клики, тики слайдеров и запуск утилит через Web Audio API.
- 📦 **Модульная система утилит:** Встроенный каталог модификаций и утилит:
  - **KeyCast & CPS Radar** — Экранный оверлей WASD и счетчик кликов в секунду для геймеров.
  - **BossKey Stealth** — Мгновенное скрытие окон и Mute звука по секретному хоткею.
  - **Freeze Killer** — Мониторинг и принудительное завершение зависших приложений в 1 клик.
  - **DropCleaner** — Глубокая очистка Temp и кэша браузеров.
  - **AirDropPC** — Локальный P2P обмен файлами с телефоном без проводов.
  - **FileShare & Tunnel** — Раздача файлов по защищенному Cloudflare туннелю.
  - **VoiceTyper AI** — Диктовка текста голосом в любое окно.
  - **Unlocker Pro** — Снятие блокировок процессов с файлов.
  - **VibeStatus RPC** — Кастомный статус Rich Presence для Discord.
  - **GameBooster** — Оптимизация игрового режима Windows.

---

## 🛠️ Стек технологий

- **Backend:** Python 3.10+, `pywebview`, Win32 API (`ctypes.windll.user32`), `ThreadingHTTPServer`.
- **Frontend:** Vanilla JS (ES6+), HTML5 Canvas Aurora, CSS Glassmorphism & Backdrop Filters, Web Audio API.
- **Компиляция:** PyInstaller (автономный `.exe` без внешних зависимостей).

---

## 🚀 Установка и сборка

### 1. Клонирование репозитория
```bash
git clone https://github.com/<your-username>/vibe-code-launcher.git
cd vibe-code-launcher
```

### 2. Установка зависимостей
```bash
pip install -r requirements.txt
```

### 3. Запуск в режиме разработки
```bash
python main_launcher.py
```

### 4. Сборка в один .exe файл
```bash
pyinstaller --noconfirm --clean VibeCodeLauncher.spec
```
Готовый исполняемый файл появится в папке `dist/Vibe Code Launcher.exe`.

---

## 📄 Лицензия

Распространяется под лицензией **MIT**. Подробности в файле `LICENSE`.
