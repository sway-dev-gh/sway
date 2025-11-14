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
                    <button className="w-full p-2 border border-terminal-border text-terminal-text hover:bg-terminal-hover transition-colors">
                      Upload Files
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-terminal-text mb-2">Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full p-2 bg-terminal-text text-terminal-bg hover:bg-terminal-muted transition-colors">
                      Open Project
                    </button>
                    <button className="w-full p-2 border border-terminal-border text-terminal-text hover:bg-terminal-hover transition-colors">
                      Share Project
                    </button>
                    <button className="w-full p-2 border border-terminal-border text-terminal-text hover:bg-terminal-hover transition-colors">
                      Project Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}