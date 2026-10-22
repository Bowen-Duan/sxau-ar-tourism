import request from '@/utils/request'

// 查询公告列表
export function listAnnouncement(query) {
  return request({
    url: '/announcement/list',
    method: 'get',
    params: query
  })
}

// 查询公告详细
export function getAnnouncement(id) {
  return request({
    url: '/announcement/' + id,
    method: 'get'
  })
}

// 新增公告
export function addAnnouncement(data) {
  return request({
    url: '/announcement',
    method: 'post',
    data: data
  })
}

// 修改公告
export function updateAnnouncement(data) {
  return request({
    url: '/announcement',
    method: 'put',
    data: data
  })
}

// 删除公告
export function delAnnouncement(id) {
  return request({
    url: '/announcement/' + id,
    method: 'delete'
  })
}
