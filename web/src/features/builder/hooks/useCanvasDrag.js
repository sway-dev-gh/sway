import { useState, useCallback } from 'react'

/**
 * Custom hook for managing canvas drag and drop operations
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.snapToGrid - Whether to snap to grid
 * @param {number} options.gridSize - Grid size for snapping (default: 10)
 * @returns {Object} Drag state and control functions
 */
export function useCanvasDrag({ snapToGrid = true, gridSize = 10 } = {}) {
  const [isDragging, setIsDragging] = useState(false)
  const [draggedComponent, setDraggedComponent] = useState(null)
  const [isDraggingElement, setIsDraggingElement] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState(null)

  /**
   * Snap coordinate to grid
   */
  const snapToGridValue = useCallback((value) => {
    if (!snapToGrid) return value
    return Math.round(value / gridSize) * gridSize
  }, [snapToGrid, gridSize])

  /**
   * Start dragging a component from the library
   */
  const startComponentDrag = useCallback((component) => {
    setIsDragging(true)
    setDraggedComponent(component)
  }, [])

  /**
   * End component drag
   */
  const endComponentDrag = useCallback(() => {
    setIsDragging(false)
    setDraggedComponent(null)
  }, [])

  /**
   * Start dragging an element on the canvas
   */
  const startElementDrag = useCallback((element, mouseX, mouseY) => {
    setIsDraggingElement(true)
    setDragOffset({
      x: mouseX - element.x,
      y: mouseY - element.y
    })
  }, [])

  /**
   * End element drag
   */
  const endElementDrag = useCallback(() => {
    setIsDraggingElement(false)
    setDragOffset({ x: 0, y: 0 })
  }, [])

  /**
   * Calculate new position for dragged element
   */
  const calculateDragPosition = useCallback((mouseX, mouseY) => {
    const newX = snapToGridValue(mouseX - dragOffset.x)
    const newY = snapToGridValue(mouseY - dragOffset.y)
    return { x: newX, y: newY }
  }, [dragOffset, snapToGridValue])

  /**
   * Start resizing an element
   */
  const startResize = useCallback((handle) => {
    setIsResizing(true)
    setResizeHandle(handle)
  }, [])

  /**
   * End resizing
   */
  const endResize = useCallback(() => {
    setIsResizing(false)
    setResizeHandle(null)
  }, [])

  /**
   * Calculate new size for resized element
   */
  const calculateResizeSize = useCallback((element, mouseX, mouseY, startMouseX, startMouseY) => {
    if (!resizeHandle) return { width: element.width, height: element.height }

    const deltaX = mouseX - startMouseX
    const deltaY = mouseY - startMouseY

    let newWidth = element.width
    let newHeight = element.height
    let newX = element.x
    let newY = element.y

    switch (resizeHandle) {
      case 'se': // Southeast (bottom-right)
        newWidth = snapToGridValue(Math.max(50, element.width + deltaX))
        newHeight = snapToGridValue(Math.max(30, element.height + deltaY))
        break
      case 'sw': // Southwest (bottom-left)
        newWidth = snapToGridValue(Math.max(50, element.width - deltaX))
        newHeight = snapToGridValue(Math.max(30, element.height + deltaY))
        newX = snapToGridValue(element.x + deltaX)
        break
      case 'ne': // Northeast (top-right)
        newWidth = snapToGridValue(Math.max(50, element.width + deltaX))
        newHeight = snapToGridValue(Math.max(30, element.height - deltaY))
        newY = snapToGridValue(element.y + deltaY)
        break
      case 'nw': // Northwest (top-left)
        newWidth = snapToGridValue(Math.max(50, element.width - deltaX))
        newHeight = snapToGridValue(Math.max(30, element.height - deltaY))
        newX = snapToGridValue(element.x + deltaX)
        newY = snapToGridValue(element.y + deltaY)
        break
      case 'e': // East (right edge)
        newWidth = snapToGridValue(Math.max(50, element.width + deltaX))
        break
      case 'w': // West (left edge)
        newWidth = snapToGridValue(Math.max(50, element.width - deltaX))
        newX = snapToGridValue(element.x + deltaX)
        break
      case 's': // South (bottom edge)
        newHeight = snapToGridValue(Math.max(30, element.height + deltaY))
        break
      case 'n': // North (top edge)
        newHeight = snapToGridValue(Math.max(30, element.height - deltaY))
        newY = snapToGridValue(element.y + deltaY)
        break
      default:
        break
    }

    return { width: newWidth, height: newHeight, x: newX, y: newY }
  }, [resizeHandle, snapToGridValue])

  /**
   * Reset all drag states
   */
  const reset = useCallback(() => {
    setIsDragging(false)
    setDraggedComponent(null)
    setIsDraggingElement(false)
    setDragOffset({ x: 0, y: 0 })
    setIsResizing(false)
    setResizeHandle(null)
  }, [])

  return {
    // Component drag state
    isDragging,
    draggedComponent,
    startComponentDrag,
    endComponentDrag,

    // Element drag state
    isDraggingElement,
    dragOffset,
    startElementDrag,
    endElementDrag,
    calculateDragPosition,

    // Resize state
    isResizing,
    resizeHandle,
    startResize,
    endResize,
    calculateResizeSize,

    // Utilities
    snapToGridValue,
    reset
  }
}
