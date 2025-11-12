import React, { useState } from 'react'
import { useWorkspace } from '../stores/WorkspaceStore'

const LeftSidebar = () => {
  const { state, actions, WORKFLOW_STATES } = useWorkspace()
  const [activeSection, setActiveSection] = useState('files')
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
  const [workspaceForm, setWorkspaceForm] = useState({ name: '', description: '', clientLink: '' })

  const sidebarSections = [
    { id: 'workspaces', label: 'Workspaces', icon: '◧' },
    { id: 'files', label: 'Files', icon: '◈' },
    { id: 'approvals', label: 'Approvals', icon: '✓' },
    { id: 'settings', label: 'Settings', icon: '⚙' }
  ]

  const handleCreateWorkspace = () => {
    if (workspaceForm.name.trim()) {
      actions.createWorkspace(
        workspaceForm.name.trim(),
        workspaceForm.description.trim(),
        workspaceForm.clientLink.trim()
      )
      setWorkspaceForm({ name: '', description: '', clientLink: '' })
      setShowCreateWorkspace(false)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file && state.currentWorkspace) {
      const reader = new FileReader()
      reader.onload = (e) => {
        actions.addFile(file.name, file.type, e.target.result)
      }
      reader.readAsText(file)
    }
  }

  const getWorkflowBadgeColor = (state) => {
    switch (state) {
      case WORKFLOW_STATES.DRAFT: return '#666666'
      case WORKFLOW_STATES.UNDER_REVIEW: return '#ffa502'
      case WORKFLOW_STATES.CHANGES_REQUESTED: return '#ff4757'
      case WORKFLOW_STATES.APPROVED: return '#2ed573'
      case WORKFLOW_STATES.DELIVERED: return '#1e90ff'
      default: return '#666666'
    }
  }

  const renderWorkspaceSection = () => (
    <div style={{ padding: '16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <span style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: '#999999'
        }}>
          Workspaces
        </span>
        <button
          onClick={() => setShowCreateWorkspace(!showCreateWorkspace)}
          style={{
            background: 'none',
            border: '1px solid #666666',
            color: '#ffffff',
            padding: '2px 6px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          New
        </button>
      </div>

      {showCreateWorkspace && (
        <div style={{
          border: '1px solid #333333',
          padding: '12px',
          marginBottom: '12px',
          background: '#111111'
        }}>
          <input
            type="text"
            placeholder="Workspace name"
            value={workspaceForm.name}
            onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
            style={{
              width: '100%',
              background: '#000000',
              border: '1px solid #333333',
              color: '#ffffff',
              padding: '6px',
              fontSize: '12px',
              marginBottom: '6px'
            }}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={workspaceForm.description}
            onChange={(e) => setWorkspaceForm({ ...workspaceForm, description: e.target.value })}
            style={{
              width: '100%',
              background: '#000000',
              border: '1px solid #333333',
              color: '#ffffff',
              padding: '6px',
              fontSize: '12px',
              marginBottom: '6px'
            }}
          />
          <input
            type="text"
            placeholder="Client link (optional)"
            value={workspaceForm.clientLink}
            onChange={(e) => setWorkspaceForm({ ...workspaceForm, clientLink: e.target.value })}
            style={{
              width: '100%',
              background: '#000000',
              border: '1px solid #333333',
              color: '#ffffff',
              padding: '6px',
              fontSize: '12px',
              marginBottom: '8px'
            }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleCreateWorkspace}
              style={{
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateWorkspace(false)}
              style={{
                background: 'none',
                color: '#ffffff',
                border: '1px solid #666666',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ maxHeight: '200px', overflow: 'auto' }}>
        {state.workspaces.length === 0 ? (
          <div style={{
            color: '#666666',
            fontSize: '11px',
            textAlign: 'center',
            padding: '20px 0'
          }}>
            No workspaces yet
          </div>
        ) : (
          state.workspaces.map(workspace => (
            <div
              key={workspace.id}
              onClick={() => actions.selectWorkspace(workspace)}
              style={{
                padding: '8px',
                cursor: 'pointer',
                borderLeft: state.currentWorkspace?.id === workspace.id ? '2px solid #ffffff' : '2px solid transparent',
                background: state.currentWorkspace?.id === workspace.id ? '#111111' : 'transparent'
              }}
            >
              <div style={{
                fontSize: '12px',
                color: '#ffffff',
                marginBottom: '2px'
              }}>
                {workspace.name}
              </div>
              {workspace.description && (
                <div style={{
                  fontSize: '10px',
                  color: '#666666'
                }}>
                  {workspace.description}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )

  const renderFilesSection = () => (
    <div style={{ padding: '16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <span style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: '#999999'
        }}>
          Files
        </span>
        <label style={{
          background: 'none',
          border: '1px solid #666666',
          color: '#ffffff',
          padding: '2px 6px',
          fontSize: '10px',
          cursor: 'pointer'
        }}>
          Add
          <input
            type="file"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            disabled={!state.currentWorkspace}
          />
        </label>
      </div>

      {!state.currentWorkspace ? (
        <div style={{
          color: '#666666',
          fontSize: '11px',
          textAlign: 'center',
          padding: '20px 0'
        }}>
          Select a workspace first
        </div>
      ) : state.files.length === 0 ? (
        <div style={{
          color: '#666666',
          fontSize: '11px',
          textAlign: 'center',
          padding: '20px 0'
        }}>
          No files yet
        </div>
      ) : (
        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
          {state.files.map(file => (
            <div
              key={file.id}
              onClick={() => actions.selectFile(file)}
              style={{
                padding: '8px',
                cursor: 'pointer',
                borderLeft: state.selectedFile?.id === file.id ? '2px solid #ffffff' : '2px solid transparent',
                background: state.selectedFile?.id === file.id ? '#111111' : 'transparent'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{
                  fontSize: '12px',
                  color: '#ffffff'
                }}>
                  {file.name}
                </span>
                <div style={{
                  padding: '2px 4px',
                  fontSize: '8px',
                  background: getWorkflowBadgeColor(file.workflowState),
                  color: '#ffffff',
                  textTransform: 'uppercase'
                }}>
                  {file.workflowState.replace('_', ' ')}
                </div>
              </div>
              <div style={{
                fontSize: '10px',
                color: '#666666'
              }}>
                {file.sections.length} sections
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderApprovalsSection = () => {
    const pendingApprovals = Object.values(state.sections).filter(
      section => section.workflowState === WORKFLOW_STATES.UNDER_REVIEW
    )

    return (
      <div style={{ padding: '16px' }}>
        <span style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: '#999999',
          marginBottom: '12px',
          display: 'block'
        }}>
          Pending Approvals ({pendingApprovals.length})
        </span>

        {pendingApprovals.length === 0 ? (
          <div style={{
            color: '#666666',
            fontSize: '11px',
            textAlign: 'center',
            padding: '20px 0'
          }}>
            No pending approvals
          </div>
        ) : (
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {pendingApprovals.map(section => (
              <div
                key={section.id}
                style={{
                  padding: '8px',
                  marginBottom: '4px',
                  border: '1px solid #333333',
                  background: '#111111'
                }}
              >
                <div style={{
                  fontSize: '12px',
                  color: '#ffffff',
                  marginBottom: '4px'
                }}>
                  {section.title}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#666666',
                  marginBottom: '6px'
                }}>
                  {section.comments.length} comments
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => actions.updateWorkflowState(section.id, WORKFLOW_STATES.APPROVED)}
                    style={{
                      background: '#2ed573',
                      color: '#000000',
                      border: 'none',
                      padding: '2px 6px',
                      fontSize: '9px',
                      cursor: 'pointer'
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => actions.updateWorkflowState(section.id, WORKFLOW_STATES.CHANGES_REQUESTED)}
                    style={{
                      background: '#ff4757',
                      color: '#ffffff',
                      border: 'none',
                      padding: '2px 6px',
                      fontSize: '9px',
                      cursor: 'pointer'
                    }}
                  >
                    Request Changes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderSettingsSection = () => (
    <div style={{ padding: '16px' }}>
      <span style={{
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: '#999999',
        marginBottom: '12px',
        display: 'block'
      }}>
        Settings
      </span>

      <div style={{ fontSize: '12px', color: '#ffffff', marginBottom: '8px' }}>
        View Options
      </div>

      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        cursor: 'pointer',
        fontSize: '11px',
        color: '#ffffff'
      }}>
        <input
          type="checkbox"
          checked={state.focusedView}
          onChange={actions.toggleFocusedView}
          style={{ margin: 0 }}
        />
        Focused View
      </label>

      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '12px', color: '#ffffff', marginBottom: '8px' }}>
          Keyboard Shortcuts
        </div>
        <div style={{ fontSize: '10px', color: '#666666', lineHeight: '1.4' }}>
          ⌘ + N - New section<br />
          ⌘ + / - Toggle focused view<br />
          ⌘ + ↑/↓ - Navigate sections
        </div>
      </div>
    </div>
  )

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'workspaces': return renderWorkspaceSection()
      case 'files': return renderFilesSection()
      case 'approvals': return renderApprovalsSection()
      case 'settings': return renderSettingsSection()
      default: return renderFilesSection()
    }
  }

  return (
    <div style={{
      width: '280px',
      height: '100vh',
      background: '#000000',
      borderRight: '1px solid #333333',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #333333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#ffffff'
        }}>
          SwayFiles
        </div>
        <div style={{
          fontSize: '10px',
          color: '#666666'
        }}>
          v2.0
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #333333'
      }}>
        {sidebarSections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              flex: 1,
              background: activeSection === section.id ? '#111111' : 'transparent',
              border: 'none',
              color: activeSection === section.id ? '#ffffff' : '#666666',
              padding: '12px 8px',
              fontSize: '10px',
              cursor: 'pointer',
              borderBottom: activeSection === section.id ? '2px solid #ffffff' : '2px solid transparent'
            }}
            title={section.label}
          >
            <div style={{ marginBottom: '2px' }}>{section.icon}</div>
            {section.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{
        flex: 1,
        overflow: 'auto'
      }}>
        {renderSectionContent()}
      </div>

      {/* Status Bar */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid #333333',
        fontSize: '10px',
        color: '#666666',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>
          {state.currentWorkspace ? state.currentWorkspace.name : 'No workspace'}
        </span>
        <span>
          {state.files.length} files
        </span>
      </div>
    </div>
  )
}

export default LeftSidebar