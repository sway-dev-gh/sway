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
    { id: 'files', label: 'Files', icon: '◈' },
    { id: 'requests', label: 'Requests', icon: '◪' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
    { id: 'workspaces', label: 'Workspaces', icon: '◯' }
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
    <div style={{ padding: '24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <span style={{
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'rgba(255, 255, 255, 0.6)',
          fontWeight: '600',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          Workspaces
        </span>
        <button
          onClick={() => setShowCreateWorkspace(!showCreateWorkspace)}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#ffffff',
            padding: '6px 12px',
            fontSize: '11px',
            cursor: 'pointer',
            borderRadius: '6px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            letterSpacing: '0.02em'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.08)'
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.16)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.06)'
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'
          }}
        >
          New
        </button>
      </div>

      {showCreateWorkspace && (
        <div style={{
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '20px',
          marginBottom: '20px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '8px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)'
        }}>
          <input
            type="text"
            placeholder="Workspace name"
            value={workspaceForm.name}
            onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              padding: '10px 12px',
              fontSize: '13px',
              marginBottom: '12px',
              borderRadius: '6px',
              fontWeight: '400',
              letterSpacing: '0.01em',
              transition: 'all 0.2s ease',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              e.target.style.background = 'rgba(0, 0, 0, 0.6)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'
              e.target.style.background = 'rgba(0, 0, 0, 0.4)'
            }}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={workspaceForm.description}
            onChange={(e) => setWorkspaceForm({ ...workspaceForm, description: e.target.value })}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              padding: '10px 12px',
              fontSize: '13px',
              marginBottom: '12px',
              borderRadius: '6px',
              fontWeight: '400',
              letterSpacing: '0.01em',
              transition: 'all 0.2s ease',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              e.target.style.background = 'rgba(0, 0, 0, 0.6)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'
              e.target.style.background = 'rgba(0, 0, 0, 0.4)'
            }}
          />
          <input
            type="text"
            placeholder="Client link (optional)"
            value={workspaceForm.clientLink}
            onChange={(e) => setWorkspaceForm({ ...workspaceForm, clientLink: e.target.value })}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              padding: '10px 12px',
              fontSize: '13px',
              marginBottom: '16px',
              borderRadius: '6px',
              fontWeight: '400',
              letterSpacing: '0.01em',
              transition: 'all 0.2s ease',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              e.target.style.background = 'rgba(0, 0, 0, 0.6)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'
              e.target.style.background = 'rgba(0, 0, 0, 0.4)'
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCreateWorkspace}
              style={{
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                padding: '8px 16px',
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: '6px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                letterSpacing: '0.01em',
                flex: 1
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.9)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#ffffff'
              }}
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateWorkspace(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '8px 16px',
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: '6px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                letterSpacing: '0.01em'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.16)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.06)'
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ maxHeight: '300px', overflow: 'auto', paddingRight: '4px' }}>
        {state.workspaces.length === 0 ? (
          <div style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '13px',
            textAlign: 'center',
            padding: '32px 20px',
            fontWeight: '400',
            letterSpacing: '0.01em'
          }}>
            No workspaces yet
          </div>
        ) : (
          state.workspaces.map(workspace => (
            <div
              key={workspace.id}
              onClick={() => actions.selectWorkspace(workspace)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderRadius: '8px',
                marginBottom: '8px',
                background: state.currentWorkspace?.id === workspace.id
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))'
                  : 'rgba(255, 255, 255, 0.02)',
                border: state.currentWorkspace?.id === workspace.id
                  ? '1px solid rgba(255, 255, 255, 0.12)'
                  : '1px solid rgba(255, 255, 255, 0.04)',
                boxShadow: state.currentWorkspace?.id === workspace.id
                  ? '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                  : 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (state.currentWorkspace?.id !== workspace.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                }
              }}
              onMouseLeave={(e) => {
                if (state.currentWorkspace?.id !== workspace.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)'
                }
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#ffffff',
                  fontWeight: '500',
                  letterSpacing: '0.01em',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  {workspace.name}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      actions.generateGuestLink(workspace.id)
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                      e.target.style.color = '#ffffff'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.06)'
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                      e.target.style.color = 'rgba(255, 255, 255, 0.7)'
                    }}
                    title="Share workspace with guest collaborators"
                  >
                    ↗
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      actions.showConfirmDialog({
                        message: `Delete workspace "${workspace.name}"?\n\nThis will permanently delete all files and sections in this workspace.`,
                        confirmText: 'Delete',
                        cancelText: 'Cancel',
                        showCancel: true,
                        onConfirm: () => actions.deleteWorkspace(workspace.id)
                      })
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'rgba(255, 255, 255, 0.5)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                      e.target.style.color = 'rgba(255, 255, 255, 0.8)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.06)'
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                      e.target.style.color = 'rgba(255, 255, 255, 0.5)'
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
                  color: 'rgba(255, 255, 255, 0.5)',
                  lineHeight: '1.4',
                  fontWeight: '400'
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
    <div style={{ padding: '8px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
        borderBottom: '1px solid #ffffff',
        paddingBottom: '4px'
      }}>
        <span style={{
          fontSize: '10px',
          textTransform: 'uppercase',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontWeight: 'bold'
        }}>
          FILES
        </span>
        <label style={{
          background: '#ffffff',
          border: 'none',
          color: '#000000',
          padding: '2px 6px',
          fontSize: '10px',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontWeight: 'bold'
        }}>
          +
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
          color: '#ffffff',
          fontSize: '10px',
          textAlign: 'center',
          padding: '16px 0',
          fontFamily: 'monospace',
          border: '1px solid #ffffff'
        }}>
          [no workspace]
        </div>
      ) : state.files.length === 0 ? (
        <div style={{
          color: '#ffffff',
          fontSize: '10px',
          textAlign: 'center',
          padding: '16px 0',
          fontFamily: 'monospace',
          border: '1px solid #ffffff'
        }}>
          [no files]
        </div>
      ) : (
        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
          {state.files.map(file => (
            <div
              key={file.id}
              onClick={() => actions.selectFile(file)}
              style={{
                padding: '4px',
                cursor: 'pointer',
                background: state.selectedFile?.id === file.id ? '#ffffff' : '#000000',
                color: state.selectedFile?.id === file.id ? '#000000' : '#ffffff',
                border: '1px solid #ffffff',
                marginBottom: '1px',
                fontFamily: 'monospace'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2px'
              }}>
                <span style={{
                  fontSize: '10px',
                  flex: 1,
                  marginRight: '8px',
                  fontWeight: 'bold'
                }}>
                  {file.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    padding: '1px 4px',
                    fontSize: '8px',
                    background: state.selectedFile?.id === file.id ? '#000000' : '#ffffff',
                    color: state.selectedFile?.id === file.id ? '#ffffff' : '#000000',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}>
                    {file.workflowState.replace('_', '')}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      actions.showConfirmDialog({
                        message: `Delete file "${file.name}"?\n\nThis will permanently delete the file and all its sections.`,
                        confirmText: 'Delete',
                        cancelText: 'Cancel',
                        showCancel: true,
                        onConfirm: () => actions.deleteFile(file.id)
                      })
                    }}
                    style={{
                      background: state.selectedFile?.id === file.id ? '#000000' : '#ffffff',
                      border: 'none',
                      color: state.selectedFile?.id === file.id ? '#ffffff' : '#000000',
                      cursor: 'pointer',
                      fontSize: '10px',
                      padding: '2px',
                      fontWeight: 'bold'
                    }}
                    title="Delete file"
                  >
                    X
                  </button>
                </div>
              </div>
              <div style={{
                fontSize: '8px'
              }}>
                [{file.sections.length}sec]
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
            Review Queue ({pendingApprovals.length})
          </span>
        </div>

        {pendingApprovals.length === 0 ? (
          <div style={{
            color: '#666666',
            fontSize: '11px',
            textAlign: 'center',
            padding: '20px 0'
          }}>
            Review queue is empty
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
    <div style={{ padding: '20px' }}>
      <span style={{
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: '#999999',
        marginBottom: '20px',
        display: 'block'
      }}>
        Settings
      </span>

      {/* Billing & Subscription */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', color: '#ffffff', marginBottom: '12px' }}>
          Billing & Subscription
        </div>
        <div style={{
          background: '#111111',
          border: '1px solid #333333',
          borderRadius: '6px',
          padding: '12px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '12px', color: '#ffffff' }}>SwayFiles Pro</span>
            <span style={{
              fontSize: '10px',
              background: '#2ed573',
              color: '#000000',
              padding: '2px 6px',
              borderRadius: '2px',
              fontWeight: 'bold'
            }}>
              ACTIVE
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginBottom: '10px' }}>
            $15/month • Unlimited workspaces & files
          </div>
          <button
            onClick={() => {
              window.open('https://billing.stripe.com/p/login/test_28ocPYdJ1eR3duE000', '_blank')
            }}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid #333333',
              color: '#ffffff',
              padding: '6px 8px',
              fontSize: '10px',
              cursor: 'pointer',
              borderRadius: '3px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#333333'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent'
            }}
          >
            Manage Subscription
          </button>

          {/* Admin Controls - Only visible for testing */}
          <div style={{ marginTop: '12px', padding: '8px', border: '1px solid #333333', borderRadius: '3px' }}>
            <div style={{ fontSize: '9px', color: '#666666', marginBottom: '6px' }}>Admin Controls (Testing)</div>
            <div style={{ display: 'flex', gap: '4px' }}>
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
                  background: '#333333',
                  border: '1px solid #555555',
                  color: '#ffffff',
                  padding: '4px 6px',
                  fontSize: '8px',
                  borderRadius: '2px',
                  cursor: 'pointer'
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
                  background: '#333333',
                  border: '1px solid #555555',
                  color: '#ffffff',
                  padding: '4px 6px',
                  fontSize: '8px',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}>
                → Pro
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Options */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', color: '#ffffff', marginBottom: '12px' }}>
          View Options
        </div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          fontSize: '11px',
          color: '#ffffff',
          padding: '4px 0'
        }}>
          <input
            type="checkbox"
            checked={state.focusedView}
            onChange={actions.toggleFocusedView}
            style={{
              margin: 0,
              marginRight: '6px',
              accentColor: '#ffffff',
              backgroundColor: '#000000',
              borderColor: '#666666'
            }}
          />
          Focused View
        </label>
      </div>

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

      {/* Account */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', color: '#ffffff', marginBottom: '12px' }}>
          Account
        </div>
        <div style={{
          background: '#111111',
          border: '1px solid #333333',
          borderRadius: '6px',
          padding: '12px'
        }}>
          <div style={{
            fontSize: '11px',
            color: '#666666',
            marginBottom: '8px'
          }}>
            {state.user?.name || 'Guest User'}
          </div>
          <button
            onClick={state.isGuest ? actions.guestLogout : actions.logout}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid #333333',
              color: '#ffffff',
              padding: '6px 8px',
              fontSize: '10px',
              cursor: 'pointer',
              borderRadius: '3px'
            }}
          >
            {state.isGuest ? 'Leave Session' : 'Sign Out'}
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#ffffff', marginBottom: '12px' }}>
          Keyboard Shortcuts
        </div>
        <div style={{
          background: '#111111',
          border: '1px solid #333333',
          borderRadius: '6px',
          padding: '12px'
        }}>
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
      background: '#000000',
      borderRight: '1px solid #ffffff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Terminal Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #ffffff',
        background: '#000000'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#ffffff',
            fontFamily: 'monospace'
          }}>
            swayfiles
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {state.isGuest && (
              <div style={{
                fontSize: '10px',
                color: '#000000',
                background: '#ffffff',
                padding: '2px 6px',
                fontWeight: 'bold',
                fontFamily: 'monospace'
              }}>
                GUEST
              </div>
            )}
            <button
              onClick={state.isGuest ? actions.guestLogout : actions.logout}
              style={{
                background: '#ffffff',
                border: 'none',
                color: '#000000',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '4px 8px',
                fontFamily: 'monospace',
                fontWeight: 'bold'
              }}
              title={state.isGuest ? "exit" : "logout"}
            >
              exit
            </button>
          </div>
        </div>
        <div style={{
          fontSize: '10px',
          color: '#ffffff',
          fontFamily: 'monospace'
        }}>
          v2.0 [{state.workspaces.length}ws]
        </div>
      </div>

      {/* Terminal Navigation */}
      <div style={{
        display: 'flex',
        margin: '8px',
        border: '1px solid #ffffff',
        background: '#000000'
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
              background: activeSection === section.id ? '#ffffff' : '#000000',
              border: 'none',
              color: activeSection === section.id ? '#000000' : '#ffffff',
              padding: '8px',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRight: index < sidebarSections.length - 1 ? '1px solid #ffffff' : 'none',
              fontFamily: 'monospace',
              textTransform: 'uppercase'
            }}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Terminal Content Area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        margin: '8px',
        background: '#000000',
        border: '1px solid #ffffff'
      }}>
        {renderSectionContent()}
      </div>

      {/* Terminal Status Bar */}
      <div style={{
        padding: '8px',
        borderTop: '1px solid #ffffff',
        background: '#000000'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          fontFamily: 'monospace',
          color: '#ffffff'
        }}>
          <div>
            {state.currentWorkspace ? `[${state.currentWorkspace.name}]` : '[no-workspace]'}
          </div>
          <div>
            {state.files.length}f
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeftSidebar