import { useState, useEffect } from 'react'

const VersionHistory = ({ projectId, fileId }) => {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState(null)

  useEffect(() => {
    fetchVersions()
  }, [projectId, fileId])

  const fetchVersions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/projects/${projectId}/files/${fileId}/versions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions || [])
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const restoreVersion = async (versionId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/projects/${projectId}/files/${fileId}/versions/${versionId}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        // Refresh parent component
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to restore version:', error)
    }
  }

  const getChangeType = (changeType) => {
    const typeMap = {
      'created': { label: 'Created', color: '#51cf66', icon: '✨' },
      'updated': { label: 'Updated', color: '#ffffff', icon: '✏️' },
      'section_added': { label: 'Section Added', color: '#4c6ef5', icon: '➕' },
      'section_removed': { label: 'Section Removed', color: '#ff6b6b', icon: '➖' },
      'section_modified': { label: 'Section Modified', color: '#ffd43b', icon: '🔄' },
      'approved': { label: 'Approved', color: '#51cf66', icon: '✅' },
      'rejected': { label: 'Changes Requested', color: '#ff6b6b', icon: '❌' },
      'restored': { label: 'Restored', color: '#4c6ef5', icon: '↩️' }
    }
    return typeMap[changeType] || { label: 'Unknown', color: '#666666', icon: '•' }
  }

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#a3a3a3'
      }}>
        Loading version history...
      </div>
    )
  }

  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid #333333',
      borderRadius: '8px',
      padding: '24px'
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#ffffff',
        margin: '0 0 20px 0'
      }}>
        Version History
      </h3>

      {versions.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {versions.map((version, index) => {
            const changeInfo = getChangeType(version.change_type)
            const isLatest = index === 0

            return (
              <div
                key={version.id}
                style={{
                  background: isLatest ? '#333333' : '#000000',
                  border: `1px solid ${isLatest ? '#666666' : '#333333'}`,
                  borderRadius: '6px',
                  padding: '16px',
                  position: 'relative'
                }}
              >
                {isLatest && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#ffffff',
                    color: '#000000',
                    fontSize: '10px',
                    fontWeight: '600',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    textTransform: 'uppercase'
                  }}>
                    Current
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <div style={{
                    fontSize: '16px',
                    minWidth: '20px'
                  }}>
                    {changeInfo.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: changeInfo.color,
                          marginBottom: '2px'
                        }}>
                          {changeInfo.label}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#a3a3a3'
                        }}>
                          Version {version.version_number} • {new Date(version.created_at).toLocaleString()}
                        </div>
                      </div>

                      {!isLatest && (
                        <button
                          onClick={() => restoreVersion(version.id)}
                          style={{
                            background: 'transparent',
                            color: '#4c6ef5',
                            border: '1px solid #4c6ef5',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Restore
                        </button>
                      )}
                    </div>

                    {version.created_by && (
                      <div style={{
                        fontSize: '12px',
                        color: '#a3a3a3',
                        marginBottom: '8px'
                      }}>
                        by {version.created_by}
                      </div>
                    )}

                    {version.change_summary && (
                      <div style={{
                        fontSize: '13px',
                        color: '#ffffff',
                        lineHeight: '1.4',
                        marginBottom: '8px'
                      }}>
                        {version.change_summary}
                      </div>
                    )}

                    {version.sections_changed && version.sections_changed.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}>
                        {version.sections_changed.map((sectionName, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: '#000000',
                              border: '1px solid #333333',
                              borderRadius: '3px',
                              padding: '2px 6px',
                              fontSize: '10px',
                              color: '#a3a3a3'
                            }}
                          >
                            {sectionName}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show detailed changes when clicked */}
                    {selectedVersion === version.id && version.detailed_changes && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: '#000000',
                        border: '1px solid #333333',
                        borderRadius: '4px'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#ffffff',
                          marginBottom: '8px'
                        }}>
                          Detailed Changes:
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#a3a3a3',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {version.detailed_changes}
                        </div>
                      </div>
                    )}

                    {/* View details button */}
                    {version.detailed_changes && (
                      <button
                        onClick={() => setSelectedVersion(
                          selectedVersion === version.id ? null : version.id
                        )}
                        style={{
                          background: 'transparent',
                          color: '#a3a3a3',
                          border: 'none',
                          fontSize: '11px',
                          cursor: 'pointer',
                          marginTop: '8px',
                          padding: 0
                        }}
                      >
                        {selectedVersion === version.id ? 'Hide Details' : 'Show Details'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          color: '#a3a3a3',
          fontSize: '14px',
          padding: '20px'
        }}>
          No version history available
        </div>
      )}
    </div>
  )
}

export default VersionHistory