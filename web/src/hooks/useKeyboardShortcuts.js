import { useEffect, useCallback } from 'react'

/**
 * Detects if the user is on a Mac platform
 * @returns {boolean} True if Mac, false otherwise
 */
const isMac = () => {
  return typeof window !== 'undefined' &&
         (navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
          navigator.userAgent.toUpperCase().indexOf('MAC') >= 0)
}

/**
 * Custom hook for managing keyboard shortcuts
 *
 * Provides centralized keyboard shortcut management with:
 * - Platform detection (Mac vs Windows/Linux)
 * - Conflict prevention with browser shortcuts
 * - Multiple shortcut registration
 * - Automatic cleanup
 *
 * @param {Object} shortcuts - Map of keyboard shortcuts to handlers
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether shortcuts are enabled (default: true)
 * @param {boolean} options.preventDefaults - Prevent default browser behavior (default: true)
 *
 * @example
 * useKeyboardShortcuts({
 *   'mod+s': handleSave,
 *   'mod+z': handleUndo,
 *   'mod+shift+z': handleRedo,
 *   'delete': handleDelete,
 *   'escape': handleEscape
 * })
 */
export function useKeyboardShortcuts(shortcuts = {}, options = {}) {
  const { enabled = true, preventDefaults = true } = options
  const isMacPlatform = isMac()

  /**
   * Parse a shortcut string into modifier keys and key
   * @param {string} shortcut - Shortcut string (e.g., 'mod+shift+z')
   * @returns {Object} Parsed shortcut components
   */
  const parseShortcut = useCallback((shortcut) => {
    const parts = shortcut.toLowerCase().split('+')
    const key = parts[parts.length - 1]
    const modifiers = parts.slice(0, -1)

    return {
      key,
      ctrl: modifiers.includes('ctrl'),
      alt: modifiers.includes('alt'),
      shift: modifiers.includes('shift'),
      meta: modifiers.includes('meta'),
      // 'mod' means Cmd on Mac, Ctrl on Windows/Linux
      mod: modifiers.includes('mod')
    }
  }, [])

  /**
   * Check if an event matches a shortcut
   * @param {KeyboardEvent} event - Keyboard event
   * @param {Object} shortcut - Parsed shortcut object
   * @returns {boolean} True if matches
   */
  const matchesShortcut = useCallback((event, shortcut) => {
    const eventKey = event.key.toLowerCase()
    const shortcutKey = shortcut.key.toLowerCase()

    // Handle special key mappings
    const keyMatches =
      eventKey === shortcutKey ||
      (shortcutKey === 'delete' && (eventKey === 'delete' || eventKey === 'backspace')) ||
      (shortcutKey === 'mod' && (isMacPlatform ? event.metaKey : event.ctrlKey))

    if (!keyMatches) return false

    // Check modifiers
    const modKey = isMacPlatform ? event.metaKey : event.ctrlKey
    const expectedMod = shortcut.mod ? modKey : true
    const expectedCtrl = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey || shortcut.mod
    const expectedAlt = shortcut.alt ? event.altKey : !event.altKey
    const expectedShift = shortcut.shift ? event.shiftKey : !event.shiftKey
    const expectedMeta = shortcut.meta ? event.metaKey : !event.metaKey || shortcut.mod

    return expectedMod && expectedCtrl && expectedAlt && expectedShift && expectedMeta
  }, [isMacPlatform])

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return

    // Don't trigger shortcuts when typing in inputs (unless it's Escape)
    const target = event.target
    const isInput = target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable

    if (isInput && event.key !== 'Escape') return

    // Check each registered shortcut
    for (const [shortcutString, handler] of Object.entries(shortcuts)) {
      const shortcut = parseShortcut(shortcutString)

      if (matchesShortcut(event, shortcut)) {
        if (preventDefaults) {
          event.preventDefault()
          event.stopPropagation()
        }

        handler(event)
        break
      }
    }
  }, [enabled, shortcuts, parseShortcut, matchesShortcut, preventDefaults])

  // Register event listener
  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])

  /**
   * Get display string for a shortcut (for UI display)
   * @param {string} shortcut - Shortcut string
   * @returns {string} Display string
   */
  const getShortcutDisplay = useCallback((shortcut) => {
    const parts = shortcut.split('+')
    const displayParts = parts.map(part => {
      switch (part.toLowerCase()) {
        case 'mod':
          return isMacPlatform ? '⌘' : 'Ctrl'
        case 'ctrl':
          return isMacPlatform ? '⌃' : 'Ctrl'
        case 'alt':
          return isMacPlatform ? '⌥' : 'Alt'
        case 'shift':
          return isMacPlatform ? '⇧' : 'Shift'
        case 'meta':
          return '⌘'
        case 'delete':
          return isMacPlatform ? '⌫' : 'Del'
        case 'escape':
          return 'Esc'
        default:
          return part.toUpperCase()
      }
    })
    return displayParts.join(isMacPlatform ? '' : '+')
  }, [isMacPlatform])

  return {
    isMac: isMacPlatform,
    getShortcutDisplay
  }
}

export default useKeyboardShortcuts
