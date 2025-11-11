import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import theme from '../theme'
import { modalVariants, backdropVariants } from '../lib/animations/variants'
import useFocusTrap from '../hooks/useFocusTrap'

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
  const { containerRef } = useFocusTrap(isOpen)

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={backdropVariants}
          style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }} onClick={onCancel}>
          <motion.div
            ref={containerRef}
            variants={modalVariants}
            onClick={e => e.stopPropagation()}
            style={{
        background: theme.colors.bg.page,
        border: `1px solid ${theme.colors.border.light}`,
        borderRadius: theme.radius.lg,
        padding: '24px',
        maxWidth: '400px',
        width: '100%'
      }}>
            <h3
              id="modal-title"
              style={{
          fontSize: theme.fontSize.lg,
          fontWeight: theme.weight.semibold,
          color: theme.colors.text.primary,
          marginBottom: '12px'
        }}>{title}</h3>
        <p
          id="modal-description"
          style={{
          fontSize: theme.fontSize.sm,
          color: theme.colors.text.secondary,
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            aria-label="Cancel"
            style={{...theme.buttons.secondary.base}}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            aria-label={danger ? 'Confirm dangerous action' : 'Confirm'}
            style={danger ? {...theme.buttons.danger.base} : {...theme.buttons.primary.base}}
          >
            {confirmText}
          </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmModal
