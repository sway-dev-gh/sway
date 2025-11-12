import React, { useState } from 'react'
import { useWorkspace } from '../stores/WorkspaceStore'
import SectionBlock from './SectionBlock'

const CenterWorkspace = () => {
  const { state, actions, WORKFLOW_STATES } = useWorkspace()
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)

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