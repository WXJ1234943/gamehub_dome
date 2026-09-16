import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { getToken, getRefreshToken, setToken, isTokenExpired, clearToken, parseJwtPayload } from './auth'
import { aesEncrypt, aesDecrypt } from './crypto'
import type { ApiResponse } from '@/types'

const REQUEST_TIMEOUT = 15000
const RETRY_COUNT = 2

let isRefreshing = false
let pendingQueue: Array<(token: string) => void> = []

function createRequest(): AxiosInstance {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: REQUEST_TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
  })

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      if (config.data && config.headers['Content-Type'] === 'application/json') {
        const shouldEncrypt = (config as any).encrypt !== false
        if (shouldEncrypt && config.data) {
          config.headers['X-Api-Encrypt'] = '1'
          config.data = { data: aesEncrypt(JSON.stringify(config.data)) }
        }
      }
      const fingerprint = `${config.method}:${config.url}:${JSON.stringify(config.data || '')}`
      if (abortDuplicateRequest(fingerprint)) {
        return Promise.reject(new Error('Duplicate request aborted'))
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const config = response.config as any
      if (config.responseDecrypt && response.data?.data) {
        const decrypted = aesDecrypt(response.data.data)
        response.data.data = JSON.parse(decrypted)
      }
      if (response.data.code === 0) {
        return response.data.data
      }
      if (response.data.code === 401) {
        return handleTokenExpired(instance, config)
      }
      return Promise.reject(new Error(response.data.msg || 'Request failed'))
    },
    async (error) => {
      const config = error.config
      if (!config) return Promise.reject(error)
      config.__retryCount = config.__retryCount || 0
      const isNetworkError = !error.response && config.__retryCount < RETRY_COUNT
      const isServerError = error.response?.status >= 500 && config.__retryCount < RETRY_COUNT
      if (isNetworkError || isServerError) {
        config.__retryCount++
        await new Promise(r => setTimeout(r, 1000 * config.__retryCount))
        return instance(config)
      }
      if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('网络连接失败，请检查网络后重试'))
      }
      return Promise.reject(error)
    }
  )

  return instance
}

function handleTokenExpired(instance: AxiosInstance, config: any): Promise<any> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      pendingQueue.push((token: string) => {
        config.headers.Authorization = `Bearer ${token}`
        resolve(instance(config))
      })
    })
  }
  isRefreshing = true
  return refreshToken(instance)
    .then((newToken: string) => {
      pendingQueue.forEach(cb => cb(newToken))
      pendingQueue = []
      config.headers.Authorization = `Bearer ${newToken}`
      return instance(config)
    })
    .catch(() => {
      pendingQueue = []
      clearToken()
      window.location.href = '/login'
      return Promise.reject(new Error('Token expired, please login again'))
    })
    .finally(() => { isRefreshing = false })
}

async function refreshToken(instance: AxiosInstance): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token')
  const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, { refreshToken })
  const { token, expiresIn } = res.data.data
  setToken(token, refreshToken, expiresIn)
  return token
}

const requestMap = new Map<string, AbortController>()

function abortDuplicateRequest(fingerprint: string): boolean {
  if (requestMap.has(fingerprint)) {
    return true
  }
  const controller = new AbortController()
  requestMap.set(fingerprint, controller)
  setTimeout(() => requestMap.delete(fingerprint), 5000)
  return false
}

const request = createRequest()

export function get<T = any>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<T> {
  return request.get(url, { params, ...config }) as unknown as Promise<T>
}

export function post<T = any>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig): Promise<T> {
  return request.post(url, data, config) as unknown as Promise<T>
}

export function put<T = any>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig): Promise<T> {
  return request.put(url, data, config) as unknown as Promise<T>
}

export function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.delete(url, config) as unknown as Promise<T>
}

export default request
