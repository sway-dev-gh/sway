import React, { useState } from 'react'
import { useWorkspace } from '../stores/WorkspaceStore'

const GuestForm = ({ guestToken }) => {
  const { actions } = useWorkspace()
  const [guestName, setGuestName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Extract workspace ID from guest token (demo implementation)
  const workspaceId = guestToken ? atob(guestToken).split(':')[0] : null

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!guestName.trim()) {
      setError('Please enter your name')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await actions.joinAsGuest(guestToken, guestName.trim(), workspaceId)
    } catch (err) {
      setError(err.message || 'Failed to join workspace')
    }

    setIsLoading(false)
  }

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff'
    }}>
      <div style={{
        width: '400px',
        border: '1px solid #333333',
        background: '#000000',
        padding: '32px'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            SwayFiles
          </div>
          <div style={{
            fontSize: '12px',
            color: '#666666',
            marginBottom: '16px'
          }}>
            Guest Collaboration
          </div>
          <div style={{
            fontSize: '11px',
            color: '#999999',
            padding: '8px',
            background: '#111111',
            border: '1px solid #333333'
          }}>
            🎉 You've been invited to collaborate!<br />
            Enter your name to join this workspace
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#999999',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Your Name
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              required
              style={{
                width: '100%',
                background: '#111111',
                border: '1px solid #333333',
                color: '#ffffff',
                padding: '12px',
                fontSize: '14px',
                outline: 'none'
              }}
              placeholder="Enter your name (e.g., Alex Smith)"
            />
          </div>

          {error && (
            <div style={{
              background: '#ff4757',
              color: '#ffffff',
              padding: '8px 12px',
              fontSize: '12px',
              marginBottom: '16px',
              border: '1px solid #ff4757'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              background: isLoading ? '#333333' : '#ffffff',
              color: isLoading ? '#666666' : '#000000',
              border: 'none',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            {isLoading ? 'Joining...' : 'Join Workspace'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '11px',
          color: '#666666'
        }}>
          <div style={{ marginBottom: '8px' }}>
            ✨ You're joining as a guest collaborator
          </div>
          <div style={{
            fontSize: '10px',
            color: '#333333'
          }}>
            Guest access • No account required
          </div>
        </div>
      </div>
    </div>
  )
}

export default GuestForm