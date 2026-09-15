<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function goOrders() {
  router.push('/orders')
}

function handleLogout() {
  authStore.logout()
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <span class="logo">🎮</span>
      <span class="title">GameHub</span>
    </div>
    <div class="header-right">
      <div class="coin-display">
        <span class="coin-icon">🪙</span>
        <span class="coin-count">{{ authStore.coinBalance }}</span>
      </div>
      <button class="icon-btn" @click="goOrders">📋</button>
      <button class="icon-btn" @click="handleLogout">🚪</button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  background: rgba(15,25,35,0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.logo { font-size: 20px; }
.title {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #818cf8 0%, #e94560 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.coin-display {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(255,184,0,0.1);
  border-radius: 20px;
}

.coin-icon { font-size: 12px; }
.coin-count {
  font-size: 13px;
  font-weight: 600;
  color: #ffb800;
}

.icon-btn {
  font-size: 16px;
  padding: 4px;
  background: none;
  border-radius: 8px;
}
.icon-btn:active { background: rgba(255,255,255,0.1); }
</style>
