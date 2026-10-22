Page({
  data: {
    recommendList: [],
    loaded: false
  },

  onLoad() {
    // 通过 eventChannel 接收拍照识别页传来的推荐数据
    const ec = this.getOpenerEventChannel()
    if (ec && ec.on) {
      ec.on('recommend', (data) => {
        const list = (data && data.list) || []
        const cleaned = list.map((it) => {
          let pic = it.pictureUrl || it.backgroundCover || ''
          pic = String(pic).split(',').map((s) => s.trim()).filter(Boolean)[0] || ''
          return Object.assign({}, it, { _img: pic })
        })
        this.setData({ recommendList: cleaned, loaded: true })
      })
    }
    // 兜底：如果 eventChannel 没传数据，2秒后标记 loaded 显示空状态
    setTimeout(() => {
      if (!this.data.loaded) {
        this.setData({ loaded: true })
      }
    }, 2000)
  },

  // 再拍一次：返回上一页（拍照识别页），用户可重新拍照
  reScan() {
    wx.navigateBack({ delta: 1 })
  },

  // 点击推荐建筑 → 进入详情页
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  },

  // 返回首页
  goHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
