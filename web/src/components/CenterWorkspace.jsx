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
      textAlign: 'center',
      padding: '40px',
      background: '#000000'
    }}>
      <div style={{
        fontSize: '24px',
        marginBottom: '24px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontWeight: 'bold'
      }}>
        SWAY
      </div>
      <div style={{
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '16px',
        background: '#000000',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{
          fontSize: '16px',
          color: '#ffffff',
          marginBottom: '8px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          textTransform: 'uppercase'
        }}>
          SWAYFILES v2.0
        </h1>
        <div style={{
          fontSize: '12px',
          color: '#ffffff',
          lineHeight: '1.4',
          fontFamily: 'monospace',
          marginBottom: '16px'
        }}>
          terminal-based workspace
          <br />
          file review + approval system
          <br />
          create workspace + add files to start
        </div>
        <div style={{
          padding: '4px',
          background: '#ffffff',
          color: '#000000',
          fontSize: '10px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          [GITHUB x NOTION x TERMINAL]
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
      textAlign: 'center',
      padding: '40px',
      background: '#000000'
    }}>
      <div style={{
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '24px',
        background: '#000000',
        width: '100%',
        maxWidth: '300px'
      }}>
        <div style={{
          fontSize: '18px',
          marginBottom: '16px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontWeight: 'bold'
        }}>
          No File Selected
        </div>
        <h2 style={{
          fontSize: '14px',
          color: '#ffffff',
          marginBottom: '8px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          textTransform: 'uppercase'
        }}>
          SELECT FILE TO START
        </h2>
        <p style={{
          fontSize: '10px',
          color: '#ffffff',
          fontFamily: 'monospace',
          lineHeight: '1.4'
        }}>
          choose file from sidebar
          <br />
          begin review + add sections
        </p>
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
          padding: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          background: '#000000'
        }}>
          <div style={{
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '12px',
            background: '#000000'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h1 style={{
                  fontSize: '16px',
                  margin: 0,
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase'
                }}>
                  FILE: {state.selectedFile.name}
                </h1>
                {state.selectedFile.workflow_status && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontWeight: 'bold'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#ffffff',
                      marginRight: '6px'
                    }}></span>
                    STATUS: {state.selectedFile.workflow_status.replace('_', '-').toUpperCase()}
                  </div>
                )}
              </div>
            </div>
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
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '32px',
              background: '#000000',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '16px',
                marginBottom: '16px',
                color: '#ffffff',
                fontFamily: 'monospace',
                fontWeight: 'bold'
              }}>
                No Sections
              </div>
              <div style={{
                color: '#ffffff',
                fontSize: '12px',
                fontFamily: 'monospace',
                textTransform: 'uppercase'
              }}>
                ADD SECTION TO START EDITING
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
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '16px',
              background: '#000000'
            }}>
              <div style={{
                marginBottom: '12px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#ffffff',
                textTransform: 'uppercase'
              }}>
                ┌─[NEW SECTION]─────────────────────┐
              </div>

              <div style={{
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: '#000000'
              }}>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="> enter section title..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#000000',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '14px',
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
              </div>

              <div style={{
                marginTop: '12px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#ffffff'
              }}>
                └──────────────────────────────────┘
              </div>

              <div style={{
                marginTop: '12px',
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={handleAddSection}
                  style={{
                    padding: '8px 16px',
                    background: '#000000',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase'
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
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase'
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
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'monospace',
                textTransform: 'uppercase'
              }}
            >
              [+ ADD SECTION]
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