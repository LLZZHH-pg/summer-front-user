import { createRouter, createWebHistory } from 'vue-router'
const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('@/components/Login.vue') },
  { path: '/register', component: () => import('@/components/Register.vue') },
  { path: '/personal', component: () => import('@/components/Personal.vue') ,meta: { requiresAuth: true }}
]
const router = createRouter({ 
  history: createWebHistory(), 
  routes 
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 判断路由是否需要登录权限
  if (to.meta.requiresAuth) {
    // 检查本地存储中是否有 token
    const token = localStorage.getItem('token')
    if (token) {
      next() // 已登录，继续访问
    } else {
      next('/login') // 未登录，跳转到登录页
    }
  } else {
    next() // 不需要登录的路由直接放行
  }
})

export default router