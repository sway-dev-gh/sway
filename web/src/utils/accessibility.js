/**
 * Accessibility Utilities
 * Provides helper functions for enhanced accessibility features
 */

/**
 * Detect and track keyboard vs mouse usage for focus styling
 * Adds 'using-keyboard' or 'using-mouse' class to body element
 */
export function initKeyboardDetection() {
  let isUsingKeyboard = false

  // Detect keyboard usage
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      isUsingKeyboard = true
      document.body.classList.add('using-keyboard')
      document.body.classList.remove('using-mouse')
    }
  })

  // Detect mouse usage
  document.addEventListener('mousedown', () => {
    isUsingKeyboard = false
    document.body.classList.add('using-mouse')
    document.body.classList.remove('using-keyboard')
  })

  // Also detect touch
  document.addEventListener('touchstart', () => {
    isUsingKeyboard = false
    document.body.classList.add('using-mouse')
    document.body.classList.remove('using-keyboard')
  })
}

/**
 * Announce message to screen readers using live region
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive' (default: 'polite')
 */
export function announceToScreenReader(message, priority = 'polite') {
  // Create or get existing live region
  let liveRegion = document.getElementById('a11y-announcer')

  if (!liveRegion) {
    liveRegion = document.createElement('div')
    liveRegion.id = 'a11y-announcer'
    liveRegion.setAttribute('role', 'status')
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.style.position = 'absolute'
    liveRegion.style.left = '-10000px'
    liveRegion.style.width = '1px'
    liveRegion.style.height = '1px'
    liveRegion.style.overflow = 'hidden'
    document.body.appendChild(liveRegion)
  } else {
    liveRegion.setAttribute('aria-live', priority)
  }

  // Clear and set new message
  liveRegion.textContent = ''
  setTimeout(() => {
    liveRegion.textContent = message
  }, 100)
}

/**
 * Check if an element is focusable
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if focusable
 */
export function isFocusable(element) {
  if (!element || element.offsetParent === null) return false

  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ]

  return focusableSelectors.some(selector => element.matches(selector))
}

/**
 * Get all focusable elements within a container
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement[]} Array of focusable elements
 */
export function getFocusableElements(container) {
  if (!container) return []

  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ')

  const elements = container.querySelectorAll(focusableSelectors)
  return Array.from(elements).filter(el => {
    return el.offsetParent !== null &&
           window.getComputedStyle(el).visibility !== 'hidden'
  })
}

/**
 * Move focus to first focusable element in container
 * @param {HTMLElement} container - Container element
 * @returns {boolean} True if focus was moved
 */
export function focusFirstElement(container) {
  const elements = getFocusableElements(container)
  if (elements.length > 0) {
    elements[0].focus()
    return true
  }
  return false
}

/**
 * Move focus to element by ID
 * @param {string} elementId - Element ID
 * @returns {boolean} True if focus was moved
 */
export function focusElementById(elementId) {
  const element = document.getElementById(elementId)
  if (element) {
    element.focus()
    return true
  }
  return false
}

/**
 * Trap focus within a container (for modals, dialogs)
 * @param {HTMLElement} container - Container element
 * @param {Function} onEscape - Callback when Escape is pressed
 * @returns {Function} Cleanup function
 */
export function trapFocus(container, onEscape = null) {
  if (!container) return () => {}

  const handleKeyDown = (e) => {
    // Handle Escape key
    if (e.key === 'Escape' && onEscape) {
      onEscape()
      return
    }

    // Handle Tab key
    if (e.key === 'Tab') {
      const focusableElements = getFocusableElements(container)
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const currentElement = document.activeElement

      // Shift+Tab on first element - wrap to last
      if (e.shiftKey && currentElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
        return
      }

      // Tab on last element - wrap to first
      if (!e.shiftKey && currentElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
        return
      }
    }
  }

  document.addEventListener('keydown', handleKeyDown)

  // Focus first element
  setTimeout(() => {
    focusFirstElement(container)
  }, 0)

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Check if reduced motion is preferred
 * @returns {boolean} True if reduced motion is preferred
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Check if high contrast is preferred
 * @returns {boolean} True if high contrast is preferred
 */
export function prefersHighContrast() {
  return window.matchMedia('(prefers-contrast: high)').matches
}

/**
 * Get ARIA label for keyboard shortcut
 * @param {string} shortcut - Shortcut key combination (e.g., 'mod+s')
 * @param {boolean} isMac - Whether on Mac platform
 * @returns {string} ARIA label
 */
export function getShortcutAriaLabel(shortcut, isMac = false) {
  const parts = shortcut.split('+')
  const labels = parts.map(part => {
    switch (part.toLowerCase()) {
      case 'mod':
        return isMac ? 'Command' : 'Control'
      case 'ctrl':
        return 'Control'
      case 'alt':
        return isMac ? 'Option' : 'Alt'
      case 'shift':
        return 'Shift'
      case 'meta':
        return 'Command'
      default:
        return part.toUpperCase()
    }
  })
  return labels.join(' + ')
}

/**
 * Create accessible loading state
 * @param {HTMLElement} element - Element to make loading
 * @param {string} message - Loading message
 */
export function setLoadingState(element, message = 'Loading...') {
  if (!element) return

  element.setAttribute('aria-busy', 'true')
  element.setAttribute('aria-live', 'polite')

  const statusElement = document.createElement('span')
  statusElement.className = 'sr-only'
  statusElement.textContent = message
  statusElement.setAttribute('role', 'status')
  element.appendChild(statusElement)

  return () => {
    element.removeAttribute('aria-busy')
    element.removeAttribute('aria-live')
    if (statusElement.parentNode) {
      statusElement.parentNode.removeChild(statusElement)
    }
  }
}

/**
 * Remove loading state
 * @param {HTMLElement} element - Element to remove loading from
 */
export function removeLoadingState(element) {
  if (!element) return

  element.removeAttribute('aria-busy')
  element.removeAttribute('aria-live')

  const statusElement = element.querySelector('.sr-only')
  if (statusElement) {
    statusElement.remove()
  }
}

/**
 * Initialize accessibility features
 * Call this once when app loads
 */
export function initAccessibility() {
  // Enable keyboard detection
  initKeyboardDetection()

  // Add accessibility CSS if not already loaded
  if (!document.getElementById('accessibility-styles')) {
    const link = document.createElement('link')
    link.id = 'accessibility-styles'
    link.rel = 'stylesheet'
    link.href = '/src/styles/accessibility.css'
    document.head.appendChild(link)
  }

  // Create global announcer for screen readers
  if (!document.getElementById('a11y-announcer')) {
    const announcer = document.createElement('div')
    announcer.id = 'a11y-announcer'
    announcer.setAttribute('role', 'status')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.style.position = 'absolute'
    announcer.style.left = '-10000px'
    announcer.style.width = '1px'
    announcer.style.height = '1px'
    announcer.style.overflow = 'hidden'
    document.body.appendChild(announcer)
  }
}

export default {
  initAccessibility,
  initKeyboardDetection,
  announceToScreenReader,
  isFocusable,
  getFocusableElements,
  focusFirstElement,
  focusElementById,
  trapFocus,
  prefersReducedMotion,
  prefersHighContrast,
  getShortcutAriaLabel,
  setLoadingState,
  removeLoadingState
}
