const FILE_NAME = 'deutsch-lernen-offline.html'

Page({
  data: {
    busy: false,
    ready: false,     // HTML 是否已写入本地
    filePath: '',
  },

  // 异步加载分包里的 HTML 字符串并写入本地文件空间
  _prepareFile() {
    return new Promise((resolve, reject) => {
      if (this.data.ready && this.data.filePath) {
        resolve(this.data.filePath)
        return
      }
      // 分包异步化加载嵌入的 HTML
      require('../../packageOffline/offline-html.js', (html) => {
        try {
          const fs = wx.getFileSystemManager()
          const filePath = `${wx.env.USER_DATA_PATH}/${FILE_NAME}`
          fs.writeFile({
            filePath,
            data: html,
            encoding: 'utf8',
            success: () => {
              this.setData({ ready: true, filePath })
              resolve(filePath)
            },
            fail: reject,
          })
        } catch (e) {
          reject(e)
        }
      }, reject)
    })
  },

  // 主操作：导出离线网页
  onExport() {
    if (this.data.busy) return
    this.setData({ busy: true })
    wx.showLoading({ title: '准备文件…' })
    this._prepareFile().then((filePath) => {
      wx.hideLoading()
      this.setData({ busy: false })
      // 优先用保存到本地磁盘（PC / 支持的端会弹保存框）
      if (wx.saveFileToDisk) {
        wx.saveFileToDisk({
          filePath,
          success: () => wx.showToast({ title: '已保存', icon: 'success' }),
          fail: () => this._shareFallback(filePath),
        })
      } else {
        this._shareFallback(filePath)
      }
    }).catch(() => {
      wx.hideLoading()
      this.setData({ busy: false })
      wx.showToast({ title: '准备失败，请重试', icon: 'none' })
    })
  },

  // 手机端：转发文件到聊天（发给自己/文件传输助手即可保存）
  _shareFallback(filePath) {
    if (wx.shareFileMessage) {
      wx.shareFileMessage({
        filePath,
        fileName: FILE_NAME,
        fail: () => wx.showToast({ title: '导出已取消', icon: 'none' }),
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '当前环境不支持导出文件，请在最新版微信中重试。',
        showCancel: false,
      })
    }
  },
})
