(function() {
    'use strict';

    // DOM 引用
    const followSystemCheckbox = document.getElementById('followSystem');
    const colorModeSelect = document.getElementById('colorMode');
    const backBtn = document.getElementById('backBtn');

    // 存储键名
    const STORAGE_KEY = 'locus-settings';

    // =============================================
    // 1. 读取 / 写入设置
    // =============================================
    function loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    function saveSettings(settings) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        window.dispatchEvent(new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: JSON.stringify(settings)
        }));
    }

    // =============================================
    // 2. 应用主题到页面
    // =============================================
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            const colors = { light: '#ffffff', dark: '#1a1a1a' };
            metaTheme.content = colors[theme] || '#ffffff';
        }
    }

    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // =============================================
    // 3. 核心：更新所有设置状态
    // =============================================
    function updateAll() {
        const settings = loadSettings() || { followSystem: true, colorMode: 'light' };

        // 同步 UI
        followSystemCheckbox.checked = settings.followSystem !== false; // 默认 true
        colorModeSelect.disabled = settings.followSystem !== false;

        // 决定最终主题
        let finalTheme;
        if (settings.followSystem !== false) {
            finalTheme = getSystemTheme();
        } else {
            finalTheme = settings.colorMode || 'light';
        }
        // 回写到 select（显示当前选中的值）
        colorModeSelect.value = finalTheme;

        // 应用主题
        applyTheme(finalTheme);

        // 保存回 localStorage（确保一致性）
        saveSettings(settings);
    }

    // =============================================
    // 4. 事件绑定
    // =============================================

    // 4a. 跟随系统开关
    followSystemCheckbox.addEventListener('change', function() {
        const settings = loadSettings() || { followSystem: true, colorMode: 'light' };
        settings.followSystem = this.checked;
        if (settings.followSystem) {
            const systemTheme = getSystemTheme();
            settings.colorMode = systemTheme; 
            applyTheme(systemTheme);
            colorModeSelect.value = systemTheme;
        } else {
            const manualTheme = colorModeSelect.value;
            applyTheme(manualTheme);
            settings.colorMode = manualTheme;
        }
        colorModeSelect.disabled = settings.followSystem;
        saveSettings(settings);
    });

    // 4b. 色彩模式下拉菜单
    colorModeSelect.addEventListener('change', function() {
        const settings = loadSettings() || { followSystem: true, colorMode: 'light' };
        if (!settings.followSystem) {
            const theme = this.value;
            settings.colorMode = theme;
            applyTheme(theme);
            saveSettings(settings);
        }
    });

    // 4c. 系统主题变化监听（实时跟随）
    const systemMedia = window.matchMedia('(prefers-color-scheme: dark)');
    systemMedia.addEventListener('change', function(e) {
        const settings = loadSettings() || { followSystem: true, colorMode: 'light' };
        if (settings.followSystem !== false) {
            const theme = e.matches ? 'dark' : 'light';
            settings.colorMode = theme;
            applyTheme(theme);
            colorModeSelect.value = theme;
            saveSettings(settings);
        }
    });

    // 4d. 跨页面同步（storage 事件）
    window.addEventListener('storage', function(e) {
        if (e.key === STORAGE_KEY && e.newValue) {
            try {
                const settings = JSON.parse(e.newValue);
                followSystemCheckbox.checked = settings.followSystem !== false;
                colorModeSelect.disabled = settings.followSystem !== false;
                const theme = settings.followSystem !== false ? getSystemTheme() : (settings.colorMode || 'light');
                colorModeSelect.value = theme;
                applyTheme(theme);
            } catch {}
        }
    });

    // 4e. 返回按钮
    backBtn.addEventListener('click', function() {
        history.back();
    });

    // =============================================
    // 5. 初始化
    // =============================================
    if (!document.querySelector('meta[name="theme-color"]')) {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = '#ffffff';
        document.head.appendChild(meta);
    }

    updateAll();

    // =============================================
    // 6. 地形开关
    // =============================================
    // 设置页是独立页面，settings.js 为普通脚本（非 module，无法 import），
    // 因此这里内联一份与 js/utils.js 相同语义的 emoji → SVG 映射，
    // 保证设置页提示同样不出现 emoji，且与主页面表现一致。
    const TOAST_EMOJI_MAP = {
        '📍': 'pin', '📌': 'pin',
        '🌍': 'globe', '🌏': 'globe', '🌎': 'globe',
        '🏙️': 'globe', '🏙': 'globe',
        '⚠️': 'warn', '⚠': 'warn',
        '✅': 'check',
    };
    const TOAST_SVG = {
        pin: '<path d="M12 21.5s6.5-6.1 6.5-11a6.5 6.5 0 1 0-13 0c0 4.9 6.5 11 6.5 11Z"/><circle cx="12" cy="10.3" r="2.5"/>',
        globe: '<circle cx="12" cy="12" r="9"/><path d="M3.2 10h17.6M3.2 14h17.6"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>',
        warn: '<path d="M12 3.2 2.6 19.2h18.8L12 3.2Z"/><path d="M12 9.6v4.2M12 16.6h.01"/>',
        check: '<path d="M20 6 9 17l-5-5"/>',
    };
    const LEADING_EMOJI_SETTINGS =
        /^(\s*)([\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]+)\s*/u;

    function renderToast(message) {
        const toast = document.getElementById('toastMessage');
        if (!toast) {
            console.log(message);
            return;
        }

        const raw = String(message ?? '');
        let iconName = '';
        let body = raw;

        const m = raw.match(LEADING_EMOJI_SETTINGS);
        if (m && TOAST_EMOJI_MAP[m[2]]) {
            iconName = TOAST_EMOJI_MAP[m[2]];
            body = raw.slice(m[0].length);
        }

        toast.innerHTML = '';
        if (iconName && TOAST_SVG[iconName]) {
            const wrap = document.createElement('span');
            wrap.className = 'toast-icon';
            wrap.innerHTML =
                '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" ' +
                'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                TOAST_SVG[iconName] + '</svg>';
            toast.appendChild(wrap);
        }
        if (body) {
            const span = document.createElement('span');
            span.className = 'toast-text';
            span.textContent = body;
            toast.appendChild(span);
        }

        toast.classList.add('show');
        clearTimeout(renderToast._t);
        renderToast._t = setTimeout(() => toast.classList.remove('show'), 4000);
    }

    function showToastInternal(message) {
        renderToast(message);
    }

    const terrainToggle = document.getElementById('terrainToggle');
        if (terrainToggle) {
            terrainToggle.checked = localStorage.getItem('terrainEnabled') !== 'false';
            
            terrainToggle.addEventListener('change', () => {
                localStorage.setItem('terrainEnabled', terrainToggle.checked);
                
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'terrainEnabled',
                    newValue: JSON.stringify(terrainToggle.checked) 
                }));
                
                showToastInternal(terrainToggle.checked ? '地形已开启' : '地形已关闭（建筑可能显示为悬浮，建议保持开启）');
            });
        }


        const overlayToggle = document.getElementById('overlayToggle');
        if (overlayToggle) {
            overlayToggle.checked = localStorage.getItem('overlayEnabled') === 'true';
            
            overlayToggle.addEventListener('change', () => {
                localStorage.setItem('overlayEnabled', overlayToggle.checked);
                showToastInternal(overlayToggle.checked ? '📍 叠加层已开启' : '📍 叠加层已关闭');
            });
        }


    // --- 清除缓存弹窗 ---
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    const clearCacheModal = document.getElementById('clearCacheModal');
    const confirmClearBtn = document.getElementById('confirmClearBtn');
    const cancelClearBtn = document.getElementById('cancelClearBtn');

    const clearAppCache = document.getElementById('clearAppCache');
    const clearCesiumCache = document.getElementById('clearCesiumCache');
    const clearBookmarks = document.getElementById('clearBookmarks');
    const clearSettings = document.getElementById('clearSettings');

    // 打开弹窗
    clearCacheBtn.addEventListener('click', () => {
        clearCacheModal.classList.add('active');
    });

    // 取消
    cancelClearBtn.addEventListener('click', () => {
        clearCacheModal.classList.remove('active');
    });

    // 请求 Service Worker 重新预热应用外壳缓存。
    // Service Worker 已安装时不会重跑 install，缓存被删除后若不主动重建，
    // 离线能力会一直缺失到 sw.js 下次变更为止。
    // 用 getRegistration() 而不是 navigator.serviceWorker.ready：
    // 后者在尚未注册 Service Worker 时会永远挂起，把整个流程卡住。
    async function requestShellRepopulation() {
        if (!('serviceWorker' in navigator)) return false;
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            const target = navigator.serviceWorker.controller || (registration && registration.active);
            if (!target) return false;
            target.postMessage({ type: 'REPOPULATE_SHELL' });
            return true;
        } catch (error) {
            console.warn('请求重新预热应用缓存失败:', error);
            return false;
        }
    }

    // 确认清除
    confirmClearBtn.addEventListener('click', async () => {
        try {
            let shellRepopulated = true;

            // 1. 清除 PWA 应用缓存
            if (clearAppCache && clearAppCache.checked) {
                const cacheNames = await caches.keys();
                const appCaches = cacheNames.filter(name => name.includes('locus-earth-app'));
                await Promise.all(appCaches.map(name => caches.delete(name)));
                // 立即重建，避免离线能力永久丧失
                shellRepopulated = await requestShellRepopulation();
            }

            // 2. 清除 Cesium 地球引擎缓存
            if (clearCesiumCache && clearCesiumCache.checked) {
                const cacheNames = await caches.keys();
                const cesiumCaches = cacheNames.filter(name => name.includes('locus-earth-cesium'));
                await Promise.all(cesiumCaches.map(name => caches.delete(name)));
            }

            // 3. 清除收藏夹数据
            if (clearBookmarks && clearBookmarks.checked) {
                localStorage.removeItem('bookmarks'); 
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'bookmarks',
                    newValue: null
                }));
            }

            // 4. 清除设置数据
            if (clearSettings && clearSettings.checked) {
                localStorage.removeItem('locus-settings');
                localStorage.removeItem('terrainEnabled');

                applyTheme('light');
                document.documentElement.setAttribute('data-theme', 'light');
            }

            // 5. 反馈
            alert(shellRepopulated
                ? '清理已完成！部分资源将在刷新后重新获取。'
                : '清理已完成！离线缓存未能自动重建，请刷新页面后重试。');
            clearCacheModal.classList.remove('active');

            if (clearCesiumCache && clearCesiumCache.checked) {
                if (confirm("Cesium 引擎缓存已清除。为了彻底释放空间并重新加载最新引擎，是否立即刷新页面？")) {
                    location.reload();
                }
            }

        } catch (error) {
            console.error('清除缓存失败:', error);
            alert('发生错误：' + error.message);
        }
    });
    console.log('设置页面已初始化');
})();