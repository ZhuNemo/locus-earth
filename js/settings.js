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
        // 返回主页面，保留当前路径的查询参数
        window.location.href = './';
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

    // 应用已保存的设置
    updateAll();

    console.log('⚙️ 设置页面已初始化');
})();