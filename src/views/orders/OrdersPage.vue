<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderList, cancelOrder } from '@/api/order'
import type { OrderItem, OrderStatus } from '@/types'
import AppHeader from '@/components/common/AppHeader.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'

const router = useRouter()

const orders = ref<OrderItem[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const activeTab = ref<OrderStatus | 'all'>('all')

const tabs = [
  { key: 'all' as const, label: '全部' },
  { key: 'pending' as const, label: '待支付' },
  { key: 'paid' as const, label: '已支付' },
  { key: 'completed' as const, label: '已完成' },
  { key: 'failed' as const, label: '已失败' },
]

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待支付', color: '#f59e0b' },
  paying: { label: '支付中', color: '#3b82f6' },
  paid: { label: '已支付', color: '#22c55e' },
  shipped: { label: '已发货', color: '#8b5cf6' },
  completed: { label: '已完成', color: '#22c55e' },
  failed: { label: '已失败', color: '#ef4444' },
  refunded: { label: '已退款', color: '#6b7280' },
}

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return orders.value
  return orders.value.filter(o => o.status === activeTab.value)
})

onMounted(() => {
  fetchOrders(true)
})

async function fetchOrders(reset = false) {
  if (reset) {
    page.value = 1
    orders.value = []
  }
  if (loading.value) return
  loading.value = true
  try {
    const res = await getOrderList({ page: page.value, pageSize: 20, status: activeTab.value === 'all' ? undefined : activeTab.value })
    if (reset) {
      orders.value = res.list
    } else {
      orders.value.push(...res.list)
    }
    total.value = res.total
    page.value++
  } finally {
    loading.value = false
  }
}

function handleTabChange(key: OrderStatus | 'all') {
  activeTab.value = key
  fetchOrders(true)
}

function getStatusInfo(status: string) {
  return statusMap[status] || { label: '未知', color: '#6b7280' }
}

function handleCancel(order: OrderItem) {
  if (!confirm(`确定取消订单 ${order.orderId} 吗？`)) return
  cancelOrder(order.orderId).then(() => {
    order.status = 'failed'
  })
}

function handleRepay(order: OrderItem) {
  router.push(`/pay/${order.gameId}`)
}

function formatTime(time: string) {
  if (!time) return '-'
  const d = new Date(time)
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function onScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 100 && !loading.value && orders.value.length < total.value) {
    fetchOrders()
  }
}
</script>

<template>
  <div class="orders-page">
    <AppHeader />

    <div class="tabs-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="handleTabChange(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="orders-scroll" @scroll.passive="onScroll">
      <div v-if="loading && orders.length === 0" class="padding">
        <SkeletonLoader type="list" :count="4" />
      </div>
      <div v-else-if="filteredOrders.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">暂无订单</div>
        <button class="empty-btn" @click="router.push('/lobby')">去逛逛</button>
      </div>
      <div v-else class="orders-list">
        <div
          v-for="order in filteredOrders"
          :key="order.orderId"
          class="order-card"
        >
          <div class="order-header">
            <span class="order-id">订单号：{{ order.orderId }}</span>
            <span class="order-status" :style="{ color: getStatusInfo(order.status).color }">
              {{ getStatusInfo(order.status).label }}
            </span>
          </div>
          <div class="order-body">
            <div class="order-game-icon">{{ order.gameName.charAt(0) }}</div>
            <div class="order-info">
              <div class="order-game-name">{{ order.gameName }}</div>
              <div class="order-coins">🪙 {{ order.coins }} 游戏币</div>
              <div class="order-time">{{ formatTime(order.createdAt) }}</div>
            </div>
            <div class="order-amount">
              <div class="amount-text">¥{{ order.amount }}</div>
              <div class="amount-label">支付金额</div>
            </div>
          </div>
          <div class="order-footer">
            <span class="order-channel">{{ order.channel === 'wechat' ? '微信支付' : order.channel === 'alipay' ? '支付宝' : 'Q币' }}</span>
            <div class="order-actions">
              <button
                v-if="order.status === 'pending' || order.status === 'paying'"
                class="order-btn ghost"
                @click="handleCancel(order)"
              >取消</button>
              <button
                v-if="order.status === 'pending' || order.status === 'failed'"
                class="order-btn primary"
                @click="handleRepay(order)"
              >重新支付</button>
            </div>
          </div>
        </div>
        <div v-if="loading" class="loading-more">
          <span class="loading-spinner"></span>
          加载中...
        </div>
        <div v-if="!loading && filteredOrders.length >= total" class="list-end">
          没有更多了
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.tabs-bar {
  display: flex;
  padding: 8px 16px;
  gap: 8px;
  overflow-x: auto;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.tabs-bar::-webkit-scrollbar { display: none; }

.tab-btn {
  white-space: nowrap;
  padding: 4px 14px;
  border-radius: 16px;
  font-size: 13px;
  color: #9ca3af;
  background: rgba(255,255,255,0.04);
  transition: all 0.2s;
}

.tab-btn.active {
  background: #6366f1;
  color: #fff;
}

.orders-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.padding { padding: 0; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 16px;
}

.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-text { color: #6b7280; margin-bottom: 16px; }

.empty-btn {
  padding: 8px 24px;
  border-radius: 20px;
  background: #6366f1;
  color: #fff;
  font-size: 14px;
}

.order-card {
  background: #1a2332;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  margin-bottom: 8px;
}

.order-id {
  font-size: 11px;
  color: #6b7280;
}

.order-status {
  font-size: 12px;
  font-weight: 600;
}

.order-body {
  display: flex;
  align-items: center;
  gap: 12px;
}

.order-game-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: rgba(99,102,241,0.15);
  flex-shrink: 0;
}

.order-info { flex: 1; min-width: 0; }

.order-game-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.order-coins {
  font-size: 12px;
  color: #ffb800;
  margin-bottom: 2px;
}

.order-time {
  font-size: 11px;
  color: #4b5563;
}

.order-amount { text-align: right; flex-shrink: 0; }

.amount-text {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

.amount-label {
  font-size: 10px;
  color: #6b7280;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.04);
}

.order-channel {
  font-size: 11px;
  color: #6b7280;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.order-btn {
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 12px;
}

.order-btn.ghost {
  background: rgba(255,255,255,0.06);
  color: #9ca3af;
}

.order-btn.primary {
  background: #6366f1;
  color: #fff;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  font-size: 13px;
  color: #6b7280;
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(99,102,241,0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.list-end {
  text-align: center;
  font-size: 12px;
  color: #4b5563;
  padding: 16px 0;
}
</style>
