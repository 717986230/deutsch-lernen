const { store } = require('../../stores/learning-store')
const analytics = require('../../services/analytics-service')

Component({
  properties: {
    de: { type: String, value: '' },
    zh: { type: String, value: '' },
    py: { type: String, value: '' },
    flipped: {
      type: Boolean,
      value: false,
      observer(newVal) {
        this.setData({ _flipped: newVal })
      }
    }
  },

  data: {
    _flipped: false,
    _favId: '',
    _isFav: false
  },

  lifetimes: {
    attached() {
      this.setData({ _flipped: this.properties.flipped })
      // Build stable favId from de+zh (no need to change callers)
      const favId = (this.properties.de || '') + '|' + (this.properties.zh || '')
      const favs = wx.getStorageSync('favorites') || {}
      // Sync storage -> store if needed
      if (favs[favId] && !store.favorites[favId]) {
        store.toggleFavorite(favId)
      }
      this.setData({ _favId: favId, _isFav: !!favs[favId] })
    }
  },

  methods: {
    onTap() {
      this.setData({ _flipped: !this.data._flipped })
      this.triggerEvent('flip', {})
    },

    onFavTap(e) {
      // Prevent bubbling so card flip is not triggered
      const favId = this.data._favId
      const favs = wx.getStorageSync('favorites') || {}
      const isFav = !!favs[favId]
      if (isFav) {
        delete favs[favId]
      } else {
        favs[favId] = true
      }
      wx.setStorageSync('favorites', favs)
      store.toggleFavorite(favId)
      try { analytics.track(analytics.EVENTS.FAVORITE_TOGGLE, { favId, on: !isFav }) } catch (e) {}
      this.setData({ _isFav: !isFav })
    }
  }
})
