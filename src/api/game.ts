import { get } from '@/utils/request'
import type { GameItem, BannerItem, PayPackage } from '@/types'

export function getBannerList() {
  return get<BannerItem[]>('/game/banners')
}

export function getGameList(params?: { page: number; pageSize: number; category?: string; keyword?: string }) {
  return get<{ list: GameItem[]; total: number }>('/game/list', params)
}

export function getGameDetail(id: string) {
  return get<GameItem>(`/game/${id}`)
}

export function getHotGames() {
  return get<GameItem[]>('/game/hot')
}

export function getPayPackages(gameId: string) {
  console.log("gameId", gameId)
  return get<PayPackage[]>(`/game/packages/${gameId}`)
}
