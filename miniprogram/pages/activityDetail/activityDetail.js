const api = require('../../config/api.js')
const request = require('../../utils/request.js')

Page({
  data: {
    activity: {},
    loading: true
  },

  onLoad(options) {
    const id = options.id
    if (id) {
      this.loadActivityDetail(id)
    } else {
      this.setData({ loading: false })
    }
  },

  // 加载活动详情（从建筑管理里的活动详情接口获取，和后台同步）
  loadActivityDetail(id) {
    this.setData({ loading: true })
    request({
      url: api.scenicspotDetail(id),
      method: 'GET',
      success: (res) => {
        const found = res.data && res.data.data
        if (found) {
          let background = found.pictureUrl || ''
          try {
            if (background) background = encodeURI(background)
          } catch (e) {
            console.warn('URL编码失败')
          }
          this.setData({ 
            activity: Object.assign({}, found, { background }), 
            loading: false 
          })
        } else {
          this.setData({ loading: false })
          wx.showToast({ title: '活动不存在', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('[活动详情] 加载失败', err)
        this.setData({ loading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  }
})
