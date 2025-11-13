import React from 'react'

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'DELETE',
  cancelText = 'CANCEL',
  confirmButtonColor = '#ff0000', // Red for destructive actions
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
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      fontFamily: 'monospace'
    }}>
      <div style={{
        backgroundColor: '#000000',
        border: '2px solid #ffffff',
        padding: '20px',
        maxWidth: '450px',
        width: '100%'
      }}>
        {/* Title */}
        {title && (
          <div style={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 'bold',
            margin: '0 0 12px 0',
            fontFamily: 'monospace',
            textTransform: 'uppercase'
          }}>
            > {title}
          </div>
        )}

        {/* Message */}
        <div style={{
          color: '#ffffff',
          fontSize: '12px',
          lineHeight: '1.4',
          margin: '0 0 20px 0',
          whiteSpace: 'pre-line',
          fontFamily: 'monospace'
        }}>
          {message}
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              backgroundColor: '#000000',
              border: '1px solid #ffffff',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '8px 16px',
              fontFamily: 'monospace',
              textTransform: 'uppercase'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#ffffff'
              e.target.style.color = '#000000'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#000000'
              e.target.style.color = '#ffffff'
            }}
          >
            [{cancelText}]
          </button>

          <button
            onClick={onConfirm}
            style={{
              backgroundColor: '#000000',
              border: '1px solid #ff0000',
              color: '#ff0000',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '8px 16px',
              fontFamily: 'monospace',
              textTransform: 'uppercase'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#ff0000'
              e.target.style.color = '#000000'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#000000'
              e.target.style.color = '#ff0000'
            }}
          >
            [{confirmText}]
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog