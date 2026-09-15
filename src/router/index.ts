import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginPage.vue'),
    meta: { title: '渠道登录', requireAuth: false },
  },
  {
    path: '/',
    redirect: '/lobby',
  },
  {
    path: '/lobby',
    name: 'Lobby',
    component: () => import('@/views/lobby/LobbyPage.vue'),
    meta: { title: '游戏大厅', requireAuth: true, keepAlive: true },
  },
  {
    path: '/pay/:gameId',
    name: 'Pay',
    component: () => import('@/views/pay/PayPage.vue'),
    meta: { title: '充值中心', requireAuth: true },
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/orders/OrdersPage.vue'),
    meta: { title: '我的订单', requireAuth: true, keepAlive: true },
  },
  {
    path: '/play/:gameId',
    name: 'Play',
    component: () => import('@/views/game/PlayPage.vue'),
    meta: { title: '游戏', requireAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/lobby',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

const DOMAIN_TITLE = 'GameHub'

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - ${DOMAIN_TITLE}` : DOMAIN_TITLE
  const authStore = useAuthStore()
  if (to.meta.requireAuth && !authStore.checkAuth()) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
