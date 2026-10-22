const api = require('../../config/api.js')
const request = require('../../utils/request.js')

Page({
  data: {
    currentVideo: {},  // 当前播放的视频
    otherVideos: [],   // 其他视频列表
    loading: true
  },

  onLoad(options) {
    const videoId = options.id
    this.loadVideoList(videoId)
  },

  // 加载视频列表
  loadVideoList(currentId) {
    this.setData({ loading: true })
    request({
      url: api.videoList,
      method: 'GET',
      data: { pageNum: 1, pageSize: 10 },
      success: (res) => {
        const rows = (res.data && res.data.rows) || []
        
        // 处理URL
        const videos = rows.map((item) => {
          let cover = item.cover || ''
          let video = item.video || ''
          
          // 对URL进行分段编码，只编码路径部分，不编码协议和域名
          function encodeUrl(url) {
            if (!url) return ''
            try {
              // 分割协议和域名
              const match = url.match(/^(https?:\/\/[^\/]+)(\/.*)$/)
              if (match) {
                const base = match[1]
                const path = match[2]
                // 对路径部分进行编码
                const encodedPath = path.split('/').map(segment => encodeURIComponent(segment)).join('/')
                return base + encodedPath
              }
              return encodeURI(url)
            } catch (e) {
              console.warn('URL编码失败', url)
              return url
            }
          }
          
          cover = encodeUrl(cover)
          video = encodeUrl(video)
          
          return Object.assign({}, item, { cover, video })
        })

        // 找到当前播放的视频
        let currentVideo = videos[0] || {}
        if (currentId) {
          const found = videos.find(v => String(v.id) === String(currentId))
          if (found) currentVideo = found
        }

        // 其他视频（排除当前的）
        const otherVideos = videos.filter(v => String(v.id) !== String(currentVideo.id))

        console.log('[视频详情] 加载完成 current=' + currentVideo.name)
        console.log('[视频详情] 视频URL:', currentVideo.video)
        this.setData({ currentVideo, otherVideos, loading: false })
      },
      fail: (err) => {
        console.error('[视频详情] 加载失败', err)
        this.setData({ loading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  },

  // 切换视频
  switchVideo(e) {
    const id = e.currentTarget.dataset.id
    if (id) {
      this.loadVideoList(id)
    }
  }
})
