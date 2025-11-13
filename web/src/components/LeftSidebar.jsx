import React, { useState, useEffect } from 'react'
import { useWorkspace } from '../stores/WorkspaceStore'
import EditRequestManager from './EditRequestManager'

const LeftSidebar = () => {
  const { state, actions, WORKFLOW_STATES } = useWorkspace()
  // Load saved tab from localStorage, fallback to 'progress' if none saved
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('swayfiles-active-tab') || 'files'
  })
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
  const [workspaceForm, setWorkspaceForm] = useState({ name: '', description: '', clientLink: '' })
  const [showUpgradeForm, setShowUpgradeForm] = useState(false)
  const [upgradeForm, setUpgradeForm] = useState({ name: '', email: '', password: '' })
  const [showEditRequestManager, setShowEditRequestManager] = useState(false)
  const [editRequests, setEditRequests] = useState([])
  const [recentActivity, setRecentActivity] = useState([])

  const sidebarSections = [
    { id: 'files', label: 'FILES', icon: '◈' },
    { id: 'requests', label: 'REQUESTS', icon: '◪' },
    { id: 'workspaces', label: 'WORKSPACES', icon: '◯' },
    { id: 'settings', label: 'SETTINGS', icon: '⚙' }
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
        actions.showConfirmDialog({
          message: 'Failed to upgrade to account: ' + error.message,
          confirmText: 'OK',
          showCancel: false
        })
      }
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]

    if (!file) return

    if (!state.currentWorkspace) {
      actions.showConfirmDialog({
        message: 'Please select a workspace first',
        confirmText: 'OK',
        showCancel: false
      })
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
      actions.showConfirmDialog({
        message: `File type not supported. Allowed types:\n• Images: JPG, PNG, GIF, SVG\n• Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX\n• Code: TXT, MD, HTML, CSS, JS, JSX, TS, TSX, JSON, XML, YAML\n• Archives: ZIP, RAR`,
        confirmText: 'Got it',
        showCancel: false
      })
      event.target.value = ''
      return
    }

    // File size limit - 50MB
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      actions.showConfirmDialog({
        message: `File size too large. Maximum allowed size is 50MB.\nYour file: ${(file.size / (1024 * 1024)).toFixed(1)}MB`,
        confirmText: 'OK',
        showCancel: false
      })
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
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#000000',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          Workspaces
        </span>
        <button
          onClick={() => setShowCreateWorkspace(!showCreateWorkspace)}
          style={{
            background: '#ffffff',
            border: '1px solid #e5e5e5',
            color: '#666666',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          New
        </button>
      </div>

      {showCreateWorkspace && (
        <div style={{
          border: '1px solid #e5e5e5',
          padding: '16px',
          marginBottom: '16px',
          background: '#f8f9fa'
        }}>
          <input
            type="text"
            placeholder="Workspace name"
            value={workspaceForm.name}
            onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #e5e5e5',
              color: '#000000',
              padding: '8px 12px',
              fontSize: '14px',
              marginBottom: '8px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={workspaceForm.description}
            onChange={(e) => setWorkspaceForm({ ...workspaceForm, description: e.target.value })}
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #e5e5e5',
              color: '#000000',
              padding: '8px 12px',
              fontSize: '14px',
              marginBottom: '8px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          />
          <input
            type="text"
            placeholder="Client link (optional)"
            value={workspaceForm.clientLink}
            onChange={(e) => setWorkspaceForm({ ...workspaceForm, clientLink: e.target.value })}
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #e5e5e5',
              color: '#000000',
              padding: '8px 12px',
              fontSize: '14px',
              marginBottom: '12px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCreateWorkspace}
              style={{
                background: '#000000',
                color: '#ffffff',
                border: '1px solid #000000',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                flex: 1
              }}
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateWorkspace(false)}
              style={{
                background: '#ffffff',
                color: '#666666',
                border: '1px solid #e5e5e5',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ maxHeight: '300px', overflow: 'auto' }}>
        {state.workspaces.length === 0 ? (
          <div style={{
            color: '#999999',
            fontSize: '13px',
            textAlign: 'center',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            No workspaces yet
          </div>
        ) : (
          state.workspaces.map(workspace => (
            <div
              key={workspace.id}
              onClick={() => actions.selectWorkspace(workspace)}
              style={{
                padding: '12px',
                cursor: 'pointer',
                marginBottom: '4px',
                background: state.currentWorkspace?.id === workspace.id ? '#f0f0f0' : '#ffffff',
                border: '1px solid #e5e5e5',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#000000',
                  fontWeight: '500',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
                      background: '#ffffff',
                      border: '1px solid #e5e5e5',
                      color: '#666666',
                      cursor: 'pointer',
                      fontSize: '11px',
                      padding: '4px 6px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                    title="Share workspace with guest collaborators"
                  >
                    Share
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log('Delete button clicked for workspace:', workspace.id)
                      actions.showConfirmDialog({
                        message: `Delete workspace "${workspace.name}"?\n\nThis will permanently delete all files and sections in this workspace.`,
                        confirmText: 'DELETE',
                        cancelText: 'CANCEL',
                        showCancel: true,
                        onConfirm: () => {
                          console.log('Confirming delete for workspace:', workspace.id)
                          actions.deleteWorkspace(workspace.id)
                        }
                      })
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e5e5e5',
                      color: '#666666',
                      cursor: 'pointer',
                      fontSize: '11px',
                      padding: '4px 6px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                    title="Delete workspace"
                  >
                    ×
                  </button>
                </div>
              </div>
              {workspace.description && (
                <div style={{
                  fontSize: '12px',
                  color: '#666666',
                  lineHeight: '1.4',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#000000',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          Files
        </span>
        <label style={{
          background: '#ffffff',
          border: '1px solid #e5e5e5',
          color: '#666666',
          padding: '4px 8px',
          fontSize: '12px',
          cursor: 'pointer',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
          color: '#999999',
          fontSize: '13px',
          textAlign: 'center',
          padding: '20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          Select workspace first
        </div>
      ) : state.files.length === 0 ? (
        <div style={{
          color: '#999999',
          fontSize: '13px',
          textAlign: 'center',
          padding: '20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
                padding: '12px',
                cursor: 'pointer',
                border: '1px solid #e5e5e5',
                marginBottom: '4px',
                background: state.selectedFile?.id === file.id ? '#f0f0f0' : '#ffffff',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{
                  fontSize: '14px',
                  color: '#000000',
                  flex: 1,
                  marginRight: '8px',
                  fontWeight: '500',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  {file.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    padding: '2px 6px',
                    fontSize: '11px',
                    background: '#f8f9fa',
                    border: '1px solid #e5e5e5',
                    color: '#666666',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    {file.workflowState.replace('_', ' ')}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      actions.showConfirmDialog({
                        message: `Delete file "${file.name}"?\n\nThis will permanently delete the file and all its sections.`,
                        confirmText: 'DELETE',
                        cancelText: 'CANCEL',
                        showCancel: true,
                        onConfirm: () => actions.deleteFile(file.id)
                      })
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e5e5e5',
                      color: '#666666',
                      cursor: 'pointer',
                      fontSize: '11px',
                      padding: '4px 6px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                    title="Delete file"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666666',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                {file.sections.length} section{file.sections.length !== 1 ? 's' : ''}
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
      <div style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#000000',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            Requests ({pendingApprovals.length})
          </span>
        </div>

        {pendingApprovals.length === 0 ? (
          <div style={{
            color: '#999999',
            fontSize: '13px',
            textAlign: 'center',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            Review queue empty
          </div>
        ) : (
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {pendingApprovals.map(section => (
              <div
                key={section.id}
                style={{
                  padding: '12px',
                  marginBottom: '4px',
                  border: '1px solid #e5e5e5',
                  background: '#ffffff',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                <div style={{
                  fontSize: '14px',
                  color: '#000000',
                  marginBottom: '4px',
                  fontWeight: '500',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  {section.title}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666666',
                  marginBottom: '8px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  {section.comments.length} comment{section.comments.length !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => actions.updateWorkflowState(section.id, WORKFLOW_STATES.APPROVED)}
                    style={{
                      background: '#000000',
                      color: '#ffffff',
                      border: '1px solid #000000',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => actions.updateWorkflowState(section.id, WORKFLOW_STATES.CHANGES_REQUESTED)}
                    style={{
                      background: '#ffffff',
                      color: '#666666',
                      border: '1px solid #e5e5e5',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
    <div style={{ padding: '20px' }}>
      <span style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#000000',
        marginBottom: '20px',
        display: 'block',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        Settings
      </span>

      {/* Billing & Subscription */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', color: '#000000', marginBottom: '12px', fontWeight: '600', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          Billing & Subscription
        </div>
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #e5e5e5',
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '14px', color: '#000000', fontWeight: '500', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>SwayFiles Pro</span>
            <span style={{
              fontSize: '11px',
              background: '#000000',
              color: '#ffffff',
              padding: '4px 8px',
              fontWeight: '500',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              Active
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#666666', marginBottom: '12px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            $15/month • Unlimited workspaces & files
          </div>
          <button
            onClick={() => {
              window.open('https://billing.stripe.com/p/login/test_28ocPYdJ1eR3duE000', '_blank')
            }}
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #e5e5e5',
              color: '#666666',
              padding: '8px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            Manage Subscription
          </button>

          {/* Admin Controls - Only visible for testing */}
          <div style={{ marginTop: '12px', padding: '12px', border: '1px solid #e5e5e5', background: '#ffffff' }}>
            <div style={{ fontSize: '11px', color: '#999999', marginBottom: '8px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Admin Controls (Testing)</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/user-plan', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-admin-key': 'admin123' // You should set this as an env var
                      },
                      body: JSON.stringify({
                        userEmail: state.user?.email,
                        plan: 'free'
                      })
                    })
                    if (response.ok) {
                      window.location.reload()
                    }
                  } catch (error) {
                    console.error('Failed to switch to free plan:', error)
                  }
                }}
                style={{
                  flex: 1,
                  background: '#ffffff',
                  border: '1px solid #e5e5e5',
                  color: '#666666',
                  padding: '6px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                → Free
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/user-plan', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-admin-key': 'admin123' // You should set this as an env var
                      },
                      body: JSON.stringify({
                        userEmail: state.user?.email,
                        plan: 'pro'
                      })
                    })
                    if (response.ok) {
                      window.location.reload()
                    }
                  } catch (error) {
                    console.error('Failed to switch to pro plan:', error)
                  }
                }}
                style={{
                  flex: 1,
                  background: '#000000',
                  border: '1px solid #000000',
                  color: '#ffffff',
                  padding: '6px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                → Pro
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Options */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', color: '#000000', marginBottom: '12px', fontWeight: '600', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          View Options
        </div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          fontSize: '13px',
          color: '#000000',
          padding: '4px 0',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <input
            type="checkbox"
            checked={state.focusedView}
            onChange={actions.toggleFocusedView}
            style={{
              margin: 0,
              marginRight: '6px'
            }}
          />
          Focused View
        </label>
      </div>

      {/* Guest Upgrade Section */}
      {state.isGuest && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', color: '#000000', marginBottom: '12px', fontWeight: '600', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            Guest Account
          </div>
          <div style={{
            fontSize: '12px',
            color: '#666666',
            marginBottom: '12px',
            lineHeight: '1.5',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            You're collaborating as {state.guestName}. Create an account to save your work and access more features.
          </div>
          {!showUpgradeForm ? (
            <button
              onClick={() => setShowUpgradeForm(true)}
              style={{
                width: '100%',
                background: '#000000',
                border: '1px solid #000000',
                color: '#ffffff',
                padding: '8px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              Upgrade to Account
            </button>
          ) : (
            <div style={{
              border: '1px solid #e5e5e5',
              background: '#f8f9fa',
              padding: '16px'
            }}>
              <div style={{ fontSize: '12px', color: '#666666', marginBottom: '12px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                Create your account - your work will be preserved!
              </div>
              <input
                type="text"
                placeholder="Your name"
                value={upgradeForm.name}
                onChange={(e) => setUpgradeForm({ ...upgradeForm, name: e.target.value })}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #e5e5e5',
                  color: '#000000',
                  padding: '8px 12px',
                  fontSize: '14px',
                  marginBottom: '8px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              />
              <input
                type="email"
                placeholder="Email address"
                value={upgradeForm.email}
                onChange={(e) => setUpgradeForm({ ...upgradeForm, email: e.target.value })}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #e5e5e5',
                  color: '#000000',
                  padding: '8px 12px',
                  fontSize: '14px',
                  marginBottom: '8px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={upgradeForm.password}
                onChange={(e) => setUpgradeForm({ ...upgradeForm, password: e.target.value })}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #e5e5e5',
                  color: '#000000',
                  padding: '8px 12px',
                  fontSize: '14px',
                  marginBottom: '12px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleUpgradeToAccount}
                  style={{
                    flex: 1,
                    background: '#000000',
                    color: '#ffffff',
                    border: '1px solid #000000',
                    padding: '8px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                >
                  Create Account
                </button>
                <button
                  onClick={() => setShowUpgradeForm(false)}
                  style={{
                    background: '#ffffff',
                    color: '#666666',
                    border: '1px solid #e5e5e5',
                    padding: '8px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Account */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', color: '#000000', marginBottom: '12px', fontWeight: '600', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          Account
        </div>
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #e5e5e5',
          padding: '16px'
        }}>
          <div style={{
            fontSize: '13px',
            color: '#000000',
            marginBottom: '12px',
            fontWeight: '500',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            {state.user?.name || 'Guest User'}
          </div>
          <button
            onClick={state.isGuest ? actions.guestLogout : actions.logout}
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #e5e5e5',
              color: '#666666',
              padding: '8px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            {state.isGuest ? 'Leave Session' : 'Sign Out'}
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#000000', marginBottom: '12px', fontWeight: '600', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          Keyboard Shortcuts
        </div>
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #e5e5e5',
          padding: '16px'
        }}>
          <div style={{ fontSize: '12px', color: '#666666', lineHeight: '1.6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
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
    </div>
  )

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'files': return renderFilesSection()
      case 'requests': return renderApprovalsSection()
      case 'settings': return renderSettingsSection()
      case 'workspaces': return renderWorkspaceSection()
      default: return renderFilesSection()
    }
  }

  return (
    <div style={{
      width: '320px',
      height: '100vh',
      background: '#ffffff',
      borderRight: '1px solid #e5e5e5',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Clean Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e5e5e5'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#000000',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
                fontSize: '11px',
                color: '#666666',
                background: '#f5f5f5',
                padding: '2px 6px',
                fontWeight: '500',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                Guest
              </div>
            )}
            <button
              onClick={state.isGuest ? actions.guestLogout : actions.logout}
              style={{
                background: '#ffffff',
                border: '1px solid #e5e5e5',
                color: '#666666',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
              title={state.isGuest ? "Leave workspace" : "Sign out"}
            >
              ↗
            </button>
          </div>
        </div>
        <div style={{
          fontSize: '12px',
          color: '#999999',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          {state.workspaces.length} workspace{state.workspaces.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Clean Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e5e5'
      }}>
        {sidebarSections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => {
              setActiveSection(section.id)
              localStorage.setItem('swayfiles-active-tab', section.id)
              if (section.id === 'settings') {
                actions.setViewMode('settings')
              } else {
                actions.setViewMode('workspace')
              }
            }}
            style={{
              flex: 1,
              background: activeSection === section.id ? '#f8f9fa' : '#ffffff',
              border: 'none',
              borderRight: index < sidebarSections.length - 1 ? '1px solid #e5e5e5' : 'none',
              borderBottom: activeSection === section.id ? '2px solid #000000' : '2px solid transparent',
              color: activeSection === section.id ? '#000000' : '#666666',
              padding: '12px 8px',
              fontSize: '11px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Clean Content Area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
      className="hide-scrollbar">
        <style jsx>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {renderSectionContent()}
      </div>

      {/* Clean Status Bar */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid #e5e5e5',
        background: '#f8f9fa'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          fontWeight: '400',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            color: '#666666'
          }}>
            {state.currentWorkspace ? state.currentWorkspace.name : 'No workspace selected'}
          </div>
          <div style={{
            color: '#999999'
          }}>
            {state.files.length} file{state.files.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeftSidebar