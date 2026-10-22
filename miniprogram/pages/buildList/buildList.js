const api = require('../../config/api.js')
const request = require('../../utils/request.js')

const PAGE_SIZE = 10
const TYPE_ALL = -1   // 全部
const TYPE_NEAR = -2  // 附近

Page({
  data: {
    keyword: '',        // 搜索框输入值
    categories: [],     // 后端二级分类（VR阅读、红色印记…）
    activeTypeId: TYPE_ALL + '',  // 字符串类型
    activeName: '全部',
    nearMode: false,    // 是否处于“附近”模式
    isSearch: false,    // 当前是否为关键字搜索结果（搜索接口不分页、字段不同）
    list: [],
    page: 1,
    total: 0,
    hasMore: true,
    loading: false,
    loaded: false,      // 是否完成过一次加载（用于空状态判断）
    latitude: null,
    longitude: null
  },

  onLoad() {
    this.reqSeq = 0      // 请求序号，防止快速切换分类时旧响应覆盖新数据
    this.loadCategories()
    this.fetchList(true)
  },

  // 拉取二级分类，“全部”固定在 wxml 最前面
  loadCategories() {
    // 直接硬编码分类列表，避免接口问题
    const categories = [
      { id: '169863344680079360', name: 'VR阅读' },
      { id: '301883092531154944', name: '红色印记' }
    ]
    this.setData({ categories })
  },

  // 搜索框输入
  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  // 点击“搜索”或键盘确认
  doSearch() {
    const kw = (this.data.keyword || '').trim()
    if (!kw) {
      this.clearSearch()
      return
    }
    this.setData({ isSearch: true, activeTypeId: TYPE_ALL, nearMode: false, activeName: '全部' })
    this.fetchList(true)
  },

  // 清空搜索，回到“全部”列表
  clearSearch() {
    this.setData({ keyword: '', isSearch: false, activeTypeId: TYPE_ALL, nearMode: false, activeName: '全部' })
    this.fetchList(true)
  },

  // 切换分类（全部 / VR阅读 / 红色印记…）
  switchCategory(e) {
    const typeId = e.currentTarget.dataset.id + ''  // 保持字符串类型，避免大数字精度丢失
    const name = e.currentTarget.dataset.name || ''
    if (!this.data.isSearch && typeId === this.data.activeTypeId) return
    this.setData({
      activeTypeId: typeId,
      activeName: name,
      isSearch: false,
      nearMode: false,
      keyword: ''
    })
    this.fetchList(true)
  },

  // 点击“附近”：先定位，再按经纬度拉取
  switchNear() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation']) {
          this.doNear()
        } else {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => this.doNear(),
            fail: () => wx.showToast({ title: '需要定位权限才能查看附近建筑', icon: 'none' })
          })
        }
      },
      fail: () => this.doNear()
    })
  },

  doNear() {
    wx.getLocation({
      type: 'gcj02',
      success: (loc) => {
        this.setData({
          latitude: loc.latitude,
          longitude: loc.longitude,
          activeTypeId: TYPE_NEAR,
          nearMode: true,
          isSearch: false,
          keyword: '',
          activeName: '附近'
        })
        this.fetchList(true)
      },
      fail: () => wx.showToast({ title: '定位失败，请检查定位权限', icon: 'none' })
    })
  },

  // 拉取列表；reset=true 表示切分类/重新搜索/下拉刷新，回到第 1 页并清空
  fetchList(reset) {
    if (this.data.loading) return
    if (!reset && !this.data.hasMore) return

    const seq = ++this.reqSeq
    const d = this.data
    const pageNum = reset ? 1 : d.page
    let url = ''
    let useSearch = false

    if (d.isSearch && (d.keyword || '').trim()) {
      url = api.scenicSearch(encodeURIComponent(d.keyword.trim()))
      useSearch = true
    } else if (d.activeTypeId == TYPE_NEAR) {
      if (d.latitude == null || d.longitude == null) {
        this.setData({ loading: false, loaded: true })
        return
      }
      url = api.scenicNear(d.longitude, d.latitude, pageNum, PAGE_SIZE)
    } else if (d.activeTypeId == TYPE_ALL) {
      url = api.scenicspotListPaged(pageNum, PAGE_SIZE)
    } else {
      url = api.scenicByClassification(d.activeTypeId, pageNum, PAGE_SIZE)
    }

    if (reset) {
      this.setData({ list: [], page: 1, total: 0, hasMore: true, loading: true, loaded: false })
    } else {
      this.setData({ loading: true })
    }

    request({
      url,
      method: 'GET',
      success: (res) => {
        if (seq !== this.reqSeq) return // 旧请求，丢弃
        const body = (res && res.data) || {}
        let rows = []
        let total = 0
        if (useSearch) {
          // 搜索接口：data 为完整数组，一次性返回，不分页
          rows = Array.isArray(body.data) ? body.data : []
          total = rows.length
        } else {
          // 分页接口：rows + total
          rows = Array.isArray(body.rows) ? body.rows : []
          total = Number(body.total) || rows.length
        }
        const cleaned = rows.map((it) => this.cleanItem(it))
        const merged = reset ? cleaned : this.data.list.concat(cleaned)
        this.setData({
          list: merged,
          page: pageNum + 1,
          total,
          hasMore: useSearch ? false : merged.length < total,
          loading: false,
          loaded: true
        })
      },
      fail: (err) => {
        if (seq !== this.reqSeq) return
        console.error('[建筑可阅读] 加载失败', err)
        this.setData({ loading: false, loaded: true })
        wx.showToast({ title: '加载失败，请重试', icon: 'none' })
      }
    })
  },

  // 清洗：pictureUrl 后端可能返回逗号分隔的多张，取首张；兼容 backgroundCover
  cleanItem(it) {
    let pic = it.pictureUrl || it.backgroundCover || ''
    pic = String(pic).split(',').map((s) => s.trim()).filter(Boolean)[0] || ''
    if (pic) pic = encodeURI(pic)
    return Object.assign({}, it, { _img: pic })
  },

  // 进入建筑详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  },

  // 上拉加载下一页
  onReachBottom() {
    if (!this.data.isSearch) {
      this.fetchList(false)
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.fetchList(true)
    setTimeout(() => wx.stopPullDownRefresh(), 600)
  }
})
