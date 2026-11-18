const phraseService = require('../../services/phrase-service')
const { store } = require('../../stores/learning-store')
const analytics = require('../../services/analytics-service')
const srs = require('../../services/srs-service')

Page({
  data: {
    list: [],       // [{de, zh, py, favId, id, level, cat}]
    loading: true,
    loadError: false, // 加载失败 ≠ 空态：失败给重试，不再误显示“还没有收藏”
    srsCounts: { total: 0, due: 0, mastered: 0 },
  },

  onShow() {
    try { analytics.track(analytics.EVENTS.PAGE_VIEW, { page: 'favorites' }) } catch (e) {}
    this.setData({ srsCounts: srs.getCounts() })
    this._refresh()
  },

  _refresh() {
    const favs = wx.getStorageSync('favorites') || {}
    const favIds = Object.keys(favs).filter(k => favs[k])

    if (favIds.length === 0) {
      this.setData({ list: [], loading: false, loadError: false })
      return
    }

    this.setData({ loading: true, loadError: false })

    phraseService.loadCategories().then(cats => {
      const result = []
      // Build a lookup: "de|zh" -> phrase info；同时算出词句 id（与 getAllPhrases 一致），
      // 供“一键加入生词本”用
      cats.forEach((cat, ci) => {
        cat.phrases.forEach((phrase, pi) => {
          const fid = phrase.de + '|' + phrase.zh
          if (favs[fid]) {
            result.push({
              de: phrase.de, zh: phrase.zh, py: phrase.py, favId: fid,
              id: ci + '-' + pi, level: cat.level, cat: cat.name,
            })
          }
        })
      })
      this.setData({ list: result, loading: false, loadError: false })
    }).catch(() => {
      // 失败就是失败：不要误判为空态
      this.setData({ loading: false, loadError: true })
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    })
  },

  retryLoad() {
    this._refresh()
  },

  // 今日待复习入口 → 生词本复习页（只练到期的）
  goReview() {
    wx.navigateTo({ url: '/pages/review/review' })
  },

  // 把全部收藏一键加入生词本（与离线版“收藏当前级别/分类”同款）
  addAllToSrs() {
    const n = srs.addAll(this.data.list)
    this.setData({ srsCounts: srs.getCounts() })
    wx.showToast({ title: n > 0 ? '已加入生词本 ' + n + ' 个' : '收藏已都在生词本里', icon: 'none' })
  },

  onUnfav(e) {
    const favId = e.currentTarget.dataset.favid
    const favs = wx.getStorageSync('favorites') || {}
    delete favs[favId]
    wx.setStorageSync('favorites', favs)
    if (store.favorites[favId]) {
      store.toggleFavorite(favId)
    }
    // Remove from list
    const list = this.data.list.filter(item => item.favId !== favId)
    this.setData({ list })
  }
})
