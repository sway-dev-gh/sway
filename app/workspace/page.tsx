'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import { apiRequest } from '@/lib/auth'

interface Project {
  id: string
  title: string
  description: string
  project_type: string
  created_at: string
}

export default function Workspace() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await apiRequest('/api/projects')
      if (response?.ok) {
        const data = await response.json()
        const userProjects = data.projects.owned || []
        setProjects(userProjects)
        if (userProjects.length > 0) {
          setSelectedProject(userProjects[0])
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !selectedProject) return

    setUploadLoading(true)
    setError('')

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('project_id', selectedProject.id)

        const response = await apiRequest('/api/files/upload', {
          method: 'POST',
          body: formData
        })

        if (!response?.ok) {
          const errorData = await response?.json()
          throw new Error(errorData?.error || `Failed to upload ${file.name}`)
        }
      }

      setShowUploadModal(false)
      setError('')
    } catch (error: any) {
      console.error('File upload error:', error)
      setError(error.message || 'Failed to upload files')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleOpenProject = () => {
    if (selectedProject) {
      window.open(`/project/${selectedProject.id}`, '_blank')
    }
  }

  const handleShareProject = () => {
    if (selectedProject) {
      setShowShareModal(true)
    }
  }

  const handleProjectSettings = () => {
    if (selectedProject) {
      setShowSettingsModal(true)
    }
  }

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/project/${selectedProject?.id}`
    navigator.clipboard.writeText(shareUrl)
    alert('Share link copied to clipboard!')
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-auto bg-terminal-bg flex items-center justify-center">
          <div className="text-terminal-muted">Loading workspace...</div>
        </div>
      </AppLayout>
    )
  }

  if (projects.length === 0) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-auto bg-terminal-bg">
          <div className="bg-terminal-surface border-b border-terminal-border p-6">
            <h1 className="text-xl text-terminal-text font-medium">Workspace</h1>
            <p className="text-terminal-muted text-sm mt-1">Project collaboration space</p>
          </div>

          <div className="p-6">
            <div className="bg-terminal-surface border border-terminal-border rounded-sm p-8 text-center">
              <h2 className="text-lg text-terminal-text mb-2">No Projects Yet</h2>
              <p className="text-terminal-muted text-sm mb-4">Create your first project to start collaborating</p>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm hover:bg-terminal-muted transition-colors"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto bg-terminal-bg">
        {/* Header */}
        <div className="bg-terminal-surface border-b border-terminal-border p-6">
          <h1 className="text-xl text-terminal-text font-medium">Workspace</h1>
          <p className="text-terminal-muted text-sm mt-1">
            {selectedProject ? `Working on: ${selectedProject.title}` : 'Project collaboration space'}
          </p>
        </div>

        <div className="p-6">
          {/* Project Selection */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-terminal-text mb-4">Your Projects</h2>
            <div className="space-y-2">
              {projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`p-4 border rounded-sm cursor-pointer transition-colors ${
                    selectedProject?.id === project.id
                      ? 'bg-terminal-hover border-terminal-text'
                      : 'bg-terminal-surface border-terminal-border hover:bg-terminal-hover'
                  }`}
                >
                  <h3 className="text-terminal-text font-medium">{project.title}</h3>
                  <p className="text-terminal-muted text-sm mt-1">{project.description}</p>
                  <div className="flex items-center mt-2 text-xs text-terminal-muted">
                    <span className="bg-terminal-bg px-2 py-1 rounded">{project.project_type}</span>
                    <span className="ml-2">{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Workspace */}
          {selectedProject && (
            <div className="bg-terminal-surface border border-terminal-border rounded-sm p-6">
              <h3 className="text-lg font-medium text-terminal-text mb-4">
                Project: {selectedProject.title}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-terminal-text mb-2">Files</h4>
                  <div className="space-y-2 text-sm text-terminal-muted">
                    <div className="p-2 bg-terminal-bg rounded">README.md</div>
                    <div className="p-2 bg-terminal-bg rounded">components/</div>
                    <div className="p-2 bg-terminal-bg rounded">styles/</div>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="w-full p-2 border border-terminal-border text-terminal-text hover:bg-terminal-hover transition-colors"
                    >
                      Upload Files
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-terminal-text mb-2">Actions</h4>
                  <div className="space-y-2">
                    <button
                      onClick={handleOpenProject}
                      className="w-full p-2 bg-terminal-text text-terminal-bg hover:bg-terminal-muted transition-colors"
                    >
                      Open Project
                    </button>
                    <button
                      onClick={handleShareProject}
                      className="w-full p-2 border border-terminal-border text-terminal-text hover:bg-terminal-hover transition-colors"
                    >
                      Share Project
                    </button>
                    <button
                      onClick={handleProjectSettings}
                      className="w-full p-2 border border-terminal-border text-terminal-text hover:bg-terminal-hover transition-colors"
                    >
                      Project Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-md">
            <h2 className="text-xl text-terminal-text font-medium mb-4">Upload Files to {selectedProject?.title}</h2>

            {error && (
              <div className="bg-terminal-bg border border-terminal-border text-terminal-text p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="border-2 border-dashed border-terminal-border p-8 text-center">
                <p className="text-terminal-muted mb-4">Choose files to upload to this project</p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full text-terminal-text text-sm"
                  multiple
                  disabled={uploadLoading}
                />
                {uploadLoading && (
                  <p className="text-terminal-muted text-sm mt-2">Uploading files...</p>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 border border-terminal-border text-terminal-text py-2 text-sm hover:bg-terminal-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Project Modal */}
      {showShareModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-md">
            <h2 className="text-xl text-terminal-text font-medium mb-4">Share {selectedProject.title}</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm text-terminal-text">Project Link</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/project/${selectedProject.id}`}
                    readOnly
                    className="flex-1 bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm"
                  />
                  <button
                    onClick={copyShareLink}
                    className="bg-terminal-text text-terminal-bg px-3 py-2 text-sm hover:bg-terminal-muted transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-terminal-text">Invite by Email</label>
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm"
                />
                <button className="w-full bg-terminal-text text-terminal-bg py-2 text-sm hover:bg-terminal-muted transition-colors">
                  Send Invitation
                </button>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 border border-terminal-border text-terminal-text py-2 text-sm hover:bg-terminal-hover transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Settings Modal */}
      {showSettingsModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-md">
            <h2 className="text-xl text-terminal-text font-medium mb-4">{selectedProject.title} Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-terminal-text mb-2">Project Name</label>
                <input
                  type="text"
                  defaultValue={selectedProject.title}
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">Description</label>
                <textarea
                  defaultValue={selectedProject.description}
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">Project Type</label>
                <select
                  defaultValue={selectedProject.project_type}
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm"
                >
                  <option value="review">Review</option>
                  <option value="collaboration">Collaboration</option>
                  <option value="shared_folder">Shared Folder</option>
                </select>
              </div>

              <div className="flex space-x-4 mt-6">
                <button className="flex-1 bg-terminal-text text-terminal-bg py-2 text-sm hover:bg-terminal-muted transition-colors">
                  Save Changes
                </button>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 border border-terminal-border text-terminal-text py-2 text-sm hover:bg-terminal-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}