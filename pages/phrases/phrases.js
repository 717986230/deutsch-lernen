const analytics = require('../../services/analytics-service')
const { createStoreBindings } = require('mobx-miniprogram-bindings')
const { store } = require('../../stores/learning-store')
const phraseService = require('../../services/phrase-service')
const { LEVEL_META, LEVEL_ORDER, LB_CLASS } = require('../../constants/levels')

const LEVEL_TABS = [
  { key: 'all', label: '📚 全部' },
  { key: '0',  label: '🌱 零基础' },
  { key: 'a1', label: '⭐ A1' },
  { key: 'a2', label: '⭐⭐ A2' },
  { key: 'b1', label: '🔥 B1' },
  { key: 'b2', label: '💎 B2' },
]
const LEVEL_NAME = { '0': '零基础', a1: 'A1', a2: 'A2', b1: 'B1', b2: 'B2' }

Page({
  data: {
    levelTabs: LEVEL_TABS,
    activeLevel: 'all',
    activeCat: 'all',
    keyword: '',
    levelInfo: null,      // {label, desc, color} 或 null
    catTabs: [],          // [{name, icon, badgeClass, badgeText}]
    sections: [],         // 正常浏览模式：[{name, icon, badgeClass, badgeText, count, phrases}]
    searchResults: [],    // 搜索/筛选模式结果
    isFiltered: false,
    resultText: '',
    loading: true,
    loadError: false,
  },

  onLoad() {
    // 绑定 mobx store
    this.storeBindings = createStoreBindings(this, {
      store,
      fields: ['activeLevel', 'activeCat', 'keyword'],
      actions: ['setLevel', 'setCat', 'setKeyword'],
    })
    // 预加载分包数据
    phraseService.loadCategories().then(() => {
      this.setData({ loading: false })
      this._applyJumpLevel()
      this._refresh()
    }).catch(() => {
      this.setData({ loading: false, loadError: true })
      wx.showToast({ title: '数据加载失败，请重试', icon: 'none' })
    })
  },

  onShow() {
    // 来自首页 level-card 的跳转
    if (!this.data.loading) this._applyJumpLevel()
  },

  retryLoad() {
    this.setData({ loading: true, loadError: false })
    phraseService.loadCategories().then(() => {
      this.setData({ loading: false })
      this._applyJumpLevel()
      this._refresh()
    }).catch(() => {
      this.setData({ loading: false, loadError: true })
      wx.showToast({ title: '数据加载失败，请重试', icon: 'none' })
    })
  },

  onUnload() {
    if (this.storeBindings) this.storeBindings.destroyStoreBindings()
  },

  _applyJumpLevel() {
    const app = getApp()
    const jump = app.globalData && app.globalData.jumpLevel
    if (jump) {
      app.globalData.jumpLevel = null
      this.setLevel(jump)
      this.setData({ activeLevel: jump, activeCat: 'all', keyword: '' })
      this._refresh()
    }
  },

  // ── 级别切换 ──
  onLevelTap(e) {
    const level = e.currentTarget.dataset.level
    try { analytics.track(analytics.EVENTS.LEVEL_SWITCH, { level }) } catch (e) {}
    this.setLevel(level)
    this.setData({ activeLevel: level, activeCat: 'all' })
    this._refresh()
  },

  // ── 分类切换 ──
  onCatTap(e) {
    const cat = e.currentTarget.dataset.cat
    this.setCat(cat)
    this.setData({ activeCat: cat })
    this._filter()
  },

  // ── 搜索 ──
  onSearch(e) {
    const kw = e.detail.value
    try { if (kw && kw.trim()) analytics.track(analytics.EVENTS.SEARCH, { keyword: kw.trim() }) } catch (e) {}
    this.setKeyword(kw)
    this.setData({ keyword: kw })
    this._filter()
  },

  // 级别/分类变化：重建分类标签 + 渲染
  _refresh() {
    const level = this.data.activeLevel
    const meta = LEVEL_META[level]
    const levelInfo = level === 'all' ? null : meta
    phraseService.getCategoriesByLevel(level).then((cats) => {
      // “全部”级别下分类多达上百个，不显示分类标签，引导先选级别（避免标签栏爆炸）
      const catTabs = level === 'all' ? [] : cats.map((c) => ({
        name: c.name,
        icon: c.icon,
        badgeClass: '',
        badgeText: '',
      }))
      this.setData({ levelInfo, catTabs })
      this._filter()
    })
  },

  // 根据 keyword/activeCat 决定渲染搜索结果还是分级浏览
  _filter() {
    const { keyword, activeCat, activeLevel } = this.data
    const kw = (keyword || '').trim()

    if (kw) {
      // 全库搜索
      phraseService.search(kw).then((results) => {
        const filtered = activeCat === 'all'
          ? results
          : results.filter((r) => r.cat === activeCat)
        this.setData({
          isFiltered: true,
          searchResults: filtered,
          resultText: `找到 ${filtered.length} 条结果`,
        })
      })
      return
    }

    // 无搜索词
    phraseService.getCategoriesByLevel(activeLevel).then((cats) => {
      if (activeCat !== 'all') {
        const cat = cats.find((c) => c.name === activeCat)
        const results = cat
          ? cat.phrases.map((p) => ({ ...p, cat: cat.name, icon: cat.icon }))
          : []
        this.setData({
          isFiltered: true,
          searchResults: results,
          resultText: `找到 ${results.length} 条结果`,
        })
      } else {
        const sections = cats.map((c) => ({
          name: c.name,
          icon: c.icon,
          count: `${c.phrases.length}句`,
          badgeClass: activeLevel === 'all' ? (LB_CLASS[c.level] || '') : '',
          badgeText: activeLevel === 'all' ? (LEVEL_NAME[c.level] || '') : '',
          phrases: c.phrases,
        }))
        this.setData({ isFiltered: false, sections, resultText: '' })
      }
    })
  },
})
