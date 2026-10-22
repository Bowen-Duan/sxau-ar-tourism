const api = require('../../config/api.js')
const request = require('../../utils/request.js')

Page({
  data: {
    videos: [],
    loading: true
  },

  onLoad() {
    this.loadVideoList()
  },

  // 加载视频列表
  loadVideoList() {
    this.setData({ loading: true })
    request({
      url: api.videoList,
      method: 'GET',
      data: { pageNum: 1, pageSize: 10 },
      success: (res) => {
        const rows = (res.data && res.data.rows) || []
        const videos = rows
          .filter((i) => i && i.cover)
          .map((item) => {
            let cover = item.cover || ''
            try {
              if (cover) cover = encodeURI(cover)
            } catch (e) {
              console.warn('URL编码失败')
            }
            return Object.assign({}, item, { cover })
          })
        console.log('[视频列表] 加载完成 videos=' + videos.length)
        this.setData({ videos, loading: false })
      },
      fail: (err) => {
        console.error('[视频列表] 加载失败', err)
        this.setData({ loading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  },

  // 跳转到视频播放页
  goVideoDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '/pages/videoDetails/videoDetails?id=' + id })
  }
})
