(function() {
    'use strict';

    // DOM 引用
    const followSystemCheckbox = document.getElementById('followSystem');
    const colorModeSelect = document.getElementById('colorMode');
    const backBtn = document.getElementById('backBtn');

    // 存储键名
    const STORAGE_KEY = 'locus-settings';
    // 瓦片缓存开关。与 js/tile-cache.js 共用同一个键（那边是 ES Module，
    // 本页是普通脚本，无法 import，因此读写逻辑各留一份，改动时两边一起改）。
    const TILE_CACHE_KEY = 'tileCacheEnabled';
    // 瓦片缓存名前缀，与 sw.js 的 TILE_CACHE_NAME 对应
    const TILE_CACHE_PREFIX = 'locus-earth-tiles';

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
        syncColorSelectUI();

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
        syncColorSelectUI();
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
        syncColorSelectUI();
    });

    // 4c. 自绘下拉
    // ------------------------------------------------------------------
    // 原生 <select> 的弹层由系统绘制，CSS 完全无法着色（深色主题下会露出
    // 系统灰白方块）。所以：原生 select 只当数据源保留在 DOM 里（上面的逻辑
    // 一行都不用改），可见部分由 button + ul 代理。
    // 所有对 select.value / .disabled 的写入都要在末尾调 syncColorSelectUI()。
    const colorSelectWrap = document.getElementById('colorModeSelectWrap');
    const colorTrigger = document.getElementById('colorModeTrigger');
    const colorMenu = document.getElementById('colorModeMenu');
    const colorValue = document.getElementById('colorModeValue');

    function syncColorSelectUI() {
        if (!colorTrigger) return;
        const opt = colorModeSelect.options[colorModeSelect.selectedIndex];
        colorValue.textContent = opt ? opt.textContent : '浅色';
        Array.prototype.forEach.call(colorMenu.children, function (li) {
            li.setAttribute('aria-selected', String(li.dataset.value === colorModeSelect.value));
            li.classList.remove('is-active');
        });
        colorTrigger.disabled = colorModeSelect.disabled;
        if (colorModeSelect.disabled) closeColorMenu();
    }

    function openColorMenu() {
        if (colorModeSelect.disabled) return;
        colorMenu.classList.add('is-open');
        colorTrigger.setAttribute('aria-expanded', 'true');
    }
    function closeColorMenu() {
        if (!colorMenu.classList.contains('is-open')) return;
        colorMenu.classList.remove('is-open');
        colorTrigger.setAttribute('aria-expanded', 'false');
        Array.prototype.forEach.call(colorMenu.children, function (li) {
            li.classList.remove('is-active');
        });
    }

    if (colorTrigger) {
        colorTrigger.addEventListener('click', function (e) {
            e.stopPropagation();
            if (colorMenu.classList.contains('is-open')) closeColorMenu();
            else openColorMenu();
        });

        colorTrigger.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                openColorMenu();
                const items = colorMenu.querySelectorAll('.select-option');
                const idx = [...items].findIndex(li => li.getAttribute('aria-selected') === 'true');
                const next = items[e.key === 'ArrowDown' ? Math.min(idx + 1, items.length - 1) : Math.max(idx - 1, 0)];
                if (next) next.classList.add('is-active');
            }
        });

        // 选择某一项
        colorMenu.addEventListener('click', function (e) {
            const li = e.target.closest('.select-option');
            if (!li) return;
            if (colorModeSelect.value !== li.dataset.value) {
                colorModeSelect.value = li.dataset.value;
                colorModeSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            syncColorSelectUI();
            closeColorMenu();
            colorTrigger.focus();
        });

        // 键盘：上下移动高亮，回车/空格确认，Esc 关闭
        colorMenu.addEventListener('keydown', function (e) {
            const items = [...colorMenu.querySelectorAll('.select-option')];
            const cur = items.findIndex(li => li.classList.contains('is-active'));
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const n = e.key === 'ArrowDown' ? Math.min(cur + 1, items.length - 1) : Math.max(cur - 1, 0);
                items.forEach(li => li.classList.remove('is-active'));
                items[n].classList.add('is-active');
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (items[cur]) items[cur].click();
            } else if (e.key === 'Escape') {
                closeColorMenu();
                colorTrigger.focus();
            }
        });

        // 点外部 / 按 Esc 关闭
        document.addEventListener('click', function (e) {
            if (!e.target.closest('#colorModeSelectWrap')) closeColorMenu();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeColorMenu();
        });
    }

    // 4c. 系统主题变化监听（实时跟随）
    const systemMedia = window.matchMedia('(prefers-color-scheme: dark)');
    systemMedia.addEventListener('change', function(e) {
        const settings = loadSettings() || { followSystem: true, colorMode: 'light' };
        if (settings.followSystem !== false) {
            const theme = e.matches ? 'dark' : 'light';
            settings.colorMode = theme;
            applyTheme(theme);
            colorModeSelect.value = theme;
            syncColorSelectUI();
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

    // ========================================================================
    // 页内确认弹窗（取代原生 confirm）
    // ------------------------------------------------------------------------
    // 原生确认框在 Android 外壳里是「<域名> 显示」的系统对话框，不跟随主题，
    // 也不套用本站样式。这里复用本页 .modal / .modal-content 结构。
    // ========================================================================
    let resolveConfirmRequest = null;

    function askConfirm(message) {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('okConfirmBtn');
        const cancelBtn = document.getElementById('cancelConfirmBtn');

        // 弹窗缺失时退回原生 confirm，保证功能不丢
        if (!modal || !okBtn || !cancelBtn) return Promise.resolve(confirm(message));

        // 上一个还挂着就直接当作取消，避免 Promise 永远悬着
        if (resolveConfirmRequest) {
            const stale = resolveConfirmRequest;
            resolveConfirmRequest = null;
            stale(false);
        }

        if (messageEl) messageEl.textContent = message;
        modal.classList.add('active');
        okBtn.focus();

        return new Promise((resolve) => {
            const finish = (result) => {
                resolveConfirmRequest = null;
                modal.classList.remove('active');
                okBtn.removeEventListener('click', onOk);
                cancelBtn.removeEventListener('click', onCancel);
                modal.removeEventListener('click', onBackdrop);
                resolve(result);
            };
            const onOk = () => finish(true);
            const onCancel = () => finish(false);
            const onBackdrop = (e) => { if (e.target === modal) finish(false); };

            resolveConfirmRequest = finish;
            okBtn.addEventListener('click', onOk);
            cancelBtn.addEventListener('click', onCancel);
            modal.addEventListener('click', onBackdrop);
        });
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


    // --- 瓦片缓存开关（默认开）---
    // 缓存本身完全由 sw.js 负责（实测它连 XHR 都拦得到），但 SW 读不到
    // localStorage，所以每次改动都要主动把状态推过去。这里内联一份与
    // js/tile-cache.js 等价的消息发送，改动时两边一起改。
    const tileCacheToggle = document.getElementById('tileCacheToggle');

    function pushTileCacheSwitch(enabled) {
        if (!('serviceWorker' in navigator)) return;
        navigator.serviceWorker.getRegistration()
            .then((registration) => {
                const target = navigator.serviceWorker.controller || (registration && registration.active);
                if (target) target.postMessage({ type: 'TILE_CACHE_SWITCH', enabled });
            })
            .catch(() => {});
    }

    if (tileCacheToggle) {
        tileCacheToggle.checked = localStorage.getItem(TILE_CACHE_KEY) !== 'false';
        // 本页加载时也推一次：SW 可能刚被系统回收重启，内存里还是默认值
        pushTileCacheSwitch(tileCacheToggle.checked);

        tileCacheToggle.addEventListener('change', () => {
            localStorage.setItem(TILE_CACHE_KEY, tileCacheToggle.checked ? 'true' : 'false');
            pushTileCacheSwitch(tileCacheToggle.checked);

            window.dispatchEvent(new StorageEvent('storage', {
                key: TILE_CACHE_KEY,
                newValue: String(tileCacheToggle.checked)
            }));

            showToastInternal(tileCacheToggle.checked
                ? '瓦片缓存已开启，浏览过的区域下次直接读本地'
                : '瓦片缓存已关闭，底图瓦片将每次都从网络获取');
        });
    }

    // 把三个非主题开关的界面状态与 localStorage 对齐。
    // 用于「清除设置数据」之后：数据恢复默认，界面也必须跟着回到默认，
    // 否则用户看到的是"清除了但开关没动"。
    function syncExtraToggles() {
        if (terrainToggle) terrainToggle.checked = localStorage.getItem('terrainEnabled') !== 'false';
        if (overlayToggle) overlayToggle.checked = localStorage.getItem('overlayEnabled') === 'true';
        if (tileCacheToggle) tileCacheToggle.checked = localStorage.getItem(TILE_CACHE_KEY) !== 'false';
    }


    // --- 清除缓存弹窗 ---
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    const clearCacheModal = document.getElementById('clearCacheModal');
    const confirmClearBtn = document.getElementById('confirmClearBtn');
    const cancelClearBtn = document.getElementById('cancelClearBtn');

    const clearAppCache = document.getElementById('clearAppCache');
    const clearTileCache = document.getElementById('clearTileCache');
    const clearCesiumCache = document.getElementById('clearCesiumCache');
    const clearBookmarks = document.getElementById('clearBookmarks');
    const clearSettings = document.getElementById('clearSettings');
    const tileCacheDesc = document.getElementById('tileCacheDesc');

    // 列出本应用某个前缀下的所有缓存名。
    // 用 startsWith 而不是 includes：前者不会误伤同域名下名字相近的其他缓存。
    async function findCaches(prefix) {
        if (!('caches' in window)) return [];
        try {
            const names = await caches.keys();
            return names.filter(name => name.startsWith(prefix));
        } catch (error) {
            console.warn('读取缓存列表失败:', error);
            return [];
        }
    }

    // 统计已缓存的瓦片数量，写进弹窗里的说明文字。
    // 只数条目、不算字节：Cache Storage 不提供单条大小，逐条读 content-length
    // 在几千条规模下会让弹窗明显卡一下，不划算。
    async function refreshTileCacheSummary() {
        if (!tileCacheDesc) return;
        const names = await findCaches(TILE_CACHE_PREFIX);
        let count = 0;
        for (const name of names) {
            try {
                const cache = await caches.open(name);
                count += (await cache.keys()).length;
            } catch {}
        }
        tileCacheDesc.textContent = count > 0
            ? `(当前已缓存 ${count.toLocaleString()} 块瓦片，清除后这些区域需要重新联网获取)`
            : '(暂无缓存瓦片。离线时能不能看到地图，取决于这里)';
    }

    // 打开弹窗
    clearCacheBtn.addEventListener('click', () => {
        clearCacheModal.classList.add('active');
        // 数量随时在变（主页面可能还在后台加载瓦片），每次打开都重新统计
        refreshTileCacheSummary();
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
            let tileCleared = false;
            // 先记下状态：后面的「勾选状态回到默认」会把它清掉，
            // 而刷新提示要按用户刚才的选择决定
            const cesiumCleared = !!(clearCesiumCache && clearCesiumCache.checked);

            // 1. 清除 PWA 应用缓存（界面外壳：HTML / CSS / JS / 图标）
            if (clearAppCache && clearAppCache.checked) {
                const appCaches = await findCaches('locus-earth-app');
                await Promise.all(appCaches.map(name => caches.delete(name)));
                // 立即重建，避免离线能力永久丧失
                shellRepopulated = await requestShellRepopulation();
            }

            // 2. 清除瓦片缓存（离线地图数据）
            if (clearTileCache && clearTileCache.checked) {
                const tileCaches = await findCaches(TILE_CACHE_PREFIX);
                await Promise.all(tileCaches.map(name => caches.delete(name)));
                tileCleared = true;
            }

            // 3. 清除 Cesium 地球引擎缓存
            if (cesiumCleared) {
                const cesiumCaches = await findCaches('locus-earth-cesium');
                await Promise.all(cesiumCaches.map(name => caches.delete(name)));
            }

            // 4. 清除收藏夹数据
            if (clearBookmarks && clearBookmarks.checked) {
                localStorage.removeItem('bookmarks');
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'bookmarks',
                    newValue: null
                }));
            }

            // 5. 清除设置数据（恢复默认）
            // 这里刻意把各项写回**默认值**而不是 removeItem：
            // 主页面用 `!== 'false'` / `=== 'true'` 判断，removeItem 会让它收到
            // newValue: null，从而把「恢复默认」误读成「全部关闭」——
            // 于是清完设置，地形看着也被关掉了，下次刷新才回来。
            if (clearSettings && clearSettings.checked) {
                localStorage.setItem('terrainEnabled', 'true');   // 默认开
                localStorage.setItem('overlayEnabled', 'false');  // 默认关
                localStorage.setItem(TILE_CACHE_KEY, 'true');     // 默认开
                localStorage.removeItem(STORAGE_KEY);             // 主题：由 updateAll 重建默认值
                updateAll();
                syncExtraToggles();
                pushTileCacheSwitch(true);                        // 开关回到默认，也要告诉 SW
            }

            // 6. 反馈（页内 toast，取代原生 alert）
            let message = shellRepopulated
                ? '清理已完成，部分资源将在刷新后重新获取'
                : '清理已完成，但离线缓存未能自动重建，请刷新页面后重试';
            if (tileCleared) {
                // 顺手说清楚"系统里看到的占用没变"是为什么：
                // Cache Storage 删掉是真的删了，但系统的配额统计是懒计算的，
                // 加上浏览器自己的 HTTP 缓存里可能还留着旧副本（网页删不掉它）。
                message += '；瓦片缓存已清空（系统显示的存储占用可能延迟一会儿才更新）';
            }
            showToastInternal(message);
            clearCacheModal.classList.remove('active');

            // 勾选状态回到默认：应用缓存默认勾上，大件（瓦片 / 引擎 / 数据）默认不勾，
            // 避免下次打开时手快连带清掉
            if (clearAppCache) clearAppCache.checked = true;
            [clearTileCache, clearCesiumCache, clearBookmarks, clearSettings]
                .forEach(box => { if (box) box.checked = false; });
            refreshTileCacheSummary();

            if (cesiumCleared) {
                const reloadNow = await askConfirm(
                    'Cesium 引擎缓存已清除。为了彻底释放空间并重新加载最新引擎，是否立即刷新页面？'
                );
                if (reloadNow) {
                    location.reload();
                }
            }

        } catch (error) {
            console.error('清除缓存失败:', error);
            showToastInternal('发生错误：' + error.message);
        }
    });
    // =============================================
    // 兼容性诊断
    // =============================================
    // 为什么放在设置页：排查"卡在加载页 / 地球全黑"必须在**壳自己的 WebView**
    // 里测 —— 同一台手机上的 Chrome / Edge 与系统 WebView 是两个内核，
    // 浏览器能跑不代表 WebView 能跑。而壳里没有地址栏、调试器也可能连不上，
    // 设置页是唯一一个能在 App 内打开、又允许跑脚本的地方。
    //
    // 检测顺序刻意与主页面启动顺序一致：
    //   WebGL 2 → ES Module → importmap 裸标识符 → Cesium 下载 → Viewer 初始化
    // 哪一步先红，问题就在那一步。
    const diagRunBtn = document.getElementById('diagRunBtn');
    const diagOutput = document.getElementById('diagOutput');

    function diagLog(output, lines, text) {
        lines.push(text);
        output.hidden = false;
        output.textContent = lines.join('\n');
    }

    function errorText(error) {
        if (!error) return '未知错误';
        return String((error && (error.message || error.reason)) || error);
    }

    async function runDiagnostics(output, button) {
        const lines = [];
        button.disabled = true;
        output.hidden = false;
        output.textContent = '检测中…';

        const log = (text) => diagLog(output, lines, text);

        const ua = navigator.userAgent || '';
        const chromium = (/Chrome\/(\d+)/.exec(ua) || [])[1] || '未识别';
        log('内核：Chromium ' + chromium + (ua.indexOf('ArkWeb') >= 0 ? '（ArkWeb）' : ''));
        log('UA：' + ua);

        // 1. WebGL 2
        let gl2 = null;
        try {
            gl2 = document.createElement('canvas').getContext('webgl2');
        } catch (error) {}
        if (!gl2) {
            log('WebGL 2：❌ 拿不到上下文（Cesium 1.118 起只支持 WebGL 2，这足以导致黑屏）');
        } else {
            log('WebGL 2：✅ ' + gl2.getParameter(gl2.VERSION));
            const extensions = gl2.getSupportedExtensions() || [];
            log('  浮点颜色缓冲：' + (extensions.indexOf('EXT_color_buffer_float') >= 0 ? '有' : '无') +
                '｜各向异性过滤：' + (extensions.indexOf('EXT_texture_filter_anisotropic') >= 0 ? '有' : '无'));
        }

        // 2. ES Module（挑一个不依赖 Cesium 的模块，验证模块加载本身）
        try {
            // 相对路径是按本脚本（js/settings.js）的位置解析的，不是页面根目录
            await import('./tile-cache.js');
            log('ES Module 加载：✅ 正常');
        } catch (error) {
            log('ES Module 加载：❌ ' + errorText(error));
        }

        // 3. Cesium 入口（走本地 shim ./cesium.js，和主页面完全同一条路）
        let Cesium = null;
        try {
            Cesium = await import('./cesium.js');
            log('Cesium 入口（./cesium.js）：✅ 版本 ' + (Cesium.VERSION || '?'));
        } catch (error) {
            log('Cesium 入口（./cesium.js）：❌ ' + errorText(error));
            // 退一步用绝对地址再试：能成说明本地 shim 的转发有问题，不能成就是网络/内核的问题
            try {
                Cesium = await import('https://unpkg.com/cesium@1.118.2/Build/Cesium/index.js');
                log('  改为绝对地址加载：✅ 成功 —— 问题在本地 shim，不在网络');
            } catch (fallbackError) {
                log('  改为绝对地址加载：❌ ' + errorText(fallbackError));
            }
        }

        // 3.5 顺带记录这个内核认不认 import maps。主站已不依赖它（2026-10-21 在华为内核
        // 上定位到：supports('importmap') 返回 true，但裸标识符根本不解析），这里只作参考。
        try {
            await import('cesium');
            log('import maps 解析裸标识符：✅ 可用');
        } catch (error) {
            log('import maps 解析裸标识符：❌ 不可用（主站已不依赖，不影响使用）');
        }

        // 4. 引擎初始化（失败多半是 WebGL 能力/驱动问题）
        if (Cesium) {
            const host = document.createElement('div');
            host.style.cssText = 'position:fixed;left:-9999px;top:0;width:200px;height:150px;';
            document.body.appendChild(host);
            try {
                const viewer = new Cesium.Viewer(host, {
                    baseLayer: false,
                    animation: false, timeline: false, geocoder: false,
                    homeButton: false, navigationHelpButton: false,
                    fullscreenButton: false, infoBox: false,
                    sceneModePicker: false, baseLayerPicker: false,
                    selectionIndicator: false
                });
                log('Cesium Viewer 初始化：✅ 成功');
                viewer.destroy();
            } catch (error) {
                log('Cesium Viewer 初始化：❌ ' + errorText(error));
            }
            host.remove();
        } else {
            log('Cesium Viewer 初始化：跳过（引擎没加载成功）');
        }

        button.disabled = false;
    }

    if (diagRunBtn && diagOutput) {
        diagRunBtn.addEventListener('click', () => {
            runDiagnostics(diagOutput, diagRunBtn);
        });
    }

    console.log('设置页面已初始化');
})();