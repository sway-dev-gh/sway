import React, { createContext, useContext, useReducer } from 'react'
import { v4 as uuidv4 } from 'uuid'
import apiService from '../services/api'

const WorkspaceContext = createContext()

// Workflow states
const WORKFLOW_STATES = {
  DRAFT: 'draft',
  UNDER_REVIEW: 'under_review',
  CHANGES_REQUESTED: 'changes_requested',
  APPROVED: 'approved',
  DELIVERED: 'delivered'
}

// Initial state
const initialState = {
  // Authentication
  isAuthenticated: false, // Don't auto-authenticate, let initializeAuth handle it
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,

  // Guest collaboration
  isGuest: false,
  guestName: null,
  guestWorkspaceId: null,

  // Current workspace
  currentWorkspace: null,

  // All workspaces
  workspaces: [],

  // Files and sections in current workspace
  files: [],
  sections: {},

  // Comments and reviews
  comments: {},
  reviews: {},

  // Collaborators
  collaborators: [],

  // Activity feed
  activities: [],

  // UI state
  selectedFile: null,
  selectedSection: null,
  focusedView: false,
  viewMode: 'workspace', // 'workspace' | 'settings'

  // Modal state
  showPricingModal: false,

  // Confirmation dialog state
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    confirmButtonColor: '#ef4444',
    onConfirm: null,
    onCancel: null
  },

  // Loading states
  isLoading: false,
  error: null
}

// Action types
const ACTIONS = {
  // Authentication
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',

  LOAD_WORKSPACES: 'LOAD_WORKSPACES',
  CREATE_WORKSPACE: 'CREATE_WORKSPACE',
  SELECT_WORKSPACE: 'SELECT_WORKSPACE',
  UPDATE_WORKSPACE: 'UPDATE_WORKSPACE',

  LOAD_FILES: 'LOAD_FILES',
  ADD_FILE: 'ADD_FILE',
  SELECT_FILE: 'SELECT_FILE',
  UPDATE_FILE: 'UPDATE_FILE',

  ADD_SECTION: 'ADD_SECTION',
  UPDATE_SECTION: 'UPDATE_SECTION',
  DELETE_SECTION: 'DELETE_SECTION',
  REORDER_SECTIONS: 'REORDER_SECTIONS',

  ADD_COMMENT: 'ADD_COMMENT',
  UPDATE_COMMENT: 'UPDATE_COMMENT',

  UPDATE_WORKFLOW_STATE: 'UPDATE_WORKFLOW_STATE',

  ADD_ACTIVITY: 'ADD_ACTIVITY',

  TOGGLE_FOCUSED_VIEW: 'TOGGLE_FOCUSED_VIEW',
  SET_VIEW_MODE: 'SET_VIEW_MODE',

  DELETE_FILE: 'DELETE_FILE',
  DELETE_WORKSPACE: 'DELETE_WORKSPACE',

  GUEST_JOIN: 'GUEST_JOIN',
  GUEST_LOGOUT: 'GUEST_LOGOUT',
  GENERATE_GUEST_LINK: 'GENERATE_GUEST_LINK',

  // Modal actions
  SHOW_PRICING_MODAL: 'SHOW_PRICING_MODAL',
  HIDE_PRICING_MODAL: 'HIDE_PRICING_MODAL',

  // Confirm dialog actions
  SHOW_CONFIRM_DIALOG: 'SHOW_CONFIRM_DIALOG',
  HIDE_CONFIRM_DIALOG: 'HIDE_CONFIRM_DIALOG'
}

// Reducer
function workspaceReducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        error: null
      }

    case ACTIONS.LOGOUT:
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        currentWorkspace: null,
        workspaces: [],
        files: [],
        sections: {},
        comments: {},
        selectedFile: null,
        selectedSection: null,
        activities: [],
        error: null
      }

    case ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.isLoading
      }

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload.error,
        isLoading: false
      }

    case ACTIONS.LOAD_WORKSPACES:
      return {
        ...state,
        workspaces: action.payload.workspaces,
        isLoading: false
      }

    case ACTIONS.CREATE_WORKSPACE:
      const newWorkspace = {
        id: action.payload.id,
        name: action.payload.name,
        description: action.payload.description || '',
        clientLink: action.payload.clientLink || '',
        createdAt: action.payload.createdAt,
        updatedAt: action.payload.updatedAt
      }
      return {
        ...state,
        workspaces: [...state.workspaces, newWorkspace],
        currentWorkspace: newWorkspace
      }

    case ACTIONS.SELECT_WORKSPACE:
      return {
        ...state,
        currentWorkspace: action.payload.workspace,
        files: [],
        sections: {},
        selectedFile: null,
        selectedSection: null
      }

    case ACTIONS.LOAD_FILES:
      return {
        ...state,
        files: action.payload.files,
        isLoading: false
      }

    case ACTIONS.ADD_FILE:
      const newFile = action.payload
      return {
        ...state,
        files: [...state.files, newFile],
        selectedFile: newFile
      }

    case ACTIONS.SELECT_FILE:
      return {
        ...state,
        selectedFile: action.payload.file,
        selectedSection: null
      }

    case ACTIONS.ADD_SECTION:
      const sectionId = uuidv4()
      const newSection = {
        id: sectionId,
        fileId: action.payload.fileId,
        title: action.payload.title || `Section ${Object.keys(state.sections).length + 1}`,
        content: action.payload.content || '',
        workflowState: WORKFLOW_STATES.DRAFT,
        order: action.payload.order || Object.keys(state.sections).length,
        createdAt: new Date().toISOString(),
        comments: [],
        approvals: []
      }

      // Update file to include this section
      const updatedFiles = state.files.map(file => {
        if (file.id === action.payload.fileId) {
          return {
            ...file,
            sections: [...file.sections, sectionId]
          }
        }
        return file
      })

      return {
        ...state,
        sections: {
          ...state.sections,
          [sectionId]: newSection
        },
        files: updatedFiles,
        selectedSection: newSection
      }

    case ACTIONS.UPDATE_SECTION:
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.payload.sectionId]: {
            ...state.sections[action.payload.sectionId],
            ...action.payload.updates,
            updatedAt: new Date().toISOString()
          }
        }
      }

    case ACTIONS.REORDER_SECTIONS:
      // Handle drag-and-drop reordering
      const reorderedSections = { ...state.sections }
      action.payload.newOrder.forEach((sectionId, index) => {
        if (reorderedSections[sectionId]) {
          reorderedSections[sectionId].order = index
        }
      })

      return {
        ...state,
        sections: reorderedSections
      }

    case ACTIONS.ADD_COMMENT:
      const commentId = uuidv4()
      const comment = {
        id: commentId,
        sectionId: action.payload.sectionId,
        author: action.payload.author,
        content: action.payload.content,
        createdAt: new Date().toISOString(),
        resolved: false
      }

      return {
        ...state,
        sections: {
          ...state.sections,
          [action.payload.sectionId]: {
            ...state.sections[action.payload.sectionId],
            comments: [
              ...state.sections[action.payload.sectionId].comments,
              commentId
            ]
          }
        },
        comments: {
          ...state.comments,
          [commentId]: comment
        }
      }

    case ACTIONS.UPDATE_WORKFLOW_STATE:
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.payload.sectionId]: {
            ...state.sections[action.payload.sectionId],
            workflowState: action.payload.newState,
            updatedAt: new Date().toISOString()
          }
        }
      }

    case ACTIONS.ADD_ACTIVITY:
      const activity = {
        id: uuidv4(),
        type: action.payload.type,
        description: action.payload.description,
        user: action.payload.user,
        timestamp: new Date().toISOString(),
        metadata: action.payload.metadata || {}
      }

      return {
        ...state,
        activities: [activity, ...state.activities.slice(0, 49)] // Keep last 50 activities
      }

    case ACTIONS.TOGGLE_FOCUSED_VIEW:
      return {
        ...state,
        focusedView: !state.focusedView
      }

    case ACTIONS.SET_VIEW_MODE:
      return {
        ...state,
        viewMode: action.payload
      }

    case ACTIONS.DELETE_FILE:
      const filteredFiles = state.files.filter(file => file.id !== action.payload.fileId)
      return {
        ...state,
        files: filteredFiles,
        selectedFile: state.selectedFile?.id === action.payload.fileId ? null : state.selectedFile
      }

    case ACTIONS.DELETE_WORKSPACE:
      const filteredWorkspaces = state.workspaces.filter(workspace => workspace.id !== action.payload.workspaceId)
      return {
        ...state,
        workspaces: filteredWorkspaces,
        currentWorkspace: state.currentWorkspace?.id === action.payload.workspaceId ? null : state.currentWorkspace,
        files: state.currentWorkspace?.id === action.payload.workspaceId ? [] : state.files,
        sections: state.currentWorkspace?.id === action.payload.workspaceId ? {} : state.sections,
        selectedFile: state.currentWorkspace?.id === action.payload.workspaceId ? null : state.selectedFile,
        selectedSection: state.currentWorkspace?.id === action.payload.workspaceId ? null : state.selectedSection
      }

    case ACTIONS.GUEST_JOIN:
      return {
        ...state,
        isGuest: true,
        guestName: action.payload.guestName,
        guestWorkspaceId: action.payload.workspaceId,
        currentWorkspace: action.payload.workspace,
        isAuthenticated: true, // Treat guest as authenticated for UI purposes
        user: { name: action.payload.guestName, email: null, isGuest: true }
      }

    case ACTIONS.GUEST_LOGOUT:
      return {
        ...initialState,
        token: null
      }

    case ACTIONS.SHOW_PRICING_MODAL:
      return {
        ...state,
        showPricingModal: true
      }

    case ACTIONS.HIDE_PRICING_MODAL:
      return {
        ...state,
        showPricingModal: false
      }

    case ACTIONS.SHOW_CONFIRM_DIALOG:
      return {
        ...state,
        confirmDialog: {
          ...state.confirmDialog,
          ...action.payload,
          isOpen: true
        }
      }

    case ACTIONS.HIDE_CONFIRM_DIALOG:
      return {
        ...state,
        confirmDialog: {
          ...state.confirmDialog,
          isOpen: false
        }
      }

    // New workflow actions
    case 'UPDATE_COMMENT_DATA':
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.commentId]: action.payload.comment
        }
      }

    case 'LOAD_SECTION_COMMENTS':
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.payload.sectionId]: {
            ...state.sections[action.payload.sectionId],
            comments: action.payload.comments
          }
        },
        comments: {
          ...state.comments,
          ...action.payload.commentsData
        }
      }

    case 'UPDATE_COMMENT_RESOLVED':
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.commentId]: {
            ...state.comments[action.payload.commentId],
            resolved: action.payload.resolved
          }
        }
      }

    case 'ADD_EDIT_REQUEST':
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.payload.sectionId]: {
            ...state.sections[action.payload.sectionId],
            editRequests: [
              ...(state.sections[action.payload.sectionId]?.editRequests || []),
              action.payload.editRequest
            ]
          }
        }
      }

    case 'LOAD_EDIT_REQUESTS':
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.payload.sectionId]: {
            ...state.sections[action.payload.sectionId],
            editRequests: action.payload.editRequests
          }
        }
      }

    case 'UPDATE_EDIT_REQUEST_STATUS':
      const updatedSections = { ...state.sections }
      Object.keys(updatedSections).forEach(sectionId => {
        const section = updatedSections[sectionId]
        if (section.editRequests) {
          section.editRequests = section.editRequests.map(request =>
            request.id === action.payload.requestId
              ? { ...request, status: action.payload.status }
              : request
          )
        }
      })

      return {
        ...state,
        sections: updatedSections
      }

    default:
      return state
  }
}

// Provider component
export const WorkspaceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(workspaceReducer, initialState)

  // Action creators
  const actions = {
    // Authentication
    login: async (email, password) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { isLoading: true } })
      try {
        const response = await apiService.login(email, password)
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.token)
        }
        dispatch({
          type: ACTIONS.LOGIN_SUCCESS,
          payload: { user: response.user, token: response.token }
        })
        actions.addActivity('user_login', `Signed in as ${response.user.name}`, response.user.name)
        // Load workspaces after successful login
        actions.loadWorkspaces()
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: error.message }
        })
        throw error
      }
    },

    signup: async (name, email, password) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { isLoading: true } })
      try {
        const response = await apiService.signup(name, email, password)
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.token)
        }
        dispatch({
          type: ACTIONS.LOGIN_SUCCESS,
          payload: { user: response.user, token: response.token }
        })
        actions.addActivity('user_signup', `Created account for ${response.user.name}`, response.user.name)
        // Load workspaces after successful signup
        actions.loadWorkspaces()
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: error.message }
        })
        throw error
      }
    },

    logout: async () => {
      try {
        await apiService.logout()
      } catch (error) {
        console.warn('Logout API call failed:', error.message)
      }
      dispatch({ type: ACTIONS.LOGOUT })
    },

    initializeAuth: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      console.log('initializeAuth called', { token: token ? 'present' : 'missing' })
      if (token) {
        console.log('Setting loading state and calling API...')
        dispatch({ type: ACTIONS.SET_LOADING, payload: { isLoading: true } })
        try {
          console.log('Making API call to getCurrentUser...')
          const response = await apiService.getCurrentUser()
          console.log('API call successful, user:', response.user?.name)
          dispatch({
            type: ACTIONS.LOGIN_SUCCESS,
            payload: { user: response.user, token }
          })
          // Load workspaces after successful auth
          console.log('Loading workspaces...')
          await actions.loadWorkspaces()
          console.log('Authentication initialization complete!')
        } catch (error) {
          console.error('Token validation failed:', error)
          // Only remove token if it's actually invalid (401/403), not for network errors
          if (error.status === 401 || error.status === 403 || error.message?.includes('Invalid token')) {
            console.log('Token is invalid, logging out')
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token')
            }
            dispatch({
              type: ACTIONS.LOGOUT
            })
          } else {
            console.log('Network/server error, keeping user authenticated')
            // Keep user authenticated but stop loading
            dispatch({ type: ACTIONS.SET_LOADING, payload: { isLoading: false } })
          }
        }
      } else {
        console.log('No token found, user needs to sign in')
      }
    },

    loadWorkspaces: async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { isLoading: true } })
      try {
        const response = await apiService.getProjects()

        // Handle the correct response structure from backend
        const projectsArray = response.projects?.owned || []
        const workspaces = projectsArray.map(project => ({
          id: project.id,
          name: project.title,  // Backend stores 'title', map to 'name' for frontend
          description: project.description,
          clientLink: project.client_link,
          createdAt: project.created_at,
          updatedAt: project.updated_at
        }))

        dispatch({
          type: ACTIONS.LOAD_WORKSPACES,
          payload: { workspaces }
        })
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: error.message }
        })
      }
    },

    createWorkspace: async (name, description, clientLink) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { isLoading: true } })
      try {
        const response = await apiService.createProject({
          title: name,  // Backend expects 'title' field, not 'name'
          description,
          client_link: clientLink
        })

        // Handle the correct response structure from backend
        const project = response.project
        dispatch({
          type: ACTIONS.CREATE_WORKSPACE,
          payload: {
            name: project.title,  // Backend returns 'title', map to 'name' for frontend
            description: project.description,
            clientLink: project.client_link,
            id: project.id,
            createdAt: project.created_at,
            updatedAt: project.updated_at
          }
        })
        actions.addActivity('workspace_created', `Created workspace "${name}"`, 'You')
      } catch (error) {
        // Check if this is a project limit error
        if (error.status === 403 && error.data?.limitReached) {
          // Show pricing modal for upgrade instead of generic error
          dispatch({ type: ACTIONS.SHOW_PRICING_MODAL })
        } else {
          // Show generic error for other cases
          dispatch({
            type: ACTIONS.SET_ERROR,
            payload: { error: error.message }
          })
        }
      }
    },

    selectWorkspace: async (workspace) => {
      dispatch({
        type: ACTIONS.SELECT_WORKSPACE,
        payload: { workspace }
      })
      // Load files for this workspace
      actions.loadFiles(workspace.id)
    },

    loadFiles: async (projectId) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { isLoading: true } })
      try {
        const response = await apiService.getProjectFiles(projectId)
        const files = response.map(file => ({
          id: file.id,
          workspaceId: projectId,
          name: file.original_name,
          type: file.file_type,
          content: file.file_content,
          uploadedAt: file.created_at,
          workflowState: WORKFLOW_STATES.DRAFT,
          sections: []
        }))
        dispatch({
          type: ACTIONS.LOAD_FILES,
          payload: { files }
        })
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: error.message }
        })
      }
    },

    addFile: async (file) => {
      if (!state.currentWorkspace) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: 'Please select a workspace first' }
        })
        return
      }

      dispatch({ type: ACTIONS.SET_LOADING, payload: { isLoading: true } })
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await apiService.uploadFile(state.currentWorkspace.id, formData)

        const newFile = {
          id: response.id,
          workspaceId: state.currentWorkspace.id,
          name: response.original_name,
          type: response.file_type,
          content: response.file_content,
          uploadedAt: response.created_at,
          workflowState: WORKFLOW_STATES.DRAFT,
          sections: []
        }

        dispatch({
          type: ACTIONS.ADD_FILE,
          payload: newFile
        })
        actions.addActivity('file_added', `Added file "${response.original_name}"`, 'You')
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: error.message }
        })
      }
    },

    selectFile: (file) => {
      dispatch({
        type: ACTIONS.SELECT_FILE,
        payload: { file }
      })
    },

    addSection: (fileId, title, content, order) => {
      dispatch({
        type: ACTIONS.ADD_SECTION,
        payload: { fileId, title, content, order }
      })
      actions.addActivity('section_added', `Added section "${title}"`, 'You')
    },

    updateSection: (sectionId, updates) => {
      dispatch({
        type: ACTIONS.UPDATE_SECTION,
        payload: { sectionId, updates }
      })
    },

    reorderSections: (newOrder) => {
      dispatch({
        type: ACTIONS.REORDER_SECTIONS,
        payload: { newOrder }
      })
      actions.addActivity('sections_reordered', 'Reordered sections', 'You')
    },

    addComment: async (sectionId, content, author = 'You', commentType = 'general') => {
      try {
        // Add comment via backend API
        const response = await apiService.addSectionComment(sectionId, {
          comment_text: content,
          comment_type: commentType,
          commenter_name: author
        })

        // Update local state with backend response
        const comment = {
          id: response.comment.id,
          sectionId,
          author: response.comment.commenter_name,
          content: response.comment.comment_text,
          commentType: response.comment.comment_type,
          createdAt: response.comment.created_at,
          resolved: response.comment.is_resolved
        }

        dispatch({
          type: ACTIONS.ADD_COMMENT,
          payload: { sectionId, commentId: comment.id }
        })

        // Update comments object
        dispatch({
          type: 'UPDATE_COMMENT_DATA',
          payload: { commentId: comment.id, comment }
        })

        actions.addActivity('comment_added', `Added comment to section`, author)
        return comment
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: error.message }
        })
        throw error
      }
    },

    loadSectionComments: async (sectionId) => {
      try {
        const response = await apiService.getSectionComments(sectionId)
        const comments = response.comments || []

        // Update comments in state
        const commentsData = {}
        comments.forEach(comment => {
          commentsData[comment.id] = {
            id: comment.id,
            sectionId,
            author: comment.commenter_name,
            content: comment.comment_text,
            commentType: comment.comment_type,
            createdAt: comment.created_at,
            resolved: comment.is_resolved
          }
        })

        dispatch({
          type: 'LOAD_SECTION_COMMENTS',
          payload: { sectionId, comments: Object.keys(commentsData), commentsData }
        })

        return comments
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: error.message }
        })
        throw error
      }
    },

    resolveComment: async (commentId, resolved = true) => {
      try {
        await apiService.resolveSectionComment(commentId, resolved)

        dispatch({
          type: 'UPDATE_COMMENT_RESOLVED',
          payload: { commentId, resolved }
        })

        actions.addActivity('comment_resolved', `${resolved ? 'Resolved' : 'Reopened'} comment`, 'You')
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: error.message }
        })
        throw error
      }
    },

    requestSectionEdit: async (sectionId, editRequest) => {
      try {
        const response = await apiService.requestSectionEdit(sectionId, {
          title: editRequest.title,
          description: editRequest.description,
          edit_type: editRequest.editType || 'content_edit',
          proposed_changes: editRequest.proposedChanges,
          change_reason: editRequest.reason,
          priority: editRequest.priority || 'normal'
        })

        // Add to local state for immediate feedback
        dispatch({
          type: 'ADD_EDIT_REQUEST',
          payload: {
            sectionId,
            editRequest: response.editRequest
          }
        })

        actions.addActivity('edit_requested', `Requested edit for section`, 'You')
        return response.editRequest
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: error.message }
        })
        throw error
      }
    },

    loadSectionEditRequests: async (sectionId) => {
      try {
        const response = await apiService.getSectionEditRequests(sectionId)
        const editRequests = response.editRequests || []

        dispatch({
          type: 'LOAD_EDIT_REQUESTS',
          payload: { sectionId, editRequests }
        })

        return editRequests
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: error.message }
        })
        throw error
      }
    },

    approveEditRequest: async (requestId, approvalData = {}) => {
      try {
        await apiService.updateEditRequestStatus(requestId, 'approved', approvalData)

        dispatch({
          type: 'UPDATE_EDIT_REQUEST_STATUS',
          payload: { requestId, status: 'approved' }
        })

        actions.addActivity('edit_approved', `Approved edit request`, 'You')
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: error.message }
        })
        throw error
      }
    },

    denyEditRequest: async (requestId, reason = '') => {
      try {
        await apiService.updateEditRequestStatus(requestId, 'denied', { denial_reason: reason })

        dispatch({
          type: 'UPDATE_EDIT_REQUEST_STATUS',
          payload: { requestId, status: 'denied' }
        })

        actions.addActivity('edit_denied', `Denied edit request`, 'You')
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: error.message }
        })
        throw error
      }
    },

    updateWorkflowState: (sectionId, newState) => {
      dispatch({
        type: ACTIONS.UPDATE_WORKFLOW_STATE,
        payload: { sectionId, newState }
      })
      actions.addActivity('workflow_updated', `Changed state to ${newState}`, 'You')
    },

    addActivity: (type, description, user) => {
      dispatch({
        type: ACTIONS.ADD_ACTIVITY,
        payload: { type, description, user }
      })
    },

    toggleFocusedView: () => {
      dispatch({
        type: ACTIONS.TOGGLE_FOCUSED_VIEW
      })
    },

    setViewMode: (mode) => {
      dispatch({
        type: ACTIONS.SET_VIEW_MODE,
        payload: mode
      })
    },

    deleteFile: async (fileId) => {
      try {
        await apiService.deleteFile(fileId)
        dispatch({
          type: ACTIONS.DELETE_FILE,
          payload: { fileId }
        })
        actions.addActivity('file_deleted', `Deleted file`, 'You')
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: error.message }
        })
      }
    },

    deleteWorkspace: async (workspaceId) => {
      try {
        await apiService.deleteProject(workspaceId)
        dispatch({
          type: ACTIONS.DELETE_WORKSPACE,
          payload: { workspaceId }
        })
        actions.addActivity('workspace_deleted', `Deleted workspace`, 'You')
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: error.message }
        })
      }
    },

    generateGuestLink: (workspaceId) => {
      // Generate a secure guest link for this workspace
      const guestToken = btoa(`${workspaceId}:${Date.now()}:${Math.random()}`)
      const guestLink = `${window.location.origin}/guest/${guestToken}`

      // Copy to clipboard
      navigator.clipboard.writeText(guestLink).then(() => {
        actions.showConfirmDialog({
          message: `Guest link copied to clipboard!\n\n${guestLink}\n\nShare this link with external collaborators. They can join without creating an account.`,
          confirmText: 'Got it',
          showCancel: false
        })
      }).catch(() => {
        actions.showConfirmDialog({
          message: `Guest link generated:\n\n${guestLink}\n\nShare this link with external collaborators. They can join without creating an account.`,
          confirmText: 'Got it',
          showCancel: false
        })
      })

      actions.addActivity('guest_link_generated', 'Generated guest collaboration link', 'You')
    },

    joinAsGuest: async (guestToken, guestName, workspaceId) => {
      try {
        // Create a guest workspace object - in a real app, you'd validate with the backend
        const workspace = {
          id: workspaceId,
          name: 'Guest Workspace',
          description: 'Collaborating as guest',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        dispatch({
          type: ACTIONS.GUEST_JOIN,
          payload: { guestName, workspaceId, workspace }
        })

        actions.addActivity('guest_joined', `${guestName} joined as guest collaborator`, guestName)

        // Load files for the guest workspace (simulate with empty array for now)
        dispatch({
          type: ACTIONS.LOAD_FILES,
          payload: { files: [] }
        })

      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: error.message }
        })
        throw error
      }
    },

    guestLogout: () => {
      dispatch({ type: ACTIONS.GUEST_LOGOUT })
    },

    upgradeGuestToAccount: async (name, email, password) => {
      if (!state.isGuest) {
        throw new Error('Only guest users can upgrade to an account')
      }

      // Store current guest data
      const guestData = {
        guestName: state.guestName,
        workspace: state.currentWorkspace,
        files: state.files,
        sections: state.sections,
        comments: state.comments,
        activities: state.activities
      }

      try {
        // Create new account
        const response = await apiService.signup(name, email, password)
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.token)
        }

        // Transfer guest data to new account
        dispatch({
          type: ACTIONS.LOGIN_SUCCESS,
          payload: { user: response.user, token: response.token }
        })

        // Restore guest data under new account
        if (guestData.workspace) {
          dispatch({
            type: ACTIONS.SELECT_WORKSPACE,
            payload: { workspace: guestData.workspace }
          })
        }

        if (guestData.files.length > 0) {
          dispatch({
            type: ACTIONS.LOAD_FILES,
            payload: { files: guestData.files }
          })
        }

        // Add upgrade activity
        actions.addActivity('guest_upgraded', `${guestData.guestName} upgraded to account: ${response.user.name}`, response.user.name)

        // Load actual workspaces now that user has an account
        await actions.loadWorkspaces()

        return response
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: error.message }
        })
        throw error
      }
    },

    // Modal actions
    showPricingModal: () => {
      dispatch({ type: ACTIONS.SHOW_PRICING_MODAL })
    },

    hidePricingModal: () => {
      dispatch({ type: ACTIONS.HIDE_PRICING_MODAL })
    },

    // Confirm dialog actions
    showConfirmDialog: (options) => {
      dispatch({
        type: ACTIONS.SHOW_CONFIRM_DIALOG,
        payload: options
      })
    },

    hideConfirmDialog: () => {
      dispatch({ type: ACTIONS.HIDE_CONFIRM_DIALOG })
    }
  }

  const value = {
    state,
    actions,
    WORKFLOW_STATES
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

// Hook to use the workspace context
export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}