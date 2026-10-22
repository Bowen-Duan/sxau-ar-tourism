const api = require('../../config/api.js')
const request = require('../../utils/request.js')

Page({
  data: {
    buildings: [],    // 顶部建筑轮播图
    scanImg: '',      // 拍照识别入口配图
    museumImg: '',    // 进入建筑可阅读入口配图
    videos: [],       // 热剧游视频列表
    loading: true,
    errorMsg: ''
  },

  onLoad() {
    this.loadBuildings()
    this.loadVideos()
  },

  onShow() {
    if (this._inited) {
      this.loadVideosSilent()
    }
    this._inited = true
  },

  // 静默刷新视频
  loadVideosSilent() {
    request({
      url: api.videoList,
      method: 'GET',
      data: { pageNum: 1, pageSize: 10 },
      success: (res) => {
        const rows = (res.data && res.data.rows) || []
        const videos = rows
          .filter((i) => i && i.cover)
          .map((i) => Object.assign({}, i, { cover: encodeURI(i.cover) }))
        this.setData({ videos })
      },
      fail: () => {}
    })
  },

  // 建筑图：并行请求随机封面接口
  loadBuildings() {
    const tasks = [0, 1, 2, 3, 4].map((i) =>
      new Promise((resolve) => {
        request({
          url: api.slideshow,
          method: 'GET',
          success: (res) => {
            const d = res.data && res.data.data
            resolve(d && d.pictureUrl
              ? { key: i + '-' + d.id, id: d.id, pictureUrl: this.normalizeMediaUrl(d.pictureUrl) }
              : null)
          },
          fail: () => resolve(null)
        })
      })
    )
    Promise.all(tasks).then((list) => {
      const seen = {}
      const buildings = []
      list.filter(Boolean).forEach((item) => {
        if (!seen[item.id]) {
          seen[item.id] = true
          buildings.push(item)
        }
      })
      const scanImg = buildings.length ? buildings[buildings.length - 1].pictureUrl : ''
      const museumImg = buildings.length > 1 ? buildings[buildings.length - 2].pictureUrl : scanImg
      console.log('[主页] 建筑图加载完成 buildings=' + buildings.length)
      this.setData({ buildings, scanImg, museumImg })
    })
  },

  normalizeMediaUrl(url) {
    if (!url) return ''
    const value = String(url).trim()
    if (/^https?:\/\//i.test(value)) return encodeURI(value)
    return encodeURI(api.baseUrl.replace(/\/$/, '') + '/' + value.replace(/^\//, ''))
  },

  onMediaError(e) {
    console.warn('[主页] 图片加载失败', e && e.detail)
  },

  // 热剧游视频列表
  loadVideos() {
    this.setData({ loading: true, errorMsg: '' })
    request({
      url: api.videoList,
      method: 'GET',
      data: { pageNum: 1, pageSize: 10 },
      success: (res) => {
        const rows = (res.data && res.data.rows) || []
        const videos = rows
          .filter((i) => i && i.cover)
          .map((i) => {
            // 处理封面图URL，编码空格和特殊字符
            let cover = i.cover
            if (cover && cover.indexOf(' ') > -1) {
              // 对URL进行安全编码
              try {
                cover = encodeURI(cover)
              } catch (e) {
                console.warn('URL编码失败', cover)
              }
            }
            return Object.assign({}, i, { cover })
          })
        console.log('[主页] 视频加载完成 videos=' + videos.length, videos)
        this.setData({ videos, loading: false })
      },
      fail: (err) => {
        const msg = (err && err.errMsg) || '请求失败'
        console.error('[主页] 视频加载失败', msg)
        this.setData({ errorMsg: msg, loading: false })
      }
    })
  },

  // 点击视频卡片
  goVideo(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '/pages/videoList/videoList' })
  },

  // 查看全部视频
  goVideoList() {
    wx.navigateTo({ url: '/pages/videoList/videoList' })
  },

  // 跳转到活动列表页
  goActivityList() {
    wx.navigateTo({ url: '/pages/activity/activity' })
  },

  // 拍照识别入口
  goScan() {
    wx.navigateTo({ url: '/pages/scan/scan' })
  },

  // 进入建筑可阅读入口
  goMuseum() {
    wx.navigateTo({ url: '/pages/buildList/buildList' })
  },

  // 下拉/失败重试
  reload() {
    this.loadBuildings()
    this.loadVideos()
  }
})
