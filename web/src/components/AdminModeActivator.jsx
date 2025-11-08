import { useState, useEffect, useRef } from 'react'
import theme from '../theme'

function AdminModeActivator({ onActivate }) {
  const [showModal, setShowModal] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(15)
  const keySequence = useRef([])
  const timerRef = useRef(null)

  // Secret key sequence: Ctrl+Shift+A+D+M+I+N
  const SECRET_SEQUENCE = ['Control', 'Shift', 'a', 'd', 'm', 'i', 'n']
  const ADMIN_PASSWORD = '1TcY38sGrA1;'

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Add key to sequence
      keySequence.current.push(e.key)

      // Keep only last 7 keys
      if (keySequence.current.length > SECRET_SEQUENCE.length) {
        keySequence.current.shift()
      }

      // Check if sequence matches
      const sequenceMatches = SECRET_SEQUENCE.every((key, index) => {
        return keySequence.current[index]?.toLowerCase() === key.toLowerCase()
      })

      if (sequenceMatches) {
        keySequence.current = []
        openAdminModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (showModal) {
      setTimeLeft(15)
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            closeModal()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [showModal])

  const openAdminModal = () => {
    setShowModal(true)
    setPassword('')
    setError('')
  }

  const closeModal = () => {
    setShowModal(false)
    setPassword('')
    setError('')
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('adminKey', ADMIN_PASSWORD)
      closeModal()
      onActivate()
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }

  if (!showModal) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: theme.colors.bg.secondary,
        border: `2px solid ${theme.colors.white}`,
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '450px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(255, 255, 255, 0.1)',
        animation: 'slideIn 0.3s ease-out'
      }}>
        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {/* Warning Icon */}
        <div style={{
          width: '60px',
          height: '60px',
          margin: '0 auto 24px',
          background: theme.colors.white,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          fontWeight: theme.weight.bold,
          color: theme.colors.black
        }}>
          ⚠
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: theme.weight.semibold,
          color: theme.colors.white,
          textAlign: 'center',
          margin: '0 0 12px 0'
        }}>
          ADMIN MODE
        </h2>

        {/* Subtitle */}
        <p style={{
          fontSize: '14px',
          color: theme.colors.text.muted,
          textAlign: 'center',
          margin: '0 0 32px 0'
        }}>
          You are about to enter admin mode
        </p>

        {/* Timer */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '48px',
            fontWeight: theme.weight.bold,
            color: timeLeft <= 5 ? '#ff4444' : theme.colors.white,
            fontFamily: 'monospace',
            transition: 'color 0.3s'
          }}>
            {timeLeft}
          </div>
          <div style={{
            fontSize: '12px',
            color: theme.colors.text.tertiary,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            seconds remaining
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: theme.weight.medium,
              color: theme.colors.text.secondary,
              marginBottom: '8px'
            }}>
              Enter Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              autoFocus
              placeholder="Enter password..."
              style={{
                width: '100%',
                padding: '14px 16px',
                background: theme.colors.bg.page,
                border: `2px solid ${error ? '#ff4444' : theme.colors.border.medium}`,
                borderRadius: '8px',
                color: theme.colors.text.primary,
                fontSize: '16px',
                fontFamily: 'monospace',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
            {error && (
              <div style={{
                marginTop: '8px',
                fontSize: '13px',
                color: '#ff4444'
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            <button
              type="button"
              onClick={closeModal}
              style={{
                flex: 1,
                padding: '12px',
                background: 'transparent',
                border: `2px solid ${theme.colors.border.medium}`,
                borderRadius: '8px',
                color: theme.colors.text.secondary,
                fontSize: '14px',
                fontWeight: theme.weight.medium,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.bg.hover
                e.currentTarget.style.color = theme.colors.text.primary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = theme.colors.text.secondary
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px',
                background: theme.colors.white,
                border: 'none',
                borderRadius: '8px',
                color: theme.colors.black,
                fontSize: '14px',
                fontWeight: theme.weight.semibold,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              Activate Admin Mode
            </button>
          </div>
        </form>

        {/* Hint */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '6px',
          fontSize: '11px',
          color: theme.colors.text.tertiary,
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          Tip: Press Ctrl+Shift+A+D+M+I+N to reopen this dialog
        </div>
      </div>
    </div>
  )
}

export default AdminModeActivator
