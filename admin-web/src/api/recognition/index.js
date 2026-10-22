import request from '@/utils/request'
import { getToken } from '@/utils/auth'

// 获取识别库列表
export function getRecognitionList(query) {
  return request({
    url: '/travel/backend/recognitionLibrary/list',
    method: 'get',
    params: query
  })
}

// 新增识别库图片 (tag: 栏目标签，1=景点，2=文创)
// 注意：后端Controller缺少@RequestBody注解，必须用query参数提交，不能用JSON请求体
export function addRecognition(tag, data) {
  return request({
    url: '/travel/backend/recognitionLibrary/storage/' + tag,
    method: 'post',
    params: data
  })
}

// 删除识别库图片 (ids: Long数组)
// 注意：后端缺少@RequestBody，用query参数提交数组
export function deleteRecognition(ids) {
  return request({
    url: '/travel/backend/recognitionLibrary/delete',
    method: 'post',
    params: { ids: ids }
  })
}

// 上传地址
export const uploadFileApi = process.env.VUE_APP_BASE_API + '/travel/oss/upload'

export const uploadFileHeaders = {
  Authorization: 'Bearer ' + getToken()
}
