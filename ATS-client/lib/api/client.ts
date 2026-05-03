'use client'

import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      if (!window.location.pathname.startsWith('/login')) {
        if (window.top && window.top !== window) {
          window.top.location.assign('/login')
        } else {
          window.location.assign('/login')
        }
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
