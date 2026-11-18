// ──────────────────────────────────────────────────────────────
// srs-service.js — 间隔重复（Leitner）生词本
// 移植自 tools/offline-template.html 里已验证的 SRS 逻辑：
//   间隔 [0,1,3,7,16,30] 天、box 0–5、三档自评（忘了/模糊/记住了）、
//   答错自动入本、复习用主动回忆（先看中文回想再显示答案）。
// 与离线版的区别：离线版以德语词 `de` 为键；小程序版以词句 id
// （`${分类序号}-${句序号}`，与 phrase-service.getAllPhrases() 一致）
// 为键，避免 13 条 de 重复词互相串联。记录里同时保存 de/zh/py/level/cat。
// 存储：wx 本地 storage，key 'srs-progress'，与收藏 'favorites' 分开。
// ──────────────────────────────────────────────────────────────

// box 0..5 的复习间隔（天），box5 = 已掌握
const INTERVALS = [0, 1, 3, 7, 16, 30]
const DAY_MS = 86400000
const STORAGE_KEY = 'srs-progress'
// 自评“忘了”：10 分钟后在本轮复习里重来（与离线版一致）
const REQUEUE_MS = 10 * 60 * 1000

function _hasWx() {
  return typeof wx !== 'undefined' && wx !== null
}

function _load() {
  if (!_hasWx()) return {}
  try {
    return wx.getStorageSync(STORAGE_KEY) || {}
  } catch (e) {
    return {}
  }
}

function _save(all) {
  if (!_hasWx()) return
  try {
    wx.setStorageSync(STORAGE_KEY, all)
  } catch (e) {
    // storage 写入失败时静默忽略
  }
}

function _isValid(phrase) {
  return phrase && phrase.id && phrase.de && phrase.zh
}

/**
 * 把一条词句加入生词本（只增不删）。已在库中返回 false。
 * @param {object} phrase {id, de, zh, py, level, cat}
 * @returns {boolean} 是否新加入
 */
function add(phrase) {
  if (!_isValid(phrase)) return false
  const all = _load()
  if (all[phrase.id]) return false
  all[phrase.id] = {
    id: phrase.id,
    de: phrase.de,
    zh: phrase.zh,
    py: phrase.py || '',
    level: phrase.level || '',
    cat: phrase.cat || '',
    box: 0,
    due: Date.now(),
  }
  _save(all)
  return true
}

/** 答错自动入本（与 add 相同语义，调用处可读性更好） */
function addWrong(phrase) {
  return add(phrase)
}

/** 批量加入（收藏页“一键加入生词本”用），返回新加入条数 */
function addAll(phrases) {
  let n = 0
  ;(phrases || []).forEach((p) => {
    if (add(p)) n++
  })
  return n
}

function remove(id) {
  const all = _load()
  if (!all[id]) return false
  delete all[id]
  _save(all)
  return true
}

function getAll() {
  const all = _load()
  return Object.keys(all)
    .map((k) => all[k])
    .sort((a, b) => a.due - b.due)
}

/** 今日待复习：box < 5 且已到期，按 due 排序 */
function getDue() {
  const now = Date.now()
  return getAll().filter((c) => c.box < 5 && c.due <= now)
}

function getCounts() {
  const all = getAll()
  return {
    total: all.length,
    due: all.filter((c) => c.box < 5 && c.due <= Date.now()).length,
    mastered: all.filter((c) => c.box >= 5).length,
  }
}

/**
 * 三档自评（与离线版 srsRate 完全一致）：
 *   0 忘了：box 回 0，10 分钟后到期，本轮稍后重来 → 返回 { requeue: true }
 *   1 模糊：box 不变（至少 1），按当前 box 间隔顺延
 *   2 记住了：box + 1（最高 5），按新 box 间隔顺延
 * @returns {{requeue:boolean}|null} 卡片不存在返回 null
 */
function grade(id, g) {
  const all = _load()
  const real = all[id]
  if (!real) return null
  if (g === 0) {
    real.box = 0
    real.due = Date.now() + REQUEUE_MS
    _save(all)
    return { requeue: true }
  }
  if (g === 1) {
    real.box = Math.max(1, real.box)
    real.due = Date.now() + INTERVALS[real.box] * DAY_MS
  } else {
    real.box = Math.min(5, real.box + 1)
    real.due = Date.now() + INTERVALS[real.box] * DAY_MS
  }
  _save(all)
  return { requeue: false }
}

module.exports = {
  INTERVALS,
  STORAGE_KEY,
  add,
  addWrong,
  addAll,
  remove,
  getAll,
  getDue,
  getCounts,
  grade,
}
