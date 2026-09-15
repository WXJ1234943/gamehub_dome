<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'
import VirtualList from '@/components/common/VirtualList.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import type { GameItem } from '@/types'

const router = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()

const keyword = ref('')
const activeCategory = ref('all')
const bannerIndex = ref(0)
const bannerTimer = ref<ReturnType<typeof setInterval> | null>(null)
const bannersLoading = ref(true)
const gamesLoading = ref(true)

const categories = [
  { key: 'all', label: '全部' },
  { key: 'rpg', label: '角色' },
  { key: 'casual', label: '休闲' },
  { key: 'card', label: '卡牌' },
  { key: 'strategy', label: '策略' },
  { key: 'action', label: '动作' },
]

const bannerList = computed(() => gameStore.bannerList)
const gameList = computed(() => gameStore.gameList)

onMounted(async () => {
  await Promise.all([
    gameStore.fetchBanners().finally(() => bannersLoading.value = false),
    gameStore.fetchGames().finally(() => gamesLoading.value = false),
    gameStore.fetchHotGames(),
  ])
  startBannerTimer()
})

function startBannerTimer() {
  if (bannerList.value.length <= 1) return
  bannerTimer.value = setInterval(() => {
    bannerIndex.value = (bannerIndex.value + 1) % bannerList.value.length
  }, 3500)
}

function handleSearch() {
  gamesLoading.value = true
  gameStore.fetchGames(keyword.value, activeCategory.value === 'all' ? undefined : activeCategory.value, true)
    .finally(() => gamesLoading.value = false)
}

function handleCategoryChange(key: string) {
  activeCategory.value = key
  handleSearch()
}

function handleGameClick(game: GameItem) {
  router.push(`/play/${game.id}`)
}

function handlePay(game: GameItem) {
  router.push(`/pay/${game.id}`)
}

function handleLoadMore() {
  if (!gameStore.loading && gameStore.hasMore) {
    gameStore.fetchGames(keyword.value, activeCategory.value === 'all' ? undefined : activeCategory.value)
  }
}

function handleBannerClick(link: string) {
  if (link) window.open(link, '_blank')
}

import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (bannerTimer.value) clearInterval(bannerTimer.value)
})
</script>

<template>
  <div class="lobby-page">
    <AppHeader />

    <div v-if="bannersLoading" class="section-padding">
      <SkeletonLoader type="banner" />
    </div>
    <div v-else class="banner-wrapper" @touchmove.prevent>
      <div
        v-for="(banner, i) in bannerList"
        :key="banner.id"
        class="banner-slide"
        :class="{ active: i === bannerIndex }"
        @click="handleBannerClick(banner.link)"
      >
        <img :src="banner.image" :alt="banner.title" class="banner-img" loading="lazy" />
      </div>
      <div class="banner-dots">
        <span
          v-for="(_, i) in bannerList"
          :key="i"
          class="banner-dot"
          :class="{ active: i === bannerIndex }"
        ></span>
      </div>
    </div>

    <div class="search-bar">
      <input
        v-model="keyword"
        class="search-input"
        placeholder="搜索游戏"
        @keyup.enter="handleSearch"
      />
      <button class="search-btn" @click="handleSearch">🔍</button>
    </div>

    <div class="category-bar">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="category-btn"
        :class="{ active: activeCategory === cat.key }"
        @click="handleCategoryChange(cat.key)"
      >
        {{ cat.label }}
      </button>
    </div>

    <div class="game-list-section">
      <div v-if="gameStore.hotGames.length" class="hot-section">
        <div class="section-title">
          <span class="section-icon">🔥</span>
          热门游戏
        </div>
        <div class="hot-scroll">
          <div
            v-for="game in gameStore.hotGames.slice(0, 6)"
            :key="game.id"
            class="hot-card"
            @click="handleGameClick(game)"
          >
            <div class="hot-card-img" :style="{ background: `linear(135deg, #${game.id}3355, #${game.id}1133)` }">
              {{ game.icon }}
            </div>
            <div class="hot-card-name">{{ game.name }}</div>
          </div>
        </div>
      </div>

      <div class="section-title">
        <span class="section-icon">🎮</span>
        全部游戏
      </div>

      <div v-if="gamesLoading" class="section-padding">
        <SkeletonLoader type="card" :count="6" />
      </div>
      <div v-else class="game-list-container">
        <VirtualList
          :items="gameList"
          :item-height="120"
          :gap="12"
          @load-more="handleLoadMore"
          @click="handleGameClick"
        >
          <template #default="{ item }">
            <div class="game-card" @click="handleGameClick(item)">
              <div class="game-card-icon">{{ item.icon }}</div>
              <div class="game-card-info">
                <div class="game-card-header">
                  <span class="game-card-name">{{ item.name }}</span>
                  <span v-if="item.hot" class="game-card-hot-badge">HOT</span>
                </div>
                <div class="game-card-tags">
                  <span class="game-card-tag">{{ item.category }}</span>
                  <span class="game-card-rating">⭐ {{ item.rating }}</span>
                  <span class="game-card-players">{{ item.players }}</span>
                </div>
                <div class="game-card-desc">{{ item.description }}</div>
              </div>
              <div class="game-card-actions">
                <button class="play-btn" @click.stop="handleGameClick(item)">开始</button>
                <button class="pay-btn" @click.stop="handlePay(item)">充值</button>
              </div>
            </div>
          </template>
        </VirtualList>
        <div v-if="!gameStore.hasMore && gameList.length > 0" class="list-end">
          已经到底了
        </div>
      </div>
    </div>

    <nav class="bottom-nav">
      <div class="nav-item active">
        <span class="nav-icon">🏠</span>
        <span class="nav-label">大厅</span>
      </div>
      <div class="nav-item" @click="router.push('/orders')">
        <span class="nav-icon">📋</span>
        <span class="nav-label">订单</span>
      </div>
      <div class="nav-item" @click="authStore.logout()">
        <span class="nav-icon">👤</span>
        <span class="nav-label">我的</span>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.lobby-page {
  min-height: 100vh;
  padding-bottom: 56px;
}

.section-padding { padding: 12px 16px; }

.banner-wrapper {
  position: relative;
  height: 160px;
  margin: 12px 16px;
  border-radius: 12px;
  overflow: hidden;
}

.banner-slide {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.banner-slide.active { opacity: 1; }

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-dots {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
}

.banner-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
  transition: all 0.3s;
}

.banner-dot.active {
  width: 16px;
  border-radius: 3px;
  background: #fff;
}

.search-bar {
  display: flex;
  gap: 8px;
  padding: 0 16px 12px;
}

.search-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border-radius: 18px;
  background: rgba(255,255,255,0.06);
  color: #fff;
  font-size: 14px;
}

.search-input::placeholder { color: #6b7280; }

.search-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(99,102,241,0.2);
  font-size: 14px;
}

.category-bar {
  display: flex;
  gap: 8px;
  padding: 0 16px 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.category-bar::-webkit-scrollbar { display: none; }

.category-btn {
  white-space: nowrap;
  padding: 4px 14px;
  border-radius: 16px;
  background: rgba(255,255,255,0.06);
  font-size: 13px;
  color: #9ca3af;
  transition: all 0.25s;
}

.category-btn.active {
  background: #6366f1;
  color: #fff;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  padding: 0 16px 12px;
}

.section-icon { font-size: 18px; }

.hot-section { margin-bottom: 16px; }

.hot-scroll {
  display: flex;
  gap: 12px;
  padding: 0 16px 16px;
  overflow-x: auto;
}

.hot-scroll::-webkit-scrollbar { display: none; }

.hot-card {
  flex-shrink: 0;
  width: 72px;
  text-align: center;
}

.hot-card-img {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  background: linear-gradient(135deg, #1a2332, #2a3650);
  margin-bottom: 4px;
}

.hot-card-name {
  font-size: 12px;
  color: #d1d5db;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-list-container {
  height: calc(100vh - 400px);
  min-height: 300px;
  padding: 0 16px;
}

.game-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #1a2332;
  border-radius: 12px;
  margin-bottom: 12px;
  width: 100%;
  box-sizing: border-box;
}

.game-card:active { background: #243040; }

.game-card-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  background: linear-gradient(135deg, #2a3650, #1a2332);
  flex-shrink: 0;
}

.game-card-info { flex: 1; min-width: 0; }

.game-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.game-card-name {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-card-hot-badge {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  background: #e94560;
  color: #fff;
  font-weight: 600;
}

.game-card-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.game-card-tag {
  font-size: 11px;
  color: #818cf8;
  background: rgba(99,102,241,0.1);
  padding: 1px 6px;
  border-radius: 4px;
}

.game-card-rating, .game-card-players {
  font-size: 11px;
  color: #6b7280;
}

.game-card-desc {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-card-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.play-btn, .pay-btn {
  width: 52px;
  height: 28px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.play-btn { background: #6366f1; }
.pay-btn { background: rgba(255,184,0,0.2); color: #ffb800; }

.list-end {
  text-align: center;
  font-size: 12px;
  color: #4b5563;
  padding: 16px 0;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: 56px;
  display: flex;
  background: rgba(15,25,35,0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255,255,255,0.06);
  z-index: 100;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.nav-icon { font-size: 18px; }
.nav-label { font-size: 10px; color: #6b7280; }
.nav-item.active .nav-icon { color: #6366f1; }
.nav-item.active .nav-label { color: #6366f1; }
</style>
