// pages/vr/vr.js
Page({
  data: {
    vrUrl: '',
    sourceUrl: '',
    title: 'VR全景漫游',
    loading: true,
    failed: false,
    navBarHeight: 88,
    statusBarHeight: 20
  },

  onLoad(options) {
    const url = options && options.url
    const title = options && options.title ? decodeURIComponent(options.title) : 'VR全景漫游'
    const windowInfo = typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : {}
    const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
    const statusBarHeight = windowInfo.statusBarHeight || 20
    const navBarHeight = menu
      ? (menu.top - statusBarHeight) * 2 + menu.height
      : 44
    if (url) {
      try {
        let decoded = decodeURIComponent(url).trim()
        if (/^http:\/\//i.test(decoded)) decoded = decoded.replace(/^http:\/\//i, 'https://')
        if (/^\/\//.test(decoded)) decoded = 'https:' + decoded
        if (!/^https:\/\//i.test(decoded)) {
          throw new Error('VR 页面必须使用 HTTPS 地址')
        }
        console.log('[VR] 正在加载:', decoded)
        this.setData({ vrUrl: decoded, sourceUrl: decoded, title, navBarHeight, statusBarHeight })
      } catch (e) {
        console.warn('[VR] 地址不可用', e && e.message)
        this.setData({ loading: false, failed: true, title, navBarHeight, statusBarHeight })
      }
    } else {
      this.setData({ loading: false, failed: true, title, navBarHeight, statusBarHeight })
    }
  },

  handleLoad() {
    this.setData({ loading: false, failed: false })
  },

  handleError(e) {
    console.error('[VR] 页面加载失败', e && e.detail)
    this.setData({ loading: false, failed: true })
  },

  retry() {
    const sourceUrl = this.data.sourceUrl
    if (!sourceUrl) return
    this.setData({ vrUrl: '', loading: true, failed: false })
    setTimeout(() => this.setData({ vrUrl: sourceUrl }), 60)
  },

  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) wx.navigateBack()
    else wx.reLaunch({ url: '/pages/index/index' })
  },

  onReady() {},
  onShow() {},
  onHide() {},
  onUnload() {},

  onShareAppMessage() {
    return {
      title: this.data.title,
      path: '/pages/index/index'
    }
  }
})
