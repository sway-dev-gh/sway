import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * UI Store
 *
 * Manages global UI state including modals, toasts, loading states,
 * and other transient UI elements across the application.
 *
 * @example
 * const { showToast, openModal, setLoading } = useUI()
 */
const useUIStore = create(
  devtools(
    (set, get) => ({
      // State
      toasts: [],
      modals: {},
      loading: {},
      theme: 'dark',
      sidebarOpen: true,

      // Actions

      /**
       * Show toast notification
       * @param {string} message - Toast message
       * @param {string} type - Toast type (success, error, warning, info)
       * @param {number} duration - Duration in milliseconds
       */
      showToast: (message, type = 'info', duration = 3000) => {
        const id = Date.now()
        const toast = { id, message, type, duration }

        set(state => ({
          toasts: [...state.toasts, toast]
        }))

        // Auto-remove after duration
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id)
          }, duration)
        }

        return id
      },

      /**
       * Show success toast
       * @param {string} message - Toast message
       * @param {number} duration - Duration in milliseconds
       */
      success: (message, duration = 3000) => {
        return get().showToast(message, 'success', duration)
      },

      /**
       * Show error toast
       * @param {string} message - Toast message
       * @param {number} duration - Duration in milliseconds
       */
      error: (message, duration = 4000) => {
        return get().showToast(message, 'error', duration)
      },

      /**
       * Show warning toast
       * @param {string} message - Toast message
       * @param {number} duration - Duration in milliseconds
       */
      warning: (message, duration = 3500) => {
        return get().showToast(message, 'warning', duration)
      },

      /**
       * Show info toast
       * @param {string} message - Toast message
       * @param {number} duration - Duration in milliseconds
       */
      info: (message, duration = 3000) => {
        return get().showToast(message, 'info', duration)
      },

      /**
       * Remove toast notification
       * @param {number} id - Toast ID
       */
      removeToast: (id) => {
        set(state => ({
          toasts: state.toasts.filter(toast => toast.id !== id)
        }))
      },

      /**
       * Clear all toasts
       */
      clearToasts: () => {
        set({ toasts: [] })
      },

      /**
       * Open modal
       * @param {string} modalId - Modal identifier
       * @param {object} props - Modal props/data
       */
      openModal: (modalId, props = {}) => {
        set(state => ({
          modals: {
            ...state.modals,
            [modalId]: { isOpen: true, ...props }
          }
        }))
      },

      /**
       * Close modal
       * @param {string} modalId - Modal identifier
       */
      closeModal: (modalId) => {
        set(state => ({
          modals: {
            ...state.modals,
            [modalId]: { isOpen: false }
          }
        }))
      },

      /**
       * Close all modals
       */
      closeAllModals: () => {
        set(state => {
          const newModals = {}
          Object.keys(state.modals).forEach(key => {
            newModals[key] = { isOpen: false }
          })
          return { modals: newModals }
        })
      },

      /**
       * Check if modal is open
       * @param {string} modalId - Modal identifier
       * @returns {boolean} True if modal is open
       */
      isModalOpen: (modalId) => {
        return get().modals[modalId]?.isOpen || false
      },

      /**
       * Get modal data
       * @param {string} modalId - Modal identifier
       * @returns {object} Modal data
       */
      getModalData: (modalId) => {
        return get().modals[modalId] || {}
      },

      /**
       * Set loading state
       * @param {string} key - Loading state key
       * @param {boolean} isLoading - Loading state
       */
      setLoading: (key, isLoading) => {
        set(state => ({
          loading: {
            ...state.loading,
            [key]: isLoading
          }
        }))
      },

      /**
       * Check if loading
       * @param {string} key - Loading state key
       * @returns {boolean} True if loading
       */
      isLoading: (key) => {
        return get().loading[key] || false
      },

      /**
       * Clear all loading states
       */
      clearLoading: () => {
        set({ loading: {} })
      },

      /**
       * Toggle sidebar
       */
      toggleSidebar: () => {
        set(state => ({ sidebarOpen: !state.sidebarOpen }))
      },

      /**
       * Set sidebar state
       * @param {boolean} isOpen - Sidebar open state
       */
      setSidebar: (isOpen) => {
        set({ sidebarOpen: isOpen })
      },

      /**
       * Set theme
       * @param {string} theme - Theme name (light, dark)
       */
      setTheme: (theme) => {
        set({ theme })
        localStorage.setItem('theme', theme)
      },

      /**
       * Toggle theme
       */
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark'
        get().setTheme(newTheme)
      },

      /**
       * Initialize UI state from localStorage
       */
      initialize: () => {
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme) {
          set({ theme: savedTheme })
        }
      },

      // Confirmation Dialog Helpers

      /**
       * Show confirmation dialog
       * @param {object} config - Confirmation config
       * @returns {Promise<boolean>} User's choice
       */
      confirm: ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) => {
        return new Promise((resolve) => {
          get().openModal('confirm', {
            title,
            message,
            confirmText,
            cancelText,
            danger,
            onConfirm: () => {
              get().closeModal('confirm')
              resolve(true)
            },
            onCancel: () => {
              get().closeModal('confirm')
              resolve(false)
            }
          })
        })
      },

      // Bulk action helpers

      /**
       * Show bulk action confirmation
       * @param {number} count - Number of items
       * @param {string} action - Action name
       * @returns {Promise<boolean>} User's choice
       */
      confirmBulkAction: (count, action = 'delete') => {
        return get().confirm({
          title: `${action.charAt(0).toUpperCase() + action.slice(1)} ${count} items?`,
          message: `Are you sure you want to ${action} ${count} selected items? This action cannot be undone.`,
          confirmText: `${action.charAt(0).toUpperCase() + action.slice(1)} All`,
          danger: action === 'delete'
        })
      },

      // Common modals

      /**
       * Show upgrade modal (for free users)
       */
      showUpgradeModal: () => {
        get().openModal('upgrade', {
          title: 'Upgrade to Pro',
          message: 'This feature is only available on the Pro plan.'
        })
      },

      /**
       * Show template preview modal
       * @param {object} template - Template data
       */
      showTemplateModal: (template) => {
        get().openModal('template', { template })
      },

      /**
       * Show preview modal
       * @param {object} data - Preview data
       */
      showPreviewModal: (data) => {
        get().openModal('preview', data)
      },

      // Analytics helpers

      /**
       * Track page view (can integrate with analytics)
       * @param {string} page - Page name
       */
      trackPageView: (page) => {
        // Can integrate with Google Analytics, Mixpanel, etc.
        console.log('[Analytics] Page view:', page)
      },

      /**
       * Track event (can integrate with analytics)
       * @param {string} event - Event name
       * @param {object} data - Event data
       */
      trackEvent: (event, data = {}) => {
        // Can integrate with Google Analytics, Mixpanel, etc.
        console.log('[Analytics] Event:', event, data)
      }
    }),
    { name: 'UIStore' }
  )
)

// Export hook
export const useUI = useUIStore

export default useUIStore
