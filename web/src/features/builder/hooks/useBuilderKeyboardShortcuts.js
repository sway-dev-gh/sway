import { useEffect, useCallback } from 'react'
import { useBuilder } from '../../../store/builderStore'
import useKeyboardShortcuts from '../../../hooks/useKeyboardShortcuts'

/**
 * Custom hook for builder-specific keyboard shortcuts
 *
 * Provides comprehensive keyboard navigation for the form builder:
 * - Undo/Redo (Ctrl/Cmd+Z, Ctrl/Cmd+Y, Ctrl/Cmd+Shift+Z)
 * - Copy/Paste (Ctrl/Cmd+C, Ctrl/Cmd+V)
 * - Delete (Delete/Backspace)
 * - Arrow keys for nudging elements (1px or 10px with Shift)
 * - Escape to deselect
 * - Save (Ctrl/Cmd+S)
 *
 * @param {Function} onSave - Save handler function
 * @param {boolean} enabled - Whether shortcuts are enabled (default: true)
 */
export function useBuilderKeyboardShortcuts(onSave, enabled = true) {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    selectedElement,
    copyToClipboard,
    pasteFromClipboard,
    deleteElement,
    deleteElements,
    selectedElements,
    clearSelection,
    updateElement,
    clipboard
  } = useBuilder()

  /**
   * Handle nudging selected element with arrow keys
   */
  const handleArrowKey = useCallback((direction, shift = false) => {
    if (!selectedElement) return

    const delta = shift ? 10 : 1
    const updates = {}

    switch (direction) {
      case 'ArrowUp':
        updates.y = selectedElement.y - delta
        break
      case 'ArrowDown':
        updates.y = selectedElement.y + delta
        break
      case 'ArrowLeft':
        updates.x = selectedElement.x - delta
        break
      case 'ArrowRight':
        updates.x = selectedElement.x + delta
        break
    }

    if (Object.keys(updates).length > 0) {
      updateElement(selectedElement.id, updates)
    }
  }, [selectedElement, updateElement])

  /**
   * Handle delete action
   */
  const handleDelete = useCallback(() => {
    if (selectedElement) {
      deleteElement(selectedElement.id)
    } else if (selectedElements.length > 0) {
      const ids = selectedElements.map(el => el.id)
      deleteElements(ids)
    }
  }, [selectedElement, selectedElements, deleteElement, deleteElements])

  /**
   * Handle copy action
   */
  const handleCopy = useCallback(() => {
    if (selectedElement) {
      copyToClipboard(selectedElement)
    }
  }, [selectedElement, copyToClipboard])

  /**
   * Handle paste action
   */
  const handlePaste = useCallback(() => {
    if (clipboard) {
      pasteFromClipboard()
    }
  }, [clipboard, pasteFromClipboard])

  /**
   * Handle undo action
   */
  const handleUndo = useCallback(() => {
    if (canUndo()) {
      undo()
    }
  }, [undo, canUndo])

  /**
   * Handle redo action
   */
  const handleRedo = useCallback(() => {
    if (canRedo()) {
      redo()
    }
  }, [redo, canRedo])

  /**
   * Handle save action
   */
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave()
    }
  }, [onSave])

  /**
   * Handle escape (deselect)
   */
  const handleEscape = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    // Undo/Redo
    'mod+z': handleUndo,
    'mod+y': handleRedo,
    'mod+shift+z': handleRedo,

    // Copy/Paste/Delete
    'mod+c': handleCopy,
    'mod+v': handlePaste,
    'delete': handleDelete,

    // Deselect
    'escape': handleEscape,

    // Save
    'mod+s': handleSave
  }, { enabled })

  // Set up arrow key handlers (handled separately to check shift key)
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e) => {
      // Don't handle arrow keys when typing in inputs
      const target = e.target
      const isInput = target.tagName === 'INPUT' ||
                      target.tagName === 'TEXTAREA' ||
                      target.isContentEditable

      if (isInput) return

      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      if (arrowKeys.includes(e.key)) {
        e.preventDefault()
        handleArrowKey(e.key, e.shiftKey)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleArrowKey])

  return {
    shortcuts: {
      undo: 'mod+z',
      redo: 'mod+y',
      copy: 'mod+c',
      paste: 'mod+v',
      delete: 'delete',
      escape: 'escape',
      save: 'mod+s',
      nudge: 'arrow keys',
      nudgeLarge: 'shift+arrow keys'
    }
  }
}

export default useBuilderKeyboardShortcuts
