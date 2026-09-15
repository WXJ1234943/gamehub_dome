<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getGameDetail } from '@/api/game'
import { getPayPackages } from '@/api/game'
import { createOrder, payOrder, getOrderStatus } from '@/api/order'
import { useAuthStore } from '@/stores/auth'
import type { GameItem, PayPackage, OrderStatus } from '@/types'
import { rsaEncrypt } from '@/utils/crypto'
import { log } from 'node:console'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const gameId = route.params.gameId as string
const game = ref<GameItem | null>(null)
const packages = ref<PayPackage[]>([])
const selectedPkg = ref<string>('')
const loading = ref(true)
const paying = ref(false)
const payStep = ref<'select' | 'paying' | 'success' | 'failed'>('select')
const orderId = ref('')
const errorMsg = ref('')
const pollTimer = ref<ReturnType<typeof setInterval> | null>(null)

const selectedPackage = computed(() => packages.value.find(p => p.id === selectedPkg.value))

onMounted(async () => {
  try {
    const [g, pkgs] = await Promise.all([
      getGameDetail(gameId),
      getPayPackages(gameId),
    ])
    game.value = g
    packages.value = pkgs
    if (pkgs.length) selectedPkg.value = pkgs[0].id
  } finally {
    loading.value = false
  }
})

async function handlePay() {
  if (!selectedPkg.value) return
  paying.value = true
  errorMsg.value = ''
  try {
    console.log("zhifu");
    
    const res = await createOrder({ gameId, packageId: selectedPkg.value, channel: 'wechat' })
    orderId.value = res.orderId
    payStep.value = 'paying'
    await simulatePayment(res.orderId)
  } catch (e: any) {
    errorMsg.value = e.message
    payStep.value = 'failed'
  } finally {
    paying.value = false
  }
}

async function simulatePayment(orderId: string) {
  try {
    await payOrder(orderId, 'wechat')
    startPolling(orderId)
  } catch (e: any) {
    payStep.value = 'failed'
    errorMsg.value = e.message || '支付请求失败'
  }
}

function startPolling(id: string) {
  let attempts = 0
  pollTimer.value = setInterval(async () => {
    attempts++
    if (attempts > 30) {
      stopPolling()
      payStep.value = 'failed'
      errorMsg.value = '支付超时'
      return
    }
    try {
      const res = await getOrderStatus(id)
      if (res.status === 'paid' || res.status === 'completed' || res.status === 'shipped') {
        stopPolling()
        payStep.value = 'success'
        authStore.fetchUserInfo()
      } else if (res.status === 'failed') {
        stopPolling()
        payStep.value = 'failed'
        errorMsg.value = '支付失败'
      }
    } catch {}
  }, 2000)
}

function stopPolling() {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
}

function handleBack() {
  if (payStep.value === 'paying') {
    stopPolling()
  }
  router.back()
}

function handleViewOrders() {
  router.replace('/orders')
}

function handleContinuePay() {
  payStep.value = 'select'
}

onUnmounted(() => stopPolling())

const payChannels = [
  { type: 'wechat', name: '微信支付', icon: '💬', color: '#07c160' },
  { type: 'alipay', name: '支付宝', icon: '💰', color: '#1677ff' },
  { type: 'qq', name: 'Q币支付', icon: '🐧', color: '#12b7f5' },
]
</script>

<template>
  <div class="pay-page">
    <header class="pay-header">
      <button class="back-btn" @click="handleBack">←</button>
      <span class="header-title">充值中心</span>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="skeleton" style="width: 80px; height: 80px; border-radius: 16px; margin: 0 auto 12px"></div>
      <div class="skeleton" style="width: 120px; height: 16px; margin: 0 auto 8px"></div>
      <div class="skeleton" style="width: 80px; height: 14px; margin: 0 auto"></div>
    </div>

    <div v-else-if="game" class="pay-content">
      <div class="game-info-card">
        <div class="game-info-icon">{{ game.icon }}</div>
        <div class="game-info-text">
          <div class="game-info-name">{{ game.name }}</div>
          <div class="game-info-meta">
            <span>当前余额</span>
            <span class="coin-count">🪙 {{ authStore.coinBalance }}</span>
          </div>
        </div>
      </div>

      <template v-if="payStep === 'select'">
        <div class="section-label">选择充值套餐</div>
        <div class="package-grid">
          <div
            v-for="pkg in packages"
            :key="pkg.id"
            class="package-card"
            :class="{ selected: selectedPkg === pkg.id, popular: pkg.popular }"
            @click="selectedPkg = pkg.id"
          >
            <span v-if="pkg.popular" class="popular-badge">热门</span>
            <div class="package-coins">
              <span class="coin-emoji">🪙</span>
              <span class="coin-num">{{ pkg.coins }}</span>
            </div>
            <div v-if="pkg.bonus" class="package-bonus">+{{ pkg.bonus }}赠</div>
            <div class="package-price">¥{{ pkg.price }}</div>
            <div v-if="pkg.originalPrice" class="package-original">¥{{ pkg.originalPrice }}</div>
            <div v-if="pkg.label" class="package-label">{{ pkg.label }}</div>
          </div>
        </div>

        <div class="section-label">选择支付方式</div>
        <div class="pay-channels">
          <label
            v-for="ch in payChannels"
            :key="ch.type"
            class="pay-channel-item"
            :class="{ selected: ch.type === 'wechat' }"
          >
            <input type="radio" name="payChannel" :value="ch.type" checked class="radio-input" />
            <span class="channel-emoji" :style="{ color: ch.color }">{{ ch.icon }}</span>
            <span class="channel-name">{{ ch.name }}</span>
            <span class="radio-dot"></span>
          </label>
        </div>

        <div v-if="selectedPackage" class="pay-summary">
          <div class="summary-row">
            <span>充值金额</span>
            <span class="summary-value">¥{{ selectedPackage.price }}</span>
          </div>
          <div class="summary-row">
            <span>获得游戏币</span>
            <span class="summary-value">🪙 {{ selectedPackage.coins + (selectedPackage.bonus || 0) }}</span>
          </div>
          <div class="summary-row total">
            <span>实付</span>
            <span class="summary-value highlight">¥{{ selectedPackage.price }}</span>
          </div>
        </div>

        <div class="pay-security">
          <span class="lock">🔒</span>
          支付信息经RSA加密传输 · 订单状态实时轮询
        </div>

        <button class="pay-btn" :disabled="paying" @click="handlePay">
          <span v-if="paying" class="loading-spinner"></span>
          {{ paying ? '处理中...' : `立即充值 ¥${selectedPackage?.price || 0}` }}
        </button>
      </template>

      <template v-else-if="payStep === 'paying'">
        <div class="paying-state">
          <div class="paying-spinner"></div>
          <div class="paying-title">支付中...</div>
          <div class="paying-desc">正在为您处理支付，请稍候</div>
          <div class="paying-order">订单号：{{ orderId }}</div>
        </div>
      </template>

      <template v-else-if="payStep === 'success'">
        <div class="result-state">
          <div class="result-icon success">✅</div>
          <div class="result-title">支付成功</div>
          <div class="result-desc">游戏币已到账，快去游戏里使用吧！</div>
          <div class="result-actions">
            <button class="action-btn primary" @click="router.replace('/lobby')">返回大厅</button>
            <button class="action-btn ghost" @click="handleViewOrders">查看订单</button>
          </div>
        </div>
      </template>

      <template v-else-if="payStep === 'failed'">
        <div class="result-state">
          <div class="result-icon fail">❌</div>
          <div class="result-title">支付失败</div>
          <div class="result-desc">{{ errorMsg || '支付过程中出现问题' }}</div>
          <div class="result-actions">
            <button class="action-btn primary" @click="handleContinuePay">重新支付</button>
            <button class="action-btn ghost" @click="handleBack">返回</button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pay-page {
  min-height: 100vh;
}

.pay-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 48px;
  background: rgba(15,25,35,0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.back-btn {
  font-size: 20px;
  background: none;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.loading-state {
  padding: 48px 16px;
  text-align: center;
}

.pay-content {
  padding: 16px;
}

.game-info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #1a2332, #243040);
  border-radius: 16px;
  margin-bottom: 24px;
}

.game-info-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  background: rgba(99,102,241,0.15);
}

.game-info-text {
  flex: 1;
}

.game-info-name {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.game-info-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}

.coin-count {
  color: #ffb800;
  font-weight: 600;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #d1d5db;
}

.package-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}

.package-card {
  position: relative;
  padding: 16px 8px;
  background: #1a2332;
  border: 2px solid transparent;
  border-radius: 12px;
  text-align: center;
  transition: all 0.25s;
}

.package-card.selected {
  border-color: #6366f1;
  background: rgba(99,102,241,0.1);
}

.package-card.popular {
  border-color: #e94560;
}

.popular-badge {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 8px;
  background: #e94560;
  white-space: nowrap;
}

.package-coins {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  margin-bottom: 4px;
}

.coin-emoji { font-size: 12px; }
.coin-num {
  font-size: 20px;
  font-weight: 700;
  color: #ffb800;
}

.package-bonus {
  font-size: 11px;
  color: #e94560;
  margin-bottom: 4px;
}

.package-price {
  font-size: 15px;
  font-weight: 600;
}

.package-original {
  font-size: 11px;
  color: #4b5563;
  text-decoration: line-through;
}

.package-label {
  font-size: 10px;
  color: #818cf8;
  margin-top: 4px;
}

.pay-channels {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.pay-channel-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #1a2332;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.pay-channel-item.selected {
  border-color: #6366f1;
  background: rgba(99,102,241,0.08);
}

.radio-input { display: none; }

.channel-emoji { font-size: 20px; }
.channel-name { flex: 1; font-size: 15px; }

.radio-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #4b5563;
  position: relative;
}

.pay-channel-item.selected .radio-dot {
  border-color: #6366f1;
}

.pay-channel-item.selected .radio-dot::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6366f1;
}

.pay-summary {
  padding: 16px;
  background: #1a2332;
  border-radius: 12px;
  margin-bottom: 16px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 14px;
  color: #9ca3af;
}

.summary-row.total {
  border-top: 1px solid rgba(255,255,255,0.06);
  margin-top: 6px;
  padding-top: 12px;
  font-size: 16px;
  color: #fff;
  font-weight: 600;
}

.summary-value.highlight {
  color: #e94560;
  font-size: 18px;
}

.pay-security {
  text-align: center;
  font-size: 11px;
  color: #4b5563;
  margin-bottom: 16px;
}

.pay-btn {
  width: 100%;
  height: 50px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #fff;
  transition: all 0.25s;
}

.pay-btn:active { transform: scale(0.97); }
.pay-btn:disabled { opacity: 0.6; }

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

@keyframes spin { to { transform: rotate(360deg); } }

.paying-state, .result-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 16px;
  text-align: center;
}

.paying-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(99,102,241,0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 20px;
}

.paying-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.paying-desc {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
}

.paying-order {
  font-size: 12px;
  color: #4b5563;
}

.result-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.result-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
}

.result-desc {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 32px;
}

.result-actions {
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 280px;
}

.action-btn {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
}

.action-btn.primary {
  background: #6366f1;
  color: #fff;
}

.action-btn.ghost {
  background: rgba(255,255,255,0.06);
  color: #d1d5db;
}
</style>
