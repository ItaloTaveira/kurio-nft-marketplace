import axios from 'axios'
import { getSessionToken, setSessionToken } from './session-token'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 8000,
  headers: { Accept: 'application/json' },
})

// A credencial é capturada ao enviar, inclusive em mutations em andamento.
http.interceptors.request.use(config => {
  const token = getSessionToken()
  if (token && !config.headers.has('Authorization')) config.headers.Authorization = `Bearer ${token}`
  return config
})
http.interceptors.response.use(response => response, error => {
  const token = getSessionToken()
  if (error.response?.status === 401 && token && error.config?.headers?.Authorization === `Bearer ${token}`) setSessionToken('', true)
  return Promise.reject(error)
})
