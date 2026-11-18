Component({
  properties: {
    score: { type: Number, value: 0 },
    total: { type: Number, value: 0 },
    question: { type: String, value: '' },
    hint: { type: String, value: '' },
    opts: { type: Array, value: [] },
    showProgress: { type: Boolean, value: false },
    // 答完题后由页面置 true，显示「下一题」按钮（不再自动跳题）
    answered: { type: Boolean, value: false },
    showNext: { type: Boolean, value: false }
  },

  methods: {
    onSelect(e) {
      const index = e.currentTarget.dataset.index
      this.triggerEvent('select', { index })
    },
    onNext() {
      this.triggerEvent('next', {})
    },
    onRestart() {
      this.triggerEvent('restart', {})
    },
    onExit() {
      this.triggerEvent('exit', {})
    },
  },

  observers: {
    'score, total'(score, total) {
      const pct = total > 0 ? Math.round(score / total * 100) : 0
      this.setData({ _percent: pct })
    }
  },

  data: {
    _percent: 0
  }
})
