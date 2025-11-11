import { useRef } from 'react'
import theme from '../../../theme'
import ElementRenderer from './ElementRenderer'

/**
 * BuilderCanvas - Main canvas area for building forms
 *
 * @param {Object} props
 * @param {Array} props.elements - Canvas elements
 * @param {Object} props.selectedElement - Currently selected element
 * @param {Array} props.selectedElements - Multi-selected elements
 * @param {boolean} props.isDragging - Whether dragging from sidebar
 * @param {boolean} props.isDraggingElement - Whether dragging an element
 * @param {number} props.zoom - Canvas zoom level
 * @param {Function} props.onDrop - Drop handler
 * @param {Function} props.onDragOver - Drag over handler
 * @param {Function} props.onClick - Canvas click handler
 * @param {Function} props.onMouseMove - Mouse move handler
 * @param {Function} props.onMouseUp - Mouse up handler
 * @param {Function} props.onElementClick - Element click handler
 * @param {Function} props.onElementMouseDown - Element mouse down handler
 * @param {Function} props.isElementLocked - Check if element is locked
 */
function BuilderCanvas({
  elements,
  selectedElement,
  selectedElements,
  isDragging,
  isDraggingElement,
  zoom,
  onDrop,
  onDragOver,
  onClick,
  onMouseMove,
  onMouseUp,
  onElementClick,
  onElementMouseDown,
  isElementLocked
}) {
  const canvasRef = useRef(null)

  return (
    <div style={{
      flex: 1,
      overflow: 'auto',
      background: theme.colors.bg.hover,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div
        ref={canvasRef}
        role="application"
        aria-label="Form builder canvas"
        aria-describedby="canvas-description"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        tabIndex={0}
        style={{
          width: '1000px',
          minHeight: '1400px',
          background: theme.colors.bg.page,
          borderRadius: '8px',
          position: 'relative',
          border: isDragging ? `2px dashed ${theme.colors.white}` : `1px solid ${theme.colors.border.dark}`,
          overflow: 'visible',
          transform: `scale(${zoom})`,
          transformOrigin: 'top left'
        }}
      >
        {/* Screen reader description */}
        <span id="canvas-description" style={{ position: 'absolute', left: '-10000px' }}>
          Form builder canvas. Use arrow keys to move selected elements, Delete to remove, Escape to deselect.
        </span>
        {/* Empty State */}
        {elements.length === 0 && !isDragging && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: theme.colors.text.tertiary,
            pointerEvents: 'none'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>↓</div>
            <div style={{ fontSize: '16px' }}>Drag elements or choose a template to start</div>
          </div>
        )}

        {/* Render Elements */}
        {elements.map(element => (
          <ElementRenderer
            key={element.id}
            element={element}
            isSelected={selectedElement?.id === element.id || selectedElements.some(el => el.id === element.id)}
            isLocked={isElementLocked(element.id)}
            isDragging={isDraggingElement}
            onMouseDown={(e) => onElementMouseDown(element, e)}
            onClick={(e) => onElementClick(element, e)}
          />
        ))}

        {/* Drop Hint */}
        {isDragging && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '18px',
            color: theme.colors.text.secondary,
            pointerEvents: 'none'
          }}>
            Drop here to add element
          </div>
        )}
      </div>
    </div>
  )
}

export default BuilderCanvas
