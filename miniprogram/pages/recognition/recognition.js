const app = getApp()
const api = require('../../config/api.js')
const request = require('../../utils/request.js')

Page({
  data: {
    tags: [
      { label: '全部', value: '' },
      { label: '景点', value: 1 },
      { label: '文创', value: 2 }
    ],
    activeTag: '',     // 当前筛选：'' 全部 / 1 景点 / 2 文创
    list: [],          // 识别库图片列表
    total: 0,
    loading: true,
    errorMsg: ''
  },

  onLoad() {
    this.loadList()
  },

  // 查询识别库图片列表：/travel/backend/recognitionLibrary/list
  loadList() {
    this.setData({ loading: true, errorMsg: '' })
    const data = this.data.activeTag === '' ? {} : { tag: this.data.activeTag }
    request({
      url: api.recognitionList,
      method: 'GET',
      data,
      success: (res) => {
        const rows = (res.data && res.data.rows) || []
        console.log('[识别库] 加载完成 total=' + (res.data && res.data.total) + ' rows=' + rows.length)
        this.setData({ list: rows, total: (res.data && res.data.total) || 0, loading: false })
      },
      fail: (err) => {
        const msg = (err && err.errMsg) || '请求失败'
        console.error('[识别库] 请求失败', msg)
        this.setData({ errorMsg: msg, loading: false })
      }
    })
  },

  // 切换 景点/文创 筛选
  switchTag(e) {
    const value = e.currentTarget.dataset.value
    if (value === this.data.activeTag) return
    this.setData({ activeTag: value })
    this.loadList()
  },

  // 点击图片大图预览
  preview(e) {
    const url = e.currentTarget.dataset.url
    const urls = this.data.list.map((i) => i.url).filter(Boolean)
    wx.previewImage({ current: url, urls })
  },

  // 加载失败重试
  reload() {
    this.loadList()
  }
})
