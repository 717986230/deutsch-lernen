// ──────────────────────────────────────────────────────────────
// pages/review/review.js — 生词本复习（间隔重复 + 主动回忆）
// 流程移植自 tools/offline-template.html 的 renderSrs / srsStart / srsShowCard / srsRate：
//   看中文先回想 → 点「显示答案」→ 看德语+谐音 → 三档自评（忘了/模糊/记住了）。
// 自评规则与离线版一致（见 services/srs-service.js）：
//   忘了 → box 回 0，10 分钟后本轮重来；模糊 → 间隔不变；记住了 → box+1。
// 入口：收藏页「今日待复习」卡片（只练到期的），或「练习全部生词」。
// ──────────────────────────────────────────────────────────────
const srs = require('../../services/srs-service')
const tts = require('../../services/tts-service')
const analytics = require('../../services/analytics-service')
const { shuffle } = require('../../utils/shuffle')

Page({
  data: {
    stage: 'list',   // list 汇总 | card 答题卡 | done 完成
    allMode: false,  // true = 练习全部生词，false = 只练今日到期
    counts: { total: 0, due: 0, mastered: 0 },
    current: null,   // {id, de, zh, py, level, cat, box, due}
    revealed: false,
    remaining: 0,
    doneCount: 0,
    progressPct: 0,  // 进度条百分比（WXML 里不用复杂算式，JS 里算好）
  },

  onLoad(options) {
    this.setData({ allMode: options && options.all === '1' })
  },

  onShow() {
    this.setData({ counts: srs.getCounts() })
    if (this.data.stage === 'list') {
      // 汇总页每次回来都刷新数字
      this.setData({ counts: srs.getCounts() })
    }
  },

  startReview(e) {
    const allMode = (e && e.currentTarget && e.currentTarget.dataset.all === '1') || this.data.allMode
    const queue = shuffle(allMode ? srs.getAll() : srs.getDue())
    try { analytics.track(analytics.EVENTS.REVIEW_START, { all: allMode, count: queue.length }) } catch (e) {}
    if (!queue.length) {
      wx.showToast({ title: allMode ? '生词本还是空的' : '今日没有到期生词', icon: 'none' })
      return
    }
    this._queue = queue
    this.setData({
      stage: 'card',
      current: queue[0],
      revealed: false,
      remaining: queue.length,
      doneCount: 0,
      progressPct: 0,
    })
  },

  // 显示答案（主动回忆 → 再看答案）
  onReveal() {
    if (!this.data.current) return
    this.setData({ revealed: true })
    try { tts.speak(this.data.current.de) } catch (e) {}
  },

  onSpeak() {
    if (!this.data.current) return
    try { tts.speak(this.data.current.de) } catch (e) {}
  },

  // 三档自评：0 忘了 / 1 模糊 / 2 记住了
  onGrade(e) {
    const grade = Number(e.currentTarget.dataset.grade)
    const cur = this.data.current
    if (!cur) return
    try { analytics.track(analytics.EVENTS.REVIEW_GRADE, { phraseId: cur.id, grade }) } catch (e) {}
    const res = srs.grade(cur.id, grade)
    const queue = this._queue || []
    queue.shift()
    // 忘了：本轮稍后重来
    if (res && res.requeue) queue.push(cur)
    const doneCount = this.data.doneCount + 1
    if (!queue.length) {
      this._queue = []
      this.setData({ stage: 'done', current: null, remaining: 0, doneCount, progressPct: 100, counts: srs.getCounts() })
      return
    }
    this._queue = queue
    this.setData({
      current: queue[0],
      revealed: false,
      remaining: queue.length,
      doneCount,
      progressPct: Math.round(doneCount / (doneCount + queue.length) * 100),
    })
  },

  onBack() {
    try { tts.stop() } catch (e) {}
    wx.navigateBack()
  },

  onUnload() {
    try { tts.stop() } catch (e) {}
  },
})
