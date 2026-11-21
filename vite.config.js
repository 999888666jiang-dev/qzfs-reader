import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' 让产物使用相对路径，保证 GitHub Pages 项目子路径（/qzfs-reader/）下可用（R-16）。
// PWA（vite-plugin-pwa）留到 M5 接入，这里先不注册 Service Worker。
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
})
