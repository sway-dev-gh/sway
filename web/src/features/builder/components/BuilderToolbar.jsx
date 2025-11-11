import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import theme from '../../../theme'

/**
 * BuilderToolbar - Top toolbar with title, zoom controls, and actions
 *
 * @param {Object} props
 * @param {string} props.formTitle - Current form title
 * @param {Function} props.onTitleChange - Title change handler
 * @param {Object} props.zoomControls - Zoom state and controls
 * @param {Function} props.onUndo - Undo handler
 * @param {Function} props.onRedo - Redo handler
 * @param {boolean} props.canUndo - Whether undo is available
 * @param {boolean} props.canRedo - Whether redo is available
 * @param {Function} props.onPreview - Preview handler
 * @param {Function} props.onSave - Save handler
 * @param {Function} props.onPublish - Publish handler
 * @param {boolean} props.snapToGrid - Grid snap state
 * @param {Function} props.onToggleSnap - Toggle snap handler
 */
function BuilderToolbar({
  formTitle,
  onTitleChange,
  zoomControls,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onPreview,
  onSave,
  onPublish,
  snapToGrid,
  onToggleSnap
}) {
  const navigate = useNavigate()
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  return (
    <header
      role="banner"
      aria-label="Form builder toolbar"
      style={{
        height: '60px',
        borderBottom: `1px solid ${theme.colors.border.dark}`,
        background: theme.colors.bg.hover,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0
      }}
    >
      {/* Left - Back + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        <button
          onClick={() => navigate('/dashboard')}
          aria-label="Back to dashboard"
          style={{
            ...theme.buttons.secondary.base,
            padding: '8px 16px',
            borderRadius: theme.radius.sm,
            fontSize: theme.fontSize.sm
          }}
        >
          ← Back
        </button>

        {isEditingTitle ? (
          <input
            type="text"
            value={formTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
            autoFocus
            aria-label="Form title"
            placeholder="Enter form title"
            style={{
              background: theme.colors.bg.page,
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: theme.radius.md,
              padding: '8px 12px',
              fontSize: theme.fontSize.base,
              color: theme.colors.text.primary,
              fontWeight: theme.weight.semibold,
              outline: 'none',
              minWidth: '300px'
            }}
          />
        ) : (
          <h1
            onClick={() => setIsEditingTitle(true)}
            role="button"
            tabIndex={0}
            aria-label="Click to edit form title"
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsEditingTitle(true)}
            style={{
              fontSize: theme.fontSize.lg,
              fontWeight: theme.weight.semibold,
              color: theme.colors.text.primary,
              cursor: 'pointer',
              margin: 0
            }}
          >
            {formTitle}
          </h1>
        )}
      </div>

      {/* Center - Zoom + Controls */}
      <div role="toolbar" aria-label="Builder controls" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Zoom Controls */}
        <div role="group" aria-label="Zoom controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={zoomControls.zoomOut}
            disabled={!zoomControls.canZoomOut}
            aria-label="Zoom out"
            style={{
              ...theme.buttons.secondary.base,
              padding: '6px 12px',
              borderRadius: theme.radius.sm,
              fontSize: theme.fontSize.sm,
              opacity: zoomControls.canZoomOut ? 1 : 0.5,
              cursor: zoomControls.canZoomOut ? 'pointer' : 'not-allowed'
            }}
          >
            -
          </button>
          <span
            role="status"
            aria-label={`Current zoom level: ${zoomControls.zoomPercentage}`}
            style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.text.secondary,
              minWidth: '45px',
              textAlign: 'center'
            }}
          >
            {zoomControls.zoomPercentage}
          </span>
          <button
            onClick={zoomControls.zoomIn}
            disabled={!zoomControls.canZoomIn}
            aria-label="Zoom in"
            style={{
              ...theme.buttons.secondary.base,
              padding: '6px 12px',
              borderRadius: theme.radius.sm,
              fontSize: theme.fontSize.sm,
              opacity: zoomControls.canZoomIn ? 1 : 0.5,
              cursor: zoomControls.canZoomIn ? 'pointer' : 'not-allowed'
            }}
          >
            +
          </button>
        </div>

        {/* Grid Snap Toggle */}
        <button
          onClick={onToggleSnap}
          aria-label={snapToGrid ? 'Grid snap is on, click to turn off' : 'Grid snap is off, click to turn on'}
          aria-pressed={snapToGrid}
          style={{
            ...theme.buttons.secondary.base,
            padding: '6px 12px',
            borderRadius: theme.radius.sm,
            fontSize: '11px',
            background: snapToGrid ? theme.colors.white : 'transparent',
            color: snapToGrid ? theme.colors.black : theme.colors.text.secondary,
            fontFamily: 'inherit',
            fontWeight: '600'
          }}
          title={snapToGrid ? 'Grid Snap: ON (10px)' : 'Grid Snap: OFF'}
        >
          {snapToGrid ? 'Snap: ON' : 'Snap: OFF'}
        </button>

        {/* Divider */}
        <div aria-hidden="true" style={{ width: '1px', height: '24px', background: theme.colors.border.dark }}></div>

        {/* Undo/Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo (Ctrl+Z)"
          style={{
            ...theme.buttons.secondary.base,
            padding: '8px 16px',
            borderRadius: theme.radius.sm,
            fontSize: theme.fontSize.sm,
            color: canUndo ? theme.colors.text.secondary : theme.colors.text.tertiary,
            cursor: canUndo ? 'pointer' : 'not-allowed'
          }}
        >
          Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo (Ctrl+Y)"
          style={{
            ...theme.buttons.secondary.base,
            padding: '8px 16px',
            borderRadius: theme.radius.sm,
            fontSize: theme.fontSize.sm,
            color: canRedo ? theme.colors.text.secondary : theme.colors.text.tertiary,
            cursor: canRedo ? 'pointer' : 'not-allowed'
          }}
        >
          Redo
        </button>
        <button
          aria-label="Preview form"
          style={{
            ...theme.buttons.secondary.base,
            borderRadius: theme.radius.sm
          }}
          onClick={onPreview}
        >
          Preview
        </button>
        <button
          aria-label="Save form (Ctrl+S)"
          style={{
            ...theme.buttons.secondary.base,
            borderRadius: theme.radius.sm
          }}
          onClick={onSave}
        >
          Save
        </button>
        <button
          aria-label="Publish form"
          style={{
            ...theme.buttons.primary.base,
            padding: '10px 24px',
            borderRadius: theme.radius.sm,
            fontWeight: theme.weight.semibold
          }}
          onClick={onPublish}
        >
          Publish
        </button>
      </div>
    </header>
  )
}

export default BuilderToolbar
