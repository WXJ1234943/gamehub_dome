import { get, post } from '@/utils/request'
import type { CreateOrderParams, PayResult, OrderItem, OrderStatus } from '@/types'

export function createOrder(params: CreateOrderParams) {
  console.log("params",params);
  
  return post<{ orderId: string }>('/order/create', params as any,{encrypt:false} as any)
 }

export function payOrder(orderId: string, channel: string) {
  return post<PayResult>(`/order/${orderId}/pay`, { channel } as any)
}

export function getOrderStatus(orderId: string) {
  return get<{ status: OrderStatus; paidAt?: string }>(`/order/${orderId}/status`)
}

export function getOrderList(params: { page: number; pageSize: number; status?: OrderStatus }) {
  return get<{ list: OrderItem[]; total: number }>('/order/list', params)
}

export function cancelOrder(orderId: string) {
  return post(`/order/${orderId}/cancel`)
}
