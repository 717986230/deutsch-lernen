// ──────────────────────────────────────────────────────────────
// pages/quiz/quiz.js — 练习测验（升级版）
// 相对旧版的变化（审查报告第 3 条，逻辑移植自 tools/offline-template.html）：
//  1) 题型 2 种 → 4 种：新增冠词（gender，der/die/das）与变位（conj，现在时），
//     出题逻辑与离线版 nextGenderQ / nextConjQ 一致；
//  2) 每轮固定题量 10 / 20 题，题库洗牌后顺序出题，一轮内不重复；
//  3) 干扰项优先同级别抽取，不足再放宽到全库（同分类优先于同级别）；
//  4) 答题后不再 1.2 秒自动跳题，改为显示正确答案 +「下一题」按钮；
//  5) 结算页：正确率 + 错题列表，答错的词自动记入生词本（SRS，带 id/级别/分类）；
//  6) 空题库 guard：所选级别下无带冠词名词时给空态提示，不再直接取 all[random] 崩掉。
// ──────────────────────────────────────────────────────────────
const phraseService = require('../../services/phrase-service')
const { shuffle, pickWrong } = require('../../utils/shuffle')
const { VERB_CONJ, CONJ_PERSON } = require('../../utils/conj')
const srs = require('../../services/srs-service')
const tts = require('../../services/tts-service')
const analytics = require('../../services/analytics-service')

const MODES = [
  { key: 'phrase',  icon: '💬', title: '词汇测验', desc: '看中文→选德语' },
  { key: 'reverse', icon: '🔄', title: '反向测验', desc: '看德语→选中文' },
  { key: 'gender',  icon: '🔤', title: '冠词测验', desc: 'der / die / das' },
  { key: 'conj',    icon: '✍️', title: '变位测验', desc: '动词现在时变位' },
]
const LEVEL_TABS = [
  { key: 'all', label: '📚 全部' },
  { key: '0',  label: '🌱 零基础' },
  { key: 'a1', label: '⭐ A1' },
  { key: 'a2', label: '⭐⭐ A2' },
  { key: 'b1', label: '🔥 B1' },
  { key: 'b2', label: '💎 B2' },
]
const ROUND_LENS = [10, 20]
const GENDER_OPTS = ['der', 'die', 'das']

Page({
  data: {
    modes: MODES,
    levelTabs: LEVEL_TABS,
    roundLens: ROUND_LENS,
    activeLevel: 'all',
    roundLen: 10,
    mode: '',          // '' 未开始
    loading: false,
    loadError: false,
    empty: false,      // 所选范围无题
    score: 0,
    total: 0,          // 已答题数，也是 queue 下标
    pct: 0,            // 正确率（WXML 里不能调 Math.round，JS 里算好）
    question: '',
    hint: '',
    opts: [],          // [{label, state, correct}]
    answered: false,
    finished: false,   // 结算页
    wrongList: [],     // [{de, zh}] 本轮答错的词
    addedToSrs: 0,     // 本轮新加入生词本的条数
  },

  onLevelTap(e) {
    this.setData({ activeLevel: e.currentTarget.dataset.level })
  },

  onLenTap(e) {
    this.setData({ roundLen: Number(e.currentTarget.dataset.len) })
  },

  startQuiz(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({
      mode, loading: true, loadError: false, empty: false,
      score: 0, total: 0, pct: 0, finished: false, wrongList: [], addedToSrs: 0,
    })
    if (mode === 'conj') {
      // 变位题不依赖词库，直接出题
      this._buildQueue([])
      this.setData({ loading: false })
      this._showQ()
      return
    }
    phraseService.getAllPhrases().then((all) => {
      this._all = all
      this._buildQueue(all)
      this.setData({ loading: false })
      this._showQ()
    }).catch(() => {
      this.setData({ loading: false, loadError: true })
      wx.showToast({ title: '题库加载失败，请重试', icon: 'none' })
    })
  },

  retryLoad() {
    this.startQuiz({ currentTarget: { dataset: { mode: this.data.mode } } })
  },

  // 按级别过滤出题池
  _pool(all) {
    const level = this.data.activeLevel
    return level === 'all' ? all : all.filter((p) => p.level === level)
  },

  // 建一轮的题序：洗牌后截取 roundLen，一轮内不重复
  _buildQueue(all) {
    const mode = this.data.mode
    const len = this.data.roundLen
    if (mode === 'conj') {
      const pairs = []
      VERB_CONJ.forEach((v) => {
        for (let i = 0; i < 6; i++) pairs.push({ verb: v, person: i })
      })
      this._queue = shuffle(pairs).slice(0, len)
      this.setData({ empty: false })
      return
    }
    let pool = this._pool(all)
    if (mode === 'gender') {
      pool = pool.filter((p) => /^(der|die|das)\s+\S/.test(p.de))
    }
    if (!pool.length) {
      this._queue = []
      this.setData({ empty: true })
      return
    }
    this._queue = shuffle(pool).slice(0, len)
    this.setData({ empty: false })
  },

  // 干扰项：先同分类，再同级别，最后全库（旧版是全库随机，常一眼可辨）
  _wrongFor(cur, n, displayKey) {
    const all = this._all || []
    const levelPool = this._pool(all)
    const catPool = levelPool.filter((p) => p.cat === cur.cat)
    let wrong = pickWrong(catPool, cur, n, (x) => x.id)
    if (wrong.length < n) {
      const got = new Set(wrong.map((x) => x.id))
      pickWrong(levelPool, cur, n, (x) => x.id).forEach((w) => {
        if (wrong.length < n && !got.has(w.id)) { wrong.push(w); got.add(w.id) }
      })
    }
    if (wrong.length < n) {
      const got = new Set(wrong.map((x) => x.id))
      pickWrong(all, cur, n, (x) => x.id).forEach((w) => {
        if (wrong.length < n && !got.has(w.id)) { wrong.push(w); got.add(w.id) }
      })
    }
    // 按展示文本去重，避免相同文本出现两次
    const seen = new Set([displayKey(cur)])
    return wrong.filter((w) => {
      if (seen.has(displayKey(w))) return false
      seen.add(displayKey(w))
      return true
    })
  },

  _showQ() {
    const total = this.data.total
    if (total >= this._queue.length) {
      this.setData({ finished: true, answered: false })
      return
    }
    const mode = this.data.mode
    if (mode === 'conj') {
      const { verb: v, person: idx } = this._queue[total]
      const correct = v.f[idx]
      const pool = v.f.filter((x) => x !== correct)
      const wrong = shuffle(pool).slice(0, 3)
      const opts = shuffle([correct, ...wrong]).map((o) => ({
        label: o, state: '', correct: o === correct,
      }))
      this._cur = { id: 'conj-' + v.inf + '-' + idx, de: CONJ_PERSON[idx] + ' ' + correct, zh: v.zh, level: this.data.activeLevel, cat: '动词变位' }
      this.setData({
        question: CONJ_PERSON[idx] + ' ____',
        hint: '选 ' + v.inf + '（' + v.zh + '）的正确变位',
        opts, answered: false,
      })
      return
    }
    const cur = this._queue[total]
    this._cur = cur
    let question, hint, opts
    if (mode === 'gender') {
      const noun = cur.de.replace(/^(der|die|das)\s+/, '')
      const correct = cur.de.match(/^(der|die|das)/)[1]
      question = noun
      hint = '这个名词是 der / die / das？（der 阳 · die 阴 · das 中）'
      opts = GENDER_OPTS.map((o) => ({ label: o, state: '', correct: o === correct }))
    } else if (mode === 'phrase') {
      const wrong = this._wrongFor(cur, 3, (x) => x.de)
      const pool = shuffle([cur, ...wrong])
      question = cur.zh
      hint = '请选择正确的德语翻译'
      opts = pool.map((o) => ({ label: o.de, state: '', correct: o.id === cur.id }))
    } else {
      const wrong = this._wrongFor(cur, 3, (x) => x.zh)
      const pool = shuffle([cur, ...wrong])
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
    const cur = this._cur
    // 埋点补上词句 id / 级别 / 分类（旧版只有 {mode, correct}）
    try {
      analytics.track(analytics.EVENTS.QUIZ_ANSWER, {
        mode: this.data.mode, correct: isCorrect,
        phraseId: cur && cur.id, level: cur && cur.level, cat: cur && cur.cat,
      })
    } catch (e) {}
    let wrongList = this.data.wrongList
    let addedToSrs = this.data.addedToSrs
    if (!isCorrect && cur) {
      // 答错自动入生词本（SRS，box 0、当天到期）
      if (srs.addWrong(cur)) addedToSrs++
      wrongList = wrongList.concat([{ de: cur.de, zh: cur.zh }])
    }
    this.setData({
      opts,
      answered: true,
      total: this.data.total + 1,
      score: this.data.score + (isCorrect ? 1 : 0),
      pct: Math.round((this.data.score + (isCorrect ? 1 : 0)) / (this.data.total + 1) * 100),
      wrongList,
      addedToSrs,
    })
    // 答完听一遍德语发音（有插件才出声，失败静默）
    if (cur && cur.de) {
      try { tts.speak(cur.de) } catch (e) {}
    }
  },

  // 答完后手动下一题（不再 1.2 秒自动跳题）
  onNext() {
    if (!this.data.answered) return
    if (this.data.total >= this.data.roundLen || this.data.total >= this._queue.length) {
      this.setData({ finished: true, answered: false })
      return
    }
    this._showQ()
  },

  onRestart() {
    this.setData({ score: 0, total: 0, pct: 0, finished: false, wrongList: [], addedToSrs: 0 })
    this._buildQueue(this._all || [])
    this._showQ()
  },

  onExit() {
    try { tts.stop() } catch (e) {}
    this.setData({ mode: '', finished: false })
  },

  onUnload() {
    try { tts.stop() } catch (e) {}
  },

  onHide() {
    try { tts.stop() } catch (e) {}
  },
})
