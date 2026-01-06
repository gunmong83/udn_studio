import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "vuetify/styles" as *;',
      },
    },
  },
  server: {
    port: 8080
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
