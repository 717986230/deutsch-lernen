const { observable, action } = require('mobx-miniprogram')

const store = observable({
  // state
  activeLevel: 'all',
  activeCat: 'all',
  keyword: '',
  favorites: {},

  // actions
  setLevel: action(function (l) {
    this.activeLevel = l
    this.activeCat = 'all'
  }),

  setCat: action(function (c) {
    this.activeCat = c
  }),

  setKeyword: action(function (k) {
    this.keyword = k
  }),

  toggleFavorite: action(function (id) {
    if (this.favorites[id]) {
      const next = Object.assign({}, this.favorites)
      delete next[id]
      this.favorites = next
    } else {
      this.favorites = Object.assign({}, this.favorites, { [id]: true })
    }
  })
})

module.exports = { store }
