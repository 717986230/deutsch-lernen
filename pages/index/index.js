// tabBar 页面（用 switchTab）；其余内容页用 navigateTo
const TAB_PAGES = [
  '/pages/index/index',
  '/pages/phrases/phrases',
  '/pages/quiz/quiz',
  '/pages/favorites/favorites',
]

Page({
  goPage(e) {
    const url = e.currentTarget.dataset.url
    if (TAB_PAGES.indexOf(url) !== -1) {
      wx.switchTab({ url })
    } else {
      wx.navigateTo({ url })
    }
  },
  goLevel(e) {
    const level = e.currentTarget.dataset.level
    // S1: 先同步写入 globalData，再 switchTab，避免竞态
    const app = getApp()
    app.globalData = app.globalData || {}
    app.globalData.jumpLevel = level
    wx.switchTab({ url: '/pages/phrases/phrases' })
  }
})
