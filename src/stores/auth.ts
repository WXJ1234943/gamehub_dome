import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types'
import { getToken, setToken, clearToken, setUser, getUser, isTokenExpired } from '@/utils/auth'
import { login as loginApi, getUserInfo, logout as logoutApi } from '@/api/auth'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getToken())
  const user = ref<UserInfo | null>(getUser<UserInfo>())
  const loading = ref(false)

  const isLogin = computed(() => !!token.value && !isTokenExpired())
  const username = computed(() => user.value?.username || '游客')
  const coinBalance = computed(() => user.value?.coinBalance || 0)

  async function login(channel: 'wechat' | 'qq', code: string) {
    console.log("channel", channel)
    console.log("code", code)
    loading.value = true
    try {
      const res = await loginApi({ channel, code })
      token.value = res.token
      user.value = res.user
      setToken(res.token, res.refreshToken, res.expiresIn)
      setUser(res.user)
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchUserInfo() {
    const res = await getUserInfo()
    user.value = res
    setUser(res)
    return res
  }

  function checkAuth(): boolean {
    if (!token.value || isTokenExpired()) {
      clearToken()
      token.value = null
      user.value = null
      return false
    }
    return true
  }

  async function logout() {
    try { await logoutApi() } catch {}
    clearToken()
    token.value = null
    user.value = null
    router.replace('/login')
  }

  return {
    token, user, loading, isLogin, username, coinBalance,
    login, fetchUserInfo, checkAuth, logout,
  }
})
