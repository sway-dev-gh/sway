import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/axios'

const useReviewStore = create(
  persist(
    (set, get) => ({
      // State
      projects: [],
      currentProject: null,
      currentFile: null,
      sections: [],
      currentSection: null,
      reviews: [],
      comments: [],
      workflowState: null,
      isLoading: false,
      error: null,

      // Filter and search state
      searchQuery: '',
      filterStatus: 'all', // all, draft, under_review, changes_requested, approved, delivered
      filterPriority: 'all', // all, low, normal, high, urgent
      sortBy: 'created_at', // created_at, updated_at, title, status

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Project actions
      fetchProjects: async () => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.get('/api/projects')
          set({
            projects: response.data.projects?.owned || [],
            isLoading: false
          })
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to fetch projects',
            isLoading: false
          })
        }
      },

      fetchProject: async (projectId) => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.get(`/api/workflow/projects/${projectId}`)
          set({
            currentProject: response.data.project,
            isLoading: false
          })
          return response.data.project
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to fetch project',
            isLoading: false
          })
        }
      },

      createProject: async (projectData) => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.post('/api/projects', projectData)
          const newProject = response.data.project
          set((state) => ({
            projects: [newProject, ...state.projects],
            isLoading: false
          }))
          return newProject
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to create project',
            isLoading: false
          })
          throw error
        }
      },

      // File actions
      uploadFileWithSections: async (projectId, fileData) => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.post(`/api/workflow/projects/${projectId}/files`, fileData)
          set({ isLoading: false })
          return response.data.file
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to upload file',
            isLoading: false
          })
          throw error
        }
      },

      setCurrentFile: (file) => set({ currentFile: file }),

      // Section actions
      fetchSection: async (sectionId) => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.get(`/api/workflow/sections/${sectionId}`)
          const { section, reviews, comments } = response.data
          set({
            currentSection: section,
            reviews,
            comments,
            isLoading: false
          })
          return response.data
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to fetch section',
            isLoading: false
          })
        }
      },

      submitReview: async (sectionId, reviewData) => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.post(`/api/workflow/sections/${sectionId}/review`, reviewData)

          // Update reviews in state
          set((state) => ({
            reviews: [response.data.review, ...state.reviews],
            currentSection: state.currentSection ? {
              ...state.currentSection,
              section_status: response.data.section_status
            } : null,
            isLoading: false
          }))

          return response.data
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to submit review',
            isLoading: false
          })
          throw error
        }
      },

      addComment: async (sectionId, commentData) => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.post(`/api/workflow/sections/${sectionId}/comments`, commentData)

          // Add comment to state
          set((state) => ({
            comments: [...state.comments, response.data.comment],
            isLoading: false
          }))

          return response.data.comment
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to add comment',
            isLoading: false
          })
          throw error
        }
      },

      // Filter and search actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setFilterPriority: (priority) => set({ filterPriority: priority }),
      setSortBy: (sortBy) => set({ sortBy }),

      // Version history management
      createFileVersion: async (fileId, versionData) => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.post(`/api/workflow/files/${fileId}/version`, versionData)
          set({ isLoading: false })
          return response.data
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to create file version',
            isLoading: false
          })
          throw error
        }
      },

      fetchFileVersions: async (fileId) => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.get(`/api/workflow/files/${fileId}/versions`)
          set({ isLoading: false })
          return response.data.versions
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to fetch file versions',
            isLoading: false
          })
          throw error
        }
      },

      // Workflow state management
      updateFileState: async (fileId, stateData) => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.post(`/api/workflow/files/${fileId}/state`, stateData)

          // Update current project files if loaded
          set((state) => {
            if (state.currentProject && state.currentProject.files) {
              const updatedFiles = state.currentProject.files.map(file =>
                file.id === fileId
                  ? { ...file, current_state: response.data.workflow_state.current_state }
                  : file
              )
              return {
                ...state,
                currentProject: {
                  ...state.currentProject,
                  files: updatedFiles
                },
                isLoading: false
              }
            }
            return { isLoading: false }
          })

          return response.data
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to update file state',
            isLoading: false
          })
          throw error
        }
      },

      fetchFileStateHistory: async (fileId) => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.get(`/api/workflow/files/${fileId}/state-history`)
          set({ isLoading: false })
          return response.data.state_history
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to fetch state history',
            isLoading: false
          })
          throw error
        }
      },

      // External access
      generateExternalAccess: async (accessData) => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.post('/api/workflow/external-access', accessData)
          set({ isLoading: false })
          return response.data
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Failed to generate external access',
            isLoading: false
          })
          throw error
        }
      },

      // Computed getters
      getFilteredProjects: () => {
        const { projects, searchQuery, filterStatus, sortBy } = get()

        let filtered = [...projects]

        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(project =>
            project.title?.toLowerCase().includes(query) ||
            project.description?.toLowerCase().includes(query)
          )
        }

        // Status filter
        if (filterStatus !== 'all') {
          filtered = filtered.filter(project => project.status === filterStatus)
        }

        // Sort
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'title':
              return a.title.localeCompare(b.title)
            case 'updated_at':
              return new Date(b.updated_at) - new Date(a.updated_at)
            case 'created_at':
            default:
              return new Date(b.created_at) - new Date(a.created_at)
          }
        })

        return filtered
      },

      getProjectStats: () => {
        const { projects } = get()
        return {
          total: projects.length,
          active: projects.filter(p => p.status === 'active').length,
          draft: projects.filter(p => p.status === 'draft').length,
          completed: projects.filter(p => p.status === 'completed').length
        }
      },

      // Reset functions
      reset: () => set({
        currentProject: null,
        currentFile: null,
        sections: [],
        currentSection: null,
        reviews: [],
        comments: [],
        workflowState: null,
        error: null
      }),

      clearCurrentSection: () => set({
        currentSection: null,
        reviews: [],
        comments: []
      })
    }),
    {
      name: 'review-store',
      partialize: (state) => ({
        // Only persist essential data
        searchQuery: state.searchQuery,
        filterStatus: state.filterStatus,
        filterPriority: state.filterPriority,
        sortBy: state.sortBy
      })
    }
  )
)

export default useReviewStore