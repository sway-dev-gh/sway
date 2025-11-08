import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

function DropboxSync() {
  const navigate = useNavigate()
  const [isConnected, setIsConnected] = useState(false)
  const [autoSync, setAutoSync] = useState(true)
  const [syncFolder, setSyncFolder] = useState('/Sway Files')
  const [lastSync, setLastSync] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const handleConnect = () => {
    // TODO: Implement Dropbox OAuth flow
    setIsConnected(true)
    alert('Dropbox connected successfully!')
  }

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect Dropbox?')) {
      setIsConnected(false)
      setLastSync(null)
    }
  }

  const handleSyncNow = () => {
    setSyncing(true)
    // TODO: Implement actual sync
    setTimeout(() => {
      setLastSync(new Date())
      setSyncing(false)
      alert('Files synced to Dropbox successfully!')
    }, 2000)
  }

  return (
    <>
      <Sidebar />
      <div style={{
        minHeight: '100vh',
        background: theme.colors.bg.page,
        color: theme.colors.text.primary,
        marginTop: '60px'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '60px 40px'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '400',
              margin: 0,
              color: theme.colors.text.primary
            }}>
              Dropbox & Drive Sync
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.muted,
              margin: '8px 0 0 0'
            }}>
              Automatically sync uploaded files to your cloud storage
            </p>
          </div>

          {/* Connection Status */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: `1px solid ${theme.colors.border.light}`,
            padding: '32px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: isConnected ? '24px' : '0'
            }}>
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.primary,
                  margin: '0 0 6px 0'
                }}>
                  Dropbox
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: theme.colors.text.muted,
                  margin: 0
                }}>
                  {isConnected ? 'Connected and syncing' : 'Not connected'}
                </p>
              </div>

              {isConnected ? (
                <button
                  onClick={handleDisconnect}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: theme.weight.medium,
                    color: theme.colors.text.secondary,
                    cursor: 'pointer',
                    transition: theme.transition.normal
                  }}
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  style={{
                    padding: '10px 20px',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: theme.weight.medium,
                    cursor: 'pointer',
                    transition: theme.transition.normal
                  }}
                >
                  Connect Dropbox
                </button>
              )}
            </div>

            {isConnected && lastSync && (
              <div style={{
                fontSize: '12px',
                color: theme.colors.text.tertiary,
                padding: '12px',
                background: theme.colors.bg.page,
                borderRadius: '6px',
                border: `1px solid ${theme.colors.border.medium}`
              }}>
                Last synced: {lastSync.toLocaleString()}
              </div>
            )}
          </div>

          {/* Sync Settings */}
          {isConnected && (
            <>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                border: `1px solid ${theme.colors.border.light}`,
                padding: '32px',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.primary,
                  margin: '0 0 20px 0'
                }}>
                  Sync Settings
                </h3>

                {/* Auto Sync Toggle */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: theme.weight.medium,
                      color: theme.colors.text.primary,
                      marginBottom: '4px'
                    }}>
                      Automatic Sync
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: theme.colors.text.muted
                    }}>
                      Automatically sync new uploads to Dropbox
                    </div>
                  </div>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '48px',
                    height: '24px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: autoSync ? theme.colors.white : theme.colors.border.medium,
                      borderRadius: '24px',
                      transition: theme.transition.normal
                    }}>
                      <span style={{
                        position: 'absolute',
                        height: '18px',
                        width: '18px',
                        left: autoSync ? '27px' : '3px',
                        bottom: '3px',
                        background: autoSync ? theme.colors.black : theme.colors.white,
                        borderRadius: '50%',
                        transition: theme.transition.normal
                      }} />
                    </span>
                  </label>
                </div>

                {/* Sync Folder */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: theme.weight.medium,
                    color: theme.colors.text.secondary,
                    marginBottom: '8px'
                  }}>
                    Dropbox Folder
                  </label>
                  <input
                    type="text"
                    value={syncFolder}
                    onChange={(e) => setSyncFolder(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: theme.colors.bg.page,
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '8px',
                      color: theme.colors.text.primary,
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Manual Sync */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                border: `1px solid ${theme.colors.border.light}`,
                padding: '32px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.primary,
                  margin: '0 0 12px 0'
                }}>
                  Manual Sync
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: theme.colors.text.muted,
                  margin: '0 0 20px 0'
                }}>
                  Manually trigger a sync of all files to Dropbox
                </p>
                <button
                  onClick={handleSyncNow}
                  disabled={syncing}
                  style={{
                    padding: '12px 32px',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: theme.weight.medium,
                    cursor: syncing ? 'not-allowed' : 'pointer',
                    opacity: syncing ? 0.6 : 1,
                    transition: theme.transition.normal
                  }}
                >
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </>
          )}

          {/* Google Drive Option (Coming Soon) */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: `1px solid ${theme.colors.border.light}`,
            padding: '32px',
            marginTop: '24px',
            opacity: 0.6
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.primary,
                  margin: '0 0 6px 0'
                }}>
                  Google Drive
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: theme.colors.text.muted,
                  margin: 0
                }}>
                  Coming soon
                </p>
              </div>
              <button
                disabled
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.tertiary,
                  cursor: 'not-allowed'
                }}
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default DropboxSync
