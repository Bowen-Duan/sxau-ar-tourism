const app = getApp()
const api = require('../../config/api.js')
const request = require('../../utils/request.js')

Page({
  data: {
    slides: [],       // 轮播图列表（key + pictureUrl）
    autoplay: true,   // 轮播自动播放（circular 无限循环）
    navBarHeight: 20, // 自定义导航栏高度，品牌标题避让用
    loading: true,
    errorMsg: '',     // 最近一次加载失败的提示
    showSplash: true, // 是否显示开屏动画
    splashImage: ''   // 开屏动画显示的图片
  },

  onLoad() {
    let navBarHeight = 20
    try {
      navBarHeight = (app.globalData && app.globalData.navBarHeight) || 20
    } catch (e) {
      // 取不到自定义导航栏高度时使用兜底值
    }
    this.setData({ navBarHeight })
    this.loadSlideshow()
  },

  // 回退数据源：封面图管理随机接口（/travel/slideshow/random），并行取 4 张组成轮播
  loadSlideshow() {
    this.setData({ loading: true, errorMsg: '' })
    const tasks = [0, 1, 2, 3].map((i) =>
      new Promise((resolve) => {
        request({
          url: api.slideshow,
          method: 'GET',
          success: (res) => {
            const data = res.data && res.data.data
            resolve(data && data.pictureUrl
              ? { key: i + '-' + data.id, id: data.id, pictureUrl: encodeURI(data.pictureUrl) }
              : null)
          },
          fail: (err) => {
            const msg = (err && err.errMsg) || '请求失败'
            console.error('[轮播图] 请求失败', msg)
            this.setData({ errorMsg: msg })
            resolve(null)
          }
        })
      })
    )

    Promise.all(tasks).then((list) => {
      const slides = list.filter(Boolean)
      console.log('[轮播图] 加载完成 slides=' + slides.length)
      this.setData({ slides, loading: false })
      // 轮播图加载完成后，设置开屏动画的图片（用第一张轮播图）
      if (slides.length) {
        this.setData({ splashImage: slides[0].pictureUrl })
      } else {
        // 没有轮播图，直接关闭开屏动画
        this.setData({ showSplash: false })
      }
    })
  },

  // 开屏动画图片加载完成
  onSplashImageLoad() {
    console.log('[开屏动画] 图片加载完成，1.5秒后关闭开屏动画')
    // 展示1.5秒后关闭，让开屏动画更自然
    setTimeout(() => {
      this.setData({ showSplash: false })
    }, 1500)
  },

  // 轮播图图片加载完成（备用，防止开屏动画图片加载失败）
  onSlideImageLoad() {
    if (this.data.showSplash && !this.data.splashImage) {
      // 如果开屏动画还在显示且没有设置图片，用这张图
      const currentIndex = 0
      if (this.data.slides[currentIndex]) {
        this.setData({ splashImage: this.data.slides[currentIndex].pictureUrl })
      }
    }
  },

  // 开始探索：进入建筑可阅读主页（顶部轮播 + 活动推荐 + 拍照识别/建筑入口）
  startExplore() {
    wx.navigateTo({ url: '/pages/rBuild/rBuild' })
  },

  // 加载失败重试
  reload() {
    this.setData({ showSplash: true, splashImage: '' })
    this.loadSlideshow()
  }
})
