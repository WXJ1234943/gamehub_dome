export interface UserInfo {
  userId: string
  username: string
  avatar: string
  channel: 'wechat' | 'qq'
  coinBalance: number
}

export interface GameItem {
  id: string
  name: string
  icon: string
  category: string
  tags: string[]
  rating: number
  players: string
  description: string
  hot: boolean
}

export interface BannerItem {
  id: string
  image: string
  link: string
  title: string
}

export interface PayPackage {
  id: string
  coins: number
  bonus: number
  price: number
  originalPrice?: number
  label?: string
  popular?: boolean
}

export interface OrderItem {
  orderId: string
  gameId: string
  gameName: string
  packageId: string
  coins: number
  amount: number
  status: OrderStatus
  createdAt: string
  paidAt?: string
  channel: string
}

export type OrderStatus = 'pending' | 'paying' | 'paid' | 'shipped' | 'completed' | 'failed' | 'refunded'

export interface LoginParams {
  channel: 'wechat' | 'qq'
  code: string
}

export interface LoginResult {
  token: string
  refreshToken: string
  expiresIn: number
  user: UserInfo
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export interface CreateOrderParams {
  gameId: string
  packageId: string
  channel: 'wechat' | 'qq' | 'alipay'
}

export interface PayResult {
  orderId: string
  payUrl: string
  prepayId: string
}
