// pages/personDetail/personDetail.js
Page({
  data: {
    person: {},
    relatedBuildings: []
  },

  onLoad() {
    // 从storage读取人物数据
    const person = wx.getStorageSync('currentPerson') || {}
    
    // 历史人物本地头像映射（避免远程图片失效）
    const photoMap = {
      '周恩来': '/assets/people/zhou_enlai2.jpg',
      '毛泽东': '/assets/people/mao_zedong2.jpg',
      '朱德': '/assets/people/zhu_de.jpg',
      '彭德怀': '/assets/people/peng_dehuai.jpg',
      '刘伯承': '/assets/people/liu_bocheng.jpg',
      '贺龙': '/assets/people/he_long.jpg',
      '陈毅': '/assets/people/chen_yi.jpg',
      '罗荣桓': '/assets/people/luo_ronghuan.jpg',
      '徐向前': '/assets/people/xu_xiangqian.jpg',
      '聂荣臻': '/assets/people/nie_rongzhen.jpg',
      '叶剑英': '/assets/people/ye_jianying.jpg'
    }
    
    // 设置本地fallback头像
    if (person.name && photoMap[person.name]) {
      person._fallbackPhoto = photoMap[person.name]
    }
    
    if (person.name) {
      wx.setNavigationBarTitle({ title: person.name })
    }
    this.setData({ person })
  },

  onPhotoError() {
    const person = this.data.person || {}
    if (!person._fallbackPhoto || person.photo === person._fallbackPhoto) return
    this.setData({ 'person.photo': person._fallbackPhoto })
  },

  // 跳转到关联建筑
  goBuilding(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.redirectTo({
      url: '/pages/detail/detail?id=' + id
    })
  },

  onShareAppMessage() {
    return {
      title: this.data.person.name || '历史人物',
      path: '/pages/index/index'
    }
  }
})
