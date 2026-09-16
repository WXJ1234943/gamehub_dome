import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = (env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/api$/, '')

  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [vue(), UnoCSS()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiBase,
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'es2015',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'utils-vendor': ['axios', 'crypto-js', 'jsencrypt'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  }
})
