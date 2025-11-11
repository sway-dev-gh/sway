import theme from '../../../theme'
import { COMPONENT_LIBRARY } from '../constants'

/**
 * PropertiesPanel - Bottom panel for editing element properties
 *
 * @param {Object} props
 * @param {Object} props.selectedElement - Currently selected element
 * @param {Function} props.onPropertyChange - Property change handler
 * @param {Function} props.onCopy - Copy handler
 * @param {Function} props.onPaste - Paste handler
 * @param {Function} props.onDuplicate - Duplicate handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onLockToggle - Lock toggle handler
 * @param {Function} props.onBringForward - Bring forward handler
 * @param {Function} props.onSendBackward - Send backward handler
 * @param {Function} props.onBringToFront - Bring to front handler
 * @param {Function} props.onSendToBack - Send to back handler
 * @param {boolean} props.hasClipboard - Whether clipboard has content
 * @param {boolean} props.isLocked - Whether element is locked
 */
function PropertiesPanel({
  selectedElement,
  onPropertyChange,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onLockToggle,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  hasClipboard,
  isLocked
}) {
  return (
    <div style={{
      height: '140px',
      borderTop: `1px solid ${theme.colors.border.dark}`,
      background: theme.colors.bg.hover,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Properties Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 20px',
        borderBottom: `1px solid ${theme.colors.border.dark}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: theme.colors.text.primary }}>
            {selectedElement ? COMPONENT_LIBRARY.find(c => c.id === selectedElement.type)?.label : 'Properties'}
          </div>
          {selectedElement && (
            <div style={{ fontSize: '11px', color: theme.colors.text.secondary }}>
              Edit element properties
            </div>
          )}
        </div>
        {selectedElement && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Copy/Paste */}
            <button
              onClick={onCopy}
              style={{
                background: 'transparent',
                border: `1px solid ${theme.colors.border.dark}`,
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                color: theme.colors.text.secondary,
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
              title="Copy (Cmd+C)"
            >
              Copy
            </button>
            <button
              onClick={onPaste}
              disabled={!hasClipboard}
              style={{
                background: 'transparent',
                border: `1px solid ${theme.colors.border.dark}`,
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                color: hasClipboard ? theme.colors.text.secondary : theme.colors.text.tertiary,
                cursor: hasClipboard ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit'
              }}
              title="Paste (Cmd+V)"
            >
              Paste
            </button>

            {/* Layer Controls */}
            <button onClick={onBringToFront} style={{ ...buttonStyle }}>To Front</button>
            <button onClick={onBringForward} style={{ ...buttonStyle }}>Forward</button>
            <button onClick={onSendBackward} style={{ ...buttonStyle }}>Backward</button>
            <button onClick={onSendToBack} style={{ ...buttonStyle }}>To Back</button>

            {/* Lock */}
            <button
              onClick={onLockToggle}
              style={{
                ...buttonStyle,
                background: isLocked ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: isLocked ? theme.colors.text.primary : theme.colors.text.secondary
              }}
            >
              {isLocked ? 'Unlock' : 'Lock'}
            </button>

            {/* Duplicate/Delete */}
            <button onClick={onDuplicate} style={{ ...buttonStyle }}>Duplicate</button>
            <button
              onClick={onDelete}
              style={{
                ...buttonStyle,
                borderColor: theme.colors.error,
                color: theme.colors.error
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Properties Content */}
      <div style={{
        flex: 1,
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '12px 20px'
      }}>
        {selectedElement ? (
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start',
            minWidth: 'fit-content'
          }}>
            {/* Position & Size */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <PropertyInput
                label="X"
                value={selectedElement.x}
                onChange={(value) => onPropertyChange('x', parseInt(value) || 0)}
                type="number"
                width="80px"
              />
              <PropertyInput
                label="Y"
                value={selectedElement.y}
                onChange={(value) => onPropertyChange('y', parseInt(value) || 0)}
                type="number"
                width="80px"
              />
              <PropertyInput
                label="Width"
                value={selectedElement.width}
                onChange={(value) => onPropertyChange('width', parseInt(value) || 50)}
                type="number"
                width="80px"
              />
              <PropertyInput
                label="Height"
                value={selectedElement.height}
                onChange={(value) => onPropertyChange('height', parseInt(value) || 30)}
                type="number"
                width="80px"
              />
            </div>

            {/* Vertical Divider */}
            <div style={{
              width: '1px',
              height: '60px',
              background: theme.colors.border.dark,
              margin: '10px 0'
            }} />

            {/* Dynamic Properties */}
            {Object.entries(selectedElement.properties).map(([key, value]) => (
              <div key={key} style={{ minWidth: typeof value === 'boolean' ? '120px' : '180px' }}>
                <label style={{
                  display: 'block',
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.text.secondary,
                  marginBottom: '6px',
                  fontWeight: theme.weight.semibold,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                {typeof value === 'boolean' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '36px' }}>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => onPropertyChange(key, e.target.checked, true)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.secondary }}>Enabled</span>
                  </label>
                ) : key.toLowerCase().includes('color') ? (
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => onPropertyChange(key, e.target.value, true)}
                    style={{
                      width: '80px',
                      height: '36px',
                      padding: '2px',
                      border: `1px solid ${theme.colors.border.dark}`,
                      borderRadius: theme.radius.sm,
                      background: theme.colors.bg.hover,
                      cursor: 'pointer'
                    }}
                  />
                ) : typeof value === 'number' ? (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => onPropertyChange(key, parseInt(e.target.value) || 0, true)}
                    style={inputStyle}
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onPropertyChange(key, e.target.value, true)}
                    style={{ ...inputStyle, width: key === 'content' || key.toLowerCase().includes('text') || key.toLowerCase().includes('label') ? '200px' : '150px' }}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme.colors.text.secondary,
            fontSize: theme.fontSize.xs
          }}>
            <span style={{ marginRight: '8px', fontSize: theme.fontSize.base, opacity: 0.3 }}>◇</span>
            Select an element to edit its properties
          </div>
        )}
      </div>
    </div>
  )
}

// Helper component for property inputs
function PropertyInput({ label, value, onChange, type = 'text', width = '100px' }) {
  return (
    <div style={{ minWidth: width }}>
      <label style={{
        display: 'block',
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.secondary,
        marginBottom: '6px',
        fontWeight: theme.weight.semibold,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  )
}

const buttonStyle = {
  background: 'transparent',
  border: `1px solid ${theme.colors.border.dark}`,
  borderRadius: '4px',
  padding: '6px 12px',
  fontSize: '12px',
  color: theme.colors.text.secondary,
  cursor: 'pointer',
  fontFamily: 'inherit'
}

const inputStyle = {
  width: '100px',
  padding: '8px',
  fontSize: theme.fontSize.sm,
  border: `1px solid ${theme.colors.border.dark}`,
  borderRadius: theme.radius.sm,
  background: theme.colors.bg.hover,
  color: theme.colors.text.primary,
  fontFamily: 'inherit'
}

export default PropertiesPanel
