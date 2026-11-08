// ============================================================================
// 互斥工具模式：标记 / 街景 / 测量共用地图左键，同一时刻只能激活一个。
// 各工具登记 { id, deactivate }，claim(id) 会先把其它已激活的工具停用。
// 本模块零依赖，避免业务模块互相 import 造成循环依赖。
// ⚠️ deactivate 回调里不得再调 release()，否则 A→B→A 会递归。
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
