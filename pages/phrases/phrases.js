const analytics = require('../../services/analytics-service')
const { createStoreBindings } = require('mobx-miniprogram-bindings')
const { store } = require('../../stores/learning-store')
const phraseService = require('../../services/phrase-service')
const { LEVEL_META, LEVEL_ORDER, LB_CLASS } = require('../../constants/levels')
const counts = require('../../constants/counts')

// 分页：一次最多渲染 50 条卡片，触底再加载 50 条（旧版“全部”一次渲染 3114 条）
const PAGE_SIZE = 50

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
    counts,                // 生成文件 constants/counts.js：25 分类 / 4414 词句
    loadedCount: 0,        // 分页：已渲染条数
    totalCount: 0,         // 分页：当前范围总条数
    hasMore: false,        // 分页：是否还有未加载的
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
      // 分类只有 25 个（旧注释称“上百个”已过时），横向滚动标签栏放得下，
      // “全部”级别也显示分类标签，可直接按分类筛选
      const catTabs = cats.map((c) => ({
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
        this._filteredAll = filtered
        this._page = 1
        this._renderFiltered(`找到 ${filtered.length} 条结果`)
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
        this._filteredAll = results
        this._page = 1
        this._renderFiltered(`找到 ${results.length} 条结果`)
      } else {
        // 分级浏览：按 50 条一页切片渲染，触底加载更多
        this._browseCats = cats
        this._page = 1
        this._renderPaged()
      }
    })
  },

  // 筛选/搜索结果分页渲染：一次最多 50 条，触底再加载
  _renderFiltered(resultText) {
    const all = this._filteredAll || []
    const limit = this._page * PAGE_SIZE
    this.setData({
      isFiltered: true,
      searchResults: all.slice(0, limit),
      resultText,
      loadedCount: Math.min(limit, all.length),
      totalCount: all.length,
      hasMore: limit < all.length,
    })
  },

  // 分页渲染：按分类顺序取满 page*PAGE_SIZE 条，其余先不渲染
  _renderPaged() {
    const cats = this._browseCats || []
    const { activeLevel } = this.data
    const limit = this._page * PAGE_SIZE
    let loaded = 0
    const total = cats.reduce((s, c) => s + c.phrases.length, 0)
    const sections = []
    for (const c of cats) {
      if (loaded >= limit) break
      const take = Math.min(c.phrases.length, limit - loaded)
      sections.push({
        name: c.name,
        icon: c.icon,
        count: `${c.phrases.length}句`,
        badgeClass: activeLevel === 'all' ? (LB_CLASS[c.level] || '') : '',
        badgeText: activeLevel === 'all' ? (LEVEL_NAME[c.level] || '') : '',
        phrases: c.phrases.slice(0, take),
      })
      loaded += take
    }
    this.setData({
      isFiltered: false,
      sections,
      resultText: '',
      loadedCount: loaded,
      totalCount: total,
      hasMore: loaded < total,
    })
  },

  // 触底加载下一页（浏览模式与筛选/搜索模式通用）
  onLoadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this._page++
    if (this.data.isFiltered) {
      this._renderFiltered(this.data.resultText)
    } else {
      this._renderPaged()
    }
  },
})
