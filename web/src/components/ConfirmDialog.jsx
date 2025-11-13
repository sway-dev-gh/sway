import React from 'react'

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  confirmButtonColor = '#000000',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
        {/* Title */}
        {title && (
          <h3 style={{
            color: '#000000',
            fontSize: '16px',
            fontWeight: '600',
            margin: '0 0 12px 0',
            lineHeight: '1.4'
          }}>
            {title}
          </h3>
        )}

        {/* Message */}
        <p style={{
          color: '#666666',
          fontSize: '14px',
          lineHeight: '1.5',
          margin: '0 0 20px 0',
          whiteSpace: 'pre-line'
        }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              color: '#666666',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              padding: '8px 16px',
              minWidth: '80px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            style={{
              backgroundColor: '#000000',
              border: '1px solid #000000',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              padding: '8px 16px',
              minWidth: '80px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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