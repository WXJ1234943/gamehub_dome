<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const selectedChannel = ref<'wechat' | 'qq'>('wechat')
const agreed = ref(false)
const errorMsg = ref('')

const channels = [
  { type: 'wechat' as const, name: '微信登录', icon: '💬', color: '#07c160' },
  { type: 'qq' as const, name: 'QQ登录', icon: '🐧', color: '#12b7f5' },
]

async function handleLogin() {
  if (!agreed.value) {
    errorMsg.value = '请先同意用户协议'
    return
  }
  errorMsg.value = ''
  loading.value = true
  try {
    const mockCode = `mock_${selectedChannel.value}_${Date.now()}`
    await authStore.login(selectedChannel.value, mockCode)
    const redirect = (route.query.redirect as string) || '/lobby'
    router.replace(redirect)
  } catch (e: any) {
    errorMsg.value = e.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="login-bg-circle login-bg-circle-1"></div>
      <div class="login-bg-circle login-bg-circle-2"></div>
      <div class="login-bg-circle login-bg-circle-3"></div>
    </div>

    <div class="login-content">
      <div class="logo-section">
        <div class="logo-icon">🎮</div>
        <h1 class="logo-title">GameHub</h1>
        <p class="logo-subtitle">游戏H5联运中心</p>
      </div>

      <div class="channel-section">
        <div class="channel-grid">
          <button
            v-for="ch in channels"
            :key="ch.type"
            class="channel-btn"
            :class="{ active: selectedChannel === ch.type }"
            :style="{ '--ch-color': ch.color }"
            @click="selectedChannel = ch.type"
          >
            <span class="channel-icon">{{ ch.icon }}</span>
            <span class="channel-name">{{ ch.name }}</span>
          </button>
        </div>

        <div class="agreement">
          <input type="checkbox" id="agree" v-model="agreed" class="checkbox" />
          <label for="agree">
            我已阅读并同意
            <a class="link">《用户协议》</a>
            和
            <a class="link">《隐私政策》</a>
          </label>
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button class="login-btn" :disabled="loading" @click="handleLogin">
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? '登录中...' : '一键登录' }}
        </button>

        <div class="login-footer">
          <span class="security-hint">
            <span class="lock-icon">🔒</span>
            支持RSA加密 · JWT鉴权 · Token无感刷新
          </span>
        </div>
      </div>

      <div class="tech-badges">
        <span class="badge">Vue 3.5</span>
        <span class="badge">TypeScript</span>
        <span class="badge">Pinia</span>
        <span class="badge">Vite</span>
        <span class="badge">UnoCSS</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #0f1923 0%, #1a1a2e 100%);
  padding: 0 24px;
}

.login-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  overflow: hidden;
}

.login-bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
  filter: blur(60px);
}

.login-bg-circle-1 { width: 300px; height: 300px; background: #6366f1; top: -80px; right: -80px; }
.login-bg-circle-2 { width: 200px; height: 200px; background: #e94560; bottom: 100px; left: -60px; }
.login-bg-circle-3 { width: 150px; height: 150px; background: #07c160; top: 40%; right: 20%; }

.login-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-section {
  text-align: center;
  margin-bottom: 48px;
}

.logo-icon {
  font-size: 64px;
  margin-bottom: 12px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.logo-title {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #818cf8 0%, #e94560 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 4px;
}

.logo-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.channel-section {
  width: 100%;
  max-width: 320px;
}

.channel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.channel-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 0;
  border-radius: 12px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  transition: all 0.25s ease;
}

.channel-btn.active {
  background: rgba(var(--ch-color-rgb, 99,102,241), 0.15);
  border-color: var(--ch-color);
  box-shadow: 0 0 0 2px var(--ch-color);
}

.channel-icon { font-size: 28px; }
.channel-name { font-size: 13px; color: #d1d5db; }

.agreement {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 20px;
}

.checkbox {
  margin-top: 2px;
  accent-color: #6366f1;
}

.link { color: #818cf8; }

.error-msg {
  color: #e94560;
  font-size: 13px;
  margin-bottom: 12px;
  text-align: center;
}

.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #fff;
  transition: all 0.25s ease;
}

.login-btn:active { transform: scale(0.97); }
.login-btn:disabled { opacity: 0.6; }

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-footer {
  margin-top: 20px;
  text-align: center;
}

.security-hint {
  font-size: 11px;
  color: #4b5563;
}

.lock-icon { margin-right: 4px; }

.tech-badges {
  margin-top: 40px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255,255,255,0.06);
  color: #9ca3af;
}
</style>
