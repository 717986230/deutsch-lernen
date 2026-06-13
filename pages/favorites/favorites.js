const phraseService = require('../../services/phrase-service')
const { store } = require('../../stores/learning-store')
const analytics = require('../../services/analytics-service')

Page({
  data: {
    list: [],       // [{de, zh, py, favId}]
    loading: true
  },

  onShow() {
    try { analytics.track(analytics.EVENTS.PAGE_VIEW, { page: 'favorites' }) } catch (e) {}
    this._refresh()
  },

  _refresh() {
    const favs = wx.getStorageSync('favorites') || {}
    const favIds = Object.keys(favs).filter(k => favs[k])

    if (favIds.length === 0) {
      this.setData({ list: [], loading: false })
      return
    }

    this.setData({ loading: true })

    phraseService.loadCategories().then(cats => {
      const result = []
      // Build a lookup: "de|zh" -> phrase info
      cats.forEach(cat => {
        cat.phrases.forEach(phrase => {
          const fid = phrase.de + '|' + phrase.zh
          if (favs[fid]) {
            result.push({ de: phrase.de, zh: phrase.zh, py: phrase.py, favId: fid })
          }
        })
      })
      this.setData({ list: result, loading: false })
    }).catch(() => {
      this.setData({ loading: false })
    })
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
