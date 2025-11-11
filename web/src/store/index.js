/**
 * Zustand Store Index
 *
 * Centralized export for all application stores.
 * Import stores individually or use the combined hooks.
 *
 * @example
 * // Individual imports
 * import { useAuth, useBuilder, useUpload } from '@/store'
 *
 * // Or import specific store
 * import { useAuth } from '@/store/authStore'
 */

// Export individual stores
export { useAuth, authActions } from './authStore'
export { useBuilder } from './builderStore'
export { useUpload } from './uploadStore'
export { useUI } from './uiStore'
export { useRequest } from './requestStore'
export { useAnalytics } from './analyticsStore'

// Export default object with all stores
export default {
  useAuth: require('./authStore').useAuth,
  useBuilder: require('./builderStore').useBuilder,
  useUpload: require('./uploadStore').useUpload,
  useUI: require('./uiStore').useUI,
  useRequest: require('./requestStore').useRequest,
  useAnalytics: require('./analyticsStore').useAnalytics
}

/**
 * Store Overview:
 *
 * 1. authStore - Authentication and user management
 *    - User login/logout
 *    - Token management
 *    - Plan information
 *    - Profile updates
 *
 * 2. builderStore - Visual form builder state
 *    - Canvas elements
 *    - Selection and manipulation
 *    - Undo/redo history
 *    - Zoom and grid settings
 *    - Form metadata
 *
 * 3. uploadStore - File upload management
 *    - Upload progress tracking
 *    - File validation
 *    - Upload history
 *    - Download functionality
 *
 * 4. uiStore - Global UI state
 *    - Toast notifications
 *    - Modal management
 *    - Loading states
 *    - Theme settings
 *    - Sidebar state
 *
 * 5. requestStore - Request/form management
 *    - CRUD operations for requests
 *    - Filtering and sorting
 *    - Request statistics
 *
 * 6. analyticsStore - Analytics and metrics
 *    - Dashboard statistics
 *    - Upload trends
 *    - Performance metrics
 *    - Storage calculations
 */
