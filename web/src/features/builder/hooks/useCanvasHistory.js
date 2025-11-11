import { useState, useCallback } from 'react'

/**
 * Custom hook for managing canvas history (undo/redo functionality)
 *
 * @returns {Object} History state and control functions
 * @property {Function} saveToHistory - Save current elements to history
 * @property {Function} undo - Undo to previous state
 * @property {Function} redo - Redo to next state
 * @property {boolean} canUndo - Whether undo is available
 * @property {boolean} canRedo - Whether redo is available
 * @property {Function} clearHistory - Clear all history
 */
export function useCanvasHistory() {
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  /**
   * Save current elements state to history
   * Clears any forward history when a new save occurs
   */
  const saveToHistory = useCallback((elements) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(elements)))
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  /**
   * Undo to previous state
   * @returns {Array|null} Previous elements state or null if can't undo
   */
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      return JSON.parse(JSON.stringify(history[newIndex]))
    }
    return null
  }, [history, historyIndex])

  /**
   * Redo to next state
   * @returns {Array|null} Next elements state or null if can't redo
   */
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      return JSON.parse(JSON.stringify(history[newIndex]))
    }
    return null
  }, [history, historyIndex])

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory([])
    setHistoryIndex(-1)
  }, [])

  return {
    saveToHistory,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    clearHistory
  }
}
