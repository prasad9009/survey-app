import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  /** Where Vite forwards `/api/*` in dev. Must match a running Express API (see `npm run server`). */
  const fileEnv = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = fileEnv.VITE_API_PROXY_TARGET || 'http://localhost:4000'
  const buildVersion =
    fileEnv.VITE_APP_VERSION ||
    `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}`
  const pwaCacheId = `surveyos-splash-v3-${buildVersion}`

  return {
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
      },
      injectRegister: 'auto',
      cleanupOutdatedCaches: true,
      includeAssets: [
        'favicon.png',
        'splash/logo-bg2.png',
        'splash/iphone-se-640x1136.png',
        'splash/iphone8-750x1334.png',
        'splash/iphone8plus-1242x2208.png',
        'splash/iphonex-1125x2436.png',
        'splash/iphone12-1170x2532.png',
        'splash/iphone12max-1284x2778.png',
        'splash/iphone14pro-1179x2556.png',
        'splash/iphone14promax-1290x2796.png',
      ],
      manifest: {
        id: '/',
        name: 'Samarth SurveyOS',
        short_name: 'SurveyOS',
        description: 'Land Survey Management System — Samarth SurveyOS',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#000000',
        background_color: '#000000',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cacheId: pwaCacheId,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,json,woff2,webmanifest}',
          'splash/**/*.png',
          'icons/**/*.png',
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache-v3-splash',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: ({ request }) =>
              ['style', 'script', 'worker'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache-v3-splash',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache-v3-splash',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
        },
      },
    },
  },
  define: {
    __APP_BUILD_VERSION__: JSON.stringify(buildVersion),
  },
  server: {
    ...(fileEnv.VITE_DEV_ALLOWED_HOSTS
      ? { allowedHosts: fileEnv.VITE_DEV_ALLOWED_HOSTS.split(',').map((h) => h.trim()).filter(Boolean) }
      : {}),
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      '/health': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  }
})
