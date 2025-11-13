import React, { useState } from 'react'
import { useWorkspace } from '../stores/WorkspaceStore'
import SectionBlock from './SectionBlock'

const CenterWorkspace = () => {
  const { state, actions, WORKFLOW_STATES } = useWorkspace()
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)
  const [showPricingPage, setShowPricingPage] = useState(false)

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
      textAlign: 'left',
      padding: '40px',
      background: '#000000',
      fontFamily: 'monospace'
    }}>
      <div style={{
        border: '2px solid #ffffff',
        padding: '30px',
        background: '#000000',
        width: '100%',
        maxWidth: '700px'
      }}>
        <div style={{
          fontSize: '18px',
          marginBottom: '20px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontWeight: 'bold'
        }}>
          > SWAYFILES v2.0 - TERMINAL WORKSPACE
        </div>

        <div style={{
          fontSize: '12px',
          color: '#00ff00',
          lineHeight: '1.5',
          fontFamily: 'monospace',
          marginBottom: '20px'
        }}>
          SYSTEM STATUS: [ONLINE] [SECURE] [READY]<br />
          CONNECTION: 192.168.1.100:443 [ENCRYPTED]<br />
          USER_MODE: [COLLABORATIVE] [AUTHENTICATED]
        </div>

        <div style={{
          border: '1px solid #ffffff',
          padding: '15px',
          marginBottom: '20px',
          background: '#000000'
        }}>
          <div style={{
            color: '#ffff00',
            fontSize: '11px',
            fontFamily: 'monospace',
            marginBottom: '10px',
            fontWeight: 'bold'
          }}>
            === QUICK START TERMINAL ===
          </div>
          <div style={{
            color: '#ffffff',
            fontSize: '11px',
            fontFamily: 'monospace',
            lineHeight: '1.4'
          }}>
            $ workspace create [name]    # Create new workspace<br />
            $ file add [path]           # Add files for review<br />
            $ review start              # Begin collaboration<br />
            $ approve --all             # Complete workflow
          </div>
        </div>

        <div style={{
          border: '1px solid #ffffff',
          padding: '15px',
          marginBottom: '20px',
          background: '#000000'
        }}>
          <div style={{
            color: '#00ffff',
            fontSize: '11px',
            fontFamily: 'monospace',
            marginBottom: '8px',
            fontWeight: 'bold'
          }}>
            FEATURES_LOADED:
          </div>
          <div style={{
            color: '#ffffff',
            fontSize: '10px',
            fontFamily: 'monospace',
            lineHeight: '1.3'
          }}>
            [✓] Real-time collaboration engine<br />
            [✓] Git-style approval workflows<br />
            [✓] Comment & review system<br />
            [✓] File versioning & history
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: '#ffffff',
          fontFamily: 'monospace',
          textAlign: 'center'
        }}>
          <span>[GITHUB_INSPIRED]</span>
          <span>[NOTION_POWERED]</span>
          <span>[TERMINAL_STYLED]</span>
        </div>
      </div>
    </div>
  )

  const renderNoFileSelected = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      textAlign: 'left',
      padding: '40px',
      background: '#000000',
      fontFamily: 'monospace'
    }}>
      <div style={{
        border: '1px solid #ffffff',
        padding: '25px',
        background: '#000000',
        width: '100%',
        maxWidth: '500px'
      }}>
        <div style={{
          fontSize: '14px',
          marginBottom: '15px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontWeight: 'bold'
        }}>
          > FILE_SELECTOR_MODE
        </div>

        <div style={{
          fontSize: '12px',
          color: '#ffff00',
          lineHeight: '1.5',
          fontFamily: 'monospace',
          marginBottom: '15px'
        }}>
          WORKSPACE: [LOADED]<br />
          FILE_SELECTED: [NONE]<br />
          STATUS: [WAITING_FOR_INPUT]
        </div>

        <div style={{
          border: '1px solid #ffffff',
          padding: '12px',
          marginBottom: '15px',
          background: '#000000'
        }}>
          <div style={{
            color: '#00ff00',
            fontSize: '11px',
            fontFamily: 'monospace',
            marginBottom: '8px',
            fontWeight: 'bold'
          }}>
            NEXT_STEP:
          </div>
          <div style={{
            color: '#ffffff',
            fontSize: '10px',
            fontFamily: 'monospace',
            lineHeight: '1.4'
          }}>
            [1] Select file from left sidebar<br />
            [2] Begin review process<br />
            [3] Add sections and content<br />
            [4] Collaborate in real-time
          </div>
        </div>

        <div style={{
          color: '#ffffff',
          fontSize: '10px',
          fontFamily: 'monospace',
          textAlign: 'center'
        }}>
          // SELECT_FILE TO CONTINUE //
        </div>
      </div>
    </div>
  )

  const renderFileWorkspace = () => {
    const sections = getCurrentFileSections()

    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* File header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #ffffff',
          background: '#000000'
        }}>
          <div style={{
            border: '1px solid #ffffff',
            padding: '15px',
            background: '#000000'
          }}>
            <div style={{
              fontSize: '14px',
              margin: 0,
              color: '#ffffff',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              marginBottom: '10px'
            }}>
              > FILE: {state.selectedFile.name}
            </div>
            {state.selectedFile.workflow_status && (
              <div style={{
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                color: '#00ff00',
                fontFamily: 'monospace',
                fontWeight: 'bold'
              }}>
                STATUS: [{state.selectedFile.workflow_status.replace('_', '_').toUpperCase()}]
              </div>
            )}
          </div>
        </div>

        {/* Sections */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px 28px'
        }}>
          {sections.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '30px',
              border: '1px solid #ffffff',
              background: '#000000'
            }}>
              <div style={{
                fontSize: '12px',
                marginBottom: '15px',
                color: '#ffff00',
                fontFamily: 'monospace',
                fontWeight: 'bold'
              }}>
                NO_SECTIONS_FOUND
              </div>
              <div style={{
                color: '#ffffff',
                fontSize: '11px',
                fontFamily: 'monospace',
                lineHeight: '1.4'
              }}>
                STATUS: [EMPTY]<br />
                ACTION_REQUIRED: [ADD_SECTION]<br />
                READY_TO_START: [TRUE]
              </div>
            </div>
          ) : (
            sections.map(section => (
              <SectionBlock
                key={section.id}
                section={section}
                onDragStart={(e) => handleDragStart(e, section.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, section.id)}
              />
            ))
          )}

          {/* Add section button */}
          {showAddSection ? (
            <div style={{
              marginTop: '24px',
              padding: '20px',
              border: '1px solid #ffffff',
              background: '#000000'
            }}>
              <div style={{
                fontSize: '11px',
                marginBottom: '10px',
                color: '#ffff00',
                fontFamily: 'monospace',
                fontWeight: 'bold'
              }}>
                NEW_SECTION_TITLE:
              </div>
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="> enter section name..."
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#000000',
                  border: '1px solid #ffffff',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddSection()
                  }
                  if (e.key === 'Escape') {
                    setShowAddSection(false)
                    setNewSectionTitle('')
                  }
                }}
              />
              <div style={{
                marginTop: '12px',
                display: 'flex',
                gap: '10px'
              }}>
                <button
                  onClick={handleAddSection}
                  style={{
                    padding: '8px 16px',
                    background: '#000000',
                    color: '#ffffff',
                    border: '1px solid #ffffff',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#ffffff'
                    e.target.style.color = '#000000'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#000000'
                    e.target.style.color = '#ffffff'
                  }}
                >
                  [ADD]
                </button>
                <button
                  onClick={() => {
                    setShowAddSection(false)
                    setNewSectionTitle('')
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#000000',
                    color: '#ffffff',
                    border: '1px solid #ffffff',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#ffffff'
                    e.target.style.color = '#000000'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#000000'
                    e.target.style.color = '#ffffff'
                  }}
                >
                  [CANCEL]
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddSection(true)}
              style={{
                marginTop: '24px',
                width: '100%',
                padding: '16px',
                background: '#000000',
                color: '#ffffff',
                border: '2px dashed #ffffff',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'monospace',
                textTransform: 'uppercase'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#ffffff'
                e.target.style.color = '#000000'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#000000'
                e.target.style.color = '#ffffff'
              }}
            >
              [+ ADD_SECTION]
            </button>
          )}
        </div>
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
      {!state.currentWorkspace ? (
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