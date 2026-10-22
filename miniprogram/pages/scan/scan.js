const app = getApp()
const api = require('../../config/api.js')

Page({
  data: {
    imagePath: '',       // 已选图片本地路径
    scanning: false,     // 识别中
    resultCode: null,    // 1 准确识别 / 2 未识别
    spot: null,          // 识别出的建筑（resultCode=1）
    recommends: [],      // 推荐建筑列表（resultCode=2）
    errorMsg: '',
    latitude: null,      // 当前纬度
    longitude: null,     // 当前经度
    locationReady: false // 是否已获取到定位
  },

  onLoad() {
    // 进入页面即请求定位授权并获取经纬度，用于后端按 1 公里地理范围过滤
    this.getLocation()
  },

  // ===== 地理位置授权与获取 =====
  getLocation() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation']) {
          // 用户已经授权
          this.doGetLocation()
        } else {
          // 用户还没有授权，向用户发起授权请求
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => this.doGetLocation(),
            fail: () => {
              console.log('[拍照识别] 定位未授权，将仅按图片相似度识别')
            }
          })
        }
      },
      fail: () => {}
    })
  },

  doGetLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          locationReady: true
        })
        console.log('[拍照识别] 定位成功 lat=' + res.latitude + ' long=' + res.longitude)
      },
      fail: (err) => {
        console.log('[拍照识别] 获取定位失败', err)
      }
    })
  },

  // 拍照：调起相机
  takePhoto() {
    this.chooseImage(['camera'])
  },

  // 从相册选择
  chooseAlbum() {
    this.chooseImage(['album'])
  },

  // 1. 选图（相机或相册），选完后先压缩再识别
  chooseImage(sourceType) {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType,
      sizeType: ['original'],
      camera: 'back',
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file || !file.tempFilePath) {
          wx.showToast({ title: '未获取到图片', icon: 'none' })
          return
        }
        this.setData({
          imagePath: file.tempFilePath,
          resultCode: null,
          spot: null,
          recommends: [],
          errorMsg: ''
        })
        // 2. Canvas2D 按比例压缩，压缩完成后再上传
        this.compressImage(file.tempFilePath, (compressedPath) => {
          this.doScan(compressedPath)
        })
      },
      fail: (err) => {
        if (err && err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '选择图片失败', icon: 'none' })
        }
      }
    })
  },

  // 2. Canvas2D 离屏按比例压缩（约最大边 800px，JPEG 0.8）
  compressImage(src, cb) {
    wx.getImageInfo({
      src,
      success: (info) => {
        // 宽高按比例缩放，最长边限制在 1600，保留建筑细节提高百度识别准确率
        const maxSide = 1600
        let w = info.width
        let h = info.height
        if (w >= h && w > maxSide) {
          h = Math.round(h * maxSide / w)
          w = maxSide
        } else if (h > w && h > maxSide) {
          w = Math.round(w * maxSide / h)
          h = maxSide
        }
        // 创建离屏 canvas
        const canvas = wx.createOffscreenCanvas({ type: '2d', width: w, height: h })
        const ctx = canvas.getContext('2d')
        const img = canvas.createImage()
        img.onload = () => {
          ctx.drawImage(img, 0, 0, w, h)
          // 3. 导出压缩图
          wx.canvasToTempFilePath({
            canvas: canvas,
            fileType: 'jpg',
            quality: 0.9,
            success: (out) => {
              console.log('[拍照识别] 压缩完成 ' + info.width + 'x' + info.height +
                ' -> ' + w + 'x' + h)
              cb && cb(out.tempFilePath)
            },
            fail: () => {
              console.warn('[拍照识别] canvas 导出失败，使用原图')
              cb && cb(src)
            }
          })
        }
        img.onerror = () => {
          console.warn('[拍照识别] 图片解码失败，使用原图')
          cb && cb(src)
        }
        img.src = src
      },
      fail: () => {
        console.warn('[拍照识别] 获取图片信息失败，使用原图')
        cb && cb(src)
      }
    })
  },

  // 上传压缩图到 /travel/scanthing，后端调用百度智能云相似图搜索
  // base64 图片识别（wx.request 调用，绕过 iOS uploadFile 对 HTTP+IP 的限制）
  doScan(e) {
    const filePath = (typeof e === 'string') ? e : this.data.imagePath
    if (!filePath || this.data.scanning) return
    this.setData({ scanning: true, errorMsg: '' })

    const fs = wx.getFileSystemManager()
    fs.readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (res) => {
        const postData = {
          image: res.data,
          tag: '1',
          source: 'miniprogram',
          sourceDetail: '拍照识别',
          fileName: filePath.split('/').pop() || 'scan.jpg'
        }
        if (this.data.latitude != null && this.data.longitude != null) {
          postData.lat = this.data.latitude
          postData.long = this.data.longitude
        }

        this.sendRecognitionRequest(postData)
      },
      fail: (err) => {
        console.error('[拍照识别] 读取图片失败', err)
        this.setData({ scanning: false, errorMsg: '读取图片失败' })
        wx.showToast({ title: '读取图片失败', icon: 'none' })
      }
    })
  },

  // 识别接口使用 JSON，同时复用全局无感登录并在 token 过期时重试一次。
  sendRecognitionRequest(postData, retried = false) {
    app.ensureLogin((token) => {
      wx.request({
          url: api.scanThingBase64,
          method: 'POST',
          data: postData,
          header: {
            'content-type': 'application/json',
            Authorization: token
          },
          success: (response) => {
            const body = response.data
            if ((response.statusCode === 401 || (body && body.code === 401)) && !retried) {
              wx.removeStorageSync('login')
              app.ensureLogin(() => this.sendRecognitionRequest(postData, true), (err) => {
                this.handleScanFailure(err)
              }, true)
              return
            }
            const data = body && body.data
            if (!body || !body.success || !data) {
              const msg = (body && body.msg) || '识别失败，请重试'
              console.error('[拍照识别] 接口返回异常', body)
              this.setData({ scanning: false, errorMsg: msg })
              wx.showToast({ title: msg, icon: 'none' })
              return
            }
            const resultCode = data.resultCode
            const spot = data.travelScenicSpot || null
            const recommends = data.recommendTravelScenicSpots || []
            console.log('[拍照识别] resultCode=' + resultCode +
              ' spot=' + (spot && spot.name) +
              ' recommends=' + recommends.length)
            if (resultCode === 2) {
              // 识别失败 → 跳 rFail 页面，通过 eventChannel 传推荐数据
              this.setData({ scanning: false })
              wx.navigateTo({
                url: '/pages/rFail/rFail',
                success: (res) => {
                  res.eventChannel.emit('recommend', { list: recommends })
                }
              })
              return
            }
            this.setData({ scanning: false, resultCode, spot, recommends })
          },
          fail: (err) => {
            this.handleScanFailure(err)
          }
        })
    }, (err) => this.handleScanFailure(err), retried)
  },

  handleScanFailure(err) {
    const msg = (err && err.errMsg) || '网络异常，请重试'
    console.error('[拍照识别] 请求失败', msg)
    this.setData({ scanning: false, errorMsg: msg })
    wx.showToast({ title: msg, icon: 'none' })
  },

  // 重新选择（清空当前图片和结果）
  reset() {
    this.setData({
      imagePath: '',
      resultCode: null,
      spot: null,
      recommends: [],
      errorMsg: ''
    })
  },

  // 查看建筑详情
  viewDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) {
      wx.showToast({ title: '建筑 ID 缺失', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + id
    })
  },

  // 点击推荐建筑 → 进入详情页
  goRecommend(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + id
    })
  }
})
