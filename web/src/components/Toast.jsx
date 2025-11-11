import { useEffect } from 'react'
import theme from '../theme'

function Toast({ message, type = 'info', duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          background: '#ffffff',
          borderColor: theme.colors.white,
          color: theme.colors.black
        }
      case 'error':
        return {
          background: '#EB5757',
          borderColor: '#EB5757',
          color: theme.colors.white
        }
      case 'warning':
        return {
          background: '#ffffff',
          borderColor: theme.colors.text.secondary,
          color: theme.colors.black
        }
      default: // info
        return {
          background: '#000000',
          borderColor: theme.colors.border.light,
          color: theme.colors.white
        }
    }
  }

  const typeStyles = getTypeStyles()

  return (
    <div
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '8px 12px',
        background: typeStyles.background,
        border: `1px solid ${typeStyles.borderColor}`,
        borderRadius: '6px',
        color: typeStyles.color,
        fontSize: '13px',
        fontWeight: '500',
        zIndex: 9999,
        maxWidth: '400px'
      }}
    >
      {message}
    </div>
  )
}

export default Toast
