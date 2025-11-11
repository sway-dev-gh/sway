import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  },
  build: {
    // Target modern browsers for better tree-shaking
    target: 'es2020',

    // Enable minification with esbuild (faster than terser)
    minify: 'esbuild',

    // Esbuild options
    esbuild: {
      drop: ['console', 'debugger'], // Remove console.logs in production
      legalComments: 'none'
    },

    // Chunk splitting strategy
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal caching
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React core - critical, loaded first
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }

            // Firebase - large library, separate chunk
            if (id.includes('firebase')) {
              return 'vendor-firebase'
            }

            // Framer Motion - animation library, lazy load
            if (id.includes('framer-motion')) {
              return 'vendor-animation'
            }

            // React Query - data fetching
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query'
            }

            // Other vendor code
            return 'vendor-other'
          }

          // Component chunks - group by feature
          if (id.includes('/src/pages/')) {
            // Auth pages together
            if (id.includes('Login') || id.includes('Signup')) {
              return 'pages-auth'
            }

            // Request management pages
            if (id.includes('Requests') || id.includes('RequestView') || id.includes('Responses')) {
              return 'pages-requests'
            }

            // File management
            if (id.includes('Uploads') || id.includes('Upload')) {
              return 'pages-files'
            }

            // Settings and support
            if (id.includes('Settings') || id.includes('Plan') || id.includes('FAQ') || id.includes('Support')) {
              return 'pages-settings'
            }

            // Dashboard gets its own chunk (critical)
            if (id.includes('Dashboard')) {
              return 'pages-dashboard'
            }

            // Other pages
            return 'pages-other'
          }

          // Shared components in a single chunk
          if (id.includes('/src/components/')) {
            return 'components'
          }
        },

        // Naming convention for chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },

    // Optimize chunk size warnings
    chunkSizeWarningLimit: 500,

    // Enable source maps for production debugging (optional)
    sourcemap: false,

    // CSS code splitting
    cssCodeSplit: true
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom'
    ],
    exclude: [
      'firebase' // Firebase is large, let it be lazy loaded
    ]
  }
})
