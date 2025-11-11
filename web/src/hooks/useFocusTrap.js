import { useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook for trapping focus within a container (e.g., modals, dialogs)
 *
 * Provides accessibility-compliant focus management:
 * - Traps tab navigation within container
 * - Returns focus to trigger element on unmount
 * - Supports Shift+Tab for reverse navigation
 * - Auto-focuses first focusable element
 *
 * @param {boolean} isActive - Whether focus trap is active
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.initialFocus - Element to focus on mount
 * @param {HTMLElement} options.returnFocus - Element to focus on unmount
 * @param {boolean} options.autoFocus - Auto-focus first element (default: true)
 *
 * @returns {Object} Ref and control functions
 * @property {React.RefObject} containerRef - Ref to attach to container
 * @property {Function} focusFirst - Focus first focusable element
 * @property {Function} focusLast - Focus last focusable element
 *
 * @example
 * function Modal({ isOpen, onClose }) {
 *   const { containerRef } = useFocusTrap(isOpen)
 *
 *   if (!isOpen) return null
 *
 *   return (
 *     <div ref={containerRef}>
 *       <button onClick={onClose}>Close</button>
 *       <input type="text" />
 *     </div>
 *   )
 * }
 */
export function useFocusTrap(isActive, options = {}) {
  const {
    initialFocus = null,
    returnFocus = null,
    autoFocus = true
  } = options

  const containerRef = useRef(null)
  const previousActiveElement = useRef(null)

  /**
   * Get all focusable elements within the container
   * @returns {HTMLElement[]} Array of focusable elements
   */
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return []

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    const elements = containerRef.current.querySelectorAll(focusableSelectors)
    return Array.from(elements).filter(el => {
      // Filter out invisible elements
      return el.offsetParent !== null &&
             window.getComputedStyle(el).visibility !== 'hidden'
    })
  }, [])

  /**
   * Focus first focusable element
   */
  const focusFirst = useCallback(() => {
    const elements = getFocusableElements()
    if (elements.length > 0) {
      elements[0].focus()
    }
  }, [getFocusableElements])

  /**
   * Focus last focusable element
   */
  const focusLast = useCallback(() => {
    const elements = getFocusableElements()
    if (elements.length > 0) {
      elements[elements.length - 1].focus()
    }
  }, [getFocusableElements])

  /**
   * Handle tab key navigation
   */
  const handleKeyDown = useCallback((event) => {
    if (!isActive || event.key !== 'Tab') return

    const focusableElements = getFocusableElements()
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const currentElement = document.activeElement

    // Shift+Tab on first element - wrap to last
    if (event.shiftKey && currentElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
      return
    }

    // Tab on last element - wrap to first
    if (!event.shiftKey && currentElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
      return
    }

    // If focus is outside container, bring it back to first element
    if (!containerRef.current?.contains(currentElement)) {
      event.preventDefault()
      firstElement.focus()
    }
  }, [isActive, getFocusableElements])

  // Set up focus trap
  useEffect(() => {
    if (!isActive) return

    // Store the element that had focus before the trap activated
    previousActiveElement.current = document.activeElement

    // Focus initial element or first focusable element
    if (initialFocus) {
      initialFocus.focus()
    } else if (autoFocus) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        focusFirst()
      }, 0)
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      // Return focus to previous element
      const elementToFocus = returnFocus || previousActiveElement.current
      if (elementToFocus && typeof elementToFocus.focus === 'function') {
        elementToFocus.focus()
      }
    }
  }, [isActive, initialFocus, returnFocus, autoFocus, handleKeyDown, focusFirst])

  return {
    containerRef,
    focusFirst,
    focusLast
  }
}

export default useFocusTrap
