import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import api from '../api/axios'

/**
 * Request Store
 *
 * Manages file collection requests (forms) including:
 * - Creating, updating, and deleting requests
 * - Fetching request data and analytics
 * - Managing request settings and branding
 *
 * @example
 * const { requests, createRequest, fetchRequests } = useRequest()
 */
const useRequestStore = create(
  devtools(
    (set, get) => ({
      // State
      requests: [],
      currentRequest: null,
      isLoading: false,
      error: null,

      // Filters and sorting
      searchQuery: '',
      filterStatus: 'all',
      sortBy: 'newest',

      // Actions

      /**
       * Fetch all requests for current user
       * @returns {Promise<object[]>} List of requests
       */
      fetchRequests: async () => {
        set({ isLoading: true, error: null })
        try {
          const token = localStorage.getItem('token')
          const { data } = await api.get('/api/requests', {
            headers: { Authorization: `Bearer ${token}` }
          })

          set({
            requests: data.requests || [],
            isLoading: false
          })

          return data.requests || []
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Failed to fetch requests'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      /**
       * Fetch single request by ID or short code
       * @param {string} identifier - Request ID or short code
       * @returns {Promise<object>} Request data
       */
      fetchRequest: async (identifier) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.get(`/api/r/${identifier}`)
          set({
            currentRequest: data.request,
            isLoading: false
          })
          return data
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Failed to fetch request'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      /**
       * Create new request
       * @param {object} requestData - Request data
       * @returns {Promise<object>} Created request
       */
      createRequest: async (requestData) => {
        set({ isLoading: true, error: null })
        try {
          const token = localStorage.getItem('token')
          const { data } = await api.post('/api/requests', requestData, {
            headers: { Authorization: `Bearer ${token}` }
          })

          set(state => ({
            requests: [...state.requests, data],
            isLoading: false
          }))

          return data
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to create request'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      /**
       * Update existing request
       * @param {string} requestId - Request ID
       * @param {object} updates - Updates to apply
       * @returns {Promise<object>} Updated request
       */
      updateRequest: async (requestId, updates) => {
        set({ isLoading: true, error: null })
        try {
          const token = localStorage.getItem('token')
          const { data } = await api.put(`/api/requests/${requestId}`, updates, {
            headers: { Authorization: `Bearer ${token}` }
          })

          set(state => ({
            requests: state.requests.map(req =>
              req.id === requestId ? { ...req, ...data } : req
            ),
            isLoading: false
          }))

          return data
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Failed to update request'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      /**
       * Delete request
       * @param {string} requestId - Request ID
       */
      deleteRequest: async (requestId) => {
        set({ isLoading: true, error: null })
        try {
          const token = localStorage.getItem('token')
          await api.delete(`/api/requests/${requestId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })

          set(state => ({
            requests: state.requests.filter(req => req.id !== requestId),
            isLoading: false
          }))
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Failed to delete request'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      /**
       * Delete multiple requests
       * @param {string[]} requestIds - Array of request IDs
       */
      deleteRequests: async (requestIds) => {
        set({ isLoading: true, error: null })
        try {
          const token = localStorage.getItem('token')
          await Promise.all(
            requestIds.map(id =>
              api.delete(`/api/requests/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              })
            )
          )

          set(state => ({
            requests: state.requests.filter(req => !requestIds.includes(req.id)),
            isLoading: false
          }))
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Failed to delete requests'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      /**
       * Set search query
       * @param {string} query - Search query
       */
      setSearchQuery: (query) => {
        set({ searchQuery: query })
      },

      /**
       * Set filter status
       * @param {string} status - Filter status (all, live, draft, paused, expired)
       */
      setFilterStatus: (status) => {
        set({ filterStatus: status })
      },

      /**
       * Set sort by
       * @param {string} sortBy - Sort option (newest, oldest, most-uploads, name-az)
       */
      setSortBy: (sortBy) => {
        set({ sortBy })
      },

      /**
       * Get filtered and sorted requests
       * @returns {object[]} Filtered requests
       */
      getFilteredRequests: () => {
        const state = get()
        let filtered = [...state.requests]

        // Apply search filter
        if (state.searchQuery) {
          filtered = filtered.filter(req =>
            req.title.toLowerCase().includes(state.searchQuery.toLowerCase())
          )
        }

        // Apply status filter
        if (state.filterStatus !== 'all') {
          filtered = filtered.filter(req => {
            const status = req.status || 'live'
            return status.toLowerCase() === state.filterStatus.toLowerCase()
          })
        }

        // Apply sorting
        filtered.sort((a, b) => {
          switch (state.sortBy) {
            case 'newest':
              return new Date(b.createdAt) - new Date(a.createdAt)
            case 'oldest':
              return new Date(a.createdAt) - new Date(b.createdAt)
            case 'most-uploads':
              return (b.uploadCount || 0) - (a.uploadCount || 0)
            case 'name-az':
              return a.title.localeCompare(b.title)
            default:
              return 0
          }
        })

        return filtered
      },

      /**
       * Get request by ID
       * @param {string} requestId - Request ID
       * @returns {object|null} Request object
       */
      getRequestById: (requestId) => {
        return get().requests.find(req => req.id === requestId) || null
      },

      /**
       * Get request by short code
       * @param {string} shortCode - Request short code
       * @returns {object|null} Request object
       */
      getRequestByShortCode: (shortCode) => {
        return get().requests.find(req => req.shortCode === shortCode) || null
      },

      /**
       * Get request statistics
       * @returns {object} Request statistics
       */
      getRequestStats: () => {
        const requests = get().requests
        const total = requests.length
        const live = requests.filter(r => (r.status || 'live') === 'live').length
        const draft = requests.filter(r => r.status === 'draft').length
        const totalUploads = requests.reduce((sum, req) => sum + (req.uploadCount || 0), 0)

        return {
          total,
          live,
          draft,
          totalUploads
        }
      },

      /**
       * Clear error state
       */
      clearError: () => {
        set({ error: null })
      },

      /**
       * Reset request store
       */
      reset: () => {
        set({
          requests: [],
          currentRequest: null,
          searchQuery: '',
          filterStatus: 'all',
          sortBy: 'newest',
          error: null
        })
      }
    }),
    { name: 'RequestStore' }
  )
)

// Export hook
export const useRequest = useRequestStore

export default useRequestStore
