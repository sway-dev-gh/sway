/**
 * Route prefetching utility
 * Preloads route chunks when user hovers over navigation links
 */

// Map of route paths to their prefetch functions
const prefetchMap = new Map()

/**
 * Register a route for prefetching
 * @param {string} path - Route path
 * @param {Function} importFn - Dynamic import function
 */
export function registerPrefetch(path, importFn) {
  if (!prefetchMap.has(path)) {
    prefetchMap.set(path, importFn)
  }
}

/**
 * Prefetch a route chunk
 * @param {string} path - Route path to prefetch
 */
export function prefetchRoute(path) {
  const importFn = prefetchMap.get(path)
  if (importFn && typeof importFn === 'function') {
    // Execute the import to trigger chunk loading
    importFn().catch(() => {
      // Silently fail - chunk will load on actual navigation
    })
  }
}

/**
 * Prefetch multiple routes
 * @param {string[]} paths - Array of route paths
 */
export function prefetchRoutes(paths) {
  paths.forEach(prefetchRoute)
}

/**
 * Setup automatic prefetching on link hover
 * Call this after routes are mounted
 */
export function setupLinkPrefetch() {
  // Prefetch on hover with debounce
  let hoverTimeout

  document.addEventListener('mouseover', (e) => {
    const link = e.target.closest('a[href^="/"]')
    if (!link) return

    clearTimeout(hoverTimeout)
    hoverTimeout = setTimeout(() => {
      const path = link.getAttribute('href')
      if (path) {
        prefetchRoute(path)
      }
    }, 100) // Small delay to avoid prefetching on quick mouse movements
  })

  // Prefetch on touchstart for mobile
  document.addEventListener('touchstart', (e) => {
    const link = e.target.closest('a[href^="/"]')
    if (!link) return

    const path = link.getAttribute('href')
    if (path) {
      prefetchRoute(path)
    }
  }, { passive: true })
}

/**
 * Prefetch critical routes on initial load
 * Call this after app initialization
 */
export function prefetchCriticalRoutes() {
  // Wait for initial render, then prefetch likely routes
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      // Prefetch dashboard and requests (most common navigation)
      prefetchRoutes(['/dashboard', '/requests', '/responses'])
    }, { timeout: 2000 })
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      prefetchRoutes(['/dashboard', '/requests', '/responses'])
    }, 2000)
  }
}
