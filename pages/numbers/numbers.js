const { nums0, numsBig, quizPool } = require('../../utils/numbers')
const { shuffle, pickWrong } = require('../../utils/shuffle')

Page({
  data: {
    nums0,
    numsBig,
    mode: '',          // '' | 'de2zh' | 'zh2de'
    question: '',
    hint: '',
    opts: [],          // [{label, state, correct}]
    score: 0,
    total: 0,
    answered: false,
  },

  startQuiz(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ mode, score: 0, total: 0 })
    this._nextQ()
  },

  _nextQ() {
    const cur = quizPool[Math.floor(Math.random() * quizPool.length)]
    const wrong = pickWrong(quizPool, cur, 3, (x) => x.n)
    const pool = shuffle([cur, ...wrong])
    const mode = this.data.mode
    let question, hint, opts
    if (mode === 'de2zh') {
      question = String(cur.n)
      hint = '这个数字的德语怎么说？'
      opts = pool.map((o) => ({ label: o.de, state: '', correct: o.n === cur.n }))
    } else {
      question = cur.de
      hint = '这个德语数字是多少？'
      opts = pool.map((o) => ({ label: String(o.n), state: '', correct: o.n === cur.n }))
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
    this.setData({
      opts,
      answered: true,
      total: this.data.total + 1,
      score: this.data.score + (isCorrect ? 1 : 0),
    })
    // 不再 1.2 秒自动跳题：答完停住，等用户点「下一题」
  },

  // 答完后手动下一题
  onNext() {
    if (!this.data.answered) return
    this._nextQ()
  },

  onRestart() {
    this.setData({ score: 0, total: 0 })
    this._nextQ()
  },

  onExit() {
    this.setData({ mode: '' })
  },

  onUnload() {},

  onHide() {},
})
