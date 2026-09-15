import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GameItem, BannerItem } from '@/types'
import { getGameList, getBannerList, getHotGames } from '@/api/game'

export const useGameStore = defineStore('game', () => {
  const gameList = ref<GameItem[]>([])
  const bannerList = ref<BannerItem[]>([])
  const hotGames = ref<GameItem[]>([])
  const total = ref(0)
  const loading = ref(false)
  const page = ref(1)
  const hasMore = ref(true)

  async function fetchBanners() {
    const res = await getBannerList()
    bannerList.value = res
  }

  async function fetchGames(keyword?: string, category?: string, reset = false) {
    if (reset) {
      page.value = 1
      gameList.value = []
      hasMore.value = true
    }
    if (!hasMore.value || loading.value) return
    loading.value = true
    try {
      const res = await getGameList({ page: page.value, pageSize: 20, keyword, category })
      gameList.value.push(...res.list)
      total.value = res.total
      hasMore.value = gameList.value.length < res.total
      page.value++
    } finally {
      loading.value = false
    }
  }

  async function fetchHotGames() {
    const res = await getHotGames()
    hotGames.value = res
  }

  return {
    gameList, bannerList, hotGames, total, loading, page, hasMore,
    fetchBanners, fetchGames, fetchHotGames,
  }
})
