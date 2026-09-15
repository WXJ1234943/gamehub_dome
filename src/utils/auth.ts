const TOKEN_KEY = 'gh_token'
const REFRESH_TOKEN_KEY = 'gh_refresh_token'
const TOKEN_EXPIRE_KEY = 'gh_token_expire'
const USER_KEY = 'gh_user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setToken(token: string, refreshToken: string, expiresIn: number): void {
  const expireTime = Date.now() + expiresIn * 1000
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.setItem(TOKEN_EXPIRE_KEY, String(expireTime))
}

export function getTokenExpire(): number {
  return Number(localStorage.getItem(TOKEN_EXPIRE_KEY) || '0')
}

export function isTokenExpired(): boolean {
  return Date.now() >= getTokenExpire() - 30 * 1000
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRE_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getUser<T>(): T | null {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function setUser(user: any): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function parseJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}
