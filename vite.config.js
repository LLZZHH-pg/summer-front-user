import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 5173, // 前端端口（保持不变）
    proxy: {
      // 配置代理规则：将/api开头的请求转发到后端
      '/api': {
        target: 'http://localhost:7395', // 后端实际地址（请替换为你的后端端口）
        changeOrigin: true, // 允许跨域
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
