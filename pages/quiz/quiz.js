const phraseService = require('../../services/phrase-service')
const { shuffle, pickWrong } = require('../../utils/shuffle')
const analytics = require('../../services/analytics-service')

const MODES = [
  { key: 'phrase',  icon: '💬', title: '词汇测验', desc: '看中文→选德语' },
  { key: 'reverse', icon: '🔄', title: '反向测验', desc: '看德语→选中文' },
]

Page({
  data: {
    modes: MODES,
    mode: '',          // '' 未开始
    loading: false,
    loadError: false,
    score: 0,
    total: 0,
    question: '',
    hint: '',
    opts: [],          // [{label, state, value, correct}]
    answered: false,
  },

  startQuiz(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ mode, loading: true, loadError: false, score: 0, total: 0 })
    phraseService.getAllPhrases().then((all) => {
      this._all = all
      this.setData({ loading: false })
      this._nextQ()
    }).catch(() => {
      this.setData({ loading: false, loadError: true })
      wx.showToast({ title: '题库加载失败，请重试', icon: 'none' })
    })
  },

  retryLoad() {
    const mode = this.data.mode
    this.setData({ loading: true, loadError: false })
    phraseService.getAllPhrases().then((all) => {
      this._all = all
      this.setData({ loading: false })
      this._nextQ()
    }).catch(() => {
      this.setData({ loading: false, loadError: true })
      wx.showToast({ title: '题库加载失败，请重试', icon: 'none' })
    })
  },

  _nextQ() {
    const all = this._all
    const cur = all[Math.floor(Math.random() * all.length)]
    const mode = this.data.mode
    // L1: 按展示字段去重干扰项（避免相同文本出现多次）
    const displayKey = mode === 'phrase' ? (x) => x.de : (x) => x.zh
    const curDisplayText = displayKey(cur)
    const wrong = pickWrong(all, cur, 3, (x) => x.id).filter(
      (o) => displayKey(o) !== curDisplayText
    )
    // 如果去重后不足3个，从剩余候选再补（按展示文本去重）
    if (wrong.length < 3) {
      const usedTexts = new Set([curDisplayText, ...wrong.map(displayKey)])
      const extra = all.filter(
        (o) => o.id !== cur.id && !usedTexts.has(displayKey(o))
      )
      const extraShuffled = shuffle(extra)
      while (wrong.length < 3 && extraShuffled.length > 0) {
        wrong.push(extraShuffled.shift())
      }
    }
    const pool = shuffle([cur, ...wrong])
    let question, hint, opts
    if (mode === 'phrase') {
      question = cur.zh
      hint = '请选择正确的德语翻译'
      opts = pool.map((o) => ({ label: o.de, state: '', correct: o.id === cur.id }))
    } else {
      question = cur.de
      hint = '请选择正确的中文翻译'
      opts = pool.map((o) => ({ label: o.zh, state: '', correct: o.id === cur.id }))
    }
    this.setData({ question, hint, opts, answered: false })
  },

  onSelect(e) {
    if (this.data.answered) return
    const idx = e.detail.index
    const opts = this.data.opts.map((o, i) => {
      if (o.correct) return { ...o, state: 'correct' }
      if (i === idx) return { ...o, state: 'wrong' }
      return o
    })
    const isCorrect = this.data.opts[idx].correct
    try { analytics.track(analytics.EVENTS.QUIZ_ANSWER, { mode: this.data.mode, correct: isCorrect }) } catch (e) {}
    this.setData({
      opts,
      answered: true,
      total: this.data.total + 1,
      score: this.data.score + (isCorrect ? 1 : 0),
    })
    this._nextTimer = setTimeout(() => this._nextQ(), 1200)
  },

  onRestart() {
    this.setData({ score: 0, total: 0 })
    this._nextQ()
  },

  onExit() {
    if (this._nextTimer) { clearTimeout(this._nextTimer); this._nextTimer = null }
    this.setData({ mode: '' })
  },

  onUnload() {
    if (this._nextTimer) { clearTimeout(this._nextTimer); this._nextTimer = null }
  },

  onHide() {
    if (this._nextTimer) { clearTimeout(this._nextTimer); this._nextTimer = null }
  },
})
