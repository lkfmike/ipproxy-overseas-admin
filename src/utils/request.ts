import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const service = axios.create({
  baseURL: '/api',
  timeout: 5000
})

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb)
}

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

const doRefreshToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return null
  try {
    const res = await axios.post('/api/auth/refresh', { refreshToken })
    if (res.data?.code === 200) {
      const data = res.data.data
      localStorage.setItem('token', data.token)
      localStorage.setItem('refreshToken', data.refreshToken)
      return data.token
    }
    return null
  } catch (e) {
    return null
  }
}

// Request interceptor
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
service.interceptors.response.use(
  (response) => {
    const res = response.data
    // Assuming backend returns standard ApiResponse structure
    // { code: 200, message: "success", data: ... }
    if (res.code !== 200) {
      ElMessage.error(res.message || 'Error')
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res
  },
  (error) => {
    const { response, config } = error || {}
    // Token expired or unauthorized
    if (response && response.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        ElMessage.error('登录状态已过期，请重新登录')
        router.push('/login')
        return Promise.reject(error)
      }

      if (!isRefreshing) {
        isRefreshing = true
        return doRefreshToken()
          .then((newToken) => {
            isRefreshing = false
            if (newToken) {
              onRefreshed(newToken)
              // Retry original request with new token
              config.headers['Authorization'] = `Bearer ${newToken}`
              return service.request(config)
            } else {
              ElMessage.error('刷新登录状态失败，请重新登录')
              localStorage.removeItem('token')
              localStorage.removeItem('refreshToken')
              router.push('/login')
              return Promise.reject(error)
            }
          })
          .catch(() => {
            isRefreshing = false
            ElMessage.error('刷新登录状态失败，请重新登录')
            localStorage.removeItem('token')
            localStorage.removeItem('refreshToken')
            router.push('/login')
            return Promise.reject(error)
          })
      }

      // If refreshing, queue the request
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken: string) => {
          config.headers['Authorization'] = `Bearer ${newToken}`
          resolve(service.request(config))
        })
      })
    }

    console.log('err' + error)
    ElMessage.error(error.message || 'Request Error')
    return Promise.reject(error)
  }
)

export default service
