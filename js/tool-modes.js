// ============================================================================
// 互斥工具模式注册中心
// ----------------------------------------------------------------------------
// 「标记」「街景」「测量」三个入口共用地球上的同一次点击，任何时刻只能有
// 一个处于激活态。若各自只管自己，会出现：
//   · 标记模式下点地图，同时又被街景的取点 handler 抢走；
//   · 测量折线画到一半，切到街景，折线还挂在屏幕上。
//
// 这里用一个极小的注册中心承接互斥：每个工具向本模块登记一个
// { id, deactivate } —— deactivate 由工具自己实现（关高亮、拆 handler、清状态）。
// 某个工具要激活时先调 claim(id)，本模块会把**其它**已激活的工具挨个 deactivate。
//
// 之所以不让各模块互相 import（streetview ←→ bookmarks 直接互调），
// 是为了避免循环依赖：本模块零依赖，谁都能引。
// ============================================================================

/** @type {Map<string, { deactivate: () => void }>} */
const registry = new Map();

/** 当前处于激活态的工具 id；null 表示三个工具都没开 */
let activeId = null;

/**
 * 注册一个可互斥的工具。
 *
 * @param {string} id 工具标识（'mark' | 'streetview' | 'measure'）
 * @param {() => void} deactivate 停用回调：把该工具恢复到未激活状态。
 *        约定：该回调**不得**再调用 release()，否则会递归。
 */
export function registerTool(id, deactivate) {
    registry.set(id, { deactivate });
}

/**
 * 声明「我要激活了」。会先停用当前激活的其它工具。
 *
 * @param {string} id 工具标识
 */
export function claim(id) {
    if (activeId && activeId !== id) {
        const other = registry.get(activeId);
        if (other) {
            try {
                other.deactivate();
            } catch (e) {
                console.warn('停用工具失败:', activeId, e);
            }
        }
    }
    activeId = id;
}

/**
 * 声明「我关闭了」。
 *
 * @param {string} id 工具标识。仅当它确实是当前激活项时才清空，
 *        避免「A 被 B 挤掉后 A 再调 release」把 B 的激活态误清。
 */
export function release(id) {
    if (activeId === id) activeId = null;
}

/** @returns {string|null} 当前激活的工具 id */
export function getActiveTool() {
    return activeId;
}
