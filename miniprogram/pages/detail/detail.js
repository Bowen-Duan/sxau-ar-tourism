// pages/detail/detail.js
const app = getApp()
const api = require('../../config/api.js')

Page({
  data: {
    id: '',
    statusBarHeight: 20,
    loading: true,
    spot: null,
    lang: 'zh', // zh / en
    bannerList: [],
    personList: [],
    currentContent: '',
    hasContent: false,
    addressText: '',
    audioUrl: '',
    vrUrl: '',
    isPlaying: false,
    showAudioPanel: false,
    audioTitle: '',
    audioFileName: '',
    isLiked: false,
    likeCount: 0,
    showMap: false,
    mapLatitude: 37.427,
    mapLongitude: 112.583,
    mapScale: 16,
    mapMarkers: [],
    mapCircles: [],
    errorMsg: '',
    audioCtx: null
  },

  onLoad(options) {
    const id = options && options.id
    if (!id) {
      this.setData({ loading: false, errorMsg: '缺少建筑 ID' })
      return
    }
    this.setData({ id })
    // 沉浸式头图：读取状态栏高度，用于返回按钮避让
    try {
      const winInfo = typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : {}
      this.setData({ statusBarHeight: winInfo.statusBarHeight || 20 })
    } catch (e) {
      // 读取失败时使用兜底值
    }
    // 创建音频上下文
    this.audioCtx = wx.createInnerAudioContext()
    this.audioCtx.onEnded(() => {
      this.setData({ isPlaying: false })
    })
    this.audioCtx.onError((err) => {
      console.error('音频播放失败', err)
      wx.showToast({ title: '音频播放失败', icon: 'none' })
      this.setData({ isPlaying: false })
    })
    // 从本地存储读取点赞状态
    const liked = wx.getStorageSync('liked_' + id) || false
    const localLikeCount = wx.getStorageSync('likeCount_' + id)
    this.setData({ isLiked: liked })
    if (localLikeCount) {
      this.setData({ likeCount: localLikeCount })
    }
    this.loadDetail(id)
    // 增加浏览量
    this.addPageView(id)
  },

  // 增加浏览量（真实记录）
  addPageView(id) {
    if (!id) return
    // 检查是否已经浏览过（避免重复计数）
    const viewedList = wx.getStorageSync('viewed_list') || []
    if (viewedList.indexOf(id) === -1) {
      // 调用后端接口增加浏览量；只有后端确认成功后才记录，失败时允许下次补报。
      app.wxRequest(
        'POST',
        api.insertScenicViews(id),
        () => {
          console.log('[建筑详情] 浏览量增加成功')
          viewedList.push(id)
          wx.setStorageSync('viewed_list', viewedList)
        },
        () => {
          console.warn('[建筑详情] 浏览量接口调用失败，使用本地计数')
        }
      )
    }
  },

  // 加载建筑详情
  loadDetail(id) {
    this.setData({ loading: true, errorMsg: '' })
    app.wxRequest(
      'GET',
      api.scenicspotDetail(id),
      (res) => {
        const body = res && res.data
        const spot = body && body.data
        if (!body || !body.success || !spot) {
          const msg = (body && body.msg) || '加载失败，请重试'
          this.setData({ loading: false, errorMsg: msg })
          wx.showToast({ title: msg, icon: 'none' })
          return
        }

        // 处理地址
        let addressText = ''
        if (spot.remarks) {
          addressText = spot.remarks
        } else if (spot.address) {
          addressText = spot.address
        }

        // 处理轮播图：backgroundCover 逗号分隔，否则用 pictureUrl
        let bannerList = []
        if (spot.backgroundCover) {
          bannerList = spot.backgroundCover.split(',').filter(url => url && url.trim()).map(url => this.fixImageUrl(url))
        }
        if (bannerList.length === 0 && spot.pictureUrl) {
          bannerList = [this.fixImageUrl(spot.pictureUrl)]
        }

        // 处理音频：与ruoyi建筑管理的音频上传字段audioUrl关联
        let audioUrl = ''
        if (spot.audioUrl) {
          audioUrl = this.fixImageUrl(spot.audioUrl)
        }
        const vrUrl = spot.vrUrl ? this.fixImageUrl(spot.vrUrl) : ''

        // 设置导航栏标题
        if (spot.name) {
          wx.setNavigationBarTitle({ title: spot.name })
        }

        // 设置地图标记（山西农业大学太谷校区 + 参照物）
        // 注意：接口返回的longitude字段可能是"纬度,经度"格式
        let mapLat = 37.427
        let mapLng = 112.583

        if (spot.latitude && spot.longitude && !isNaN(parseFloat(spot.latitude)) && !isNaN(parseFloat(spot.longitude))) {
          // 正常情况：latitude和longitude分开
          mapLat = parseFloat(spot.latitude)
          mapLng = parseFloat(spot.longitude)
        } else if (spot.longitude && spot.longitude.indexOf(',') > -1) {
          // longitude字段是"纬度,经度"格式
          const parts = spot.longitude.split(',')
          mapLat = parseFloat(parts[0]) || 37.427
          mapLng = parseFloat(parts[1]) || 112.583
        } else if (spot.latitude && spot.latitude.indexOf(',') > -1) {
          // latitude字段是"纬度,经度"格式
          const parts = spot.latitude.split(',')
          mapLat = parseFloat(parts[0]) || 37.427
          mapLng = parseFloat(parts[1]) || 112.583
        }

        // 山西农业大学主要建筑参照物（经纬度为太谷校区大致位置）
        const landmarks = [
          { id: 1, name: spot.name || '当前景点', lat: mapLat, lng: mapLng, isCurrent: true },
          { id: 2, name: '山西农业大学', lat: 37.425, lng: 112.581, isLandmark: true },
          { id: 3, name: '崇慧楼', lat: 37.428, lng: 112.585, isLandmark: true },
          { id: 4, name: '图书馆', lat: 37.426, lng: 112.586, isLandmark: true },
          { id: 5, name: '校门', lat: 37.423, lng: 112.580, isLandmark: true }
        ]

        const mapMarkers = landmarks.map(item => ({
          id: item.id,
          latitude: item.lat,
          longitude: item.lng,
          width: item.isCurrent ? 36 : 28,
          height: item.isCurrent ? 36 : 28,
          callout: {
            content: item.name,
            color: item.isCurrent ? '#d4af37' : '#666',
            fontSize: item.isCurrent ? 12 : 10,
            borderRadius: 6,
            bgColor: item.isCurrent ? '#fff8e6' : '#f5f5f5',
            padding: 6,
            display: 'ALWAYS',
            textAlign: 'center',
            borderWidth: item.isCurrent ? 1 : 0,
            borderColor: item.isCurrent ? '#d4af37' : ''
          }
        }))

        // 判断是否有内容
        const hasContent = !!(spot.content && spot.content.trim()) ||
                          !!(spot.englishIntroduction && spot.englishIntroduction.trim())

        // 山西农业大学范围圆形区域
        const mapCircles = [{
          latitude: 37.425,
          longitude: 112.581,
          color: '#d4af37',
          fillColor: '#d4af3720',
          radius: 500,
          strokeWidth: 2
        }]

        this.setData({
          loading: false,
          spot,
          bannerList,
          audioUrl,
          vrUrl,
          hasContent,
          addressText,
          likeCount: spot.likes || 0,
          mapLatitude: mapLat,
          mapLongitude: mapLng,
          mapMarkers,
          mapCircles,
          currentContent: this.normalizeRichContent(spot.content)
        })

        // 加载历史人物（human字段存人物ID，可能是单个或逗号分隔多个）
        if (spot.human) {
          this.loadPersonList(spot.human)
        }
      },
      (err) => {
        const msg = (err && err.errMsg) || '网络异常，请重试'
        console.error('[建筑详情] 加载失败', msg)
        this.setData({ loading: false, errorMsg: msg })
      }
    )
  },

  // 根据人物ID加载历史人物详情
  loadPersonList(humanStr) {
    // 解析ID：可能是单个ID、逗号分隔、JSON数组
    let ids = []
    if (typeof humanStr === 'string') {
      try {
        const parsed = JSON.parse(humanStr)
        if (Array.isArray(parsed)) {
          ids = parsed.map(String)
        } else if (parsed && parsed.id) {
          ids = [String(parsed.id)]
        } else {
          ids = humanStr.split(',').map(s => s.trim()).filter(s => s)
        }
      } catch (e) {
        // 不是JSON，按逗号分隔
        ids = humanStr.split(',').map(s => s.trim()).filter(s => s)
      }
    } else if (Array.isArray(humanStr)) {
      ids = humanStr.map(String)
    }

    if (ids.length === 0) return

    // 逐个获取人物详情（接口支持单ID查询）
    const personList = []
    let loaded = 0
    ids.forEach((pid, idx) => {
      app.wxRequest(
        'GET',
        api.humanList(pid),
        (res) => {
          const body = res && res.data
          const rows = body && body.rows
          if (rows && rows.length > 0) {
            let person = rows[0]
            // 处理人物照片URL
            if (person.photo) {
              person.photo = this.fixImageUrl(person.photo)
            }
            person._fallbackPhoto = person.name && person.name.indexOf('周恩来') > -1
              ? '/assets/people/zhou-enlai.jpg'
              : ''
            personList[idx] = person
          }
          loaded++
          if (loaded === ids.length) {
            this.setData({ personList: personList.filter(p => p) })
          }
        },
        () => {
          loaded++
          if (loaded === ids.length) {
            this.setData({ personList: personList.filter(p => p) })
          }
        }
      )
    })
  },

  // 修复图片URL：在开发者工具中localhost可直接访问，真机需替换为实际地址
  fixImageUrl(url) {
    if (!url) return url
    const value = String(url).trim()
    if (/^data:|^wxfile:|^https?:\/\//i.test(value)) return encodeURI(value)
    if (/^\/\//.test(value)) return encodeURI('https:' + value)
    return encodeURI(api.baseUrl.replace(/\/$/, '') + '/' + value.replace(/^\//, ''))
  },

  // 富文本中的上传图片通常只有相对路径，补齐后端地址后再交给 rich-text 渲染。
  normalizeRichContent(content) {
    if (!content) return ''
    const base = api.baseUrl.replace(/\/$/, '')
    return String(content).replace(/(<img\b[^>]*?\bsrc=["'])(?!https?:|data:|wxfile:|\/\/)([^"']+)(["'])/gi,
      (all, prefix, src, suffix) => prefix + base + '/' + src.replace(/^\//, '') + suffix)
  },

  // 切换语言
  toggleLang() {
    const newLang = this.data.lang === 'zh' ? 'en' : 'zh'
    const spot = this.data.spot
    let currentContent = ''
    if (newLang === 'zh') {
      currentContent = this.normalizeRichContent(spot.content)
    } else {
      currentContent = this.normalizeRichContent(spot.englishIntroduction || spot.content)
    }
    this.setData({ lang: newLang, currentContent })
  },

  // 语音导览（与ruoyi建筑管理的音频上传关联）
  playAudio() {
    if (!this.data.audioUrl) {
      wx.showToast({ title: '暂无语音导览', icon: 'none' })
      return
    }
    if (this.data.isPlaying) {
      this.audioCtx.pause()
      this.setData({ isPlaying: false })
      return
    }
    const spot = this.data.spot
    this.audioCtx.src = this.data.audioUrl
    this.audioCtx.play()
    this.setData({
      isPlaying: true,
      showAudioPanel: true,
      audioTitle: spot && spot.name ? spot.name + ' 语音导览' : '语音导览',
      audioFileName: this.extractFileName(this.data.audioUrl)
    })
  },

  // 音频面板：播放/暂停切换
  toggleAudioPlay() {
    if (!this.data.isPlaying) {
      this.audioCtx.play()
      this.setData({ isPlaying: true })
    } else {
      this.audioCtx.pause()
      this.setData({ isPlaying: false })
    }
  },

  // 关闭音频面板
  closeAudioPanel() {
    if (this.audioCtx) this.audioCtx.stop()
    this.setData({ showAudioPanel: false, isPlaying: false })
  },

  // 从URL提取文件名
  extractFileName(url) {
    if (!url) return ''
    try {
      const cleaned = decodeURIComponent(String(url).split('?')[0])
      const parts = cleaned.split('/')
      const name = parts[parts.length - 1]
      return name && name !== 'null' && name !== 'undefined' ? name : ''
    } catch (e) {
      return ''
    }
  },

  // VR漫游
  goVr() {
    // 360地图“山西农业大学太谷校区全景”公开嵌入的真实校园作品《瞰见山西农业大学》。
    const fallbackVrUrl = 'https://www.720yun.com/t/c6929xOOjuv?scene_id=26737038'
    let vrUrl = this.data.vrUrl
    const isLocalVr = /(?:127\.0\.0\.1|localhost|:\/\/192\.168\.|:\/\/10\.)/i.test(vrUrl || '')
    const hasInvalidType = /[?&]type=(?:null|undefined|)(&|$)/i.test(vrUrl || '')
    if (isLocalVr || hasInvalidType || (!vrUrl && Number(this.data.spot && this.data.spot.isVr) === 1)) {
      vrUrl = fallbackVrUrl
    }
    if (!vrUrl) {
      wx.showToast({ title: '该建筑暂未配置 VR 全景', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/vr/vr?url=${encodeURIComponent(vrUrl)}&title=${encodeURIComponent(this.data.spot.name || 'VR全景漫游')}`,
      fail: () => {
        wx.showToast({ title: 'VR页面打开失败', icon: 'none' })
      }
    })
  },

  // 显示/隐藏地图
  toggleMap() {
    const showMap = !this.data.showMap
    this.setData({ showMap })
    if (showMap) {
      // 滚动到地图位置
      wx.pageScrollTo({
        selector: '.map-section',
        duration: 300
      })
    }
  },

  // 放大地图
  zoomInMap() {
    let scale = this.data.mapScale
    if (scale < 20) {
      this.setData({ mapScale: Math.min(20, scale + 1) })
    }
  },

  // 缩小地图
  zoomOutMap() {
    let scale = this.data.mapScale
    if (scale > 3) {
      this.setData({ mapScale: Math.max(3, scale - 1) })
    }
  },

  // 在微信地图中打开导航
  openInWechatMap() {
    const { mapLatitude, mapLongitude, spot, addressText } = this.data
    wx.openLocation({
      latitude: mapLatitude,
      longitude: mapLongitude,
      name: spot.name || '',
      address: addressText || '',
      scale: 18,
      fail: () => {
        wx.showToast({ title: '打开地图失败', icon: 'none' })
      }
    })
  },

  // 进入人物详情
  goPersonDetail(e) {
    const index = e.currentTarget.dataset.index
    const person = this.data.personList[index]
    if (!person) return
    // 传递人物数据（通过storage）
    wx.setStorageSync('currentPerson', person)
    wx.navigateTo({
      url: '/pages/personDetail/personDetail',
      fail: () => {
        wx.showModal({
          title: person.name || '人物详情',
          content: person.content || person.introduction || '暂无详细介绍',
          showCancel: false
        })
      }
    })
  },

  // 共享后端中的旧临时图片地址失效时，仅在小程序端切换本地兜底图。
  onPersonImageError(e) {
    const index = Number(e.currentTarget.dataset.index)
    const person = this.data.personList[index]
    if (!person || !person._fallbackPhoto || person.photo === person._fallbackPhoto) return
    this.setData({ ['personList[' + index + '].photo']: person._fallbackPhoto })
  },

  // 图片加载失败
  onImageError(e) {
    console.warn('[建筑详情] 图片加载失败', e.detail)
  },

  // 重试
  retry() {
    if (this.data.id) {
      this.loadDetail(this.data.id)
    }
  },

  // 返回上一页
  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  // 点赞（真实存储，可取消）
  handleLike() {
    const id = this.data.id
    const isLiked = this.data.isLiked
    let likeCount = this.data.likeCount

    if (isLiked) {
      // 取消点赞
      likeCount = Math.max(0, likeCount - 1)
      wx.setStorageSync('liked_' + id, false)
      wx.showToast({ title: '已取消点赞', icon: 'none', duration: 1500 })
    } else {
      // 点赞
      likeCount = likeCount + 1
      wx.setStorageSync('liked_' + id, true)
      wx.showToast({ title: '点赞成功', icon: 'none', duration: 1500 })
    }
    // 存储点赞数
    wx.setStorageSync('likeCount_' + id, likeCount)
    this.setData({ isLiked: !isLiked, likeCount })
  },

  // 分享给朋友
  onShareAppMessage() {
    const spot = this.data.spot
    return {
      title: spot ? `${spot.name} - 建筑可阅读` : '建筑可阅读',
      path: '/pages/detail/detail?id=' + this.data.id,
      imageUrl: spot && spot.pictureUrl ? this.fixImageUrl(spot.pictureUrl) : ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const spot = this.data.spot
    return {
      title: spot ? `${spot.name} - 建筑可阅读` : '建筑可阅读',
      query: 'id=' + this.data.id,
      imageUrl: spot && spot.pictureUrl ? this.fixImageUrl(spot.pictureUrl) : ''
    }
  },

  onUnload() {
    // 停止音频
    if (this.audioCtx) {
      this.audioCtx.stop()
      this.audioCtx.destroy()
    }
    this.setData({ isPlaying: false, showAudioPanel: false })
  }
})
