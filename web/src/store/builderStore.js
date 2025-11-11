import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import theme from '../theme'

/**
 * Form Builder Store
 *
 * Manages the visual form builder state including:
 * - Canvas elements (drag-drop components)
 * - Element selection and manipulation
 * - Undo/redo history
 * - Zoom and grid settings
 * - Form metadata and settings
 *
 * @example
 * const { canvasElements, addElement, updateElement } = useBuilder()
 */
const useBuilderStore = create(
  devtools(
    (set, get) => ({
      // State
      canvasElements: [],
      selectedElement: null,
      selectedElements: [],
      formTitle: 'Untitled File Request',
      isEditingTitle: false,

      // History
      history: [],
      historyIndex: -1,

      // UI State
      zoom: 1,
      snapToGrid: true,
      lockedElements: [],
      clipboard: null,
      isDragging: false,
      isResizing: false,
      dragOffset: { x: 0, y: 0 },
      resizeHandle: null,
      editingElementId: null,

      // Settings
      branding: {
        accentColor: '#ffffff',
        pageTitle: '',
        successMessage: 'Thank you! Your file has been uploaded successfully.',
        showPoweredBy: true,
        instructions: ''
      },
      settings: {
        allowedFileTypes: ['*'],
        maxFileSize: 104857600, // 100MB
        maxFiles: 10,
        customFileTypes: ''
      },

      // Actions

      /**
       * Add element to canvas
       * @param {object} element - Element to add
       */
      addElement: (element) => {
        set(state => {
          const newElements = [...state.canvasElements, element]
          get().saveToHistory(newElements)
          return { canvasElements: newElements }
        })
      },

      /**
       * Update element properties
       * @param {string} elementId - Element ID
       * @param {object} updates - Properties to update
       */
      updateElement: (elementId, updates) => {
        set(state => {
          const newElements = state.canvasElements.map(el =>
            el.id === elementId ? { ...el, ...updates } : el
          )
          return { canvasElements: newElements }
        })
      },

      /**
       * Delete element
       * @param {string} elementId - Element ID to delete
       */
      deleteElement: (elementId) => {
        set(state => {
          const newElements = state.canvasElements.filter(el => el.id !== elementId)
          get().saveToHistory(newElements)
          return {
            canvasElements: newElements,
            selectedElement: null
          }
        })
      },

      /**
       * Delete multiple elements
       * @param {string[]} elementIds - Array of element IDs to delete
       */
      deleteElements: (elementIds) => {
        set(state => {
          const newElements = state.canvasElements.filter(
            el => !elementIds.includes(el.id)
          )
          get().saveToHistory(newElements)
          return {
            canvasElements: newElements,
            selectedElements: []
          }
        })
      },

      /**
       * Duplicate element
       * @param {string} elementId - Element ID to duplicate
       */
      duplicateElement: (elementId) => {
        set(state => {
          const element = state.canvasElements.find(el => el.id === elementId)
          if (!element) return state

          const newElement = {
            ...element,
            id: get().generateId(),
            x: element.x + 20,
            y: element.y + 20
          }
          const newElements = [...state.canvasElements, newElement]
          get().saveToHistory(newElements)
          return {
            canvasElements: newElements,
            selectedElement: newElement
          }
        })
      },

      /**
       * Select element
       * @param {object|null} element - Element to select
       */
      selectElement: (element) => {
        set({ selectedElement: element, selectedElements: [] })
      },

      /**
       * Select multiple elements
       * @param {object[]} elements - Elements to select
       */
      selectElements: (elements) => {
        set({ selectedElements: elements, selectedElement: null })
      },

      /**
       * Clear selection
       */
      clearSelection: () => {
        set({ selectedElement: null, selectedElements: [] })
      },

      /**
       * Set form title
       * @param {string} title - New form title
       */
      setFormTitle: (title) => {
        set({ formTitle: title })
      },

      /**
       * Update branding settings
       * @param {object} updates - Branding updates
       */
      updateBranding: (updates) => {
        set(state => ({
          branding: { ...state.branding, ...updates }
        }))
      },

      /**
       * Update form settings
       * @param {object} updates - Settings updates
       */
      updateSettings: (updates) => {
        set(state => ({
          settings: { ...state.settings, ...updates }
        }))
      },

      /**
       * Save current state to history
       * @param {object[]} elements - Canvas elements to save
       */
      saveToHistory: (elements) => {
        set(state => {
          const newHistory = state.history.slice(0, state.historyIndex + 1)
          newHistory.push(JSON.parse(JSON.stringify(elements)))
          // Limit history to 50 items
          const limitedHistory = newHistory.slice(-50)
          return {
            history: limitedHistory,
            historyIndex: limitedHistory.length - 1
          }
        })
      },

      /**
       * Undo last action
       */
      undo: () => {
        set(state => {
          if (state.historyIndex > 0) {
            const newIndex = state.historyIndex - 1
            return {
              historyIndex: newIndex,
              canvasElements: JSON.parse(JSON.stringify(state.history[newIndex])),
              selectedElement: null,
              selectedElements: []
            }
          }
          return state
        })
      },

      /**
       * Redo last undone action
       */
      redo: () => {
        set(state => {
          if (state.historyIndex < state.history.length - 1) {
            const newIndex = state.historyIndex + 1
            return {
              historyIndex: newIndex,
              canvasElements: JSON.parse(JSON.stringify(state.history[newIndex])),
              selectedElement: null,
              selectedElements: []
            }
          }
          return state
        })
      },

      /**
       * Copy element to clipboard
       * @param {object} element - Element to copy
       */
      copyToClipboard: (element) => {
        set({ clipboard: JSON.parse(JSON.stringify(element)) })
      },

      /**
       * Paste element from clipboard
       */
      pasteFromClipboard: () => {
        const state = get()
        if (!state.clipboard) return

        const newElement = {
          ...state.clipboard,
          id: get().generateId(),
          x: state.clipboard.x + 20,
          y: state.clipboard.y + 20
        }
        get().addElement(newElement)
        set({ selectedElement: newElement })
      },

      /**
       * Set zoom level
       * @param {number} zoom - Zoom level (0.25 to 2)
       */
      setZoom: (zoom) => {
        const clampedZoom = Math.min(Math.max(zoom, 0.25), 2)
        set({ zoom: clampedZoom })
      },

      /**
       * Toggle grid snapping
       */
      toggleSnapToGrid: () => {
        set(state => ({ snapToGrid: !state.snapToGrid }))
      },

      /**
       * Snap value to grid
       * @param {number} value - Value to snap
       * @returns {number} Snapped value
       */
      snapToGridValue: (value) => {
        const state = get()
        if (!state.snapToGrid) return value
        return Math.round(value / 10) * 10
      },

      /**
       * Toggle element lock
       * @param {string} elementId - Element ID to lock/unlock
       */
      toggleElementLock: (elementId) => {
        set(state => {
          const isLocked = state.lockedElements.includes(elementId)
          return {
            lockedElements: isLocked
              ? state.lockedElements.filter(id => id !== elementId)
              : [...state.lockedElements, elementId]
          }
        })
      },

      /**
       * Check if element is locked
       * @param {string} elementId - Element ID
       * @returns {boolean} True if locked
       */
      isElementLocked: (elementId) => {
        return get().lockedElements.includes(elementId)
      },

      /**
       * Bring element forward in z-order
       */
      bringForward: () => {
        const state = get()
        if (!state.selectedElement) return

        const currentIndex = state.canvasElements.findIndex(
          el => el.id === state.selectedElement.id
        )
        if (currentIndex < state.canvasElements.length - 1) {
          const newElements = [...state.canvasElements]
          const temp = newElements[currentIndex]
          newElements[currentIndex] = newElements[currentIndex + 1]
          newElements[currentIndex + 1] = temp
          set({ canvasElements: newElements })
          get().saveToHistory(newElements)
        }
      },

      /**
       * Send element backward in z-order
       */
      sendBackward: () => {
        const state = get()
        if (!state.selectedElement) return

        const currentIndex = state.canvasElements.findIndex(
          el => el.id === state.selectedElement.id
        )
        if (currentIndex > 0) {
          const newElements = [...state.canvasElements]
          const temp = newElements[currentIndex]
          newElements[currentIndex] = newElements[currentIndex - 1]
          newElements[currentIndex - 1] = temp
          set({ canvasElements: newElements })
          get().saveToHistory(newElements)
        }
      },

      /**
       * Bring element to front
       */
      bringToFront: () => {
        const state = get()
        if (!state.selectedElement) return

        const currentIndex = state.canvasElements.findIndex(
          el => el.id === state.selectedElement.id
        )
        if (currentIndex < state.canvasElements.length - 1) {
          const newElements = [...state.canvasElements]
          const element = newElements.splice(currentIndex, 1)[0]
          newElements.push(element)
          set({ canvasElements: newElements })
          get().saveToHistory(newElements)
        }
      },

      /**
       * Send element to back
       */
      sendToBack: () => {
        const state = get()
        if (!state.selectedElement) return

        const currentIndex = state.canvasElements.findIndex(
          el => el.id === state.selectedElement.id
        )
        if (currentIndex > 0) {
          const newElements = [...state.canvasElements]
          const element = newElements.splice(currentIndex, 1)[0]
          newElements.unshift(element)
          set({ canvasElements: newElements, selectedElement: element })
          get().saveToHistory(newElements)
        }
      },

      /**
       * Load template into canvas
       * @param {object[]} elements - Template elements
       */
      loadTemplate: (elements) => {
        const newElements = elements.map(el => ({
          ...el,
          id: get().generateId()
        }))
        set({ canvasElements: newElements })
        get().saveToHistory(newElements)
      },

      /**
       * Reset builder state
       */
      reset: () => {
        set({
          canvasElements: [],
          selectedElement: null,
          selectedElements: [],
          formTitle: 'Untitled File Request',
          history: [],
          historyIndex: -1,
          clipboard: null,
          branding: {
            accentColor: '#ffffff',
            pageTitle: '',
            successMessage: 'Thank you! Your file has been uploaded successfully.',
            showPoweredBy: true,
            instructions: ''
          },
          settings: {
            allowedFileTypes: ['*'],
            maxFileSize: 104857600,
            maxFiles: 10,
            customFileTypes: ''
          }
        })
      },

      /**
       * Generate unique element ID
       * @returns {string} Unique ID
       */
      generateId: () => {
        return `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      },

      // Computed selectors

      /**
       * Check if undo is available
       * @returns {boolean}
       */
      canUndo: () => get().historyIndex > 0,

      /**
       * Check if redo is available
       * @returns {boolean}
       */
      canRedo: () => get().historyIndex < get().history.length - 1,

      /**
       * Get element count
       * @returns {number}
       */
      getElementCount: () => get().canvasElements.length
    }),
    { name: 'BuilderStore' }
  )
)

// Export hook
export const useBuilder = useBuilderStore

export default useBuilderStore
