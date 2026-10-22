// 后端接口统一管理
// 所有 URL 全部走这里，切换环境改 config/env.js 即可
const env = require('./env.js')

/**
 * 小程序分页查询参数。
 * @typedef {Object} PageQueryParams
 * @property {number} [pageNum] 页码，从 1 开始。
 * @property {number} [pageSize] 每页条数。
 */

/**
 * 后端分页响应（TableDataInfo）。
 * @typedef {Object} PageResponse
 * @property {number} total 符合条件的记录总数。
 * @property {Array<Object>} rows 当前页数据。
 * @property {number} code 响应状态码。
 * @property {string} msg 响应消息。
 */

/**
 * 景点/建筑对象（对应后端 TravelModuleDetail）。
 * @typedef {Object} ScenicSpot
 * @property {number|string} id 景点 ID。
 * @property {number|string} [moduleId] 所属栏目 ID。
 * @property {number|string} [subClassificationId] 二级分类 ID。
 * @property {string} name 中文名称。
 * @property {string} [englishName] 英文名称。
 * @property {string} [title] 标题。
 * @property {string} [subTitle] 副标题。
 * @property {string} [pictureUrl] 景点图片 URL，多个地址以逗号分隔。
 * @property {string} [backgroundCover] 背景图 URL，多个地址以逗号分隔。
 * @property {string} [videoUrl] 视频 URL。
 * @property {string} [audioUrl] 音频 URL。
 * @property {string} [address] 英文地址。
 * @property {string} [remarks] 中文地址。
 * @property {string} [content] 中文介绍内容。
 * @property {number} [status] 状态：0 失效，1 正常。
 * @property {string} [longitude] 经纬度，后端约定为"纬度,经度"。
 * @property {string} [introduction] 景点简介。
 * @property {string} [englishIntroduction] 英文介绍。
 * @property {number} [isVr] 是否存在 VR：0 否，1 是。
 * @property {number|string} [vrId] 关联 VR ID。
 * @property {number} [pageviews] 浏览量。
 * @property {number} [likes] 点赞量。
 * @property {number} [isUser] 是否开启用户识别：0 否，1 是。
 * @property {string} [human] 历史人物 JSON 字符串。
 * @property {string} [vrUrl] VR 访问地址，详情接口返回。
 * @property {boolean} [isAppointment] 是否允许预约。
 * @property {string} [distance] 与当前位置的距离，附近接口返回。
 * @property {number} [activity] 是否为活动：0 否，1 是。
 * @property {string} [activityName] 活动名称。
 * @property {string} [activityUrl] 活动链接。
 * @property {Array<Object>} [travelModelVideos] 景点音频/视频列表。
 * @property {Array<ScenicSpot>} [relateDetailList] 相关景点集合。
 */

/**
 * 景点列表查询参数。
 * @typedef {Object} ScenicListQueryParams
 * @property {number|string} [subClassificationId] 二级分类 ID。
 * @property {number|string} [blockId] 街区 ID。
 * @property {number} [pageNum] 页码，从 1 开始。
 * @property {number} [pageSize] 每页条数。
 */

/**
 * 活动 Banner 对象（对应后端 BookActiv）。
 * @typedef {Object} BookActivity
 * @property {number|string} id 活动 ID。
 * @property {string} [background] 封面图片 URL。
 * @property {string} name 活动名称。
 * @property {number} [type] 链接类型：1 内部链接，2 外部链接。
 * @property {string} url 链接地址。
 * @property {number} [status] 发布状态：1 发布，0 不发布。
 * @property {string} [createBy] 创建者 ID。
 * @property {string} [createTime] 创建时间，格式为 yyyy-MM-dd HH:mm:ss。
 */

/**
 * 视频对象（对应后端 TravelVideo）。
 * @typedef {Object} TravelVideo
 * @property {number|string} id 视频 ID。
 * @property {string} name 视频名称。
 * @property {number|string} [modelId] 所属模块 ID。
 * @property {number|string} [tourId] 所属景点 ID。
 * @property {string} [tittle] 视频标题/副标题（后端字段名为 tittle）。
 * @property {string} [cover] 视频封面 URL。
 * @property {string} [video] 视频文件 URL。
 * @property {number} [count] 播放次数；详情接口访问时会递增。
 * @property {string} [content] 视频介绍。
 * @property {number} [type] 类型：0 文创，1 宣传视频，2 手册，3 活动。
 * @property {number} [inx] 排序值。
 * @property {string} [startDate] 活动开始日期，格式为 yyyy-MM-dd。
 * @property {string} [endDate] 活动结束日期，格式为 yyyy-MM-dd。
 * @property {number} [status] 活动状态：0 未开始，1 进行中，2 已结束。
 */

/**
 * 历史人物对象（对应后端 HistoryHuman）。
 * @typedef {Object} HistoryHuman
 * @property {number|string} id 人物 ID。
 * @property {string} name 姓名。
 * @property {string} [date] 生辰信息。
 * @property {string} [photo] 照片 URL。
 * @property {string} [content] 人物简介。
 */

/**
 * 轮播图对象（对应后端 TravelSlideshow）。
 * @typedef {Object} Slideshow
 * @property {number|string} id 轮播图 ID。
 * @property {string} pictureUrl 图片 URL。
 * @property {number} status 状态：0 无效，1 正常。
 */

/**
 * 景点浏览埋点参数（对应后端 TravelScenicViews）。
 * @typedef {Object} ScenicViewPayload
 * @property {number|string} scenicId 景点 ID。
 * @property {number} [eventType] 事件类型：1 建筑浏览，2 建筑识别，3 VR 查看。
 * @property {string} [source] 来源标识：首页、搜索、地图、分享等。
 * @property {string} [sourceDetail] 来源补充说明。
 */

/**
 * 小程序访问埋点参数（对应后端 TravelViews）。
 * @typedef {Object} MiniViewPayload
 * @property {number} [eventType] 事件类型，默认为 1（首页访问）。
 * @property {string} [source] 来源标识：首页、搜索、分享等。
 * @property {string} [sourceDetail] 来源补充说明。
 * @property {string} [pageName] 当前页面，默认为小程序页面标识。
 */

/**
 * 拍照识别响应对象（对应后端 ScanthingVo）。
 * @typedef {Object} ScanthingResult
 * @property {number} resultCode 识别结果：1 准确识别出建筑物，2 未识别出建筑物。
 * @property {ScenicSpot} [travelScenicSpot] 准确识别出的建筑物。
 * @property {Array<ScenicSpot>} [recommendTravelScenicSpots] 未识别时推荐的建筑物列表。
 */

const baseUrl = env.baseUrl
const appId = env.appId
console.log(appId, 'appid')
const api = {
    // 暴露基础地址，方便特殊场景拼接
    /** 后端 API 根地址，来自当前环境配置。 */
    baseUrl: baseUrl,

    /** 当前小程序 AppID，用于拼接微信登录接口。 */
    appId: appId,

    // ===== 微信用户 =====
    // wxLogin 只负责把 wx.login 返回的一次性 code 交给后端；
    // token 的缓存和 Authorization 请求头由 app.js 统一处理。
    /**
     * 生成微信小程序登录 URL。
     * GET /wx/user/{appid}/login?code={code}
     *
     * wx.login 获取的一次性 code 交给后端换取业务 token；token 缓存和 Authorization 请求头由 app.js 统一处理。
     * @param {string} code wx.login 返回的一次性临时凭证。
     * @returns {string} 拼接后的登录接口 URL；响应体 data 通常包含 token、openid、sessionKey、firstLogin。
     */
    wxLogin: function (code) {
        return baseUrl + '/wx/user/' + appId + '/login?code=' + code
    },

    /**
     * 微信手机号绑定/解密地址。
     * POST /wx/user/{appid}/phone
     *
     * 请求数据需包含 sessionKey、encryptedData、iv；响应体 data 为 Boolean，表示手机号是否绑定成功。
     */
    wxPhone: baseUrl + '/wx/user/' + appId + '/phone',

    // ===== 用户 =====
    /**
     * 获取当前登录用户资料。
     * GET /system/user/profile
     *
     * 需要携带 Authorization；响应体 data 为用户对象，另含 roleGroup、postGroup 等信息。
     */
    userProfile: baseUrl + '/system/user/profile',

    // ===== 景点 =====
    /**
     * 获取景点详情。
     * GET /travel/scenicspot/{id}
     * @param {number|string} id 景点 ID。
     * @returns {string} 景点详情 URL；响应体 data 为 ScenicSpot 对象。
     */
    scenicspotDetail: function (id) {
        return baseUrl + '/travel/scenicspot/' + id
    },

    /**
     * 获取景点列表。
     * GET /travel/scenicspot/list
     *
     * 后端支持 subClassificationId、blockId、pageNum、pageSize 查询参数；该常量本身不附带参数。
     * 响应体为 PageResponse，rows 元素为 ScenicSpot。
     */
    scenicspotList: baseUrl + '/travel/scenicspot/list',

    /**
     * 生成分页景点列表 URL。
     * GET /travel/scenicspot/list?pageNum={num}&pageSize={size}
     * @param {number} num 页码，从 1 开始。
     * @param {number} size 每页条数。
     * @returns {string} 分页景点列表 URL；响应体 rows 为 ScenicSpot 数组，total 为总数。
     */
    scenicspotListPaged: function (num, size) {
        return baseUrl + '/travel/scenicspot/list?pageNum=' + num + '&pageSize=' + size
    },

    /**
     * 生成附近景点查询 URL。
     * GET /travel/near?longitude={longitude}&latitude={latitude}&pageNum={num}&pageSize={size}
     *
     * 后端以坐标为中心查询约 20 公里范围内的景点，响应 rows 按距离排序并包含 distance 字段。
     * @param {number|string} longitude 当前经度。
     * @param {number|string} latitude 当前纬度。
     * @param {number} num 页码，从 1 开始。
     * @param {number} size 每页条数。
     * @returns {string} 附近景点分页 URL；响应体为 PageResponse。
     */
    scenicNear: function (longitude, latitude, num, size) {
        return baseUrl + '/travel/near?longitude=' + longitude + '&latitude=' + latitude + '&pageNum=' + num + '&pageSize=' + size
    },

    /**
     * 生成景点关键字搜索 URL。
     * GET /travel/list?name={name}
     *
     * 后端会在景点名称和中文地址（remarks）中进行模糊匹配；响应体 data 为 ScenicSpot 数组。
     * @param {string} name 搜索关键字。
     * @returns {string} 景点搜索 URL。
     */
    scenicSearch: function (name) {
        return baseUrl + '/travel/list?name=' + name
    },

    /**
     * 生成按二级分类查询景点的 URL。
     * GET /classification/selectScenicByClassificatin?classficationId={typeId}&pageNum={num}&pageSize={size}
     *
     * 接口路径和参数名中的拼写错误为后端既有约定，请勿改成 classification。
     * @param {number|string} typeId 二级分类 ID。
     * @param {number} num 页码，从 1 开始。
     * @param {number} size 每页条数。
     * @returns {string} 分类景点分页 URL；响应体为 PageResponse。
     */
    scenicByClassification: function (typeId, num, size) {
        return baseUrl + '/classification/selectScenicByClassificatin?classficationId=' + typeId + '&pageNum=' + num + '&pageSize=' + size
    },

    /**
     * 获取二级分类列表。
     * GET /travel/backstage/selectTravelSubClassification
     *
     * 响应体 data 为分类数组，元素通常包含 id、name、status、moduleId、orderBy。
     */
    subClassification: baseUrl + '/travel/backstage/selectTravelSubClassification',

    /**
     * 生成模块封面图查询 URL。
     * GET /travel/backstage/getCoverPicture/{type}
     * @param {number} type 封面类型：0 拍照识别封面，1 建筑可阅读封面。
     * @returns {string} 封面查询 URL；响应体 data 为图片 URL。
     */
    coverPicture: function (type) {
        return baseUrl + '/travel/backstage/getCoverPicture/' + type
    },

    // ===== 活动 =====
    /**
     * 获取景点活动列表。
     * GET /travel/getActivityList
     *
     * 该接口返回"活动"栏目下的 TravelModuleDetail 分页数据，响应体为 PageResponse；不要与 activList 混用。
     */
    activityList: baseUrl + '/travel/getActivityList',

    /**
     * 获取 Banner 活动列表。
     * GET /activ/list
     *
     * 该接口返回 BookActivity 数组，数据位于响应体 data 字段，当前后端不分页；不要与 activityList 混用。
     */
    activList: baseUrl + '/activ/list',

    /**
     * Banner 活动列表别名（兼容已有页面引用 api.bannerList）。
     * GET /activ/list
     */
    bannerList: baseUrl + '/activ/list',

    // ===== 视频 =====
    /**
     * 获取视频列表。
     * GET /travelVideo/list
     *
     * 响应体为 PageResponse，rows 元素为 TravelVideo；后端支持 pageNum、pageSize、type 等查询字段。
     */
    videoList: baseUrl + '/travelVideo/list',

    /**
     * 生成视频详情 URL。
     * GET /travelVideo/detail?id={id}
     * @param {number|string} id 视频 ID。
     * @returns {string} 视频详情 URL；响应体 data 为 TravelVideo，访问详情会使 count 增加 1。
     */
    videoDetail: function (id) {
        return baseUrl + '/travelVideo/detail?id=' + id
    },

    // ===== 人物 =====
    /**
     * 生成历史人物查询 URL。
     * GET /travel/human/list?id={id}
     * @param {number|string} id 人物 ID。
     * @returns {string} 人物列表 URL；响应体为 PageResponse，匹配记录位于 rows。
     */
    humanList: function (id) {
        return baseUrl + '/travel/human/list?id=' + id
    },

    // ===== 轮播 =====
    /**
     * 随机获取一张启用中的首页轮播图。
     * GET /travel/slideshow/random
     *
     * 响应体 data 为 Slideshow 对象；后端只从 status=1 的记录中随机选择。
     */
    slideshow: baseUrl + '/travel/slideshow/random',

    // ===== 浏览量 =====
    /**
     * 记录一次小程序访问。
     * POST /views/insertViews
     *
     * 请求体可使用 MiniViewPayload；后端自动补充用户、时间，并返回写入影响行数。
     */
    insertViews: baseUrl + '/views/insertViews',

    /**
     * 生成景点浏览埋点 URL。
     * POST /views/insertScenicViews?scenicId={id}
     *
     * 后端自动记录当前用户和时间，eventType 默认是 1（建筑浏览）。
     * @param {number|string} id 景点 ID。
     * @returns {string} 景点浏览埋点 URL；响应体 data 为写入影响行数。
     */
    insertScenicViews: function (id) {
        return baseUrl + '/views/insertScenicViews?scenicId=' + id
    },

    /**
     * 生成 VR 查看埋点 URL。
     * POST /views/insertVrViews?scenicId={id}
     *
     * 该接口固定记录 eventType=3（VR 查看）。
     * @param {number|string} id 关联景点 ID。
     * @returns {string} VR 浏览埋点 URL；响应体 data 为写入影响行数。
     */
    insertVrViews: function (id) {
        return baseUrl + '/views/insertVrViews?scenicId=' + id
    },

    // ===== 拍照识别 =====
    /**
     * 拍照识别接口地址。
     * POST /travel/scanthing
     *
     * 使用 app.wxUpload 调用，文件字段名必须为 file；可选表单字段包括 tag（1 景点、2 文创）、long、lat、source、sourceDetail。
     * 响应体 data 为 ScanthingResult。
     */
    scanThing: baseUrl + '/travel/scanthing',
    scanThingBase64: baseUrl + '/travel/scanthingBase64',

    // ===== 管理端：Banner（活动）增删改，对应后端 BookActiv，需登录态 =====
    /** 新增 Banner：POST /activ/add（background/name/type/url） */
    bannerAdd: baseUrl + '/activ/add',
    /** 修改 Banner：POST /activ/update（需带 id） */
    bannerUpdate: baseUrl + '/activ/update',
    /**
     * 删除 Banner。
     * DELETE /activ/delete?id={id}
     * @param {number|string} id Banner ID。
     * @returns {string} 删除接口 URL。
     */
    bannerDelete: function (id) {
        return baseUrl + '/activ/delete?id=' + encodeURIComponent(id)
    },

    // ===== 管理端：识别库管理系统，对应后端 TravelRecognitionLibrary，需登录态 =====
    /** 查询识别库图片列表：GET /travel/backend/recognitionLibrary/list */
    recognitionList: baseUrl + '/travel/backend/recognitionLibrary/list',
    /**
     * 将图片加入官方识别库。
     * GET /travel/backend/recognitionLibrary/storage/{tag}
     * @param {number} tag 识别库类型：1 景点，2 文创。
     * @returns {string} 入库接口 URL。
     */
    recognitionStorage: function (tag) {
        return baseUrl + '/travel/backend/recognitionLibrary/storage/' + tag
    },
    /** 批量删除识别库图片：POST /travel/backend/recognitionLibrary/delete（body 传 id 数组） */
    recognitionDelete: baseUrl + '/travel/backend/recognitionLibrary/delete',

    // ===== H5 页面 =====
    /**
     * 生成 H5 订单中心页面 URL。
     * GET /xhhy_ly/h5/orderCenter/?wxtoken={token}
     * @param {string} token 当前登录业务 token。
     * @returns {string} 带 wxtoken 查询参数的 H5 地址，供 H5 页面跳转使用。
     */
    h5OrderCenter: function (token) {
        return baseUrl + '/xhhy_ly/h5/orderCenter/?wxtoken=' + token
    },

    /**
     * 生成 H5 预约页面 URL。
     * GET /xhhy_ly/h5/appointment/{id}?wxtoken={token}
     * @param {number|string} id 预约/景点记录 ID。
     * @param {string} token 当前登录业务 token。
     * @returns {string} 带 wxtoken 的 H5 预约地址。
     */
    h5Appointment: function (id, token) {
        return baseUrl + '/xhhy_ly/h5/appointment/' + id + '?wxtoken=' + token
    },

    // ===== 小程序数据统计接口（对应后端 WxDataController） =====
    /**
     * 获取小程序首页基础数据统计。
     * GET /wxdata/base
     * 返回：buildingCount(建筑总数), vrBuildingCount(VR建筑数), visitorCount(访问用户数),
     *       scenicViewCount(建筑浏览次数), recognitionCount(识别次数), vrViewCount(VR查看次数), likeCount(点赞总数)
     */
    baseData: baseUrl + '/wxdata/base',

    /**
     * 获取建筑识别次数排行。
     * GET /wxdata/recognition?limit={limit}
     * @param {number} [limit=10] 返回条数，默认10条。
     * @returns {string} 识别排行接口 URL。
     */
    recognitionRank: function (limit) {
        return baseUrl + '/wxdata/recognition?limit=' + (limit || 10)
    },

    /**
     * 获取建筑 VR 查看次数排行。
     * GET /wxdata/vrRank?limit={limit}
     * @param {number} [limit=10] 返回条数，默认10条。
     * @returns {string} VR排行接口 URL。
     */
    vrRank: function (limit) {
        return baseUrl + '/wxdata/vrRank?limit=' + (limit || 10)
    },

    /**
     * 获取建筑热度排行（按浏览次数）。
     * GET /wxdata/hot?limit={limit}
     * @param {number} [limit=10] 返回条数，默认10条。
     * @returns {string} 热门排行接口 URL。
     */
    hotRank: function (limit) {
        return baseUrl + '/wxdata/hot?limit=' + (limit || 10)
    }
}

module.exports = api
