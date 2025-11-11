import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import api from '../api/axios'

/**
 * Analytics Store
 *
 * Manages analytics data including:
 * - Dashboard statistics
 * - Upload trends
 * - Form performance metrics
 * - Storage usage
 *
 * @example
 * const { stats, fetchAnalytics } = useAnalytics()
 */
const useAnalyticsStore = create(
  devtools(
    (set, get) => ({
      // State
      stats: {
        totalRequests: 0,
        totalUploads: 0,
        storageUsed: 0,
        activeRequests: 0,
        uploadsByDay: [],
        topRequests: [],
        fileTypeBreakdown: [],
        recentActivity: []
      },
      isLoading: false,
      error: null,
      lastFetched: null,

      // Actions

      /**
       * Fetch analytics data
       * @param {boolean} force - Force refresh even if cached
       * @returns {Promise<object>} Analytics data
       */
      fetchAnalytics: async (force = false) => {
        const state = get()

        // Cache for 5 minutes
        if (!force && state.lastFetched) {
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
          if (state.lastFetched > fiveMinutesAgo) {
            return state.stats
          }
        }

        set({ isLoading: true, error: null })
        try {
          const token = localStorage.getItem('token')
          const { data } = await api.get('/api/analytics', {
            headers: { Authorization: `Bearer ${token}` }
          })

          set({
            stats: {
              totalRequests: data.totalRequests || 0,
              totalUploads: data.totalUploads || 0,
              storageUsed: (data.totalStorageGB || 0) * 1024, // Convert to MB
              activeRequests: data.activeRequests || 0,
              uploadsByDay: data.uploadsByDay || [],
              topRequests: data.advanced?.topRequests || [],
              fileTypeBreakdown: data.advanced?.fileTypeBreakdown || [],
              recentActivity: []
            },
            isLoading: false,
            lastFetched: Date.now()
          })

          return data
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Failed to fetch analytics'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      /**
       * Track form view
       * @param {string} shortCode - Form short code
       */
      trackFormView: (shortCode) => {
        const viewKey = `form_viewed_${shortCode}`
        const hasViewedThisSession = sessionStorage.getItem(viewKey)

        if (!hasViewedThisSession) {
          const storageKey = `form_views_${shortCode}`
          const currentViews = parseInt(localStorage.getItem(storageKey) || '0', 10)
          localStorage.setItem(storageKey, (currentViews + 1).toString())
          sessionStorage.setItem(viewKey, 'true')
        }
      },

      /**
       * Get form views
       * @param {string} shortCode - Form short code
       * @returns {number} View count
       */
      getFormViews: (shortCode) => {
        const storageKey = `form_views_${shortCode}`
        return parseInt(localStorage.getItem(storageKey) || '0', 10)
      },

      /**
       * Get conversion rate
       * @param {number} views - Number of views
       * @param {number} uploads - Number of uploads
       * @returns {string} Conversion rate percentage
       */
      getConversionRate: (views, uploads) => {
        if (views === 0) return '—'
        return ((uploads / views) * 100).toFixed(1) + '%'
      },

      /**
       * Calculate storage usage
       * @param {object[]} files - Array of files
       * @returns {object} Storage stats
       */
      calculateStorageUsage: (files) => {
        const totalBytes = files.reduce((sum, file) => sum + (file.fileSize || 0), 0)
        const totalGB = totalBytes / (1024 * 1024 * 1024)

        return {
          bytes: totalBytes,
          mb: totalBytes / (1024 * 1024),
          gb: totalGB,
          formatted: get().formatStorage(totalGB)
        }
      },

      /**
       * Format storage for display
       * @param {number} gb - Storage in GB
       * @returns {string} Formatted storage
       */
      formatStorage: (gb) => {
        if (gb < 0.001) return '0 MB'
        if (gb < 1) return `${(gb * 1024).toFixed(2)} MB`
        return `${gb.toFixed(2)} GB`
      },

      /**
       * Get upload trend
       * @param {object[]} uploadsByDay - Uploads by day data
       * @returns {string} Trend indicator (up, down, stable)
       */
      getUploadTrend: (uploadsByDay) => {
        if (!uploadsByDay || uploadsByDay.length < 2) return 'stable'

        const recent = uploadsByDay.slice(-7) // Last 7 days
        const older = uploadsByDay.slice(-14, -7) // Previous 7 days

        const recentAvg = recent.reduce((sum, day) => sum + day.count, 0) / recent.length
        const olderAvg = older.reduce((sum, day) => sum + day.count, 0) / (older.length || 1)

        if (recentAvg > olderAvg * 1.1) return 'up'
        if (recentAvg < olderAvg * 0.9) return 'down'
        return 'stable'
      },

      /**
       * Get time to first upload
       * @param {string} createdAt - Form creation date
       * @param {object[]} uploads - Form uploads
       * @returns {string} Time to first upload
       */
      getTimeToFirstUpload: (createdAt, uploads) => {
        if (uploads.length === 0) return '—'

        const created = new Date(createdAt)
        const firstUpload = uploads.reduce((earliest, upload) => {
          return new Date(upload.uploadedAt) < new Date(earliest.uploadedAt)
            ? upload
            : earliest
        }, uploads[0])

        const diffMs = new Date(firstUpload.uploadedAt) - created
        return get().formatDuration(diffMs)
      },

      /**
       * Format duration
       * @param {number} ms - Duration in milliseconds
       * @returns {string} Formatted duration
       */
      formatDuration: (ms) => {
        const minutes = Math.floor(ms / (1000 * 60))
        const hours = Math.floor(ms / (1000 * 60 * 60))
        const days = Math.floor(ms / (1000 * 60 * 60 * 24))

        if (minutes < 1) return 'Less than 1 min'
        if (minutes < 60) return `${minutes} min`
        if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`
        return `${days} day${days === 1 ? '' : 's'}`
      },

      /**
       * Get average upload interval
       * @param {object[]} uploads - Form uploads
       * @returns {string} Average interval
       */
      getAverageUploadInterval: (uploads) => {
        if (uploads.length <= 1) return '—'

        const sorted = [...uploads].sort((a, b) =>
          new Date(a.uploadedAt) - new Date(b.uploadedAt)
        )

        const firstTime = new Date(sorted[0].uploadedAt)
        const lastTime = new Date(sorted[sorted.length - 1].uploadedAt)
        const totalMs = lastTime - firstTime
        const avgMs = totalMs / (uploads.length - 1)

        return get().formatDuration(avgMs)
      },

      /**
       * Get files per day rate
       * @param {string} createdAt - Form creation date
       * @param {object[]} uploads - Form uploads
       * @returns {string} Files per day
       */
      getFilesPerDay: (createdAt, uploads) => {
        if (uploads.length === 0) return '—'

        const now = new Date()
        const created = new Date(createdAt)
        const diffDays = Math.max(1, Math.floor((now - created) / (1000 * 60 * 60 * 24)))
        const rate = uploads.length / diffDays

        if (rate < 0.1) {
          const perWeek = (rate * 7).toFixed(1)
          return `${perWeek}/week`
        }

        return rate.toFixed(1) + '/day'
      },

      /**
       * Get time since creation
       * @param {string} createdAt - Creation date
       * @returns {string} Time since creation
       */
      getTimeSinceCreated: (createdAt) => {
        const now = new Date()
        const created = new Date(createdAt)
        const diffMs = now - created
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'Today'
        if (diffDays === 1) return '1 day'
        if (diffDays < 30) return `${diffDays} days`

        const diffMonths = Math.floor(diffDays / 30)
        if (diffMonths === 1) return '1 month'
        if (diffMonths < 12) return `${diffMonths} months`

        const diffYears = Math.floor(diffDays / 365)
        if (diffYears === 1) return '1 year'
        return `${diffYears} years`
      },

      /**
       * Format time ago
       * @param {string} date - Date string
       * @returns {string} Time ago string
       */
      getTimeAgo: (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000)
        if (seconds < 60) return 'Just now'

        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return `${minutes}m ago`

        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h ago`

        const days = Math.floor(hours / 24)
        if (days < 7) return `${days}d ago`

        return new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      },

      /**
       * Clear error state
       */
      clearError: () => {
        set({ error: null })
      },

      /**
       * Reset analytics store
       */
      reset: () => {
        set({
          stats: {
            totalRequests: 0,
            totalUploads: 0,
            storageUsed: 0,
            activeRequests: 0,
            uploadsByDay: [],
            topRequests: [],
            fileTypeBreakdown: [],
            recentActivity: []
          },
          lastFetched: null,
          error: null
        })
      }
    }),
    { name: 'AnalyticsStore' }
  )
)

// Export hook
export const useAnalytics = useAnalyticsStore

export default useAnalyticsStore
