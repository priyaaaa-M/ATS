import axios from 'axios'

const apiBaseUrl = import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Expires: '0',
  },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const requestUrl = String(err.config?.url || '')
    const isAuthBootstrapRequest =
      requestUrl.includes('/auth/me') || requestUrl.includes('/auth/logout')

    if (err.response?.status === 401 && !isAuthBootstrapRequest) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)
