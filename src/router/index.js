import { createRouter, createWebHistory } from 'vue-router'
const routes = [
  { path: '/', redirect: '/personal' },
  { path: '/login', component: () => import('@/components/Login.vue') },
  { path: '/register', component: () => import('@/components/Register.vue') },
  { path: '/personal', component: () => import('@/components/Personal.vue') }
]
export default createRouter({ history: createWebHistory(), routes })