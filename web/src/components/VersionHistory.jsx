import React, { useState, useEffect } from 'react'
import useReviewStore from '../store/reviewStore'
import toast from 'react-hot-toast'

const VersionHistory = ({ fileId, filename }) => {
  const { fetchFileVersions, createFileVersion } = useReviewStore()
  const [versions, setVersions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateVersion, setShowCreateVersion] = useState(false)
  const [versionNotes, setVersionNotes] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadVersions()
  }, [fileId])

  const loadVersions = async () => {
    try {
      setIsLoading(true)
      const data = await fetchFileVersions(fileId)
      setVersions(data || [])
    } catch (error) {
      console.error('Failed to load versions:', error)
      toast.error('Failed to load version history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateVersion = async () => {
    if (!versionNotes.trim()) {
      toast.error('Please add version notes')
      return
    }

    setIsCreating(true)
    try {
      await createFileVersion(fileId, {
        version_notes: versionNotes.trim(),
        file_changes: [],
        section_changes: []
      })

      toast.success('New version created successfully')
      setVersionNotes('')
      setShowCreateVersion(false)
      loadVersions() // Refresh the list
    } catch (error) {
      console.error('Failed to create version:', error)
      toast.error('Failed to create version')
    } finally {
      setIsCreating(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const formatFileChanges = (changes) => {
    if (!changes || changes.length === 0) return null

    try {
      const parsedChanges = typeof changes === 'string' ? JSON.parse(changes) : changes
      return parsedChanges.map((change, index) => (
        <li key={index} className="text-sm text-gray-400">
          {change.type}: {change.description}
        </li>
      ))
    } catch {
      return null
    }
  }

  const getVersionStatus = (version) => {
    const isLatest = versions[0]?.id === version.id
    const daysSinceCreated = Math.floor((new Date() - new Date(version.created_at)) / (1000 * 60 * 60 * 24))

    return {
      isLatest,
      age: daysSinceCreated === 0 ? 'Today' : `${daysSinceCreated} days ago`
    }
  }

  if (isLoading) {
    return (
      <div className="bg-[#1C1C1C] border border-[#333] rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
          <div className="w-32 h-4 bg-gray-600 rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-full h-16 bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1C1C1C] border border-[#333] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Version History</h3>
          <p className="text-sm text-gray-400">{filename}</p>
        </div>
        <button
          onClick={() => setShowCreateVersion(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          Create Version
        </button>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 opacity-50">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No versions yet</h3>
          <p className="text-gray-400 mb-4">Create your first version to track changes over time</p>
          <button
            onClick={() => setShowCreateVersion(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Create First Version
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {versions.map((version, index) => {
            const status = getVersionStatus(version)
            return (
              <div key={version.id} className="bg-[#2A2A2A] border border-[#444] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-white">Version {version.version_number}</span>
                    {status.isLatest && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                        Latest
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">{status.age}</span>
                </div>

                <div className="mb-3">
                  <p className="text-gray-300">{version.version_notes || 'No notes provided'}</p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div>
                    Created by {version.created_by_name || 'Unknown user'}
                  </div>
                  <div>
                    {formatDate(version.created_at)}
                  </div>
                </div>

                {/* Show file changes if available */}
                {version.file_changes && (
                  <div className="mt-3 pt-3 border-t border-[#444]">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Changes:</h4>
                    <ul className="space-y-1">
                      {formatFileChanges(version.file_changes)}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Version Modal */}
      {showCreateVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1C1C1C] border border-[#333] rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Create New Version</h3>
              <button
                onClick={() => setShowCreateVersion(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Version notes *
                </label>
                <textarea
                  value={versionNotes}
                  onChange={(e) => setVersionNotes(e.target.value)}
                  placeholder="Describe the changes made in this version..."
                  className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#444] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="4"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateVersion(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVersion}
                  disabled={!versionNotes.trim() || isCreating}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
                >
                  {isCreating ? 'Creating...' : 'Create Version'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VersionHistory