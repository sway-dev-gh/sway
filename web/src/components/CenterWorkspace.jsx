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
        Select a file to get started
      </h2>
      <p style={{
        fontSize: '14px',
        maxWidth: '300px',
        lineHeight: '1.5'
      }}>
        Choose a file from the sidebar to begin reviewing and adding sections.
      </p>
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
          borderBottom: '1px solid #333333',
          background: '#111111'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 style={{
                fontSize: '20px',
                margin: 0,
                color: '#ffffff'
              }}>
                {state.selectedFile.name}
              </h1>
              {state.selectedFile.workflow_status && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getWorkflowStatusColor(state.selectedFile.workflow_status),
                    marginRight: '6px'
                  }}></span>
                  {state.selectedFile.workflow_status.replace('_', ' ').toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sections */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px'
        }}>
          {sections.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#666666',
              padding: '40px'
            }}>
              <p>No sections yet. Add one to get started.</p>
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
              marginTop: '20px',
              padding: '16px',
              border: '1px solid #333333',
              borderRadius: '8px',
              background: '#111111'
            }}>
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="Section title"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#000000',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '14px'
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
                marginTop: '8px',
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={handleAddSection}
                  style={{
                    padding: '6px 12px',
                    background: '#0070f3',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
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
                    padding: '6px 12px',
                    background: 'transparent',
                    color: '#666666',
                    border: '1px solid #333333',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddSection(true)}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#666666',
                border: '1px dashed #333333',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              + Add Section
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