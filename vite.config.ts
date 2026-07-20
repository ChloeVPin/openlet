import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      includeAssets: ['icon.svg', 'logo.svg', 'og-image.jpg'],
      manifest: {
        name: 'Openlet - Free study tools',
        short_name: 'Openlet',
        description:
          'Free flashcards with spaced repetition, practice tests, and study modes. No paywall.',
        theme_color: '#4255ff',
        background_color: '#f6f7fb',
        display: 'standalone',
        display_override: ['window-controls-overlay'],
        orientation: 'any',
        categories: ['education', 'productivity'],
        start_url: '/',
        icons: [
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/apple-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
      },
    }),
  ],
})
