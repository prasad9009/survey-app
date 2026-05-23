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
  const pwaCacheId = `surveyos-offline-v4-${buildVersion}`

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
        'branding/logo-bg2.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-512-maskable.png',
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
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        globPatterns: [
          '**/*.{js,css,html,ico,svg,json,woff2,webmanifest}',
          'icons/**/*.png',
          'branding/logo-bg2.png',
          'favicon.png',
        ],
        globIgnores: [
          '**/splash/**',
          '**/*.pdf',
          '**/signatures/**',
          '**/login-bg.*',
          '**/survey-bg.*',
          '**/samarth-logo.png',
          '**/survey-machine-logo.png',
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /\.pdf$/i, /\/reports?\//i],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache-v4-offline',
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: ({ request }) =>
              ['style', 'script', 'worker'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-cache-v4-offline',
              expiration: {
                maxEntries: 48,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ url }) =>
              /\/(icons\/|branding\/logo-bg2\.png|favicon\.png)/i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'icons-cache-v4-offline',
              expiration: {
                maxEntries: 12,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    target: 'es2020',
    reportCompressedSize: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('jspdf')) return 'pdf'
          if (id.includes('@tanstack')) return 'query'
          if (id.includes('lucide-react')) return 'ui'
          if (id.includes('axios')) return 'http'
          if (id.includes('react-dom') || id.includes('react-router') || /\/react\//.test(id)) {
            return 'vendor'
          }
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
