'use client'

import { useState, useEffect } from 'react'

interface FileVersion {
  id: string
  file_id: string
  version_number: number
  created_by: string
  version_notes: string
  file_changes: any[]
  section_changes: any[]
  is_current_version: boolean
  created_at: string
  metadata: any
  creator_name?: string
  creator_email?: string
}

interface FileVersionHistoryProps {
  fileId: string
  onClose: () => void
  currentFileName?: string
}

export default function FileVersionHistory({ fileId, onClose, currentFileName }: FileVersionHistoryProps) {
  const [versions, setVersions] = useState<FileVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<FileVersion | null>(null)
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set())
  const [compareMode, setCompareMode] = useState(false)
  const [compareVersions, setCompareVersions] = useState<[FileVersion | null, FileVersion | null]>([null, null])

  // Create new version state
  const [creatingVersion, setCreatingVersion] = useState(false)
  const [newVersionNotes, setNewVersionNotes] = useState('')
  const [showCreateVersion, setShowCreateVersion] = useState(false)

  const fetchVersions = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/workflow/files/${fileId}/versions`, {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('File not found or access denied')
        }
        throw new Error('Failed to fetch version history')
      }

      const data = await response.json()
      setVersions(data.versions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch version history')
    } finally {
      setLoading(false)
    }
  }

  const createVersion = async () => {
    try {
      setCreatingVersion(true)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/workflow/files/${fileId}/version`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          version_notes: newVersionNotes,
          file_changes: [],
          section_changes: []
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create new version')
      }

      const data = await response.json()
      await fetchVersions() // Refresh the list
      setNewVersionNotes('')
      setShowCreateVersion(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create version')
    } finally {
      setCreatingVersion(false)
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)

    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`
    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const toggleExpandChanges = (versionId: string) => {
    const newExpanded = new Set(expandedChanges)
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId)
    } else {
      newExpanded.add(versionId)
    }
    setExpandedChanges(newExpanded)
  }

  const toggleCompareVersion = (version: FileVersion) => {
    if (compareVersions[0] === null) {
      setCompareVersions([version, null])
    } else if (compareVersions[1] === null) {
      setCompareVersions([compareVersions[0], version])
    } else {
      setCompareVersions([version, null])
    }
  }

  const renderChanges = (changes: any[], type: 'file' | 'section') => {
    if (!changes || changes.length === 0) {
      return <span className="text-terminal-muted text-xs">No {type} changes</span>
    }

    return (
      <div className="space-y-1">
        {changes.map((change, index) => (
          <div key={index} className="text-xs">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
              change.type === 'added' ? 'bg-green-400' :
              change.type === 'modified' ? 'bg-yellow-400' :
              change.type === 'deleted' ? 'bg-red-400' :
              'bg-blue-400'
            }`}></span>
            <span className="text-terminal-text">
              {change.description || `${change.type} change`}
            </span>
          </div>
        ))}
      </div>
    )
  }

  useEffect(() => {
    fetchVersions()
  }, [fileId])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-terminal-surface border border-terminal-border p-6 rounded">
          <div className="text-terminal-text">Loading version history...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-terminal-surface border border-terminal-border w-full max-w-6xl h-full max-h-screen overflow-auto">
        {/* Header */}
        <div className="border-b border-terminal-border p-6 sticky top-0 bg-terminal-surface">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl text-terminal-text font-medium">File Version History</h2>
              <p className="text-terminal-muted text-sm mt-1">
                {currentFileName && `File: ${currentFileName} • `}
                {versions.length} version{versions.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`border border-terminal-border text-terminal-text px-3 py-1 text-sm hover:bg-terminal-hover transition-colors ${
                  compareMode ? 'bg-terminal-hover' : ''
                }`}
              >
                {compareMode ? 'Exit Compare' : 'Compare Versions'}
              </button>

              <button
                onClick={() => setShowCreateVersion(true)}
                className="bg-terminal-text text-terminal-bg px-3 py-1 text-sm hover:bg-terminal-muted transition-colors"
              >
                Create Version
              </button>

              <button
                onClick={onClose}
                className="text-terminal-muted hover:text-terminal-text text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Compare Mode Info */}
          {compareMode && (
            <div className="mt-4 p-3 bg-terminal-bg border border-terminal-border rounded">
              <div className="flex items-center justify-between">
                <div className="text-terminal-text text-sm">
                  Compare Mode: Click on two versions to compare
                </div>
                {compareVersions[0] && compareVersions[1] && (
                  <div className="text-terminal-text text-sm">
                    Comparing v{compareVersions[0].version_number} ↔ v{compareVersions[1].version_number}
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-900 border border-red-700 text-red-400 px-4 py-3">
              {error}
              <button
                onClick={() => setError(null)}
                className="float-right text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Version List */}
        <div className="p-6">
          {versions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-terminal-text text-lg mb-2">No Version History</div>
              <p className="text-terminal-muted text-sm">This file doesn't have any versions yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`bg-terminal-bg border rounded p-4 transition-colors ${
                    compareMode
                      ? (compareVersions.includes(version)
                          ? 'border-blue-400 bg-blue-900 bg-opacity-20'
                          : 'border-terminal-border hover:border-blue-400 cursor-pointer')
                      : 'border-terminal-border'
                  } ${version.is_current_version ? 'border-green-400' : ''}`}
                  onClick={compareMode ? () => toggleCompareVersion(version) : undefined}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-terminal-text font-medium">
                        Version {version.version_number}
                        {version.is_current_version && (
                          <span className="ml-2 text-xs px-2 py-1 bg-green-900 text-green-400 rounded">
                            CURRENT
                          </span>
                        )}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-terminal-muted">
                      <span>{formatRelativeTime(version.created_at)}</span>
                      {version.creator_name && (
                        <span>by {version.creator_name}</span>
                      )}
                    </div>
                  </div>

                  {version.version_notes && (
                    <div className="mb-3 p-3 bg-terminal-surface border border-terminal-border rounded">
                      <p className="text-terminal-text text-sm">{version.version_notes}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <h4 className="text-terminal-text text-sm font-medium mb-2">File Changes</h4>
                      {renderChanges(version.file_changes, 'file')}
                    </div>

                    <div>
                      <h4 className="text-terminal-text text-sm font-medium mb-2">Section Changes</h4>
                      {renderChanges(version.section_changes, 'section')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-terminal-border">
                    <div className="text-terminal-muted text-xs">
                      Version ID: {version.id.substring(0, 8)}...
                    </div>

                    <div className="flex items-center space-x-2">
                      {!compareMode && (
                        <>
                          <button
                            onClick={() => setSelectedVersion(version)}
                            className="border border-terminal-border text-terminal-text px-2 py-1 text-xs hover:bg-terminal-hover transition-colors"
                          >
                            View Details
                          </button>

                          {(version.file_changes.length > 0 || version.section_changes.length > 0) && (
                            <button
                              onClick={() => toggleExpandChanges(version.id)}
                              className="border border-terminal-border text-terminal-text px-2 py-1 text-xs hover:bg-terminal-hover transition-colors"
                            >
                              {expandedChanges.has(version.id) ? 'Hide' : 'Show'} Changes
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded Changes */}
                  {expandedChanges.has(version.id) && (
                    <div className="mt-4 pt-4 border-t border-terminal-border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-terminal-text text-sm font-medium mb-2">Detailed File Changes</h5>
                          {version.file_changes.length > 0 ? (
                            <pre className="text-xs bg-terminal-surface p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(version.file_changes, null, 2)}
                            </pre>
                          ) : (
                            <span className="text-terminal-muted text-xs">No file changes</span>
                          )}
                        </div>

                        <div>
                          <h5 className="text-terminal-text text-sm font-medium mb-2">Detailed Section Changes</h5>
                          {version.section_changes.length > 0 ? (
                            <pre className="text-xs bg-terminal-surface p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(version.section_changes, null, 2)}
                            </pre>
                          ) : (
                            <span className="text-terminal-muted text-xs">No section changes</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Version Modal */}
        {showCreateVersion && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60">
            <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-md">
              <h3 className="text-terminal-text text-lg font-medium mb-4">Create New Version</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-terminal-muted text-sm mb-1">Version Notes</label>
                  <textarea
                    value={newVersionNotes}
                    onChange={(e) => setNewVersionNotes(e.target.value)}
                    className="w-full bg-terminal-bg border border-terminal-border text-terminal-text px-3 py-2 h-24"
                    placeholder="Describe what changed in this version..."
                  />
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCreateVersion(false)
                      setNewVersionNotes('')
                    }}
                    className="border border-terminal-border text-terminal-text px-4 py-2 text-sm hover:bg-terminal-hover transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={createVersion}
                    disabled={creatingVersion}
                    className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm hover:bg-terminal-muted transition-colors disabled:opacity-50"
                  >
                    {creatingVersion ? 'Creating...' : 'Create Version'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Version Details Modal */}
        {selectedVersion && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60">
            <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-4xl h-full max-h-[80vh] overflow-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-terminal-text text-lg font-medium">
                  Version {selectedVersion.version_number} Details
                </h3>
                <button
                  onClick={() => setSelectedVersion(null)}
                  className="text-terminal-muted hover:text-terminal-text text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-terminal-muted">Created:</span>
                    <span className="text-terminal-text ml-2">{formatRelativeTime(selectedVersion.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-terminal-muted">Created by:</span>
                    <span className="text-terminal-text ml-2">{selectedVersion.creator_name || selectedVersion.creator_email}</span>
                  </div>
                  <div>
                    <span className="text-terminal-muted">Version:</span>
                    <span className="text-terminal-text ml-2">{selectedVersion.version_number}</span>
                  </div>
                  <div>
                    <span className="text-terminal-muted">Status:</span>
                    <span className={`ml-2 ${selectedVersion.is_current_version ? 'text-green-400' : 'text-terminal-muted'}`}>
                      {selectedVersion.is_current_version ? 'Current Version' : 'Historical Version'}
                    </span>
                  </div>
                </div>

                {selectedVersion.version_notes && (
                  <div>
                    <h4 className="text-terminal-text font-medium mb-2">Version Notes</h4>
                    <div className="bg-terminal-bg border border-terminal-border rounded p-3">
                      <p className="text-terminal-text text-sm">{selectedVersion.version_notes}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-terminal-text font-medium mb-3">File Changes</h4>
                    <div className="bg-terminal-bg border border-terminal-border rounded p-3">
                      {selectedVersion.file_changes.length > 0 ? (
                        <pre className="text-xs text-terminal-text overflow-auto max-h-64">
                          {JSON.stringify(selectedVersion.file_changes, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-terminal-muted text-sm">No file changes recorded</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-terminal-text font-medium mb-3">Section Changes</h4>
                    <div className="bg-terminal-bg border border-terminal-border rounded p-3">
                      {selectedVersion.section_changes.length > 0 ? (
                        <pre className="text-xs text-terminal-text overflow-auto max-h-64">
                          {JSON.stringify(selectedVersion.section_changes, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-terminal-muted text-sm">No section changes recorded</span>
                      )}
                    </div>
                  </div>
                </div>

                {selectedVersion.metadata && Object.keys(selectedVersion.metadata).length > 0 && (
                  <div>
                    <h4 className="text-terminal-text font-medium mb-3">Metadata</h4>
                    <div className="bg-terminal-bg border border-terminal-border rounded p-3">
                      <pre className="text-xs text-terminal-text overflow-auto">
                        {JSON.stringify(selectedVersion.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}