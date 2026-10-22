// 小程序入口：只保留通用初始化和无感登录，不包含任何业务请求。
const api = require('./config/api.js')
const env = require('./config/env.js')

App({
  onLaunch() {
    console.log('[配置] 当前 baseUrl:', env.baseUrl)
    // this.detectBaseUrl()  // 暂时关闭IP探测，直接使用配置的baseUrl
    // 清理旧版本可能留下的 sessionKey；学生框架不使用它。
    wx.removeStorageSync('sessionKey')
    // 计算自定义导航栏需要的尺寸；页面可以从 getApp().globalData 读取。
    // 旧版系统信息同步接口已被微信官方弃用，使用新的 getWindowInfo API。
    const windowInfo = typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : {}
    const menu = wx.getMenuButtonBoundingClientRect
      ? wx.getMenuButtonBoundingClientRect()
      : { top: windowInfo.statusBarHeight || 0, height: 32 }
    const statusBarHeight = windowInfo.statusBarHeight || 0
    this.globalData.navBarHeight =
      (menu.top - statusBarHeight) * 2 + menu.height + statusBarHeight
    this.globalData.reHeight = menu.top
  },

  // 自动探测可用的后端 IP（WiFi/热点切换后自动适配）
  // 注意：如果当前 baseUrl 是 HTTPS 公网地址（如 Cloudflare Tunnel），不做探测替换，
  // 因为公网地址在任何网络下都可达，替换成局域网 IP 反而可能导致真机不通。
  detectBaseUrl() {
    if (!env.candidateIps || env.candidateIps.length === 0) return
    // HTTPS 公网地址（Cloudflare Tunnel 等）直接跳过探测
    if (env.baseUrl && env.baseUrl.indexOf('https://') === 0) {
      console.log('[配置] baseUrl 为 HTTPS 公网地址，跳过 IP 探测:', env.baseUrl)
      return
    }
    const candidates = env.candidateIps
    const oldBase = env.baseUrl
    let idx = 0
    const tryNext = () => {
      if (idx >= candidates.length) {
        console.log('[配置] 所有候选IP均不可达，保留默认:', oldBase)
        return
      }
      const ip = candidates[idx++]
      const testUrl = 'http://' + ip + ':8020/travel/slideshow/random'
      wx.request({
        url: testUrl,
        method: 'GET',
        timeout: 3000,
        success: (res) => {
          if (res.statusCode === 200 && res.data && res.data.code === 200) {
            const newBase = 'http://' + ip + ':8020'
            if (newBase !== oldBase) {
              console.log('[配置] 探测成功，切换到:', newBase)
              this.replaceApiBase(oldBase, newBase)
              this.globalData.baseUrl = newBase
            } else {
              console.log('[配置] 当前IP可用:', newBase)
            }
          } else {
            tryNext()
          }
        },
        fail: () => { tryNext() }
      })
    }
    tryNext()
  },

  // 把 api 对象里所有 URL 的旧前缀替换成新前缀
  replaceApiBase(oldBase, newBase) {
    for (const key in api) {
      if (typeof api[key] === 'string' && api[key].indexOf(oldBase) === 0) {
        api[key] = newBase + api[key].substring(oldBase.length)
      }
    }
  },

  // 首次进入小程序时上报浏览量，同时完成首次无感登录。
  // onShow 在每次回到前台都会触发，这里用一个标志保证每次启动只上报一次。
  onShow() {
    if (this._viewsReported) return
    this._viewsReported = true
    this.wxRequest(
      'POST',
      api.insertViews,
      () => {
        // 上报成功，登录已由 ensureLogin 完成，后续请求直接复用 token。
      },
      (error) => {
        // 后端未就绪时静默失败，不影响页面正常使用；
        // 后续业务请求仍会触发 ensureLogin 尝试登录。
      }
    )
  },

  /*
   * 无感登录流程：
   * 1. 本地已有后端 token 时直接复用，用户无需看到登录页。
   * 2. 没有 token 时调用 wx.login，拿一次性 code 请求后端登录接口。
   * 3. 后端校验 code 后返回业务 token，前端只保存后端 token。
   * 4. 接口返回 401 时清除旧 token，并自动重新登录重试一次。
   *
   * wx.login 返回的 code 不是登录态，不能当作长期 token 使用。
   */
  ensureLogin(onToken, onError, forceRefresh = false) {
    if (!forceRefresh) {
      const cached = wx.getStorageSync('login')
      if (cached) {
        onToken && onToken(cached)
        return
      }
    }

    if (!api.baseUrl ) {
      const error = { errMsg: '请先在 config/env.js 配置 baseUrl 和 appId' }
      onError && onError(error)
      return
    }

    wx.login({
      success: (res) => {
        if (!res.code) {
          onError && onError(res)
          return
        }
        wx.request({
          url: api.wxLogin(res.code),
          method: 'GET',
          header: {
            'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
          },
          success: (response) => {
            const data = response.data && response.data.data
            if (!data || !data.token) {
              onError && onError(response)
              return
            }
            wx.setStorageSync('login', data.token)
            // 学生框架只保存后端业务 token，不把微信 sessionKey 写入本地缓存。
            onToken && onToken(data.token)
          },
          fail: (error) => onError && onError(error)
        })
      },
      fail: (error) => onError && onError(error)
    })
  },

  // 通用 JSON 请求封装；业务页面只需要传入自己的 URL 和数据。
  wxRequest(method, url, callback, errFun, data = {}) {
    this._sendRequest(method, url, callback, errFun, data, false)
  },

  _sendRequest(method, url, callback, errFun, data, retried) {
    this.ensureLogin((token) => {
      const header = {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
      if (token) {
        header.Authorization = token
      }
      wx.request({
        url,
        method,
        data,
        header,
        dataType: 'json',
        success: (response) => {
          const code = response.data && response.data.code
          if ((response.statusCode === 401 || code === 401) && !retried) {
            wx.removeStorageSync('login')
            this._sendRequest(method, url, callback, errFun, data, true)
            return
          }
          callback && callback(response)
        },
        fail: (error) => errFun && errFun(error)
      })
    }, errFun)
  },

  // 文件上传封装，与 wxRequest 使用同一套无感登录和 401 重试逻辑。
  wxUpload(url, filePath, formData, callback, errFun) {
    this._sendUpload(url, filePath, formData, callback, errFun, false)
  },

  _sendUpload(url, filePath, formData, callback, errFun, retried) {
    this.ensureLogin((token) => {
      wx.uploadFile({
        url,
        filePath,
        name: 'file',
        header: { Authorization: token, 'bypass-tunnel-reminder': '1' },
        formData: formData || {},
        success: (response) => {
          let parsed = null
          try {
            parsed = JSON.parse(response.data)
          } catch (e) {
            // 后端返回非 JSON 文本时，继续把原始响应交给调用方。
          }
          const code = parsed && parsed.code
          if ((response.statusCode === 401 || code === 401) && !retried) {
            wx.removeStorageSync('login')
            this._sendUpload(url, filePath, formData, callback, errFun, true)
            return
          }
          callback && callback({ ...response, data: parsed == null ? response.data : parsed })
        },
        fail: (error) => errFun && errFun(error)
      })
    }, errFun)
  },

  // 只获取 token，不主动请求业务接口。
  getToken(callback, errFun) {
    this.ensureLogin(callback, errFun)
  },

  globalData: {
    navBarHeight: 0,
    reHeight: 0
  }
})
