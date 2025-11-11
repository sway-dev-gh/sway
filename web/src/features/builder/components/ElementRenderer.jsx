import { motion } from 'framer-motion'
import theme from '../../../theme'

/**
 * ElementRenderer - Renders individual canvas elements
 *
 * @param {Object} props
 * @param {Object} props.element - Element to render
 * @param {boolean} props.isSelected - Whether element is selected
 * @param {boolean} props.isLocked - Whether element is locked
 * @param {boolean} props.isDragging - Whether element is being dragged
 * @param {Function} props.onMouseDown - Mouse down handler
 * @param {Function} props.onClick - Click handler
 */
function ElementRenderer({ element, isSelected, isLocked, isDragging, onMouseDown, onClick }) {
  const { type, properties, x, y, width, height } = element

  // Animation variants for smooth element transitions
  const elementVariants = {
    rest: {
      scale: 1,
      transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] }
    },
    hover: {
      scale: isLocked ? 1 : 1.005,
      transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] }
    },
    dragging: {
      scale: 1.02,
      transition: { duration: 0.1, ease: [0.22, 1, 0.36, 1] }
    }
  }

  const elementStyle = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: type === 'textarea' || type === 'rich-text' || type === 'signature' ? `${height}px` : 'auto',
    minHeight: type === 'spacer' ? `${properties.height || '40px'}` : 'auto',
    cursor: isLocked ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab'),
    border: isSelected ? `2px solid ${theme.colors.white}` : '2px solid transparent',
    outline: isSelected ? '2px solid rgba(59, 130, 246, 0.3)' : 'none',
    outlineOffset: '2px',
    borderRadius: '4px',
    boxSizing: 'border-box',
    opacity: isLocked ? 0.7 : 1
  }

  const commonProps = {
    key: element.id,
    as: motion.div,
    initial: "rest",
    animate: isDragging ? "dragging" : "rest",
    whileHover: isLocked ? "rest" : "hover",
    variants: elementVariants,
    layout: true,
    transition: { type: "spring", stiffness: 400, damping: 30 },
    style: elementStyle,
    onMouseDown,
    onClick
  }

  // Wrapper to add lock indicator
  const wrapWithLockIndicator = (content) => {
    if (isLocked && isSelected) {
      return (
        <>
          {content}
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: theme.colors.white,
            color: theme.colors.black,
            borderRadius: '4px',
            padding: '4px 6px',
            fontSize: '10px',
            fontWeight: '600',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            LOCKED
          </div>
        </>
      )
    }
    return content
  }

  // Individual element renderers
  const renderText = () => (
    <motion.div {...commonProps}>
      <div style={{
        fontSize: properties.fontSize,
        color: properties.color,
        fontWeight: properties.fontWeight,
        textAlign: properties.textAlign,
        padding: '8px',
        userSelect: 'none'
      }}>
        {properties.content}
      </div>
    </motion.div>
  )

  const renderHeading = () => (
    <motion.div {...commonProps}>
      <div style={{
        fontSize: properties.fontSize,
        color: properties.color,
        fontWeight: properties.fontWeight,
        textAlign: properties.textAlign,
        padding: '8px',
        userSelect: 'none'
      }}>
        {properties.content}
      </div>
    </motion.div>
  )

  const renderTextInput = () => (
    <motion.div {...commonProps}>
      <div style={{ padding: '8px' }}>
        {properties.label && (
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: theme.colors.text.primary }}>
            {properties.label} {properties.required && <span style={{ color: theme.colors.error }}>*</span>}
          </div>
        )}
        <input
          type="text"
          placeholder={properties.placeholder}
          readOnly
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            border: `1px solid ${theme.colors.border.dark}`,
            borderRadius: '4px',
            backgroundColor: theme.colors.bg.hover,
            color: theme.colors.text.primary,
            pointerEvents: 'none'
          }}
        />
      </div>
    </motion.div>
  )

  const renderTextarea = () => (
    <motion.div {...commonProps}>
      <div style={{ padding: '8px', height: '100%' }}>
        {properties.label && (
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: theme.colors.text.primary }}>
            {properties.label} {properties.required && <span style={{ color: theme.colors.error }}>*</span>}
          </div>
        )}
        <textarea
          placeholder={properties.placeholder}
          readOnly
          rows={properties.rows || 4}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            border: `1px solid ${theme.colors.border.dark}`,
            borderRadius: '4px',
            backgroundColor: theme.colors.bg.hover,
            color: theme.colors.text.primary,
            pointerEvents: 'none',
            resize: 'none',
            fontFamily: 'inherit'
          }}
        />
      </div>
    </motion.div>
  )

  const renderFileUpload = () => (
    <motion.div {...commonProps}>
      <div style={{
        backgroundColor: theme.colors.bg.hover,
        border: `2px dashed ${theme.colors.border.dark}`,
        borderRadius: '8px',
        padding: '24px',
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '500', color: theme.colors.text.primary }}>{properties.label}</div>
        <div style={{ fontSize: '11px', color: theme.colors.text.secondary, marginTop: '4px' }}>
          {properties.multiple ? 'Multiple files' : 'Single file'}
        </div>
      </div>
    </motion.div>
  )

  const renderButton = () => (
    <motion.div {...commonProps}>
      <button style={{
        backgroundColor: properties.backgroundColor,
        color: properties.color,
        fontSize: '16px',
        fontWeight: '600',
        padding: '12px 32px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        fontFamily: 'inherit'
      }}>
        {properties.label}
      </button>
    </motion.div>
  )

  const renderMultiFile = () => (
    <motion.div {...commonProps}>
      <div style={{ padding: '8px', height: '100%' }}>
        {properties.label && (
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: theme.colors.text.primary }}>
            {properties.label}
          </div>
        )}
        <div style={{
          width: '100%',
          height: 'calc(100% - 32px)',
          backgroundColor: theme.colors.bg.hover,
          border: `2px dashed ${theme.colors.border.dark}`,
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: '600', color: theme.colors.text.secondary }}>MULTI FILE</div>
          <div style={{ fontSize: '13px', color: theme.colors.text.secondary }}>
            Upload up to {properties.maxFiles} files
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderImageGallery = () => (
    <motion.div {...commonProps}>
      <div style={{ padding: '8px', height: '100%' }}>
        {properties.label && (
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: theme.colors.text.primary }}>
            {properties.label}
          </div>
        )}
        <div style={{
          width: '100%',
          height: 'calc(100% - 32px)',
          display: 'grid',
          gridTemplateColumns: properties.gridSize === '4x4' ? 'repeat(4, 1fr)' :
                              properties.gridSize === '3x3' ? 'repeat(3, 1fr)' :
                              'repeat(3, 1fr)',
          gap: '8px'
        }}>
          {Array.from({ length: properties.gridSize === '4x4' ? 16 : properties.gridSize === '3x3' ? 9 : 6 }).map((_, i) => (
            <div key={i} style={{
              backgroundColor: theme.colors.bg.hover,
              border: `1px solid ${theme.colors.border.dark}`,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              aspectRatio: '1/1'
            }}>
              <span style={{ fontSize: '20px', color: theme.colors.text.tertiary }}>+</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )

  const renderDivider = () => (
    <motion.div {...commonProps}>
      <div style={{
        width: '100%',
        height: properties.thickness || '1px',
        backgroundColor: properties.color || theme.colors.text.tertiary,
        margin: '16px 0'
      }} />
    </motion.div>
  )

  const renderSpacer = () => (
    <motion.div {...commonProps}>
      <div style={{
        width: '100%',
        height: properties.height || '40px',
        backgroundColor: 'transparent',
        border: `1px dashed ${theme.colors.border.dark}`,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.colors.text.secondary,
        fontSize: '11px'
      }}>
        Spacer
      </div>
    </motion.div>
  )

  // Switch based on element type
  switch (type) {
    case 'text':
      return wrapWithLockIndicator(renderText())
    case 'heading':
      return wrapWithLockIndicator(renderHeading())
    case 'text-input':
      return wrapWithLockIndicator(renderTextInput())
    case 'textarea':
      return renderTextarea()
    case 'file-upload':
      return renderFileUpload()
    case 'button':
      return renderButton()
    case 'multi-file':
      return renderMultiFile()
    case 'image-gallery':
      return renderImageGallery()
    case 'divider':
      return renderDivider()
    case 'spacer':
      return renderSpacer()
    default:
      return null
  }
}

export default ElementRenderer
