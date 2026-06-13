App({
  globalData: {
    jumpLevel: null,   // 首页级别卡片跳转词句页时的目标级别
  },

  onLaunch() {
    // 不在启动时加载分包词句数据：保持启动轻量。
    // 词句/测验页会在进入时各自懒加载（service 内有缓存，只加载一次）。
  },
})
