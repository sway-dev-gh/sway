import { useState, useCallback } from 'react'

/**
 * Custom hook for managing canvas elements (CRUD operations)
 *
 * @param {Function} saveToHistory - Function to save state to history
 * @returns {Object} Elements state and manipulation functions
 */
export function useCanvasElements(saveToHistory) {
  const [elements, setElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)
  const [selectedElements, setSelectedElements] = useState([])
  const [lockedElements, setLockedElements] = useState([])
  const [clipboard, setClipboard] = useState(null)

  /**
   * Generate unique ID for elements
   */
  const generateId = useCallback(() => {
    return `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  /**
   * Add a new element to the canvas
   */
  const addElement = useCallback((element) => {
    const newElement = {
      ...element,
      id: element.id || generateId()
    }
    const newElements = [...elements, newElement]
    setElements(newElements)
    saveToHistory(newElements)
    return newElement
  }, [elements, generateId, saveToHistory])

  /**
   * Update an element's properties
   */
  const updateElement = useCallback((elementId, updates) => {
    const newElements = elements.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    )
    setElements(newElements)
    saveToHistory(newElements)

    // Update selected element if it's the one being updated
    if (selectedElement?.id === elementId) {
      setSelectedElement({ ...selectedElement, ...updates })
    }
  }, [elements, selectedElement, saveToHistory])

  /**
   * Update element property
   */
  const updateElementProperty = useCallback((elementId, propertyName, value) => {
    const newElements = elements.map(el =>
      el.id === elementId
        ? { ...el, properties: { ...el.properties, [propertyName]: value } }
        : el
    )
    setElements(newElements)
    saveToHistory(newElements)

    // Update selected element
    if (selectedElement?.id === elementId) {
      setSelectedElement({
        ...selectedElement,
        properties: { ...selectedElement.properties, [propertyName]: value }
      })
    }
  }, [elements, selectedElement, saveToHistory])

  /**
   * Delete an element
   */
  const deleteElement = useCallback((elementId) => {
    const newElements = elements.filter(el => el.id !== elementId)
    setElements(newElements)
    saveToHistory(newElements)

    if (selectedElement?.id === elementId) {
      setSelectedElement(null)
    }
  }, [elements, selectedElement, saveToHistory])

  /**
   * Delete selected element
   */
  const deleteSelected = useCallback(() => {
    if (selectedElement) {
      deleteElement(selectedElement.id)
    }
  }, [selectedElement, deleteElement])

  /**
   * Duplicate an element
   */
  const duplicateElement = useCallback((elementId) => {
    const element = elements.find(el => el.id === elementId)
    if (!element) return null

    const newElement = {
      ...JSON.parse(JSON.stringify(element)),
      id: generateId(),
      x: element.x + 20,
      y: element.y + 20
    }

    const newElements = [...elements, newElement]
    setElements(newElements)
    saveToHistory(newElements)
    setSelectedElement(newElement)
    return newElement
  }, [elements, generateId, saveToHistory])

  /**
   * Duplicate selected element
   */
  const duplicateSelected = useCallback(() => {
    if (selectedElement) {
      return duplicateElement(selectedElement.id)
    }
    return null
  }, [selectedElement, duplicateElement])

  /**
   * Set all elements (for template loading, undo/redo)
   */
  const setAllElements = useCallback((newElements) => {
    setElements(newElements)
  }, [])

  /**
   * Clear all elements
   */
  const clearElements = useCallback(() => {
    setElements([])
    setSelectedElement(null)
    setSelectedElements([])
    saveToHistory([])
  }, [saveToHistory])

  /**
   * Copy element to clipboard
   */
  const copyToClipboard = useCallback((elementId) => {
    const element = elements.find(el => el.id === elementId)
    if (element) {
      setClipboard(JSON.parse(JSON.stringify(element)))
    }
  }, [elements])

  /**
   * Paste element from clipboard
   */
  const pasteFromClipboard = useCallback(() => {
    if (!clipboard) return null

    const newElement = {
      ...clipboard,
      id: generateId(),
      x: clipboard.x + 20,
      y: clipboard.y + 20
    }

    const newElements = [...elements, newElement]
    setElements(newElements)
    saveToHistory(newElements)
    setSelectedElement(newElement)
    return newElement
  }, [clipboard, elements, generateId, saveToHistory])

  /**
   * Check if element is locked
   */
  const isElementLocked = useCallback((elementId) => {
    return lockedElements.includes(elementId)
  }, [lockedElements])

  /**
   * Toggle element lock status
   */
  const toggleElementLock = useCallback((elementId) => {
    if (lockedElements.includes(elementId)) {
      setLockedElements(lockedElements.filter(id => id !== elementId))
    } else {
      setLockedElements([...lockedElements, elementId])
    }
  }, [lockedElements])

  /**
   * Z-index management - bring element forward
   */
  const bringForward = useCallback(() => {
    if (!selectedElement) return

    const currentIndex = elements.findIndex(el => el.id === selectedElement.id)
    if (currentIndex < elements.length - 1) {
      const newElements = [...elements]
      const temp = newElements[currentIndex]
      newElements[currentIndex] = newElements[currentIndex + 1]
      newElements[currentIndex + 1] = temp
      setElements(newElements)
      saveToHistory(newElements)
    }
  }, [selectedElement, elements, saveToHistory])

  /**
   * Z-index management - send element backward
   */
  const sendBackward = useCallback(() => {
    if (!selectedElement) return

    const currentIndex = elements.findIndex(el => el.id === selectedElement.id)
    if (currentIndex > 0) {
      const newElements = [...elements]
      const temp = newElements[currentIndex]
      newElements[currentIndex] = newElements[currentIndex - 1]
      newElements[currentIndex - 1] = temp
      setElements(newElements)
      saveToHistory(newElements)
    }
  }, [selectedElement, elements, saveToHistory])

  /**
   * Z-index management - bring to front
   */
  const bringToFront = useCallback(() => {
    if (!selectedElement) return

    const currentIndex = elements.findIndex(el => el.id === selectedElement.id)
    if (currentIndex < elements.length - 1) {
      const newElements = [...elements]
      const element = newElements.splice(currentIndex, 1)[0]
      newElements.push(element)
      setElements(newElements)
      saveToHistory(newElements)
    }
  }, [selectedElement, elements, saveToHistory])

  /**
   * Z-index management - send to back
   */
  const sendToBack = useCallback(() => {
    if (!selectedElement) return

    const currentIndex = elements.findIndex(el => el.id === selectedElement.id)
    if (currentIndex > 0) {
      const newElements = [...elements]
      const element = newElements.splice(currentIndex, 1)[0]
      newElements.unshift(element)
      setElements(newElements)
      saveToHistory(newElements)
      setSelectedElement(element)
    }
  }, [selectedElement, elements, saveToHistory])

  return {
    // State
    elements,
    selectedElement,
    selectedElements,
    lockedElements,
    clipboard,

    // Setters
    setSelectedElement,
    setSelectedElements,
    setAllElements,

    // Element operations
    addElement,
    updateElement,
    updateElementProperty,
    deleteElement,
    deleteSelected,
    duplicateElement,
    duplicateSelected,
    clearElements,

    // Clipboard operations
    copyToClipboard,
    pasteFromClipboard,

    // Lock operations
    isElementLocked,
    toggleElementLock,

    // Z-index operations
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,

    // Utilities
    generateId
  }
}
