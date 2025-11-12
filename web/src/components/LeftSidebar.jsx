import React, { useState } from 'react'
import { useWorkspace } from '../stores/WorkspaceStore'

const LeftSidebar = () => {
  const { state, actions, WORKFLOW_STATES } = useWorkspace()
  const [activeSection, setActiveSection] = useState('files')
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
  const [workspaceForm, setWorkspaceForm] = useState({ name: '', description: '', clientLink: '' })
  const [showUpgradeForm, setShowUpgradeForm] = useState(false)
  const [upgradeForm, setUpgradeForm] = useState({ name: '', email: '', password: '' })

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

  const handleUpgradeToAccount = async () => {
    if (upgradeForm.name.trim() && upgradeForm.email.trim() && upgradeForm.password.trim()) {
      try {
        await actions.upgradeGuestToAccount(
          upgradeForm.name.trim(),
          upgradeForm.email.trim(),
          upgradeForm.password.trim()
        )
        setUpgradeForm({ name: '', email: '', password: '' })
        setShowUpgradeForm(false)
      } catch (error) {
        alert('Failed to upgrade to account: ' + error.message)
      }
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]

    if (!file) return

    if (!state.currentWorkspace) {
      alert('Please select a workspace first')
      event.target.value = ''
      return
    }

    // File type restrictions - only allow certain types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml',
      'application/pdf',
      'text/plain', 'text/markdown', 'text/html', 'text/css', 'text/javascript',
      'application/json', 'application/xml',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/msword', // .doc
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-powerpoint', // .ppt
      'application/zip', 'application/x-rar-compressed'
    ]

    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.svg',
      '.pdf',
      '.txt', '.md', '.html', '.css', '.js', '.jsx', '.ts', '.tsx',
      '.json', '.xml', '.yaml', '.yml',
      '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt',
      '.zip', '.rar'
    ]

    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)

    if (!isValidType) {
      alert(`File type not supported. Allowed types:\n• Images: JPG, PNG, GIF, SVG\n• Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX\n• Code: TXT, MD, HTML, CSS, JS, JSX, TS, TSX, JSON, XML, YAML\n• Archives: ZIP, RAR`)
      event.target.value = ''
      return
    }

    // File size limit - 50MB
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`File size too large. Maximum allowed size is 50MB.\nYour file: ${(file.size / (1024 * 1024)).toFixed(1)}MB`)
      event.target.value = ''
      return
    }

    actions.addFile(file)
    // Reset input value so same file can be uploaded again
    event.target.value = ''
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
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#ffffff'
                }}>
                  {workspace.name}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      actions.generateGuestLink(workspace.id)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#666666',
                      cursor: 'pointer',
                      fontSize: '10px',
                      padding: '2px'
                    }}
                    title="Share workspace with guest collaborators"
                  >
                    ↗
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete workspace "${workspace.name}"?\n\nThis will permanently delete all files and sections in this workspace.`)) {
                        actions.deleteWorkspace(workspace.id)
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#666666',
                      cursor: 'pointer',
                      fontSize: '10px',
                      padding: '2px'
                    }}
                    title="Delete workspace"
                  >
                    ×
                  </button>
                </div>
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
                  color: '#ffffff',
                  flex: 1,
                  marginRight: '8px'
                }}>
                  {file.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    padding: '2px 4px',
                    fontSize: '8px',
                    background: getWorkflowBadgeColor(file.workflowState),
                    color: '#ffffff',
                    textTransform: 'uppercase'
                  }}>
                    {file.workflowState.replace('_', ' ')}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete file "${file.name}"?\n\nThis will permanently delete the file and all its sections.`)) {
                        actions.deleteFile(file.id)
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#666666',
                      cursor: 'pointer',
                      fontSize: '10px',
                      padding: '2px'
                    }}
                    title="Delete file"
                  >
                    ×
                  </button>
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
        marginBottom: '16px',
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

      {/* Guest Upgrade Section */}
      {state.isGuest && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#ffffff', marginBottom: '8px' }}>
            Guest Account
          </div>
          <div style={{
            fontSize: '10px',
            color: '#666666',
            marginBottom: '8px',
            lineHeight: '1.4'
          }}>
            You're collaborating as {state.guestName}. Create an account to save your work and access more features.
          </div>
          {!showUpgradeForm ? (
            <button
              onClick={() => setShowUpgradeForm(true)}
              style={{
                width: '100%',
                background: '#2ed573',
                border: 'none',
                color: '#000000',
                padding: '8px 12px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ⬆ Upgrade to Account
            </button>
          ) : (
            <div style={{
              border: '1px solid #333333',
              background: '#111111',
              padding: '12px'
            }}>
              <div style={{ fontSize: '10px', color: '#999999', marginBottom: '8px' }}>
                Create your account - your work will be preserved!
              </div>
              <input
                type="text"
                placeholder="Your name"
                value={upgradeForm.name}
                onChange={(e) => setUpgradeForm({ ...upgradeForm, name: e.target.value })}
                style={{
                  width: '100%',
                  background: '#000000',
                  border: '1px solid #333333',
                  color: '#ffffff',
                  padding: '6px 8px',
                  fontSize: '11px',
                  marginBottom: '6px'
                }}
              />
              <input
                type="email"
                placeholder="Email address"
                value={upgradeForm.email}
                onChange={(e) => setUpgradeForm({ ...upgradeForm, email: e.target.value })}
                style={{
                  width: '100%',
                  background: '#000000',
                  border: '1px solid #333333',
                  color: '#ffffff',
                  padding: '6px 8px',
                  fontSize: '11px',
                  marginBottom: '6px'
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={upgradeForm.password}
                onChange={(e) => setUpgradeForm({ ...upgradeForm, password: e.target.value })}
                style={{
                  width: '100%',
                  background: '#000000',
                  border: '1px solid #333333',
                  color: '#ffffff',
                  padding: '6px 8px',
                  fontSize: '11px',
                  marginBottom: '8px'
                }}
              />
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={handleUpgradeToAccount}
                  style={{
                    flex: 1,
                    background: '#2ed573',
                    color: '#000000',
                    border: 'none',
                    padding: '6px 8px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Create Account
                </button>
                <button
                  onClick={() => setShowUpgradeForm(false)}
                  style={{
                    background: 'none',
                    color: '#ffffff',
                    border: '1px solid #666666',
                    padding: '6px 8px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: '#ffffff', marginBottom: '8px' }}>
          Account
        </div>
        <button
          onClick={state.isGuest ? actions.guestLogout : actions.logout}
          style={{
            width: '100%',
            background: '#111111',
            border: '1px solid #333333',
            color: '#ffffff',
            padding: '8px 12px',
            fontSize: '11px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          {state.isGuest ? 'Leave Session' : 'Sign Out'}
        </button>
      </div>

      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '12px', color: '#ffffff', marginBottom: '8px' }}>
          Unique Shortcuts
        </div>
        <div style={{ fontSize: '10px', color: '#666666', lineHeight: '1.6' }}>
          ⌘ + ⇧ + S - New section<br />
          ⌘ + ⌥ + Z - Toggle zen mode<br />
          ⌘ + ⌃ + ↑/↓ - Navigate sections<br />
          ⌘ + ⇧ + F - Upload file<br />
          ⌘ + ⌥ + W - New workspace<br />
          ⌘ + ⇧ + A - Approve section<br />
          ⌘ + ⇧ + R - Request changes<br />
          ⌘ + ⌥ + D - Delete item<br />
          ⌘ + ⌃ + C - Add comment
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
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {state.isGuest && (
            <div style={{
              fontSize: '10px',
              color: '#ffa502',
              background: '#333333',
              padding: '2px 4px',
              borderRadius: '2px'
            }}>
              GUEST
            </div>
          )}
          <div style={{
            fontSize: '10px',
            color: '#666666'
          }}>
            v2.0
          </div>
          <button
            onClick={state.isGuest ? actions.guestLogout : actions.logout}
            style={{
              background: 'none',
              border: '1px solid #333333',
              color: '#666666',
              cursor: 'pointer',
              fontSize: '10px',
              padding: '2px 4px'
            }}
            title={state.isGuest ? "Leave workspace" : "Sign out"}
          >
            ⏻
          </button>
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