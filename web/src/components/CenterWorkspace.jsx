import React, { useState } from 'react'
import { useWorkspace } from '../stores/WorkspaceStore'
import SectionBlock from './SectionBlock'
import BillingDashboard from './BillingDashboard'
import PricingPage from './PricingPage'

const CenterWorkspace = () => {
  const { state, actions, WORKFLOW_STATES } = useWorkspace()
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)
  const [showPricingPage, setShowPricingPage] = useState(false)
  const [settingsTab, setSettingsTab] = useState('general')

  // Get sections for the current file, sorted by order
  const getCurrentFileSections = () => {
    if (!state.selectedFile) return []

    return state.selectedFile.sections
      .map(sectionId => state.sections[sectionId])
      .filter(Boolean)
      .sort((a, b) => a.order - b.order)
  }

  const handleAddSection = () => {
    if (newSectionTitle.trim() && state.selectedFile) {
      const currentSections = getCurrentFileSections()
      actions.addSection(
        state.selectedFile.id,
        newSectionTitle.trim(),
        '',
        currentSections.length
      )
      setNewSectionTitle('')
      setShowAddSection(false)
    }
  }

  const handleDragStart = (e, sectionId) => {
    e.dataTransfer.setData('text/plain', sectionId)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, targetSectionId) => {
    e.preventDefault()
    const draggedSectionId = e.dataTransfer.getData('text/plain')

    if (draggedSectionId !== targetSectionId) {
      const sections = getCurrentFileSections()
      const draggedIndex = sections.findIndex(s => s.id === draggedSectionId)
      const targetIndex = sections.findIndex(s => s.id === targetSectionId)

      // Create new order
      const newSections = [...sections]
      const [draggedSection] = newSections.splice(draggedIndex, 1)
      newSections.splice(targetIndex, 0, draggedSection)

      // Update order
      const newOrder = newSections.map(s => s.id)
      actions.reorderSections(newOrder)
    }
  }

  const getWorkflowStatusColor = (status) => {
    switch (status) {
      case WORKFLOW_STATES.DRAFT: return '#666666'
      case WORKFLOW_STATES.UNDER_REVIEW: return '#ffa502'
      case WORKFLOW_STATES.CHANGES_REQUESTED: return '#ff4757'
      case WORKFLOW_STATES.APPROVED: return '#2ed573'
      case WORKFLOW_STATES.DELIVERED: return '#1e90ff'
      default: return '#666666'
    }
  }

  const renderWelcomeScreen = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: '#666666',
      textAlign: 'center',
      padding: '40px'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '16px'
      }}>
        ◧
      </div>
      <h1 style={{
        fontSize: '24px',
        color: '#ffffff',
        marginBottom: '8px'
      }}>
        Welcome to SwayFiles v2.0
      </h1>
      <p style={{
        fontSize: '14px',
        maxWidth: '400px',
        lineHeight: '1.5'
      }}>
        A developer-first workspace for reviewing and approving creative projects, code, and files.
        Create a workspace and add files to get started.
      </p>
      <div style={{
        marginTop: '24px',
        fontSize: '12px',
        color: '#333333'
      }}>
        GitHub × Notion-inspired collaboration
      </div>
    </div>
  )

  const renderSettingsScreen = () => (
    <div style={{
      height: '100%',
      background: '#000000',
      overflow: 'auto'
    }}>
      {/* Settings Header */}
      <div style={{
        padding: '32px 48px',
        borderBottom: '1px solid #333333'
      }}>
        <h1 style={{
          fontSize: '32px',
          color: '#ffffff',
          marginBottom: '8px'
        }}>
          Settings
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#999999',
          margin: 0
        }}>
          Manage your account, preferences, and billing
        </p>
      </div>

      {/* Settings Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #333333',
        background: '#111111'
      }}>
        {[
          { id: 'general', label: 'General', icon: '⚙' },
          { id: 'billing', label: 'Billing & Usage', icon: '💳' },
          { id: 'shortcuts', label: 'Shortcuts', icon: '⌨' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSettingsTab(tab.id)}
            style={{
              background: settingsTab === tab.id ? '#000000' : 'transparent',
              border: 'none',
              color: settingsTab === tab.id ? '#ffffff' : '#666666',
              padding: '16px 32px',
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: settingsTab === tab.id ? '2px solid #ffffff' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '16px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div style={{ padding: '32px 48px' }}>
        {settingsTab === 'general' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '18px',
                color: '#ffffff',
                marginBottom: '16px'
              }}>
                View Preferences
              </h3>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#ffffff'
              }}>
                <input
                  type="checkbox"
                  checked={state.focusedView}
                  onChange={actions.toggleFocusedView}
                  style={{
                    width: '16px',
                    height: '16px',
                    margin: 0,
                    accentColor: '#ffffff'
                  }}
                />
                <div>
                  <div style={{ fontWeight: 'bold' }}>Focused View</div>
                  <div style={{ fontSize: '12px', color: '#999999' }}>
                    Hide distracting elements when reviewing files
                  </div>
                </div>
              </label>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '18px',
                color: '#ffffff',
                marginBottom: '16px'
              }}>
                Account Actions
              </h3>

              {state.isGuest ? (
                <div>
                  <div style={{
                    background: '#111111',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '8px' }}>
                      Guest Account
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#999999',
                      marginBottom: '16px',
                      lineHeight: '1.4'
                    }}>
                      You're collaborating as {state.guestName}. Create a full account to save your work and unlock premium features.
                    </div>
                    <button
                      onClick={() => setShowPricingPage(true)}
                      style={{
                        background: '#2ed573',
                        border: 'none',
                        color: '#000000',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ⬆ Upgrade to Full Account
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setSettingsTab('billing')}
                    style={{
                      background: '#ffffff',
                      border: 'none',
                      color: '#000000',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      marginRight: '12px'
                    }}
                  >
                    💳 Manage Billing
                  </button>

                  <button
                    onClick={() => setShowPricingPage(true)}
                    style={{
                      background: 'none',
                      border: '1px solid #ffffff',
                      color: '#ffffff',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    View Plans
                  </button>
                </div>
              )}

              <div style={{ marginTop: '24px' }}>
                <button
                  onClick={state.isGuest ? actions.guestLogout : actions.logout}
                  style={{
                    background: 'none',
                    border: '1px solid #ff4757',
                    color: '#ff4757',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {state.isGuest ? 'Leave Session' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        )}

        {settingsTab === 'billing' && !state.isGuest && (
          <BillingDashboard />
        )}

        {settingsTab === 'billing' && state.isGuest && (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: '#666666'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
            <h3 style={{ fontSize: '18px', color: '#ffffff', marginBottom: '8px' }}>
              Billing Unavailable
            </h3>
            <p style={{ fontSize: '14px', marginBottom: '24px' }}>
              Guest accounts don't have access to billing features.
              Create a full account to manage your subscription.
            </p>
            <button
              onClick={() => setShowPricingPage(true)}
              style={{
                background: '#ffffff',
                border: 'none',
                color: '#000000',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              View Plans
            </button>
          </div>
        )}

        {settingsTab === 'shortcuts' && (
          <div>
            <h3 style={{
              fontSize: '18px',
              color: '#ffffff',
              marginBottom: '24px'
            }}>
              Keyboard Shortcuts
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              <div>
                <h4 style={{ fontSize: '14px', color: '#ffffff', marginBottom: '12px' }}>
                  General
                </h4>
                <div style={{ fontSize: '12px', color: '#cccccc', lineHeight: '1.8' }}>
                  <div>⌘ + ⇧ + S - New section</div>
                  <div>⌘ + ⌥ + Z - Toggle zen mode</div>
                  <div>⌘ + ⇧ + F - Upload file</div>
                  <div>⌘ + ⌥ + W - New workspace</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', color: '#ffffff', marginBottom: '12px' }}>
                  Navigation
                </h4>
                <div style={{ fontSize: '12px', color: '#cccccc', lineHeight: '1.8' }}>
                  <div>⌘ + ⌃ + ↑/↓ - Navigate sections</div>
                  <div>⌘ + 1-4 - Switch sidebar tabs</div>
                  <div>⌘ + ⌃ + ← → - Switch files</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', color: '#ffffff', marginBottom: '12px' }}>
                  Review & Approval
                </h4>
                <div style={{ fontSize: '12px', color: '#cccccc', lineHeight: '1.8' }}>
                  <div>⌘ + ⇧ + A - Approve section</div>
                  <div>⌘ + ⇧ + R - Request changes</div>
                  <div>⌘ + ⌃ + C - Add comment</div>
                  <div>⌘ + ⌥ + D - Delete item</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Page Modal */}
      {showPricingPage && (
        <PricingPage onClose={() => setShowPricingPage(false)} />
      )}
    </div>
  )

  const renderNoFileSelected = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: '#666666',
      textAlign: 'center',
      padding: '40px'
    }}>
      <div style={{
        fontSize: '32px',
        marginBottom: '16px'
      }}>
        ◈
      </div>
      <h2 style={{
        fontSize: '18px',
        color: '#ffffff',
        marginBottom: '8px'
      }}>
        Select a file to start working
      </h2>
      <p style={{
        fontSize: '12px',
        maxWidth: '300px'
      }}>
        Choose a file from the sidebar to view and edit its sections, or add a new file to your workspace.
      </p>
    </div>
  )

  const renderFileWorkspace = () => {
    const sections = getCurrentFileSections()

    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* File Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #333333',
          background: '#000000'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <h1 style={{
              fontSize: '20px',
              color: '#ffffff',
              margin: 0
            }}>
              {state.selectedFile.name}
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                padding: '4px 8px',
                fontSize: '10px',
                background: getWorkflowStatusColor(state.selectedFile.workflowState),
                color: '#ffffff',
                textTransform: 'uppercase'
              }}>
                {state.selectedFile.workflowState.replace('_', ' ')}
              </div>
              <button
                onClick={() => setShowAddSection(!showAddSection)}
                style={{
                  background: 'none',
                  border: '1px solid #666666',
                  color: '#ffffff',
                  padding: '4px 8px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Add Section
              </button>
            </div>
          </div>
          <div style={{
            fontSize: '12px',
            color: '#666666'
          }}>
            {sections.length} sections • Last modified {new Date(state.selectedFile.uploadedAt).toLocaleDateString()}
          </div>

          {/* Add Section Form */}
          {showAddSection && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              border: '1px solid #333333',
              background: '#111111'
            }}>
              <input
                type="text"
                placeholder="Section title..."
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                style={{
                  width: '100%',
                  background: '#000000',
                  border: '1px solid #333333',
                  color: '#ffffff',
                  padding: '8px',
                  fontSize: '12px',
                  marginBottom: '8px'
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddSection()
                  } else if (e.key === 'Escape') {
                    setShowAddSection(false)
                    setNewSectionTitle('')
                  }
                }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleAddSection}
                  style={{
                    background: '#ffffff',
                    color: '#000000',
                    border: 'none',
                    padding: '4px 12px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Add Section
                </button>
                <button
                  onClick={() => {
                    setShowAddSection(false)
                    setNewSectionTitle('')
                  }}
                  style={{
                    background: 'none',
                    color: '#ffffff',
                    border: '1px solid #666666',
                    padding: '4px 12px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sections Area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '0'
        }}>
          {sections.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              color: '#666666',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                marginBottom: '12px'
              }}>
                ⊞
              </div>
              <h3 style={{
                fontSize: '16px',
                color: '#ffffff',
                marginBottom: '8px'
              }}>
                No sections yet
              </h3>
              <p style={{
                fontSize: '12px',
                marginBottom: '16px'
              }}>
                Break this file into reviewable sections. Each section can be reviewed,
                commented on, and approved independently.
              </p>
              <button
                onClick={() => setShowAddSection(true)}
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  padding: '8px 16px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Create First Section
              </button>
            </div>
          ) : (
            <div style={{ padding: '0' }}>
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, section.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, section.id)}
                >
                  <SectionBlock
                    section={section}
                    isSelected={state.selectedSection?.id === section.id}
                    onSelect={() => actions.updateSection(section.id, { selectedSection: section })}
                    index={index}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workflow Controls */}
        {sections.length > 0 && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #333333',
            background: '#000000',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: '11px',
              color: '#666666'
            }}>
              {sections.filter(s => s.workflowState === WORKFLOW_STATES.APPROVED).length}/{sections.length} sections approved
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  sections.forEach(section => {
                    if (section.workflowState === WORKFLOW_STATES.DRAFT) {
                      actions.updateWorkflowState(section.id, WORKFLOW_STATES.UNDER_REVIEW)
                    }
                  })
                }}
                style={{
                  background: 'none',
                  border: '1px solid #ffa502',
                  color: '#ffa502',
                  padding: '6px 12px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Submit for Review
              </button>
              {sections.every(s => s.workflowState === WORKFLOW_STATES.APPROVED) && (
                <button
                  onClick={() => {
                    sections.forEach(section => {
                      actions.updateWorkflowState(section.id, WORKFLOW_STATES.DELIVERED)
                    })
                  }}
                  style={{
                    background: '#1e90ff',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Mark as Delivered
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      flex: 1,
      height: '100vh',
      background: '#000000',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {state.viewMode === 'settings' ? (
        renderSettingsScreen()
      ) : !state.currentWorkspace ? (
        renderWelcomeScreen()
      ) : !state.selectedFile ? (
        renderNoFileSelected()
      ) : (
        renderFileWorkspace()
      )}
    </div>
  )
}

export default CenterWorkspace