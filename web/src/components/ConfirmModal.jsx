import { useEffect, useRef } from 'react'
import theme from '../theme'

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
  const containerRef = useRef(null)

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}
      onClick={onCancel}
    >
      <div
        ref={containerRef}
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.colors.bg.page,
          border: `1px solid ${theme.colors.border.light}`,
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%'
        }}
      >
        <h3
          id="modal-title"
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: '12px'
          }}
        >
          {title}
        </h3>
        <p
          id="modal-description"
          style={{
            fontSize: '13px',
            color: theme.colors.text.secondary,
            marginBottom: '24px',
            lineHeight: '1.5'
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            aria-label="Cancel"
            style={{
              padding: '6px 12px',
              background: 'transparent',
              color: theme.colors.text.primary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            aria-label={danger ? 'Confirm dangerous action' : 'Confirm'}
            style={{
              padding: '6px 12px',
              background: danger ? '#EB5757' : theme.colors.white,
              color: danger ? theme.colors.white : theme.colors.black,
              border: danger ? '1px solid #EB5757' : 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
