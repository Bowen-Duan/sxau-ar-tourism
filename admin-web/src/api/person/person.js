import request from '@/utils/request'

/**
 * 查询历史人物列表
 * @param {Object} queryParams 分页参数 {pageNum, pageSize, name}
 * @returns {Promise} response.rows 为人物数组（id、name、date、photo、content），response.total 为总条数
 */
export function getPersonList(queryParams) {
  return request({
    url: "/travel/human/list",
    method: "get",
    params: queryParams
  })
}

/**
 * 新增历史人物
 * @param {Object} data 人物表单数据 {name, date, photo, content}
 */
export function savePerson(data) {
  return request({
    url: "/travel/human/save",
    method: "post",
    data: data
  })
}

/**
 * 修改历史人物
 * @param {Object} data 人物表单数据，必须包含 id
 */
export function updatePerson(data) {
  return request({
    url: "/travel/human/update",
    method: "post",
    data: data
  })
}

/**
 * 批量删除历史人物
 * @param {Array} data 人物 ID 数组，请求体直接传数组
 */
export function deletePerson(data) {
  return request({
    url: "/travel/human/delete",
    method: "delete",
    data: data
  })
}
