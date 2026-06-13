/**
 * analytics-service.js
 * 本地埋点 & 数据分析服务
 *
 * 设计原则：
 * 1. 全部 API 容错：try/catch 包裹，wx 不存在时不抛错
 * 2. 环形缓冲：最多存储最近 MAX_EVENTS 条事件，超出丢弃最旧
 * 3. flush() / report() 预留上报钩子，当前为本地持久化空实现
 *    将来对接后端或微信数据助手时只需实现 _doReport(events)
 */

// ── 事件常量 ──────────────────────────────────────────────
const EVENTS = {
  PAGE_VIEW:      'page_view',       // 页面曝光
  QUIZ_ANSWER:    'quiz_answer',     // 测验答题（含对错）
  FAVORITE_TOGGLE:'favorite_toggle', // 收藏/取消收藏
  SEARCH:         'search',          // 搜索
  LEVEL_SWITCH:   'level_switch',    // 级别切换
}

// ── 配置 ──────────────────────────────────────────────────
const STORAGE_KEY = 'analytics_events'
const MAX_EVENTS  = 1000   // 环形缓冲上限

// ── 内部工具 ──────────────────────────────────────────────
function _hasWx() {
  return typeof wx !== 'undefined' && wx !== null
}

function _readEvents() {
  if (!_hasWx()) return []
  try {
    return wx.getStorageSync(STORAGE_KEY) || []
  } catch (e) {
    return []
  }
}

function _writeEvents(events) {
  if (!_hasWx()) return
  try {
    wx.setStorageSync(STORAGE_KEY, events)
  } catch (e) {
    // storage 写入失败时静默忽略
  }
}

// ── 核心 API ──────────────────────────────────────────────

/**
 * track(event, props)
 * 记录一条埋点事件，追加到本地 storage 事件缓冲。
 *
 * @param {string} event  事件名（建议使用 EVENTS 常量）
 * @param {object} props  附加属性（可为空）
 */
function track(event, props) {
  try {
    const entry = {
      event,
      props: props || {},
      ts: Date.now(),
      date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    }
    const events = _readEvents()
    events.push(entry)
    // 环形缓冲：超出上限则丢弃最旧
    const trimmed = events.length > MAX_EVENTS
      ? events.slice(events.length - MAX_EVENTS)
      : events
    _writeEvents(trimmed)
  } catch (e) {
    // 埋点不影响主流程
  }
}

/**
 * getEvents()
 * 获取本地所有已记录事件（原始数组）。
 *
 * @returns {Array}
 */
function getEvents() {
  try {
    return _readEvents()
  } catch (e) {
    return []
  }
}

/**
 * clear()
 * 清空本地事件缓冲（开发调试用）。
 */
function clear() {
  try {
    _writeEvents([])
  } catch (e) {}
}

/**
 * flush()
 * 将本地缓冲事件上报，然后清空缓冲。
 * 当前为预留接口，_doReport 为空实现。
 * 将来对接后端时在 _doReport 里补充 HTTP 请求逻辑即可。
 *
 * @returns {Promise}
 */
function flush() {
  try {
    const events = _readEvents()
    if (events.length === 0) return Promise.resolve()
    return _doReport(events).then(() => {
      _writeEvents([])
    }).catch(() => {
      // 上报失败不清空，等待下次重试
    })
  } catch (e) {
    return Promise.resolve()
  }
}

/**
 * _doReport(events)
 * 【预留】将来对接后端 / 微信数据助手时实现此函数。
 *
 * 方案 A：自建后端
 *   return new Promise((resolve, reject) => {
 *     wx.request({ url: 'https://your-api/track', method: 'POST',
 *                  data: { events }, success: resolve, fail: reject })
 *   })
 *
 * 方案 B：微信数据助手（wx.reportEvent）
 *   events.forEach(e => { try { wx.reportEvent(e.event, e.props) } catch(_){} })
 *   return Promise.resolve()
 *
 * @param {Array} events
 * @returns {Promise}
 */
function _doReport(events) { // eslint-disable-line no-unused-vars
  // TODO: 实现真实上报逻辑
  return Promise.resolve()
}

/**
 * getReport()
 * 基于本地事件缓冲计算汇总指标，返回指标对象。
 * 无需网络，适合在「学习统计」页面展示本地数据。
 *
 * 返回字段：
 *   totalEvents      累计事件数
 *   quizTotal        测验总答题数
 *   quizCorrect      测验答对数
 *   quizAccuracy     测验正确率（0~1，-1 表示暂无数据）
 *   quizByLevel      各级别测验正确率（预留；当前 quiz 事件未带 level 属性）
 *   favoriteCount    当前收藏操作净增数（toggle on - toggle off）
 *   lastActiveDate   最近活跃日期（YYYY-MM-DD）
 *   topSearchTerms   热门搜索词 Top5 [{term, count}]
 *   topCategories    热门分类 Top5（来自 QUIZ_ANSWER 的 cat 属性）[{cat, count}]
 *
 * @returns {object}
 */
function getReport() {
  try {
    const events = _readEvents()

    let quizTotal   = 0
    let quizCorrect = 0
    let favOn       = 0
    let favOff      = 0
    let lastActiveDate = null
    const searchCount = {}
    const catCount    = {}

    events.forEach(e => {
      // 最近活跃日
      if (!lastActiveDate || e.date > lastActiveDate) lastActiveDate = e.date

      if (e.event === EVENTS.QUIZ_ANSWER) {
        quizTotal++
        if (e.props && e.props.correct) quizCorrect++
        if (e.props && e.props.cat) {
          catCount[e.props.cat] = (catCount[e.props.cat] || 0) + 1
        }
      }

      if (e.event === EVENTS.FAVORITE_TOGGLE) {
        if (e.props && e.props.on) favOn++
        else favOff++
      }

      if (e.event === EVENTS.SEARCH && e.props && e.props.keyword) {
        const kw = (e.props.keyword || '').trim()
        if (kw) searchCount[kw] = (searchCount[kw] || 0) + 1
      }
    })

    const topSearchTerms = Object.entries(searchCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term, count]) => ({ term, count }))

    const topCategories = Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, count]) => ({ cat, count }))

    return {
      totalEvents:     events.length,
      quizTotal,
      quizCorrect,
      quizAccuracy:    quizTotal > 0 ? +(quizCorrect / quizTotal).toFixed(4) : -1,
      favoriteCount:   favOn - favOff,
      lastActiveDate,
      topSearchTerms,
      topCategories,
    }
  } catch (e) {
    return {
      totalEvents: 0, quizTotal: 0, quizCorrect: 0,
      quizAccuracy: -1, favoriteCount: 0,
      lastActiveDate: null, topSearchTerms: [], topCategories: [],
    }
  }
}

// ── 导出 ──────────────────────────────────────────────────
module.exports = {
  EVENTS,
  track,
  getEvents,
  clear,
  flush,
  getReport,
}
