import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/axios'

/**
 * Authentication Store
 *
 * Manages user authentication state, login/logout, and user profile data.
 * Persists token and user data to localStorage for session management.
 *
 * @example
 * const { user, login, logout, isAuthenticated } = useAuth()
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // Computed
      isAuthenticated: () => !!get().token,
      isPro: () => {
        const adminOverride = localStorage.getItem('adminPlanOverride')
        const plan = adminOverride || get().user?.plan || 'free'
        return plan.toLowerCase() === 'pro'
      },
      getStorageLimit: () => {
        return get().isPro() ? 50 : 2
      },

      // Actions

      /**
       * Login user with credentials
       * @param {string} email - User email
       * @param {string} password - User password
       * @returns {Promise<object>} User data and token
       */
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/api/auth/login', { email, password })
          set({
            user: data.user,
            token: data.token,
            isLoading: false,
            error: null
          })
          return data
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Login failed'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      /**
       * Sign up new user
       * @param {object} credentials - User registration data
       * @returns {Promise<object>} User data and token
       */
      signup: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/api/auth/signup', credentials)
          set({
            user: data.user,
            token: data.token,
            isLoading: false,
            error: null
          })
          return data
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Signup failed'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      /**
       * Logout current user
       */
      logout: () => {
        set({ user: null, token: null, error: null })
      },

      /**
       * Update user profile
       * @param {object} updates - User data to update
       */
      updateUser: (updates) => {
        set(state => ({
          user: { ...state.user, ...updates }
        }))
      },

      /**
       * Change user password
       * @param {string} currentPassword - Current password
       * @param {string} newPassword - New password
       */
      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null })
        try {
          const token = get().token
          await api.post('/api/auth/change-password',
            { currentPassword, newPassword },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          set({ isLoading: false, error: null })
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to change password'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      /**
       * Refresh user data from server
       */
      refreshUser: async () => {
        set({ isLoading: true })
        try {
          const token = get().token
          const { data } = await api.get('/api/stripe/plan-info', {
            headers: { Authorization: `Bearer ${token}` }
          })
          set(state => ({
            user: {
              ...state.user,
              plan: data.plan,
              storage_limit_gb: data.storage_limit_gb
            },
            isLoading: false
          }))
        } catch (error) {
          set({ isLoading: false })
          console.error('Failed to refresh user data:', error)
        }
      },

      /**
       * Clear error state
       */
      clearError: () => set({ error: null }),

      /**
       * Initialize auth from localStorage
       */
      initialize: () => {
        const token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr)
            set({ user, token })
          } catch (error) {
            console.error('Failed to parse user data:', error)
            get().logout()
          }
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token
      }),
      onRehydrateStorage: () => (state) => {
        // Sync with legacy localStorage
        if (state?.token) {
          localStorage.setItem('token', state.token)
          localStorage.setItem('user', JSON.stringify(state.user))
        }
      }
    }
  )
)

// Export hook
export const useAuth = useAuthStore

// Export actions for non-component usage
export const authActions = {
  login: () => useAuthStore.getState().login,
  logout: () => useAuthStore.getState().logout,
  getToken: () => useAuthStore.getState().token
}
