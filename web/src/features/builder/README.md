# Builder Feature Module

This directory contains the refactored form builder components, extracted from the original 4000+ line `Requests.jsx` file.

## Directory Structure

```
builder/
├── components/          # React components
│   ├── BuilderToolbar.jsx
│   ├── BuilderSidebar.jsx
│   ├── BuilderCanvas.jsx
│   ├── PropertiesPanel.jsx
│   ├── ElementRenderer.jsx
│   └── index.js
├── hooks/              # Custom React hooks
│   ├── useCanvasHistory.js
│   ├── useCanvasElements.js
│   ├── useCanvasDrag.js
│   ├── useCanvasZoom.js
│   └── index.js
├── constants/          # Shared constants
│   ├── templates.js
│   ├── componentLibrary.js
│   └── index.js
└── README.md
```

## Components

### BuilderToolbar
**Location:** `components/BuilderToolbar.jsx`

Top toolbar containing:
- Back navigation
- Form title (editable)
- Zoom controls (+/- and percentage display)
- Grid snap toggle
- Undo/Redo buttons
- Preview, Save, and Publish actions

**Props:**
- `formTitle`: Current form title
- `onTitleChange`: Title change handler
- `zoomControls`: Zoom state and methods from `useCanvasZoom`
- `onUndo`, `onRedo`: History navigation
- `canUndo`, `canRedo`: History state
- `onPreview`, `onSave`, `onPublish`: Action handlers
- `snapToGrid`, `onToggleSnap`: Grid snap controls

### BuilderSidebar
**Location:** `components/BuilderSidebar.jsx`

Left sidebar with two tabs:
- **Templates Tab**: Pre-configured form layouts (free and pro)
- **Elements Tab**: Draggable component library

**Props:**
- `activeTab`: Current tab ('templates' or 'elements')
- `onTabChange`: Tab switch handler
- `onTemplateClick`: Template selection
- `onComponentDragStart`: Component drag initialization
- `userPlan`: User's subscription level
- `onUpgradeClick`: Upgrade modal trigger

### BuilderCanvas
**Location:** `components/BuilderCanvas.jsx`

Main canvas area where form elements are positioned and edited.

**Features:**
- Drag and drop support
- Element rendering via ElementRenderer
- Empty state display
- Zoom transformation
- Multi-element rendering

**Props:**
- `elements`: Array of canvas elements
- `selectedElement`: Currently selected element
- `isDragging`, `isDraggingElement`: Drag states
- `zoom`: Canvas zoom level
- `onDrop`, `onDragOver`: Drop handlers
- `onClick`, `onMouseMove`, `onMouseUp`: Mouse event handlers
- `onElementClick`, `onElementMouseDown`: Element interaction
- `isElementLocked`: Lock status checker

### PropertiesPanel
**Location:** `components/PropertiesPanel.jsx`

Bottom panel for editing selected element properties.

**Features:**
- Position controls (X, Y, Width, Height)
- Dynamic property editors based on element type
- Copy/Paste functionality
- Layer controls (bring forward, send back, etc.)
- Lock/unlock element
- Duplicate and delete actions

**Props:**
- `selectedElement`: Element being edited
- `onPropertyChange`: Property update handler
- `onCopy`, `onPaste`: Clipboard operations
- `onDuplicate`, `onDelete`: Element operations
- `onLockToggle`: Lock state toggle
- `onBringForward`, `onSendBackward`, etc.: Layer operations
- `hasClipboard`: Whether clipboard has content
- `isLocked`: Element lock state

### ElementRenderer
**Location:** `components/ElementRenderer.jsx`

Renders individual canvas elements based on their type.

**Supported Element Types:**
- text, heading
- text-input, textarea
- file-upload, multi-file
- button
- image-gallery
- divider, spacer
- And more...

**Props:**
- `element`: Element data (type, properties, position, size)
- `isSelected`: Selection state
- `isLocked`: Lock state
- `isDragging`: Drag state
- `onMouseDown`, `onClick`: Interaction handlers

## Hooks

### useCanvasHistory
**Location:** `hooks/useCanvasHistory.js`

Manages undo/redo functionality for canvas operations.

**API:**
```javascript
const {
  saveToHistory,  // Save current state
  undo,           // Undo to previous state
  redo,           // Redo to next state
  canUndo,        // Boolean - can undo
  canRedo,        // Boolean - can redo
  clearHistory    // Clear all history
} = useCanvasHistory()
```

### useCanvasElements
**Location:** `hooks/useCanvasElements.js`

Manages CRUD operations for canvas elements.

**API:**
```javascript
const {
  // State
  elements,
  selectedElement,
  lockedElements,
  clipboard,

  // Element operations
  addElement,
  updateElement,
  updateElementProperty,
  deleteElement,
  duplicateElement,

  // Clipboard
  copyToClipboard,
  pasteFromClipboard,

  // Z-index
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,

  // Lock
  isElementLocked,
  toggleElementLock
} = useCanvasElements(saveToHistory)
```

### useCanvasDrag
**Location:** `hooks/useCanvasDrag.js`

Manages drag and drop operations for both sidebar components and canvas elements.

**API:**
```javascript
const {
  // Component drag (from sidebar)
  isDragging,
  draggedComponent,
  startComponentDrag,
  endComponentDrag,

  // Element drag (on canvas)
  isDraggingElement,
  dragOffset,
  startElementDrag,
  endElementDrag,
  calculateDragPosition,

  // Resize
  isResizing,
  resizeHandle,
  startResize,
  endResize,
  calculateResizeSize,

  // Utilities
  snapToGridValue,
  reset
} = useCanvasDrag({ snapToGrid, gridSize })
```

### useCanvasZoom
**Location:** `hooks/useCanvasZoom.js`

Manages canvas zoom level.

**API:**
```javascript
const {
  zoom,           // Current zoom level (0.25 - 2)
  zoomPercentage, // Formatted string (e.g., "100%")
  canZoomIn,      // Boolean
  canZoomOut,     // Boolean
  zoomIn,         // Increase zoom
  zoomOut,        // Decrease zoom
  resetZoom,      // Reset to 100%
  setZoomLevel    // Set specific level
} = useCanvasZoom()
```

## Constants

### Templates
**Location:** `constants/templates.js`

Pre-configured form templates with positioned elements.

```javascript
import { TEMPLATES } from '../constants'
// Each template has: id, name, description, plan, preview, elements[]
```

### Component Library
**Location:** `constants/componentLibrary.js`

Available builder elements with metadata.

```javascript
import { COMPONENT_LIBRARY, DEFAULT_PROPERTIES, DEFAULT_SIZES } from '../constants'
```

## Usage Example

```javascript
import {
  BuilderToolbar,
  BuilderSidebar,
  BuilderCanvas,
  PropertiesPanel
} from '../features/builder/components'

import {
  useCanvasHistory,
  useCanvasElements,
  useCanvasDrag,
  useCanvasZoom
} from '../features/builder/hooks'

function FormBuilder() {
  const { saveToHistory, undo, redo, canUndo, canRedo } = useCanvasHistory()
  const elementsAPI = useCanvasElements(saveToHistory)
  const dragAPI = useCanvasDrag({ snapToGrid: true })
  const zoomAPI = useCanvasZoom()

  return (
    <div>
      <BuilderToolbar
        formTitle="My Form"
        onTitleChange={...}
        zoomControls={zoomAPI}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        {...}
      />
      <div style={{ display: 'flex' }}>
        <BuilderSidebar {...} />
        <BuilderCanvas
          elements={elementsAPI.elements}
          zoom={zoomAPI.zoom}
          {...}
        />
      </div>
      <PropertiesPanel
        selectedElement={elementsAPI.selectedElement}
        {...}
      />
    </div>
  )
}
```

## Benefits of This Structure

1. **Modularity**: Each component has a single responsibility
2. **Reusability**: Components and hooks can be used independently
3. **Testability**: Smaller units are easier to test
4. **Maintainability**: Changes are isolated to specific files
5. **Type Safety**: JSDoc comments provide inline documentation
6. **Performance**: Easier to optimize individual components

## Migration Notes

When updating `Requests.jsx`:
1. Import components and hooks from this directory
2. Replace inline component definitions with imported components
3. Replace local state and functions with hook equivalents
4. Keep business logic (API calls, form submission) in the page component
5. Pass necessary props down to child components

## Next Steps

- Add PropTypes or TypeScript for better type checking
- Create unit tests for hooks
- Add integration tests for components
- Consider Zustand store for global state management
- Add error boundaries for component isolation
