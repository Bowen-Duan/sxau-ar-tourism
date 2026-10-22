// pages/map/map.js
Page({
  data: {
    spotName: '',
    spotAddress: '',
    latitude: 37.427,
    longitude: 112.583,
    scale: 16,
    markers: [],
    distance: ''
  },

  onLoad(options) {
    const name = options.name || '景点位置'
    const address = options.address || ''
    const lat = parseFloat(options.latitude) || 37.427
    const lng = parseFloat(options.longitude) || 112.583

    // 山西农业大学太谷校区中心坐标
    const sxauLat = 37.427
    const sxauLng = 112.583

    // 如果没有传入坐标，使用山西农业大学默认位置
    const finalLat = lat || sxauLat
    const finalLng = lng || sxauLng

    const markers = [{
      id: 1,
      latitude: finalLat,
      longitude: finalLng,
      width: 40,
      height: 40,
      iconPath: '',
      callout: {
        content: name,
        color: '#333',
        fontSize: 12,
        borderRadius: 8,
        bgColor: '#fff',
        padding: 8,
        display: 'ALWAYS',
        textAlign: 'center'
      }
    }]

    this.setData({
      spotName: name,
      spotAddress: address,
      latitude: finalLat,
      longitude: finalLng,
      markers
    })

    // 设置导航栏标题
    wx.setNavigationBarTitle({ title: name })
  },

  // 返回
  goBack() {
    wx.navigateBack()
  },

  // 点击标记
  onMarkerTap(e) {
    console.log('点击标记', e.detail)
  },

  // 在微信地图中打开
  openInMap() {
    const { latitude, longitude, spotName, spotAddress } = this.data
    wx.openLocation({
      latitude,
      longitude,
      name: spotName,
      address: spotAddress,
      scale: 18,
      fail: () => {
        wx.showToast({ title: '打开地图失败', icon: 'none' })
      }
    })
  },

  // 放大
  zoomIn() {
    let scale = this.data.scale
    if (scale < 20) {
      scale = Math.min(20, scale + 1)
      this.setData({ scale })
    }
  },

  // 缩小
  zoomOut() {
    let scale = this.data.scale
    if (scale > 3) {
      scale = Math.max(3, scale - 1)
      this.setData({ scale })
    }
  },

  onShareAppMessage() {
    return {
      title: this.data.spotName || '景点位置',
      path: '/pages/index/index'
    }
  }
})
