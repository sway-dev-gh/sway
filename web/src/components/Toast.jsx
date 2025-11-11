import { useEffect } from 'react'
import { motion } from 'framer-motion'
import theme from '../theme'
import { toastVariants } from '../lib/animations/variants'

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
          background: 'rgba(255, 255, 255, 0.95)',
          borderColor: theme.colors.white,
          color: theme.colors.black
        }
      case 'error':
        return {
          background: 'rgba(239, 68, 68, 0.95)',
          borderColor: theme.colors.error,
          color: theme.colors.white
        }
      case 'warning':
        return {
          background: 'rgba(255, 255, 255, 0.9)',
          borderColor: theme.colors.text.secondary,
          color: theme.colors.black
        }
      default: // info
        return {
          background: 'rgba(10, 10, 10, 0.95)',
          borderColor: theme.colors.border.light,
          color: theme.colors.white
        }
    }
  }

  const typeStyles = getTypeStyles()

  return (
    <motion.div
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={toastVariants}
      style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      padding: '12px 20px',
      background: typeStyles.background,
      border: `1px solid ${typeStyles.borderColor}`,
      borderRadius: theme.radius.md,
      color: typeStyles.color,
      fontSize: theme.fontSize.sm,
      fontWeight: theme.weight.medium,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 9999,
      maxWidth: '400px',
      fontFamily: theme.fontFamily.base
    }}>
      {message}
    </motion.div>
  )
}

export default Toast
