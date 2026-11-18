// tabBar 页面（用 switchTab）；其余内容页用 navigateTo
const counts = require('../../constants/counts')
const TAB_PAGES = [
  '/pages/index/index',
  '/pages/phrases/phrases',
  '/pages/quiz/quiz',
  '/pages/favorites/favorites',
]

// 各级别“X个词句 · Y个分类”文案（WXML 里不能用 byLevel['0'] 这种带引号的下标，JS 里拼好）
function levelStat(level) {
  const b = counts.byLevel[level] || { c: 0, p: 0 }
  return b.p + '个词句 · ' + b.c + '个分类'
}

Page({
  data: {
    counts, // 生成文件 constants/counts.js：25 分类 / 4414 词句（npm run build:counts）
    stat0: levelStat('0'),
    statA1: levelStat('a1'),
    statA2: levelStat('a2'),
    statB1: levelStat('b1'),
    statB2: levelStat('b2'),
  },

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
