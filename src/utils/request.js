import axios from 'axios'
import router from '@/router'

const instance = axios.create({
  baseURL: '/api',
  timeout: 8000
})

instance.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = 'Bearer ' + token
  return cfg
})

instance.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear()
      router.push('/login')
    }
    return Promise.reject(err)
  }
)

export default instance