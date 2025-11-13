'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { apiRequest } from '@/lib/auth'

interface Project {
  id: string
  title: string
  description: string
  project_type: string
  created_at: string
  status: string
}

export default function Dashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectType, setProjectType] = useState('review')

  // Load projects
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await apiRequest('/api/projects')
      if (response?.ok) {
        const data = await response.json()
        setProjects(data.projects.owned || [])
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          project_type: projectType,
          visibility: 'private'
        })
      })

      if (response?.ok) {
        const data = await response.json()
        setProjects(prev => [data.project, ...prev])
        setShowCreateModal(false)
        setTitle('')
        setDescription('')
        setProjectType('review')
      } else {
        const data = await response?.json()
        setError(data?.error || 'Failed to create project')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // For now, just show an alert - we can implement full upload later
      alert(`File "${file.name}" selected. Full upload functionality coming next!`)
      setShowUploadModal(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto bg-terminal-bg">
        {/* Header */}
        <div className="bg-terminal-surface border-b border-terminal-border p-6">
          <h1 className="text-xl text-terminal-text font-medium">Dashboard</h1>
          <p className="text-terminal-muted text-sm mt-1">Welcome to SwayFiles</p>
        </div>

        <div className="p-6">
          {/* Project List */}
          {projects.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-medium text-terminal-text mb-4">Recent Projects</h2>
              <div className="space-y-2">
                {projects.slice(0, 3).map(project => (
                  <div key={project.id} className="bg-terminal-surface border border-terminal-border p-4 rounded-sm">
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
          )}

          {/* Main Content Area */}
          <div className="bg-terminal-surface border border-terminal-border rounded-sm p-6">
            <div className="text-center py-12">
              <h2 className="text-terminal-text text-lg mb-2">Your Workspace</h2>
              <p className="text-terminal-muted text-sm">Start by creating your first project or uploading files</p>

              <div className="mt-8 space-x-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm hover:bg-terminal-muted transition-colors"
                >
                  Create Project
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="border border-terminal-border text-terminal-text px-4 py-2 text-sm hover:bg-terminal-hover transition-colors"
                >
                  Upload Files
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-md">
            <h2 className="text-xl text-terminal-text font-medium mb-4">Create New Project</h2>

            {error && (
              <div className="bg-red-900 border border-red-700 text-red-100 p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm text-terminal-text mb-2">Project Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-text"
                  placeholder="Enter project title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-text h-24 resize-none"
                  placeholder="Describe your project"
                />
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">Project Type</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-text"
                >
                  <option value="review">Review</option>
                  <option value="collaboration">Collaboration</option>
                  <option value="shared_folder">Shared Folder</option>
                </select>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="flex-1 bg-terminal-text text-terminal-bg py-2 text-sm hover:bg-terminal-muted transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-terminal-border text-terminal-text py-2 text-sm hover:bg-terminal-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Files Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-md">
            <h2 className="text-xl text-terminal-text font-medium mb-4">Upload Files</h2>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-terminal-border p-8 text-center">
                <p className="text-terminal-muted mb-4">Choose files to upload</p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full text-terminal-text text-sm"
                  multiple
                />
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
    </AppLayout>
  )
}