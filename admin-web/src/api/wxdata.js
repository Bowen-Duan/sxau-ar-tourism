import request from '@/utils/request'

/**
 * 小程序首页基础统计数据（对应 TravelStatisticsBaseVo）。
 * @typedef {Object} WxBaseData
 * @property {number} buildingCount 建筑总数。
 * @property {number} vrBuildingCount 已关联 VR 的建筑总数。
 * @property {number} visitorCount 访问用户数。
 * @property {number} scenicViewCount 建筑浏览次数。
 * @property {number} recognitionCount 建筑识别次数。
 * @property {number} vrViewCount VR 查看次数。
 * @property {number} likeCount 点赞总数。
 */

/**
 * 建筑排行查询参数。
 * @typedef {Object} WxRankQueryParams
 * @property {number} [limit=10] 返回条数，默认返回 10 条。
 */

/**
 * 建筑排行数据项（对应 WxData）。
 * @typedef {Object} WxRankItem
 * @property {string} name 建筑名称。
 * @property {number} value 统计值；具体含义由排行接口决定。
 */

/**
 * 获取小程序首页基础数据统计。
 * GET /wxdata/base
 * @returns {Promise} response.data 为 {@link WxBaseData}，包含建筑、访问、识别、VR 和点赞统计值。
 */
export function getBaseData() {
  return request({
    url: '/wxdata/base',
    method: 'get'
  })
}

/**
 * 获取建筑识别次数排行。
 * GET /wxdata/recognition
 * @param {WxRankQueryParams} [params] 查询参数。
 * @returns {Promise} response.data 为 {@link WxRankItem} 数组，按建筑识别次数排行。
 */
export function getRecognitionRank(params) {
  return request({
    url: '/wxdata/recognition',
    method: 'get',
    params
  })
}

/**
 * 获取建筑 VR 查看次数排行。
 * GET /wxdata/vrRank
 * @param {WxRankQueryParams} [params] 查询参数。
 * @returns {Promise} response.data 为 {@link WxRankItem} 数组，按 VR 查看次数排行。
 */
export function getVrRank(params) {
  return request({
    url: '/wxdata/vrRank',
    method: 'get',
    params
  })
}

/**
 * 获取建筑热度排行（按浏览次数）。
 * GET /wxdata/hot
 * @param {WxRankQueryParams} [params] 查询参数。
 * @returns {Promise} response.data 为 {@link WxRankItem} 数组，按建筑浏览次数排行。
 */
export function getHotRank(params) {
  return request({
    url: '/wxdata/hot',
    method: 'get',
    params
  })
}
