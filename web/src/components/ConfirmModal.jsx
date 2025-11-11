import theme from '../theme'

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
  if (!isOpen) return null

  return (
    <div style={{
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
      <div style={{
        background: theme.colors.bg.page,
        border: `1px solid ${theme.colors.border.light}`,
        borderRadius: theme.radius.lg,
        padding: '24px',
        maxWidth: '400px',
        width: '100%'
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{
          fontSize: theme.fontSize.lg,
          fontWeight: theme.weight.semibold,
          color: theme.colors.text.primary,
          marginBottom: '12px'
        }}>{title}</h3>
        <p style={{
          fontSize: theme.fontSize.sm,
          color: theme.colors.text.secondary,
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{...theme.buttons.secondary.base}}>
            {cancelText}
          </button>
          <button onClick={onConfirm} style={danger ? {...theme.buttons.danger.base} : {...theme.buttons.primary.base}}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
