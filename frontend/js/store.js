// Reactive Store & State Management for Vibe Code Launcher
class LauncherStore {
    constructor() {
        this.STORAGE_KEY = 'vibe_code_launcher_state_v5';
        this.listeners = [];
        
        // Default applications: STRICTLY the 8 vibe-coded tools from Desktop\вайбкод
        this.defaultApps = [
            {
                id: 'keycast',
                name: 'KeyCast & CPS Radar',
                version: 'v1.2.0',
                size: '34.7 MB',
                developer: 'Vibe Code Studio',
                desc: 'Экранный оверлей нажатий клавиш WASD, кнопок мыши и счетчик CPS в реальном времени.',
                fullDesc: 'KeyCast & CPS Radar — киберспортивный инструмент для геймеров и стримеров. Создает плавный неоновый экранный оверлей клавиш WASD, кнопок мыши и счетчик CPS (кликов в секунду) поверх любых игр. Не вызывает просадок FPS и имеет настраиваемую прозрачность.',
                features: [
                    'Отображение нажатий WASD и Space в реальном времени',
                    'Точный счетчик CPS для левой и правой кнопок мыши',
                    'Работает поверх полноэкранных игр без задержек',
                    'Свободное перемещение оверлея по экрану'
                ],
                hotkey: 'WASD / Mouse',
                category: 'games',
                categoryLabel: 'Игры',
                path: 'C:\\Users\\mishg\\OneDrive\\Desktop\\вайбкод\\KeyCast.exe',
                icon: 'keyboard',
                badgeBg: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                installed: true,
                isFavorite: true,
                openCount: 14,
                lastOpened: Date.now() - 3600000 * 2
            },
            {
                id: 'bosskey',
                name: 'BossKey Stealth',
                version: 'v2.0.1',
                size: '26.8 MB',
                developer: 'Vibe Code Studio',
                desc: 'Мгновенное скрытие окон, заглушение звука и маскировка рабочего стола по хоткею.',
                fullDesc: 'BossKey Stealth — ультимативная защита вашей приватности. По нажатию одной секретной комбинации клавиш мгновенно прячет все запущенные окна (игры, Discord, браузеры), заглушает звук Windows и открывает фейковый рабочий экран Excel или рабочий стол.',
                features: [
                    'Мгновенное скрытие всех окон менее чем за 20 мс',
                    'Автоматический Master Mute звука системы',
                    'Маскировка под рабочие документы или рабочий стол',
                    'Полная невидимость в трее и диспетчере задач'
                ],
                hotkey: 'Ctrl + Shift + B',
                category: 'utilities',
                categoryLabel: 'Утилиты',
                path: 'C:\\Users\\mishg\\OneDrive\\Desktop\\вайбкод\\BossKey.exe',
                icon: 'shield',
                badgeBg: 'linear-gradient(135deg, #10b981, #059669)',
                installed: true,
                isFavorite: true,
                openCount: 22,
                lastOpened: Date.now() - 3600000 * 5
            },
            {
                id: 'dropcleaner',
                name: 'DropCleaner',
                version: 'v1.4.0',
                size: '16.4 MB',
                developer: 'Vibe Code Studio',
                desc: 'Глубокая очистка Temp, кэша браузеров, дампов и мусора Windows в один клик.',
                fullDesc: 'DropCleaner — мощный оптимизатор накопителей. Находит и безопасно удаляет временные файлы Temp, кэш шейдеров DirectX, логи дампов, кэши браузеров (Chrome, Edge, Яндекс), освобождая десятки гигабайт дискового пространства в один клик.',
                features: [
                    'Очистка системных каталогов Temp и Prefetch',
                    'Глубокая чистка кэшей всех популярных браузеров',
                    'Освобождение памяти и дискового пространства',
                    'Абсолютно безопасное удаление без риска для системы'
                ],
                hotkey: '1-Click Clean',
                category: 'utilities',
                categoryLabel: 'Утилиты',
                path: 'C:\\Users\\mishg\\OneDrive\\Desktop\\вайбкод\\DropCleaner.exe',
                icon: 'trash',
                badgeBg: 'linear-gradient(135deg, #06b6d4, #0284c7)',
                installed: true,
                isFavorite: false,
                openCount: 8,
                lastOpened: Date.now() - 3600000 * 24
            },
            {
                id: 'airdrop',
                name: 'AirDropPC',
                version: 'v1.1.2',
                size: '18.7 MB',
                developer: 'Vibe Code Studio',
                desc: 'Локальный беспроводной P2P обмен файлами с телефоном и другими ПК в домашней сети.',
                fullDesc: 'AirDropPC — беспроводной аналог Apple AirDrop для Windows. Позволяет мгновенно передавать фото, видео и документы между компьютером и смартфонами по локальному Wi-Fi без интернета, проводов и регистрации аккаунтов.',
                features: [
                    'Быстрое подключение по QR-коду со смартфона',
                    'Высокая скорость передачи по локальной сети',
                    'Поддержка отправки папок и нескольких файлов сразу',
                    'Работает в браузере телефона без установки приложений'
                ],
                hotkey: 'P2P Web Sync',
                category: 'web',
                categoryLabel: 'Веб',
                path: 'C:\\Users\\mishg\\OneDrive\\Desktop\\вайбкод\\AirDropPC.exe',
                icon: 'wifi',
                badgeBg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                installed: true,
                isFavorite: false,
                openCount: 5,
                lastOpened: Date.now() - 3600000 * 48
            },
            {
                id: 'fileshare',
                name: 'FileShare & Tunnel',
                version: 'v1.3.0',
                size: '45.5 MB',
                developer: 'Vibe Code Studio',
                desc: 'Мгновенная раздача файлов по защищенной ссылке через защищенный Cloudflare туннель.',
                fullDesc: 'FileShare & Tunnel — сервис раздачи больших файлов напрямую с вашего диска. Автоматически поднимает защищенный HTTPS туннель Cloudflare и генерирует уникальную ссылку, по которой любой человек в мире может скачать файл на максимальной скорости.',
                features: [
                    'Генерация безопасной публичной HTTPS ссылки',
                    'Не требует белого IP адреса и открытия портов',
                    'Счетчик скачиваний и автоматический таймер раздачи',
                    'Шифрование трафика через Cloudflare Zero Trust'
                ],
                hotkey: 'Cloudflare Tunnel',
                category: 'web',
                categoryLabel: 'Веб',
                path: 'C:\\Users\\mishg\\OneDrive\\Desktop\\вайбкод\\FileShare.exe',
                icon: 'share',
                badgeBg: 'linear-gradient(135deg, #6366f1, #4338ca)',
                installed: true,
                isFavorite: false,
                openCount: 11,
                lastOpened: Date.now() - 3600000 * 12
            },
            {
                id: 'voicetyper',
                name: 'VoiceTyper AI',
                version: 'v1.5.0',
                size: '59.1 MB',
                developer: 'Vibe Code Studio',
                desc: 'Локальное распознавание речи и диктовка текста в любое активное окно Windows.',
                fullDesc: 'VoiceTyper AI — голосовой ассистент для диктовки. Слушает ваш микрофон и мгновенно печатает распознанный текст в любое активное поле ввода Windows (Telegram, Word, Discord, код и т.д.). Идеально подходит для быстрой печати сообщений голосом.',
                features: [
                    'Высокая точность распознавания русской и английской речи',
                    'Вставка текста прямо в позицию курсора',
                    'Активация удержанием одной клавиши',
                    'Шумоподавление и фильтрация дыхания'
                ],
                hotkey: 'Hold Hotkey',
                category: 'ai',
                categoryLabel: 'ИИ',
                path: 'C:\\Users\\mishg\\OneDrive\\Desktop\\вайбкод\\VoiceTyper.exe',
                icon: 'mic',
                badgeBg: 'linear-gradient(135deg, #ec4899, #db2777)',
                installed: true,
                isFavorite: true,
                openCount: 19,
                lastOpened: Date.now() - 3600000 * 3
            },
            {
                id: 'unlocker',
                name: 'Unlocker Pro',
                version: 'v1.2.5',
                size: '17.2 MB',
                developer: 'Vibe Code Studio',
                desc: 'Принудительное снятие блокировок процессов и безопасное удаление занятых файлов.',
                fullDesc: 'Unlocker Pro решает вечную проблему «Файл занят другим процессом и не может быть удален». Сканирует системные дескрипторы DLL и процессов, мгновенно разрывает блокировки и удаляет или перемещает нужные файлы.',
                features: [
                    'Поиск всех процессов, удерживающих файл или папку',
                    'Принудительное закрытие блокирующих потоков',
                    'Удаление неудаляемых файлов при следующей перезагрузке',
                    'Интеграция с контекстным меню Windows'
                ],
                hotkey: 'Force Unlock',
                category: 'utilities',
                categoryLabel: 'Утилиты',
                path: 'C:\\Users\\mishg\\OneDrive\\Desktop\\вайбкод\\Unlocker.exe',
                icon: 'unlock',
                badgeBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
                installed: true,
                isFavorite: false,
                openCount: 4,
                lastOpened: Date.now() - 3600000 * 36
            },
            {
                id: 'vibestatus',
                name: 'VibeStatus RPC',
                version: 'v1.0.8',
                size: '27.4 MB',
                developer: 'Vibe Code Studio',
                desc: 'Кастомный Rich Presence статус в Discord с кликабельными кнопками и счетчиками.',
                fullDesc: 'VibeStatus RPC — стильный Rich Presence клиент для Discord. Позволяет транслировать в профиль кастомный статус, показ модификаций, таймер работы, кнопки перехода в Telegram или GitHub, и анимированные иконки.',
                features: [
                    'Кастомные кликабельные кнопки в профиле Discord',
                    'Таймер активности и счетчики времени',
                    'Готовые пресеты под вайбкодинг, игры и чилл',
                    'Автоматическое подключение к клиенту Discord'
                ],
                hotkey: 'Discord RPC',
                category: 'vibecoding',
                categoryLabel: 'Вайбкодинг',
                path: 'C:\\Users\\mishg\\OneDrive\\Desktop\\вайбкод\\VibeStatus.exe',
                icon: 'activity',
                badgeBg: 'linear-gradient(135deg, #5865F2, #3c45a5)',
                isFavorite: true,
                openCount: 30,
                lastOpened: Date.now() - 3600000 * 1
            },
            {
                id: 'gamebooster',
                name: 'Vibe Game Booster',
                version: 'v1.0.0 PRO',
                size: '26.8 MB',
                developer: 'Vibe Code Studio',
                desc: 'Разгон FPS, 0.5ms Timer Resolution, очистка Standby RAM и оптимизация пинга.',
                fullDesc: 'Vibe Game Booster & Latency Killer — профессиональная утилита для твика системы под киберспорт. Снижает системную задержку таймера Windows до 0.500 мс (ntdll NtSetTimerResolution), оптимизирует TCP NoDelay/TcpAckFrequency для минимизации пинга, автоматически очищает кэш Standby RAM и поднимает приоритет запущенных игр (CS2, Dota 2, Valorant, GTA V и др.).',
                features: [
                    '0.500 ms Kernel Timer Resolution — устранение инпут-лага',
                    'TCP NoDelay & Network Throttling Index твик для низкого пинга',
                    'Standby List & Working Set RAM Cleaner против фризов',
                    'Автоматический буст приоритета 27+ популярных игр'
                ],
                hotkey: 'Auto-Boost',
                category: 'games',
                categoryLabel: 'Игры',
                path: 'C:\\Users\\mishg\\OneDrive\\Desktop\\вайбкод\\GameBooster.exe',
                icon: 'zap',
                badgeBg: 'linear-gradient(135deg, #00f5d4, #00bbf9)',
                installed: true,
                isFavorite: true,
                openCount: 1,
                lastOpened: Date.now()
            },
            {
                id: 'freezekiller',
                name: 'Freeze Killer',
                version: 'v2.0.0 PRO',
                size: '34.2 MB',
                developer: 'Vibe Code Studio',
                desc: 'Экстренная ликвидация зависших игр, снятие TopMost и оверлеев NVIDIA.',
                fullDesc: 'Freeze Killer — мощный инструмент экстренного спасения системы от намертво зависших игр, полноэкранных окон с черным экраном и заблокированным курсором. По горячим клавишам мгновенно сбрасывает ClipCursor, убивает дерево зависших процессов, снимает флаги HWND_TOPMOST и выводит Диспетчер задач на передний план.',
                features: [
                    'Ctrl+Alt+F12 — мгновенная ликвидация зависшего активного окна',
                    'Ctrl+Alt+F11 — сброс блокировки HWND_TOPMOST и открытие Taskmgr',
                    'Ctrl+Alt+F10 — сброс зависших оверлеев NVIDIA ShadowPlay/Share',
                    'Освобождение захваченного играми курсора (ClipCursor unblock)'
                ],
                hotkey: 'Ctrl+Alt+F12',
                category: 'system',
                categoryLabel: 'Система',
                path: 'C:\\Users\\mishg\\OneDrive\\Desktop\\вайбкод\\FreezeKiller.exe',
                icon: 'snowflake',
                badgeBg: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                installed: true,
                isFavorite: true,
                openCount: 2,
                lastOpened: Date.now()
            }
        ];
        
        this.defaultAppearance = {
            theme: 'liquid-glass',
            bgType: 'custom',
            galleryPreset: 'cyberpunk-neon',
            auroraPalette: 'classic',
            dimming: 25,
            cardOpacity: 70,
            blur: 24,
            accentColor: '#ffffff',
            animationsEnabled: true,
            reducedMotion: false,
            soundEnabled: true,
            soundVolume: 60,
            soundPreset: 'glass',
            customWallpaper: '/api/wallpaper'
        };
        
        this.state = this.loadState();
        this.initBackendState();
    }
    
    async initBackendState() {
        try {
            // 1. Fetch backend state.json to restore wallpaper and settings
            const res = await fetch('/api/state');
            if (res.ok) {
                const data = await res.json();
                if (data && data.appearance) {
                    this.state.appearance = { ...this.state.appearance, ...data.appearance };
                    this.applyAppearanceToDom();
                    window.dispatchEvent(new CustomEvent('launcher-state-loaded', { detail: this.state.appearance }));
                }
            }
            
            // 2. Fetch live installed status from backend
            const checkRes = await fetch('/api/check_apps');
            if (checkRes.ok) {
                const statuses = await checkRes.json();
                for (const app of this.state.apps) {
                    if (statuses[app.id]) {
                        app.installed = statuses[app.id].installed;
                        if (statuses[app.id].path) app.path = statuses[app.id].path;
                    }
                }
                this.notify();
            }
        } catch (e) {
            console.warn('Backend sync warning:', e);
        }
    }

    loadState() {
        try {
            let raw = localStorage.getItem(this.STORAGE_KEY);
            let prev = null;
            if (!raw) {
                const prevRaw = localStorage.getItem('vibe_code_launcher_state_v4') || localStorage.getItem('vibe_code_launcher_state_v3') || localStorage.getItem('vibe_code_launcher_state_v2') || localStorage.getItem('vibe_code_launcher_state_v1');
                if (prevRaw) prev = JSON.parse(prevRaw);
            }
            const parsed = raw ? JSON.parse(raw) : (prev || {});
            const vibeIds = new Set(['keycast', 'bosskey', 'dropcleaner', 'airdrop', 'fileshare', 'voicetyper', 'unlocker', 'vibestatus', 'gamebooster', 'freezekiller']);
            
            let savedApps = (parsed.apps || []).filter(a => vibeIds.has(a.id) || (a.id && a.id.startsWith('app_')));
            
            // Merge with fresh defaultApps to ensure full rich metadata
            const finalApps = this.defaultApps.map(def => {
                const found = savedApps.find(s => s.id === def.id);
                if (found) {
                    return { ...def, isFavorite: found.isFavorite, openCount: found.openCount, lastOpened: found.lastOpened, installed: found.installed !== undefined ? found.installed : def.installed, path: found.path || def.path };
                }
                return def;
            });

            // Include user custom added apps
            const userCustomApps = savedApps.filter(a => a.id && a.id.startsWith('app_'));
            finalApps.push(...userCustomApps);

            const baseApp = { ...this.defaultAppearance };
            if (parsed.appearance && parsed.appearance.customWallpaper) {
                baseApp.customWallpaper = parsed.appearance.customWallpaper;
                baseApp.bgType = 'custom';
            }

            return {
                apps: finalApps,
                appearance: { ...baseApp, ...(parsed.appearance || {}), theme: (parsed.appearance && parsed.appearance.theme) || 'liquid-glass' },
                viewMode: parsed.viewMode || 'grid',
                sortBy: parsed.sortBy || 'name',
                selectedCategory: 'all',
                activeTab: 'home',
                searchQuery: ''
            };
        } catch (e) {
            console.error('Error loading state from localStorage:', e);
        }
        
        return {
            apps: this.defaultApps,
            appearance: { ...this.defaultAppearance },
            viewMode: 'grid',
            sortBy: 'name',
            selectedCategory: 'all',
            activeTab: 'home',
            searchQuery: ''
        };
    }
    
    saveState() {
        try {
            const toSave = {
                apps: this.state.apps,
                appearance: this.state.appearance,
                viewMode: this.state.viewMode,
                sortBy: this.state.sortBy
            };

            // 1. Always save to backend state.json so settings never get lost across restarts!
            fetch('/api/save_state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify(toSave)
            }).catch(() => {});

            // 2. Safe localStorage save (strip heavy base64 strings)
            try {
                const lsCopy = JSON.parse(JSON.stringify(toSave));
                if (lsCopy.appearance && lsCopy.appearance.customWallpaper && lsCopy.appearance.customWallpaper.startsWith('data:')) {
                    lsCopy.appearance.customWallpaper = '/api/wallpaper';
                }
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lsCopy));
            } catch (lsErr) {
                console.warn('localStorage save warning:', lsErr);
            }
        } catch (e) {
            console.error('Error saving state:', e);
        }
    }
    
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }
    
    notify() {
        this.saveState();
        for (const cb of this.listeners) {
            try { cb(this.state); } catch (e) { console.error(e); }
        }
    }
    
    // Actions
    setSearchQuery(q) {
        this.state.searchQuery = q.trim();
        this.notify();
    }
    
    setCategory(cat) {
        this.state.selectedCategory = cat;
        this.notify();
    }
    
    setActiveTab(tab) {
        this.state.activeTab = tab;
        this.notify();
    }
    
    setViewMode(mode) {
        this.state.viewMode = mode;
        this.notify();
    }
    
    setSortBy(sort) {
        this.state.sortBy = sort;
        this.notify();
    }
    
    toggleFavorite(appId) {
        const app = this.state.apps.find(a => a.id === appId);
        if (app) {
            app.isFavorite = !app.isFavorite;
            this.notify();
        }
    }
    
    recordOpen(appId) {
        const app = this.state.apps.find(a => a.id === appId);
        if (app) {
            app.openCount = (app.openCount || 0) + 1;
            app.lastOpened = Date.now();
            this.notify();
        }
    }
    
    async installApp(appId) {
        const app = this.state.apps.find(a => a.id === appId);
        if (!app) return false;
        try {
            const res = await fetch('/api/install_app', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: app.id, path: app.path })
            });
            const data = await res.json();
            if (data.installed || data.success) {
                app.installed = true;
                if (data.path) app.path = data.path;
                this.notify();
                return true;
            }
        } catch (e) {
            console.error('Install error:', e);
        }
        return false;
    }

    async uninstallApp(appId) {
        const app = this.state.apps.find(a => a.id === appId);
        if (!app) return false;
        try {
            await fetch('/api/uninstall_app', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: app.id })
            });
            app.installed = false;
            this.notify();
            return true;
        } catch (e) {
            console.error('Uninstall error:', e);
        }
        return false;
    }

    addApp(newApp) {
        const id = 'app_' + Date.now();
        const colors = [
            'linear-gradient(135deg, #8b5cf6, #6366f1)',
            'linear-gradient(135deg, #10b981, #059669)',
            'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            'linear-gradient(135deg, #ec4899, #db2777)',
            'linear-gradient(135deg, #06b6d4, #0284c7)'
        ];
        const badgeBg = colors[Math.floor(Math.random() * colors.length)];
        
        this.state.apps.push({
            id,
            name: newApp.name,
            version: 'v1.0',
            size: 'Local App',
            developer: 'Пользователь',
            desc: newApp.desc || 'Пользовательское приложение',
            fullDesc: newApp.desc || 'Пользовательское приложение, добавленное вручную.',
            features: ['Пользовательский ярлык Windows'],
            category: newApp.category || 'utilities',
            categoryLabel: newApp.categoryLabel || 'Утилиты',
            path: newApp.path,
            icon: newApp.icon || 'terminal',
            badgeBg,
            installed: true,
            isFavorite: false,
            openCount: 0,
            lastOpened: Date.now()
        });
        this.notify();
    }
    
    deleteApp(appId) {
        this.state.apps = this.state.apps.filter(a => a.id !== appId);
        this.notify();
    }
    
    updateAppearance(partial) {
        this.state.appearance = { ...this.state.appearance, ...partial };
        this.applyAppearanceToDom();
        this.notify();
    }
    
    resetAppearance() {
        this.state.appearance = { ...this.defaultAppearance };
        this.applyAppearanceToDom();
        this.notify();
    }
    
    applyAppearanceToDom() {
        const app = this.state.appearance;
        const root = document.documentElement;
        
        root.style.setProperty('--accent-color', app.accentColor || '#ffffff');
        root.style.setProperty('--accent-glow', `${app.accentColor || '#ffffff'}55`);
        root.style.setProperty('--bg-dimming', ((app.dimming !== undefined ? app.dimming : 25) / 100).toFixed(2));
        root.style.setProperty('--card-opacity', ((app.cardOpacity !== undefined ? app.cardOpacity : 70) / 100).toFixed(2));
        root.style.setProperty('--bg-blur', `${app.blur !== undefined ? app.blur : 24}px`);
        
        const galleryPresets = {
            'cyberpunk-neon': 'radial-gradient(ellipse at 50% 120%, #7b1fa2 0%, #150f2e 45%, #070712 100%)',
            'retrowave-sunset': 'radial-gradient(ellipse at 50% 100%, #e040fb 0%, #3d1b66 40%, #0d0221 100%)',
            'cosmic-nebula': 'radial-gradient(ellipse at top right, #30336b 0%, #130f40 50%, #060814 100%)',
            'frost-peaks': 'linear-gradient(135deg, #091a28 0%, #1b354d 50%, #294861 100%)',
            'lofi-sunset': 'linear-gradient(135deg, #2b1055 0%, #57385c 50%, #1a0a2a 100%)',
            'oled-void': 'radial-gradient(circle at center, #09090f 0%, #000000 100%)',
            'liquid-prism': 'linear-gradient(135deg, #0d2538 0%, #1f4037 50%, #101c24 100%)',
            'emerald-aurora': 'linear-gradient(135deg, #021a1a 0%, #064439 50%, #020b14 100%)'
        };

        const customWp = document.getElementById('custom-wallpaper');
        const aurora = document.getElementById('aurora-canvas');
        const bgContainer = document.getElementById('background-container');
        const galleryBackdrop = document.getElementById('gallery-backdrop');

        if (app.bgType === 'gallery') {
            const grad = galleryPresets[app.galleryPreset] || galleryPresets['cyberpunk-neon'];
            if (galleryBackdrop) {
                galleryBackdrop.style.background = grad;
                galleryBackdrop.style.opacity = '1';
            }
            if (bgContainer) bgContainer.style.background = grad;
            if (customWp) customWp.style.opacity = '0';
            if (aurora) aurora.style.opacity = '0.35';
        } else if (app.bgType === 'custom') {
            if (galleryBackdrop) galleryBackdrop.style.opacity = '0';
            if (bgContainer) bgContainer.style.background = '#060813';
            if (customWp) {
                if (app.customWallpaper && customWp.getAttribute('src') !== app.customWallpaper) {
                    customWp.src = app.customWallpaper;
                }
                customWp.style.opacity = '1';
            }
            if (aurora) aurora.style.opacity = '0';
        } else { // 'aurora'
            if (galleryBackdrop) galleryBackdrop.style.opacity = '0';
            if (bgContainer) bgContainer.style.background = '#060813';
            if (customWp) customWp.style.opacity = '0';
            if (aurora) aurora.style.opacity = '1';
        }
        
        // Apply theme class to body
        const theme = app.theme || 'liquid-glass';
        document.body.className = `theme-${theme}`;

        // Sync sound engine
        if (window.asmrSound) {
            window.asmrSound.setSettings(app.soundEnabled, app.soundVolume, app.soundPreset);
        }

        // Palette
        if (window.auroraEngineInstance) {
            window.auroraEngineInstance.setPalette(app.auroraPalette);
            window.auroraEngineInstance.setAnimations(app.animationsEnabled);
            window.auroraEngineInstance.setReducedMotion(app.reducedMotion);
        }
    }
}

window.LauncherStore = LauncherStore;
