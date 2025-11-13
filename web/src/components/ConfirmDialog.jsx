import React from 'react'

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  confirmButtonColor = '#ef4444', // Red for destructive actions
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Title */}
        {title && (
          <h3 style={{
            color: '#fff',
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 16px 0',
            lineHeight: '1.4'
          }}>
            {title}
          </h3>
        )}

        {/* Message */}
        <p style={{
          color: '#ccc',
          fontSize: '14px',
          lineHeight: '1.5',
          margin: '0 0 24px 0',
          whiteSpace: 'pre-line'
        }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #444',
              borderRadius: '8px',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              padding: '8px 16px',
              transition: 'all 0.2s ease',
              minWidth: '80px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#333'
              e.target.style.borderColor = '#555'
              e.target.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.borderColor = '#444'
              e.target.style.color = '#ccc'
            }}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            style={{
              backgroundColor: confirmButtonColor,
              border: `1px solid ${confirmButtonColor}`,
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              padding: '8px 16px',
              transition: 'all 0.2s ease',
              minWidth: '80px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = confirmButtonColor === '#ef4444' ? '#dc2626' : confirmButtonColor
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = `0 4px 12px ${confirmButtonColor}40`
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = confirmButtonColor
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

    </div>
  )
}

export default ConfirmDialog