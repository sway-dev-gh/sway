import React, { useState, useEffect } from 'react'
import useReviewStore from '../store/reviewStore'
import toast from 'react-hot-toast'

const ExternalAccessManager = ({ projectId, fileId = null, sectionId = null }) => {
  const { generateExternalAccess } = useReviewStore()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [accessTokens, setAccessTokens] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    collaborator_email: '',
    collaborator_name: '',
    access_level: 'view_comment',
    expires_in_days: 7
  })

  const accessLevels = {
    'view_only': {
      label: 'View Only',
      description: 'Can view content but cannot comment or interact'
    },
    'view_comment': {
      label: 'View & Comment',
      description: 'Can view content and add comments'
    },
    'review': {
      label: 'Review & Approve',
      description: 'Can review, comment, and approve/reject sections'
    }
  }

  const handleGenerateAccess = async () => {
    if (!formData.collaborator_email || !formData.collaborator_name) {
      toast.error('Please provide collaborator email and name')
      return
    }

    setIsLoading(true)
    try {
      const result = await generateExternalAccess({
        project_id: projectId,
        file_id: fileId,
        section_id: sectionId,
        ...formData
      })

      // Copy access URL to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(result.access_url)
        toast.success(`Access link generated and copied to clipboard!`)
      } else {
        toast.success(`Access link generated: ${result.access_url}`)
      }

      setFormData({
        collaborator_email: '',
        collaborator_name: '',
        access_level: 'view_comment',
        expires_in_days: 7
      })
      setShowCreateForm(false)

      // Add to local tokens list (in real app, you'd fetch from API)
      setAccessTokens(prev => [result.access_info, ...prev])

    } catch (error) {
      console.error('Failed to generate access:', error)
      toast.error('Failed to generate access link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSend = (accessUrl, email) => {
    const subject = `Review Invitation - ${fileId ? 'File Review' : 'Project Collaboration'}`
    const body = `You've been invited to collaborate on a review project.

Access your review workspace here: ${accessUrl}

This link will expire in ${formData.expires_in_days} days.

Best regards`

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink, '_blank')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getAccessScopeText = () => {
    if (sectionId) return 'Section-specific access'
    if (fileId) return 'File-specific access'
    return 'Project-wide access'
  }

  return (
    <div className="bg-[#1C1C1C] border border-[#333] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">External Access</h3>
          <p className="text-sm text-gray-400 mt-1">{getAccessScopeText()}</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          Generate Access
        </button>
      </div>

      {/* Create Access Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-[#2A2A2A] border border-[#444] rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-white">Create External Access</h4>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Collaborator Email *
              </label>
              <input
                type="email"
                value={formData.collaborator_email}
                onChange={(e) => setFormData(prev => ({ ...prev, collaborator_email: e.target.value }))}
                placeholder="colleague@company.com"
                className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#444] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Collaborator Name *
              </label>
              <input
                type="text"
                value={formData.collaborator_name}
                onChange={(e) => setFormData(prev => ({ ...prev, collaborator_name: e.target.value }))}
                placeholder="John Doe"
                className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#444] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Access Level
              </label>
              <select
                value={formData.access_level}
                onChange={(e) => setFormData(prev => ({ ...prev, access_level: e.target.value }))}
                className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#444] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(accessLevels).map(([key, level]) => (
                  <option key={key} value={key}>
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expires In (Days)
              </label>
              <select
                value={formData.expires_in_days}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_in_days: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#444] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAccess}
                disabled={!formData.collaborator_email || !formData.collaborator_name || isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
              >
                {isLoading ? 'Generating...' : 'Generate Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Access Tokens */}
      <div>
        <h4 className="text-md font-medium text-white mb-4">Recent Access Links</h4>

        {accessTokens.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 opacity-50">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <p className="text-gray-400 mb-4">No external access links generated yet</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Generate First Link
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {accessTokens.map((token, index) => (
              <div key={token.id || index} className="bg-[#2A2A2A] border border-[#444] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-medium">
                      {token.collaborator_name || 'Unknown Collaborator'}
                    </span>
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                      {accessLevels[token.access_level]?.label || token.access_level}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Expires: {formatDate(token.expires_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{token.collaborator_email}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEmailSend(`${window.location.origin}/external/${token.token}`, token.collaborator_email)}
                      className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                    >
                      Send Email
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(`${window.location.origin}/external/${token.token}`)
                        toast.success('Link copied to clipboard!')
                      }}
                      className="text-xs px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ExternalAccessManager