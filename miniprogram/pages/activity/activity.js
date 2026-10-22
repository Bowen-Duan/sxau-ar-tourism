const api = require('../../config/api.js')
const request = require('../../utils/request.js')

Page({
  data: {
    activities: [],
    loading: true
  },

  onLoad() {
    this.loadActivityList()
  },

  // 加载活动列表（从建筑管理里的活动栏目获取，和后台同步）
  loadActivityList() {
    this.setData({ loading: true })
    request({
      url: api.activityList,
      method: 'GET',
      success: (res) => {
        const list = (res.data && res.data.rows) || []
        const activities = list
          .filter((i) => i && i.pictureUrl && String(i.status) !== '0')
          .map((item) => {
            let pictureUrl = item.pictureUrl || ''
            try {
              if (pictureUrl) pictureUrl = encodeURI(pictureUrl)
            } catch (e) {
              console.warn('URL编码失败')
            }
            // 映射成wxml需要的字段：background
            return Object.assign({}, item, { background: pictureUrl })
          })
        console.log('[活动列表] 加载完成 activities=' + activities.length)
        this.setData({ activities, loading: false })
      },
      fail: (err) => {
        console.error('[活动列表] 加载失败', err)
        this.setData({ loading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  },

  // 跳转到活动详情页
  goActivityDetail(e) {
    const item = e.currentTarget.dataset.item
    if (!item) return
    // 跳转到activityDetail页面
    wx.navigateTo({ url: '/pages/activityDetail/activityDetail?id=' + item.id })
  }
})
