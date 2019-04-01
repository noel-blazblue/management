import axios from 'axios'
import {MessageBox, Message} from 'element-ui'

/* 为每个请求设置默认baseURL，并添加token */
axios.defaults.baseURL = ''
axios.interceptors.request.use(function (config) {
  config.headers.Authorization = localStorage.getItem('user-token')
  return config
})

/* 普通请求 */
export const request = (url, params, config = {}, auto_error_res = true, auto_error_data = true) => {
  const args = Object.assign({
    'method': 'post',
    'url': url,
    'data': params
  }, config)
  return axios(args).then((res) => {
    /* 后台返回指定错误 */
    if (!res.data.success) {
      res.data.error = res.data.error || {}
      console.error(res.data.error)
      /* token失效 */
      if (res.data.error.code === 100000) {
        Message({
          message: '登录失效，请重新登录',
          type: 'error'
        })
        window.location.href = '/#/login'
        return Promise.reject(res.data.error)
      }
      /* 其他错误 */
      if (auto_error_data) {
        const err_msg = res.data.error.message || '未知的服务器错误，请联系管理员！'
        const err_cod = res.data.error.code || -1
        MessageBox.alert(err_msg, '请求失败：' + err_cod, {confirmButtonText: '确定'})
      }
      return Promise.reject(res.data.error)
    }
    return res.data.result
  }, (error) => {
    /* 网络请求异常 */
    console.error(error)
    if (auto_error_res) {
      const err_status = error.response.status || -100
      MessageBox.alert('网络请求异常，请联系管理员！', '请求异常：' + err_status, {confirmButtonText: '确定'})
    }
    return Promise.reject(error)
  })
}

/* 使用sessionStorage缓存的请求 */
export const sessionRequest = (url, params, out_time = -1, config = {}, auto_error_res = true, auto_error_data = true) => {
  const item_key = url + '#' + JSON.stringify(params)
  let item_val = sessionStorage.getItem(item_key)
  const now_time = new Date().getTime()
  if (item_val) {
    item_val = JSON.parse(item_val)
    const over_time = now_time - item_val.last_time
    if (out_time < 0 || over_time < out_time * 1000) {
      return Promise.resolve(item_val.data)
    }
  }
  return request(url, params, config, auto_error_res, auto_error_data).then(data => {
    sessionStorage.setItem(item_key, JSON.stringify({
      'last_time': now_time,
      'data': data
    }))
    return data
  })
}

/* 使用localStorage缓存的请求 */
export const localRequest = (url, params, out_time = 604800, config = {}, auto_error_res = true, auto_error_data = true) => {
  const item_key = url + '#' + JSON.stringify(params)
  let item_val = localStorage.getItem(item_key)
  const now_time = new Date().getTime()
  if (item_val) {
    item_val = JSON.parse(item_val)
    const over_time = now_time - item_val.last_time
    if (out_time < 0 || over_time < out_time * 1000) {
      return Promise.resolve(item_val.data)
    }
  }
  return request(url, params, config, auto_error_res, auto_error_data).then(data => {
    localStorage.setItem(item_key, JSON.stringify({
      'last_time': now_time,
      'data': data
    }))
    return data
  })
}
