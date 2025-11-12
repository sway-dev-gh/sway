import React, { createContext, useContext, useReducer } from 'react'
import { v4 as uuidv4 } from 'uuid'

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
  focusedView: false
}

// Action types
const ACTIONS = {
  CREATE_WORKSPACE: 'CREATE_WORKSPACE',
  SELECT_WORKSPACE: 'SELECT_WORKSPACE',
  UPDATE_WORKSPACE: 'UPDATE_WORKSPACE',

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

  TOGGLE_FOCUSED_VIEW: 'TOGGLE_FOCUSED_VIEW'
}

// Reducer
function workspaceReducer(state, action) {
  switch (action.type) {
    case ACTIONS.CREATE_WORKSPACE:
      const newWorkspace = {
        id: uuidv4(),
        name: action.payload.name,
        description: action.payload.description || '',
        clientLink: action.payload.clientLink || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
        // Load workspace-specific data here
        files: action.payload.files || [],
        sections: action.payload.sections || {},
        selectedFile: null,
        selectedSection: null
      }

    case ACTIONS.ADD_FILE:
      const newFile = {
        id: uuidv4(),
        workspaceId: state.currentWorkspace.id,
        name: action.payload.name,
        type: action.payload.type,
        content: action.payload.content || '',
        uploadedAt: new Date().toISOString(),
        workflowState: WORKFLOW_STATES.DRAFT,
        sections: []
      }
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

    default:
      return state
  }
}

// Provider component
export const WorkspaceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(workspaceReducer, initialState)

  // Action creators
  const actions = {
    createWorkspace: (name, description, clientLink) => {
      dispatch({
        type: ACTIONS.CREATE_WORKSPACE,
        payload: { name, description, clientLink }
      })
      actions.addActivity('workspace_created', `Created workspace "${name}"`, 'You')
    },

    selectWorkspace: (workspace, files = [], sections = {}) => {
      dispatch({
        type: ACTIONS.SELECT_WORKSPACE,
        payload: { workspace, files, sections }
      })
    },

    addFile: (name, type, content) => {
      dispatch({
        type: ACTIONS.ADD_FILE,
        payload: { name, type, content }
      })
      actions.addActivity('file_added', `Added file "${name}"`, 'You')
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

    addComment: (sectionId, content, author = 'You') => {
      dispatch({
        type: ACTIONS.ADD_COMMENT,
        payload: { sectionId, content, author }
      })
      actions.addActivity('comment_added', `Added comment to section`, author)
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