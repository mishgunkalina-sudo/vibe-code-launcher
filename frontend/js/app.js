// Main Application Logic for Vibe Code Launcher
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Aurora Engine & Sound Engine
    const aurora = new AuroraEngine('aurora-canvas');
    window.auroraEngineInstance = aurora;
    // Aurora is started only if user selects it in settings
    
    const sound = new ASMRSoundEngine();
    window.asmrSound = sound;

    // 2. Initialize Store
    const store = new LauncherStore();
    window.launcherStore = store;
    
    // 3. Cache DOM Elements
    const elements = {
        navHome: document.getElementById('nav-home'),
        navAll: document.getElementById('nav-all'),
        navFavs: document.getElementById('nav-favs'),
        navRecents: document.getElementById('nav-recents'),
        navSettings: document.getElementById('nav-settings'),
        
        searchInput: document.getElementById('search-input'),
        categoryPillsContainer: document.getElementById('category-pills'),
        appGrid: document.getElementById('app-grid'),
        
        favoritesSection: document.getElementById('favorites-section'),
        favoritesRow: document.getElementById('favorites-row'),
        recentsSection: document.getElementById('recents-section'),
        recentsRow: document.getElementById('recents-row'),
        
        viewGridBtn: document.getElementById('view-grid-btn'),
        viewListBtn: document.getElementById('view-list-btn'),
        sortSelect: document.getElementById('sort-select'),
        addAppBtn: document.getElementById('add-app-btn'),
        
        appearanceDrawer: document.getElementById('appearance-drawer'),
        drawerCloseBtn: document.getElementById('drawer-close-btn'),
        
        dimmingSlider: document.getElementById('dimming-slider'),
        dimmingValue: document.getElementById('dimming-val'),
        opacitySlider: document.getElementById('opacity-slider'),
        opacityValue: document.getElementById('opacity-val'),
        blurSlider: document.getElementById('blur-slider'),
        blurValue: document.getElementById('blur-val'),
        
        soundToggle: document.getElementById('sound-toggle'),
        soundSlider: document.getElementById('sound-slider'),
        soundValue: document.getElementById('sound-val'),

        animToggle: document.getElementById('anim-toggle'),
        reducedMotionToggle: document.getElementById('reduced-motion-toggle'),
        resetSettingsBtn: document.getElementById('reset-settings-btn'),
        
        winMinBtn: document.getElementById('win-min'),
        winMaxBtn: document.getElementById('win-max'),
        winCloseBtn: document.getElementById('win-close'),
        
        addAppModal: document.getElementById('add-app-modal'),
        addAppForm: document.getElementById('add-app-form'),
        modalCancelBtn: document.getElementById('modal-cancel-btn'),
        browseFileBtn: document.getElementById('browse-file-btn')
    };
    
    // Apply saved appearance immediately
    store.applyAppearanceToDom();
    syncAppearanceControls();
    
    // 4. Render Functions
    function formatTimeAgo(timestamp) {
        if (!timestamp) return 'Не запускалось';
        const diffMs = Date.now() - timestamp;
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMinutes < 1) return 'Только что';
        if (diffMinutes < 60) return `${diffMinutes} мин. назад`;
        if (diffHours < 24) return `${diffHours} ч. назад`;
        if (diffDays === 1) return 'Вчера';
        return `${diffDays} дн. назад`;
    }
    
    function filterAndSortApps(apps) {
        const { searchQuery, selectedCategory, activeTab, sortBy } = store.state;
        
        return apps.filter(app => {
            if (activeTab === 'favs' && !app.isFavorite) return false;
            if (activeTab === 'recents' && (!app.lastOpened || app.openCount === 0)) return false;
            
            if (selectedCategory !== 'all' && app.category !== selectedCategory) {
                return false;
            }
            
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchName = app.name.toLowerCase().includes(q);
                const matchDesc = (app.desc || '').toLowerCase().includes(q);
                const matchCat = (app.categoryLabel || '').toLowerCase().includes(q);
                if (!matchName && !matchDesc && !matchCat) return false;
            }
            
            return true;
        }).sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name, 'ru');
            } else if (sortBy === 'date') {
                return (b.lastOpened || 0) - (a.lastOpened || 0);
            } else if (sortBy === 'popular') {
                return (b.openCount || 0) - (a.openCount || 0);
            }
            return 0;
        });
    }

    function closeAllContextMenus() {
        document.querySelectorAll('.app-context-menu').forEach(m => m.remove());
    }

    document.addEventListener('click', () => closeAllContextMenus());

    function toggleCardContextMenu(card, app) {
        const existing = card.querySelector('.app-context-menu');
        if (existing) {
            existing.remove();
            return;
        }
        closeAllContextMenus();

        const menu = document.createElement('div');
        menu.className = 'app-context-menu';
        menu.innerHTML = `
            <div class="context-item" data-action="explore">
                <span>📁</span> <span>Показать в папке</span>
            </div>
            <div class="context-item" data-action="fav">
                <span>${app.isFavorite ? '🤍' : '⭐'}</span> <span>${app.isFavorite ? 'Убрать из избранного' : 'В избранное'}</span>
            </div>
            <div class="context-item" data-action="reset">
                <span>🔄</span> <span>Сбросить статистику</span>
            </div>
            <div class="context-item danger" data-action="delete">
                <span>🗑️</span> <span>Удалить из лаунчера</span>
            </div>
        `;

        menu.querySelectorAll('.context-item').forEach(item => {
            item.addEventListener('mouseenter', () => sound.playHover());
            item.addEventListener('click', (ev) => {
                ev.stopPropagation();
                sound.playClick();
                const action = item.dataset.action;
                if (action === 'explore') {
                    fetch(`/api/open_folder?id=${encodeURIComponent(app.id)}&path=${encodeURIComponent(app.path || '')}`);
                } else if (action === 'fav') {
                    sound.playStar();
                    store.toggleFavorite(app.id);
                } else if (action === 'reset') {
                    app.openCount = 0;
                    store.notify();
                } else if (action === 'delete') {
                    card.style.transition = 'all 0.25s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => store.deleteApp(app.id), 220);
                }
                closeAllContextMenus();
            });
        });

        card.appendChild(menu);
    }
    
    function renderMainGrid() {
        const filtered = filterAndSortApps(store.state.apps);
        elements.appGrid.innerHTML = '';
        
        if (filtered.length === 0) {
            elements.appGrid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 48px 0; text-align: center; color: var(--text-muted);">
                    <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
                    <div style="font-size: 15px; font-weight: 600; color: #f1f5f9; margin-bottom: 4px;">Ничего не найдено</div>
                    <div style="font-size: 13px;">Попробуйте изменить поисковый запрос или выбрать другую категорию</div>
                </div>
            `;
            return;
        }
        
        elements.appGrid.className = `app-grid ${store.state.viewMode === 'list' ? 'list-view' : ''}`;
        
        filtered.forEach((app, index) => {
            const card = document.createElement('div');
            card.className = 'app-card';
            card.dataset.id = app.id;
            card.style.animationDelay = `${index * 0.04}s`;
            
            const starIcon = app.isFavorite ? ICONS.starFilled : ICONS.star;
            const appIconSvg = getIcon(app.icon);
            const isInstalled = app.installed !== false;
            
            card.innerHTML = `
                <div class="app-card-top">
                    <div class="app-icon-badge" style="background: ${app.badgeBg};">
                        ${appIconSvg}
                    </div>
                    <div class="app-info" style="${store.state.viewMode === 'list' ? 'margin-left: 14px;' : ''}">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h3>${app.name}</h3>
                            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.06); color: var(--text-muted);">${app.categoryLabel || 'Утилита'}</span>
                            ${!isInstalled ? '<span style="font-size: 9px; padding: 2px 5px; border-radius: 4px; background: rgba(245,158,11,0.15); color: #fbbf24; font-weight: 600;">Не установлено</span>' : ''}
                        </div>
                        <p>${app.desc || ''}</p>
                    </div>
                    <button class="app-star-btn ${app.isFavorite ? 'active' : ''}" title="В избранное">
                        ${starIcon}
                    </button>
                </div>
                <div class="app-card-bottom">
                    <button class="app-open-btn">
                        ${isInstalled ? `${ICONS.play} <span>Открыть</span>` : `<span>📥 Установить</span>`}
                    </button>
                    <button class="app-actions-menu-btn" title="Опции (меню)">
                        ${ICONS.more}
                    </button>
                </div>
            `;
            
            // Hover ASMR sound
            card.addEventListener('mouseenter', () => sound.playHover());

            // Favorite button
            const starBtn = card.querySelector('.app-star-btn');
            starBtn.addEventListener('mouseenter', () => sound.playHover());
            starBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sound.playStar();
                store.toggleFavorite(app.id);
            });
            
            // Open / Install button
            const openBtn = card.querySelector('.app-open-btn');
            openBtn.addEventListener('mouseenter', () => sound.playHover());
            openBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isInstalled) {
                    sound.playClick();
                    launchApp(app);
                } else {
                    openAppDetailModal(app);
                }
            });

            // Three Dots Context Menu Button (Strictly isolated click)
            const moreBtn = card.querySelector('.app-actions-menu-btn');
            moreBtn.addEventListener('mouseenter', () => sound.playHover());
            moreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                sound.playClick();
                toggleCardContextMenu(card, app);
            });
            
            // Card body click opens Detail Modal GUI
            card.addEventListener('click', (e) => {
                if (e.target.closest('.app-context-menu')) return;
                sound.playClick();
                openAppDetailModal(app);
            });
            
            elements.appGrid.appendChild(card);
        });
    }
    
    function renderFavoritesRow() {
        const favs = store.state.apps.filter(a => a.isFavorite);
        if (favs.length === 0 || store.state.activeTab !== 'home') {
            elements.favoritesSection.style.display = 'none';
            return;
        }
        
        elements.favoritesSection.style.display = 'flex';
        elements.favoritesRow.innerHTML = '';
        
        favs.forEach(app => {
            const chip = document.createElement('div');
            chip.className = 'compact-app-chip';
            chip.innerHTML = `
                <div class="compact-app-icon" style="background: ${app.badgeBg};">
                    ${getIcon(app.icon)}
                </div>
                <div class="compact-app-info">
                    <h5>${app.name}</h5>
                    <p>${app.categoryLabel || 'Утилита'}</p>
                </div>
                <span style="color: #fbbf24; margin-left: 4px;">★</span>
            `;
            chip.addEventListener('mouseenter', () => sound.playHover());
            chip.addEventListener('click', () => {
                sound.playClick();
                launchApp(app);
            });
            elements.favoritesRow.appendChild(chip);
        });
    }
    
    function renderRecentsRow() {
        const recents = store.state.apps
            .filter(a => a.lastOpened && a.openCount > 0)
            .sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0))
            .slice(0, 6);
            
        if (recents.length === 0 || store.state.activeTab !== 'home') {
            elements.recentsSection.style.display = 'none';
            return;
        }
        
        elements.recentsSection.style.display = 'flex';
        elements.recentsRow.innerHTML = '';
        
        recents.forEach(app => {
            const chip = document.createElement('div');
            chip.className = 'compact-app-chip';
            chip.innerHTML = `
                <div class="compact-app-icon" style="background: ${app.badgeBg};">
                    ${getIcon(app.icon)}
                </div>
                <div class="compact-app-info">
                    <h5>${app.name}</h5>
                    <p>${formatTimeAgo(app.lastOpened)}</p>
                </div>
            `;
            chip.addEventListener('mouseenter', () => sound.playHover());
            chip.addEventListener('click', () => {
                sound.playClick();
                launchApp(app);
            });
            elements.recentsRow.appendChild(chip);
        });
    }
    
    function renderAll() {
        renderMainGrid();
        renderFavoritesRow();
        renderRecentsRow();
    }
    
    // 5. App Launch Action
    function launchApp(app) {
        store.recordOpen(app.id);
        sound.playLaunch();
        
        // Visual feedback
        const card = document.querySelector(`.app-card[data-id="${app.id}"]`);
        if (card) {
            card.style.transform = 'scale(0.96)';
            setTimeout(() => card.style.transform = '', 180);
        }
        
        // Launch via backend
        fetch('/api/launch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: app.id, path: app.path })
        }).catch(console.error);
    }
    
    // 6. Navigation Tabs
    const navItems = [
        { el: elements.navHome, tab: 'home' },
        { el: elements.navAll, tab: 'all' },
        { el: elements.navFavs, tab: 'favs' },
        { el: elements.navRecents, tab: 'recents' }
    ];
    
    navItems.forEach(({ el, tab }) => {
        el.addEventListener('mouseenter', () => sound.playHover());
        el.addEventListener('click', () => {
            sound.playClick();
            navItems.forEach(n => n.el.classList.remove('active'));
            el.classList.add('active');
            store.setActiveTab(tab);
        });
    });
    
    elements.navSettings.addEventListener('mouseenter', () => sound.playHover());
    elements.navSettings.addEventListener('click', () => {
        sound.playClick();
        elements.appearanceDrawer.classList.toggle('open');
    });
    
    elements.drawerCloseBtn.addEventListener('click', () => {
        sound.playClick();
        elements.appearanceDrawer.classList.remove('open');
    });
    
    // 7. Search Input & Shortcuts
    elements.searchInput.addEventListener('input', (e) => {
        store.setSearchQuery(e.target.value);
    });
    
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            elements.searchInput.focus();
            elements.searchInput.select();
            sound.playClick();
        } else if (e.key === 'Escape') {
            if (elements.addAppModal.classList.contains('open')) {
                elements.addAppModal.classList.remove('open');
            } else if (elements.appearanceDrawer.classList.contains('open')) {
                elements.appearanceDrawer.classList.remove('open');
            } else if (elements.searchInput === document.activeElement) {
                elements.searchInput.value = '';
                store.setSearchQuery('');
                elements.searchInput.blur();
            }
        }
    });
    
    // 8. Category Pills
    const categoryButtons = elements.categoryPillsContainer.querySelectorAll('.category-pill');
    categoryButtons.forEach(btn => {
        btn.addEventListener('mouseenter', () => sound.playHover());
        btn.addEventListener('click', () => {
            sound.playClick();
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            store.setCategory(btn.dataset.category);
        });
    });
    
    // 9. View Mode & Sorting
    elements.viewGridBtn.addEventListener('click', () => {
        sound.playClick();
        elements.viewGridBtn.classList.add('active');
        elements.viewListBtn.classList.remove('active');
        store.setViewMode('grid');
    });
    
    elements.viewListBtn.addEventListener('click', () => {
        sound.playClick();
        elements.viewListBtn.classList.add('active');
        elements.viewGridBtn.classList.remove('active');
        store.setViewMode('list');
    });
    
    elements.sortSelect.addEventListener('change', (e) => {
        sound.playClick();
        store.setSortBy(e.target.value);
    });
    
    // 10. Appearance Drawer Controls
    function syncAppearanceControls() {
        const app = store.state.appearance;
        elements.dimmingSlider.value = app.dimming !== undefined ? app.dimming : 25;
        elements.dimmingValue.textContent = `${elements.dimmingSlider.value}%`;
        
        elements.opacitySlider.value = app.cardOpacity !== undefined ? app.cardOpacity : 70;
        elements.opacityValue.textContent = `${elements.opacitySlider.value}%`;
        
        elements.blurSlider.value = app.blur !== undefined ? app.blur : 24;
        elements.blurValue.textContent = `${elements.blurSlider.value}px`;
        
        elements.animToggle.checked = app.animationsEnabled !== false;
        elements.reducedMotionToggle.checked = app.reducedMotion === true;

        if (elements.soundToggle) elements.soundToggle.checked = app.soundEnabled !== false;
        if (elements.soundSlider) {
            elements.soundSlider.value = app.soundVolume !== undefined ? app.soundVolume : 60;
            elements.soundValue.textContent = `${elements.soundSlider.value}%`;
        }
        
        sound.setSettings(app.soundEnabled !== false, app.soundVolume !== undefined ? app.soundVolume : 60, app.soundPreset || 'glass');
        
        document.querySelectorAll('.theme-style-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === (app.theme || 'liquid-glass'));
        });
        
        document.querySelectorAll('.palette-dot').forEach(dot => {
            dot.classList.toggle('active', dot.dataset.palette === (app.auroraPalette || 'classic'));
        });
        
        document.querySelectorAll('.accent-dot').forEach(dot => {
            dot.classList.toggle('active', dot.dataset.color.toLowerCase() === (app.accentColor || '#ffffff').toLowerCase());
        });
        
        document.querySelectorAll('.bg-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.bg === app.bgType);
        });

        // Gallery presets visibility & active card
        const gallerySec = document.getElementById('gallery-presets-section');
        const auroraSec = document.getElementById('aurora-variation-section');
        const auroraRow = document.getElementById('aurora-variation-row');

        if (gallerySec) {
            gallerySec.style.display = app.bgType === 'gallery' ? 'block' : 'none';
        }
        if (auroraSec && auroraRow) {
            auroraSec.style.display = app.bgType === 'aurora' ? 'block' : 'none';
            auroraRow.style.display = app.bgType === 'aurora' ? 'flex' : 'none';
        }

        document.querySelectorAll('.gallery-card').forEach(card => {
            card.classList.toggle('active', card.dataset.preset === (app.galleryPreset || 'cyberpunk-neon'));
        });
    }

    window.addEventListener('launcher-state-loaded', () => {
        syncAppearanceControls();
    });
    
    // Theme Style Buttons
    document.querySelectorAll('.theme-style-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => sound.playHover());
        btn.addEventListener('click', () => {
            sound.playClick();
            store.updateAppearance({ theme: btn.dataset.theme });
            syncAppearanceControls();
        });
    });

    elements.dimmingSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        elements.dimmingValue.textContent = `${val}%`;
        store.updateAppearance({ dimming: val });
        sound.playSliderTick();
    });
    
    elements.opacitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        elements.opacityValue.textContent = `${val}%`;
        store.updateAppearance({ cardOpacity: val });
        sound.playSliderTick();
    });
    
    elements.blurSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        elements.blurValue.textContent = `${val}px`;
        store.updateAppearance({ blur: val });
        sound.playSliderTick();
    });

    if (elements.soundToggle) {
        elements.soundToggle.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            store.updateAppearance({ soundEnabled: enabled });
            sound.setSettings(enabled, store.state.appearance.soundVolume);
            if (enabled) sound.playClick();
        });
    }

    if (elements.soundSlider) {
        elements.soundSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            elements.soundValue.textContent = `${val}%`;
            store.updateAppearance({ soundVolume: val });
            sound.setSettings(store.state.appearance.soundEnabled !== false, val);
            sound.playSliderTick();
        });
    }
    
    elements.animToggle.addEventListener('change', (e) => {
        sound.playClick();
        store.updateAppearance({ animationsEnabled: e.target.checked });
    });
    
    elements.reducedMotionToggle.addEventListener('change', (e) => {
        sound.playClick();
        store.updateAppearance({ reducedMotion: e.target.checked });
    });
    
    elements.resetSettingsBtn.addEventListener('click', () => {
        sound.playClick();
        store.resetAppearance();
        syncAppearanceControls();
    });
    
    document.querySelectorAll('.palette-dot').forEach(dot => {
        dot.addEventListener('mouseenter', () => sound.playHover());
        dot.addEventListener('click', () => {
            sound.playClick();
            store.updateAppearance({ auroraPalette: dot.dataset.palette });
            syncAppearanceControls();
        });
    });
    
    document.querySelectorAll('.accent-dot').forEach(dot => {
        dot.addEventListener('mouseenter', () => sound.playHover());
        dot.addEventListener('click', () => {
            sound.playClick();
            store.updateAppearance({ accentColor: dot.dataset.color });
            syncAppearanceControls();
        });
    });
    
    document.querySelectorAll('.bg-type-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => sound.playHover());
        btn.addEventListener('click', () => {
            sound.playClick();
            const bg = btn.dataset.bg;
            if (bg === 'custom') {
                pickCustomWallpaper();
            } else {
                store.updateAppearance({ bgType: bg });
                syncAppearanceControls();
            }
        });
    });

    // Gallery Preset Cards
    document.querySelectorAll('.gallery-card').forEach(card => {
        card.addEventListener('mouseenter', () => sound.playHover());
        card.addEventListener('click', () => {
            sound.playClick();
            const preset = card.dataset.preset;
            store.updateAppearance({ bgType: 'gallery', galleryPreset: preset });
            syncAppearanceControls();
        });
    });
    
    async function pickCustomWallpaper() {
        try {
            const r = await fetch('/api/pick_wallpaper');
            if (r.ok) {
                const data = await r.json();
                if (data && data.url) {
                    store.updateAppearance({ bgType: 'custom', customWallpaper: data.url });
                    syncAppearanceControls();
                    return;
                }
            }
        } catch (_) {}

        // Fallback to hidden file input
        const fileInput = document.getElementById('wallpaper-file-input');
        if (fileInput) {
            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    const dataUrl = ev.target.result;
                    // Upload binary to backend so it's safely saved to disk and never lost
                    try {
                        const upRes = await fetch('/api/upload_wallpaper', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ data: dataUrl, name: file.name })
                        });
                        if (upRes.ok) {
                            const upData = await upRes.json();
                            if (upData && upData.url) {
                                store.updateAppearance({ bgType: 'custom', customWallpaper: upData.url });
                                syncAppearanceControls();
                                return;
                            }
                        }
                    } catch (upErr) {
                        console.warn('Backend upload failed, applying inline:', upErr);
                    }
                    store.updateAppearance({ bgType: 'custom', customWallpaper: dataUrl });
                    syncAppearanceControls();
                };
                reader.readAsDataURL(file);
            };
            fileInput.click();
        }
    }
    
    // 11. Add Custom App Modal
    elements.addAppBtn.addEventListener('mouseenter', () => sound.playHover());
    elements.addAppBtn.addEventListener('click', () => {
        sound.playClick();
        elements.addAppModal.classList.add('open');
        document.getElementById('app-name-input').focus();
    });
    
    elements.modalCancelBtn.addEventListener('click', () => {
        sound.playClick();
        elements.addAppModal.classList.remove('open');
    });
    
    elements.browseFileBtn.addEventListener('click', () => {
        sound.playClick();
        fetch('/api/pick_file')
            .then(r => r.json())
            .then(data => {
                if (data && data.path) {
                    document.getElementById('app-path-input').value = data.path;
                    if (!document.getElementById('app-name-input').value) {
                        const fileName = data.path.split('\\').pop().replace('.exe', '').replace('.lnk', '');
                        document.getElementById('app-name-input').value = fileName;
                    }
                }
            })
            .catch(() => {
                const path = prompt('Введите полный путь к .exe / .lnk или URL:');
                if (path) document.getElementById('app-path-input').value = path;
            });
    });
    
    elements.addAppForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sound.playLaunch();
        const name = document.getElementById('app-name-input').value.trim();
        const path = document.getElementById('app-path-input').value.trim();
        const category = document.getElementById('app-category-select').value;
        const categoryLabel = document.getElementById('app-category-select').selectedOptions[0].text;
        const desc = document.getElementById('app-desc-input').value.trim();
        
        if (!name || !path) return;
        
        store.addApp({ name, path, category, categoryLabel, desc });
        elements.addAppModal.classList.remove('open');
        elements.addAppForm.reset();
    });
    
    // 12. Window Window Management & Controls
    function minimizeLauncherWindow() {
        sound.playClick();
        fetch('/api/minimize_window', { method: 'POST' }).catch(() => {});
    }

    let isWindowMaximized = false;

    function toggleMaximizeLauncherWindow() {
        sound.playClick();
        isWindowMaximized = !isWindowMaximized;
        fetch('/api/maximize_window', { method: 'POST' }).catch(() => {});
    }

    function closeLauncherWindow() {
        sound.playClick();
        fetch('/api/close_window', { method: 'POST' }).finally(() => {
            window.close();
        });
    }

    if (elements.winMinBtn) elements.winMinBtn.addEventListener('click', (e) => { e.stopPropagation(); minimizeLauncherWindow(); });
    if (elements.winMaxBtn) elements.winMaxBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMaximizeLauncherWindow(); });
    if (elements.winCloseBtn) elements.winCloseBtn.addEventListener('click', (e) => { e.stopPropagation(); closeLauncherWindow(); });

    // Splash Screen Window Controls
    const splashMinBtn = document.getElementById('splash-min');
    const splashCloseBtn = document.getElementById('splash-close');
    if (splashMinBtn) splashMinBtn.addEventListener('click', (e) => { e.stopPropagation(); minimizeLauncherWindow(); });
    if (splashCloseBtn) splashCloseBtn.addEventListener('click', (e) => { e.stopPropagation(); closeLauncherWindow(); });

    // Smooth, 144Hz Crash-Proof Window Dragging using Pointer Events & Win32 SetWindowPos
    function setupWindowDraggable(element) {
        if (!element) return;
        let isDragging = false;
        let lastScreenX = 0;
        let lastScreenY = 0;
        let pendingDx = 0;
        let pendingDy = 0;
        let isMoving = false;

        function flushDrag() {
            if (!isDragging && pendingDx === 0 && pendingDy === 0) {
                isMoving = false;
                return;
            }
            if (pendingDx !== 0 || pendingDy !== 0) {
                const dx = pendingDx;
                const dy = pendingDy;
                pendingDx = 0;
                pendingDy = 0;
                fetch(`/api/move_by?dx=${dx}&dy=${dy}`, { method: 'POST' }).catch(() => {});
            }
            if (isDragging) {
                requestAnimationFrame(flushDrag);
            } else {
                isMoving = false;
            }
        }

        element.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 || isWindowMaximized) return;
            if (e.target.closest('button, input, select, textarea, a, .win-btn, .splash-enter-btn, .app-card')) {
                return;
            }
            isDragging = true;
            lastScreenX = e.screenX;
            lastScreenY = e.screenY;
            pendingDx = 0;
            pendingDy = 0;
            try {
                element.setPointerCapture(e.pointerId);
            } catch (_) {}
            if (!isMoving) {
                isMoving = true;
                requestAnimationFrame(flushDrag);
            }
        });

        element.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const dx = e.screenX - lastScreenX;
            const dy = e.screenY - lastScreenY;
            if (dx === 0 && dy === 0) return;
            lastScreenX = e.screenX;
            lastScreenY = e.screenY;
            pendingDx += dx;
            pendingDy += dy;
        });

        const stopDrag = (e) => {
            if (isDragging) {
                isDragging = false;
                try {
                    element.releasePointerCapture(e.pointerId);
                } catch (_) {}
            }
        };

        element.addEventListener('pointerup', stopDrag);
        element.addEventListener('pointercancel', stopDrag);
    }

    const titlebarEl = document.getElementById('titlebar');
    if (titlebarEl) {
        setupWindowDraggable(titlebarEl);
        titlebarEl.addEventListener('dblclick', (e) => {
            if (!e.target.closest('button, input, .win-btn')) {
                toggleMaximizeLauncherWindow();
            }
        });
    }
    const splashTopBar = document.querySelector('.splash-top-bar');
    if (splashTopBar) {
        setupWindowDraggable(splashTopBar);
    }

    // Splash Screen Transition to Main Dashboard (Diagonal Parting Shutter)
    const splashScreen = document.getElementById('splash-screen');
    const splashEnterBtn = document.getElementById('splash-enter-btn');
    let splashEntered = false;

    function enterMainLauncher() {
        if (splashEntered || !splashScreen) return;
        splashEntered = true;
        try {
            if (window.asmrSound && typeof window.asmrSound.playIntroTransition === 'function') {
                window.asmrSound.playIntroTransition();
            }
        } catch (_) {}
        splashScreen.classList.add('splash-exiting');
        if (store && store.state && store.state.appearance && store.state.appearance.bgType === 'aurora') {
            aurora.start();
        }
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 500);
    }

    if (splashEnterBtn) {
        splashEnterBtn.addEventListener('mouseenter', () => sound.playHover());
        splashEnterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            enterMainLauncher();
        });
    }

    if (splashScreen) {
        // Clicking ANYWHERE on the splash screen smoothly enters the launcher
        splashScreen.addEventListener('click', (e) => {
            if (e.target.closest('.win-btn, #splash-min, #splash-close')) return;
            enterMainLauncher();
        });

        window.addEventListener('keydown', (e) => {
            if (!splashEntered && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) {
                enterMainLauncher();
            }
        });
    }
    
    // 13. App Detail & Installer Modal GUI
    function openAppDetailModal(app) {
        sound.playClick();
        const modal = document.getElementById('app-detail-modal');
        const badge = document.getElementById('modal-app-icon-badge');
        const nameEl = document.getElementById('modal-app-name');
        const verEl = document.getElementById('modal-app-version');
        const catEl = document.getElementById('modal-app-category');
        const sizeEl = document.getElementById('modal-app-size');
        const statusEl = document.getElementById('modal-app-status-badge');
        const descEl = document.getElementById('modal-app-full-desc');
        const featList = document.getElementById('modal-app-features-list');
        const actionBtn = document.getElementById('modal-action-btn');
        const uninstallBtn = document.getElementById('modal-uninstall-btn');
        const exploreBtn = document.getElementById('modal-explore-btn');
        const progressBox = document.getElementById('modal-install-progress-box');
        const progressFill = document.getElementById('install-progress-fill');
        const progressPercent = document.getElementById('install-progress-percent');
        const progressText = document.getElementById('install-progress-text');

        badge.style.background = app.badgeBg;
        badge.innerHTML = getIcon(app.icon);
        nameEl.textContent = app.name;
        verEl.textContent = app.version || 'v1.0';
        catEl.textContent = app.categoryLabel || 'Утилита';
        sizeEl.textContent = app.size || '30 MB';
        descEl.textContent = app.fullDesc || app.desc || '';
        
        featList.innerHTML = '';
        const features = app.features || [app.desc || 'Модификация для Windows'];
        features.forEach(f => {
            const li = document.createElement('li');
            li.textContent = f;
            featList.appendChild(li);
        });

        progressBox.style.display = 'none';
        progressFill.style.width = '0%';

        function updateModalStatus() {
            if (app.installed !== false) {
                statusEl.textContent = '🟢 Установлено';
                statusEl.style.color = '#10b981';
                actionBtn.innerHTML = `${ICONS.play} <span>Запустить</span>`;
                actionBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                actionBtn.style.boxShadow = '0 4px 18px rgba(16, 185, 129, 0.4)';
                uninstallBtn.style.display = 'inline-flex';
                exploreBtn.style.display = 'inline-flex';
            } else {
                statusEl.textContent = '🟡 Готово к установке';
                statusEl.style.color = '#f59e0b';
                actionBtn.innerHTML = `<span>📥 Установить модификацию</span>`;
                actionBtn.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
                actionBtn.style.boxShadow = '0 4px 18px rgba(59, 130, 246, 0.4)';
                uninstallBtn.style.display = 'none';
                exploreBtn.style.display = 'none';
            }
        }

        updateModalStatus();

        actionBtn.onclick = async () => {
            if (app.installed !== false) {
                sound.playLaunch();
                launchApp(app);
                modal.classList.remove('open');
            } else {
                // Perform visual smooth installation
                sound.playClick();
                progressBox.style.display = 'block';
                actionBtn.disabled = true;
                actionBtn.style.opacity = '0.5';
                
                let p = 0;
                progressText.textContent = 'Развертывание файлов модификации...';
                const interval = setInterval(() => {
                    p += 14;
                    if (p > 90) p = 90;
                    progressFill.style.width = `${p}%`;
                    progressPercent.textContent = `${p}%`;
                }, 75);

                const success = await store.installApp(app.id);
                clearInterval(interval);
                progressFill.style.width = '100%';
                progressPercent.textContent = '100%';
                progressText.textContent = 'Модификация успешно установлена!';
                sound.playStar();

                setTimeout(() => {
                    actionBtn.disabled = false;
                    actionBtn.style.opacity = '1';
                    progressBox.style.display = 'none';
                    updateModalStatus();
                    renderAll();
                }, 500);
            }
        };

        uninstallBtn.onclick = async () => {
            sound.playClick();
            if (confirm(`Удалить модификацию "${app.name}"?`)) {
                await store.uninstallApp(app.id);
                updateModalStatus();
                renderAll();
            }
        };

        exploreBtn.onclick = () => {
            sound.playClick();
            fetch(`/api/open_folder?id=${encodeURIComponent(app.id)}&path=${encodeURIComponent(app.path || '')}`);
        };

        modal.classList.add('open');
    }

    const detailClose = document.getElementById('detail-modal-close');
    if (detailClose) {
        detailClose.addEventListener('click', () => {
            sound.playClick();
            document.getElementById('app-detail-modal').classList.remove('open');
        });
    }

    const detailModal = document.getElementById('app-detail-modal');
    if (detailModal) {
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) {
                detailModal.classList.remove('open');
            }
        });
    }

    // 14. Subscribe to Store Changes
    store.subscribe(() => {
        renderAll();
    });
    
    // Periodic heartbeat to maintain backend process
    setInterval(() => {
        fetch('/api/heartbeat').catch(() => {});
    }, 2500);

    // Clean exit on window close
    window.addEventListener('beforeunload', () => {
        navigator.sendBeacon('/api/close_window');
    });

    // Initial Render
    renderAll();
});
