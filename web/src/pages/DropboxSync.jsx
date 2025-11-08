import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

function DropboxSync() {
  const navigate = useNavigate()
  const [isConnected, setIsConnected] = useState(false)
  const [autoSync, setAutoSync] = useState(true)
  const [syncFolder, setSyncFolder] = useState('/Sway Files')
  const [lastSync, setLastSync] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if user has access (Business or Admin)
  useEffect(() => {
    const adminKey = localStorage.getItem('adminKey')
    const isAdmin = !!adminKey

    if (!isAdmin) {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        const userPlan = user.plan?.toLowerCase() || 'free'
        if (userPlan !== 'business') {
          navigate('/plan')
        }
      }
    }
  }, [navigate])

  useEffect(() => {
    fetchIntegrationStatus()
  }, [])

  const fetchIntegrationStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const { data } = await api.get('/api/integrations/dropbox', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.integration) {
        setIsConnected(data.integration.is_active)
        setAutoSync(data.integration.auto_sync)
        setSyncFolder(data.integration.sync_folder)
        setLastSync(data.integration.last_sync_at ? new Date(data.integration.last_sync_at) : null)
      }
    } catch (error) {
      console.error('Error fetching Dropbox status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem('token')
      const { data } = await api.post('/api/integrations/dropbox/connect', {
        auto_sync: autoSync,
        sync_folder: syncFolder
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setIsConnected(true)
      alert('Dropbox connected successfully!')
    } catch (error) {
      console.error('Error connecting Dropbox:', error)
      if (error.response?.status === 403) {
        alert('Business plan required for cloud integrations')
      } else {
        alert('Failed to connect Dropbox. Please try again.')
      }
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Dropbox?')) return

    try {
      const token = localStorage.getItem('token')
      await api.post('/api/integrations/dropbox/disconnect', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setIsConnected(false)
      setLastSync(null)
      alert('Dropbox disconnected successfully')
    } catch (error) {
      console.error('Error disconnecting Dropbox:', error)
      alert('Failed to disconnect Dropbox')
    }
  }

  const handleSyncNow = async () => {
    setSyncing(true)

    try {
      const token = localStorage.getItem('token')
      const { data } = await api.post('/api/integrations/dropbox/sync', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setLastSync(data.integration.last_sync_at ? new Date(data.integration.last_sync_at) : new Date())
      alert('Files synced to Dropbox successfully!')
    } catch (error) {
      console.error('Error syncing to Dropbox:', error)
      alert('Failed to sync files to Dropbox')
    } finally {
      setSyncing(false)
    }
  }

  const handleUpdateSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      await api.patch('/api/integrations/dropbox', {
        auto_sync: autoSync,
        sync_folder: syncFolder
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      alert('Settings updated successfully!')
    } catch (error) {
      console.error('Error updating settings:', error)
      alert('Failed to update settings')
    }
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
              alignItems: 'center'
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
                  {isConnected ? '✓ Connected' : 'Not connected'}
                </p>
              </div>

              <button
                onClick={isConnected ? handleDisconnect : handleConnect}
                style={{
                  padding: '10px 24px',
                  background: isConnected ? 'transparent' : theme.colors.white,
                  color: isConnected ? theme.colors.text.secondary : theme.colors.black,
                  border: isConnected ? `1px solid ${theme.colors.border.medium}` : 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: theme.weight.medium,
                  cursor: 'pointer',
                  transition: theme.transition.normal
                }}
              >
                {isConnected ? 'Disconnect' : 'Connect Dropbox'}
              </button>
            </div>
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
                  marginBottom: '24px',
                  paddingBottom: '24px',
                  borderBottom: `1px solid ${theme.colors.border.light}`
                }}>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: theme.weight.medium,
                      color: theme.colors.text.primary,
                      marginBottom: '4px'
                    }}>
                      Auto-sync
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.muted
                    }}>
                      Automatically sync files when uploaded
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
                    Sync Folder
                  </label>
                  <input
                    type="text"
                    value={syncFolder}
                    onChange={(e) => setSyncFolder(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: theme.colors.bg.page,
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '8px',
                      color: theme.colors.text.primary,
                      fontSize: '13px',
                      marginBottom: '12px'
                    }}
                  />
                </div>

                <button
                  onClick={handleUpdateSettings}
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
                  Save Settings
                </button>
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

                {lastSync && (
                  <p style={{
                    fontSize: '13px',
                    color: theme.colors.text.muted,
                    margin: '0 0 16px 0'
                  }}>
                    Last synced: {lastSync.toLocaleString()}
                  </p>
                )}

                <button
                  onClick={handleSyncNow}
                  disabled={syncing}
                  style={{
                    padding: '12px 24px',
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
        </div>
      </div>
    </>
  )
}

export default DropboxSync
