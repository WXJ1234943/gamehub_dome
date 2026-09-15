import { get, post } from '@/utils/request'
import type { LoginParams, LoginResult, UserInfo } from '@/types'

export function login(params: LoginParams) {
  return post<LoginResult>('/auth/login', params as any)
}

export function refreshToken(refreshToken: string) {
  return post<{ token: string; expiresIn: number }>('/auth/refresh', { refreshToken } as any)
}

export function getUserInfo() {
  return get<UserInfo>('/user/info')
}

export function logout() {
  return post('/auth/logout')
}
