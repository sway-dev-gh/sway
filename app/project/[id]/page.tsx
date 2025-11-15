'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/auth'
import { format } from 'date-fns'

interface Project {
  id: string
  title: string
  description: string
  project_type: string
  status: string
  visibility: string
  created_at: string
  updated_at: string
  my_role: string
  my_permissions: {
    can_view: boolean
    can_edit: boolean
    can_manage: boolean
  }
}

interface Collaborator {
  collaborator_id: string
  name: string
  email: string
  role: string
  status: string
  last_activity_at: string
}

interface ProjectFile {
  id: string
  filename: string
  original_filename: string
  file_size: number
  file_type: string
  upload_status: string
  uploaded_by: string
  created_at: string
}

export default function ProjectDetail() {
  const { id } = useParams()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [project, setProject] = useState<Project | null>(null)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && isAuthenticated && id) {
      loadProjectDetails()
    } else if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, id])

  const loadProjectDetails = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await apiRequest(`/api/projects/${id}`)

      if (response?.ok) {
        const data = await response.json()
        setProject(data.project)
        setCollaborators(data.collaborators || [])
        setFiles(data.files || [])
      } else if (response?.status === 404) {
        setError('Project not found or you don\'t have access to it.')
      } else if (response?.status === 401) {
        router.push('/login')
      } else {
        const errorData = await response?.json()
        setError(errorData?.error || 'Failed to load project details')
      }
    } catch (error) {
      console.error('Error loading project:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-red-100 text-red-800'
      case 'editor': return 'bg-blue-100 text-blue-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <div className="text-red-600 mb-4">⚠️ Error</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">Project not found</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {project.title}
                </h1>
                <p className="text-gray-600 mb-4">{project.description}</p>

                <div className="flex flex-wrap gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(project.my_role)}`}>
                    {project.my_role}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {project.project_type}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ← Back
                </button>
                {project.my_permissions?.can_edit && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Edit Project
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">

              {/* Project Files */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Project Files ({files.length})
                </h2>

                {files.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">📁</div>
                    <p>No files uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">📄</div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {file.original_filename}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.file_size)} • Uploaded {format(new Date(file.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          file.upload_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {file.upload_status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Project Info */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Information</h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{project.project_type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Visibility</dt>
                    <dd className="mt-1 text-sm text-gray-900">{project.visibility}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(project.created_at), 'MMMM d, yyyy')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(project.updated_at), 'MMMM d, yyyy')}
                    </dd>
                  </div>
                </dl>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              {/* Collaborators */}
              <motion.div
                className="bg-white rounded-lg shadow-md p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Team ({collaborators.length + 1})
                </h2>

                <div className="space-y-3">
                  {collaborators.map((collaborator) => (
                    <div key={collaborator.collaborator_id} className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {collaborator.name}
                        </h3>
                        <p className="text-xs text-gray-500">{collaborator.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(collaborator.role)}`}>
                        {collaborator.role}
                      </span>
                    </div>
                  ))}
                </div>

                {project.my_permissions?.can_manage && (
                  <button className="mt-4 w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    + Invite Collaborator
                  </button>
                )}
              </motion.div>

              {/* Quick Actions */}
              {project.my_permissions?.can_edit && (
                <motion.div
                  className="bg-white rounded-lg shadow-md p-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Upload Files
                    </button>
                    <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                      Create Review
                    </button>
                    <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                      Export Project
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}