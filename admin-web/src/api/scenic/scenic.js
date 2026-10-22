import request from '@/utils/request'

// 查询景点管理列表
export function listScenic(query) {
  return request({
    url: '/scenic/list',
    method: 'get',
    params: query
  })
}

// 查询景点管理详细
export function getScenic(scenicId) {
  return request({
    url: '/scenic/' + scenicId,
    method: 'get'
  })
}

// 新增景点管理
export function addScenic(data) {
  return request({
    url: '/scenic',
    method: 'post',
    data: data
  })
}

// 修改景点管理
export function updateScenic(data) {
  return request({
    url: '/scenic',
    method: 'put',
    data: data
  })
}

// 删除景点管理
export function delScenic(scenicId) {
  return request({
    url: '/scenic/' + scenicId,
    method: 'delete'
  })
}

// 导出景点管理
export function exportScenic(query) {
  return request({
    url: '/scenic/export',
    method: 'get',
    params: query
  })
}
