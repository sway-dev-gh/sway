import { useState, useCallback } from 'react'

/**
 * Custom hook for managing canvas zoom functionality
 *
 * @param {number} initialZoom - Initial zoom level (default: 1)
 * @param {number} minZoom - Minimum zoom level (default: 0.25)
 * @param {number} maxZoom - Maximum zoom level (default: 2)
 * @param {number} step - Zoom step increment (default: 0.1)
 * @returns {Object} Zoom state and control functions
 */
export function useCanvasZoom({
  initialZoom = 1,
  minZoom = 0.25,
  maxZoom = 2,
  step = 0.1
} = {}) {
  const [zoom, setZoom] = useState(initialZoom)

  /**
   * Zoom in by one step
   */
  const zoomIn = useCallback(() => {
    setZoom(prevZoom => Math.min(maxZoom, prevZoom + step))
  }, [maxZoom, step])

  /**
   * Zoom out by one step
   */
  const zoomOut = useCallback(() => {
    setZoom(prevZoom => Math.max(minZoom, prevZoom - step))
  }, [minZoom, step])

  /**
   * Reset zoom to initial level (100%)
   */
  const resetZoom = useCallback(() => {
    setZoom(initialZoom)
  }, [initialZoom])

  /**
   * Set specific zoom level
   */
  const setZoomLevel = useCallback((level) => {
    const clampedLevel = Math.max(minZoom, Math.min(maxZoom, level))
    setZoom(clampedLevel)
  }, [minZoom, maxZoom])

  /**
   * Get zoom percentage as string (e.g., "100%")
   */
  const zoomPercentage = `${Math.round(zoom * 100)}%`

  /**
   * Check if can zoom in
   */
  const canZoomIn = zoom < maxZoom

  /**
   * Check if can zoom out
   */
  const canZoomOut = zoom > minZoom

  return {
    zoom,
    zoomPercentage,
    canZoomIn,
    canZoomOut,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomLevel
  }
}
