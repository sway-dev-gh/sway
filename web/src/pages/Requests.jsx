import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

function Requests() {
  const navigate = useNavigate()

  // Core state (updated dashboard redesign)
  const [elements, setElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)
  const [formTitle, setFormTitle] = useState('Untitled Request')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [activeTab, setActiveTab] = useState('templates')

  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedComponent, setDraggedComponent] = useState(null)

  const canvasRef = useRef()

  // Save current state to history for undo/redo
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const saveToHistory = useCallback((newElements) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newElements)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  // Undo/Redo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setElements(history[historyIndex - 1])
      setSelectedElement(null)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setElements(history[historyIndex + 1])
      setSelectedElement(null)
    }
  }

  // Component Library
  const COMPONENT_LIBRARY = [
    {
      id: 'heading',
      label: 'Heading',
      category: 'text',
      description: 'Large title text for sections',
      defaultProps: {
        content: 'Section Heading',
        fontSize: '32px',
        fontWeight: '700',
        color: '#FFFFFF'
      }
    },
    {
      id: 'paragraph',
      label: 'Paragraph',
      category: 'text',
      description: 'Body text and descriptions',
      defaultProps: {
        content: 'Add your description text here...',
        fontSize: '16px',
        fontWeight: '400',
        color: '#9B9A97'
      }
    },
    {
      id: 'textfield',
      label: 'Text Field',
      category: 'input',
      description: 'Single line text input',
      defaultProps: {
        label: 'Text Input',
        placeholder: 'Enter text here...',
        required: false
      }
    },
    {
      id: 'textarea',
      label: 'Text Area',
      category: 'input',
      description: 'Multi-line text input',
      defaultProps: {
        label: 'Message',
        placeholder: 'Enter your message here...',
        required: false,
        rows: 4
      }
    },
    {
      id: 'email',
      label: 'Email',
      category: 'input',
      description: 'Email address input with validation',
      defaultProps: {
        label: 'Email Address',
        placeholder: 'your.email@example.com',
        required: true
      }
    },
    {
      id: 'phone',
      label: 'Phone',
      category: 'input',
      description: 'Phone number input',
      defaultProps: {
        label: 'Phone Number',
        placeholder: '(555) 123-4567',
        required: false
      }
    },
    {
      id: 'file-upload',
      label: 'File Upload',
      category: 'input',
      description: 'File upload with drag & drop',
      defaultProps: {
        label: 'Upload Files',
        acceptedTypes: 'image/*,application/pdf,.doc,.docx',
        maxFiles: 5
      }
    },
    {
      id: 'button',
      label: 'Button',
      category: 'action',
      description: 'Submit or action button',
      defaultProps: {
        content: 'Submit',
        type: 'submit'
      }
    }
  ]

  const TEMPLATE_LIBRARY = [
    {
      id: 'blank',
      name: 'Blank Canvas',
      description: 'Start from scratch with an empty form',
      elements: []
    },
    {
      id: 'contact-form',
      name: 'Contact Form',
      description: 'Basic contact form with name, email, and message',
      elements: [
        {
          id: 'heading-1',
          type: 'heading',
          x: 50,
          y: 50,
          width: 400,
          height: 60,
          properties: {
            content: 'Get in Touch',
            fontSize: '32px',
            fontWeight: '700',
            color: '#FFFFFF'
          }
        },
        {
          id: 'name-field',
          type: 'textfield',
          x: 50,
          y: 130,
          width: 400,
          height: 50,
          properties: {
            label: 'Full Name',
            placeholder: 'Enter your full name',
            required: true
          }
        },
        {
          id: 'email-field',
          type: 'email',
          x: 50,
          y: 200,
          width: 400,
          height: 50,
          properties: {
            label: 'Email Address',
            placeholder: 'your.email@example.com',
            required: true
          }
        },
        {
          id: 'message-field',
          type: 'textarea',
          x: 50,
          y: 270,
          width: 400,
          height: 120,
          properties: {
            label: 'Message',
            placeholder: 'How can we help you?',
            required: true
          }
        }
      ]
    },
    {
      id: 'file-request',
      name: 'File Request',
      description: 'Simple file upload form with description',
      elements: [
        {
          id: 'heading-1',
          type: 'heading',
          x: 50,
          y: 50,
          width: 400,
          height: 60,
          properties: {
            content: 'File Submission',
            fontSize: '28px',
            fontWeight: '700',
            color: '#FFFFFF'
          }
        },
        {
          id: 'name-field',
          type: 'textfield',
          x: 50,
          y: 140,
          width: 400,
          height: 50,
          properties: {
            label: 'Your Name',
            placeholder: 'Enter your name',
            required: true
          }
        },
        {
          id: 'file-upload',
          type: 'file-upload',
          x: 50,
          y: 210,
          width: 400,
          height: 120,
          properties: {
            label: 'Upload Files',
            acceptedTypes: 'image/*,application/pdf,.doc,.docx',
            maxFiles: 3
          }
        }
      ]
    }
  ]

  // Load template
  const loadTemplate = (template) => {
    const newElements = template.elements.map(element => ({
      ...element,
      id: `${element.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }))
    setElements(newElements)
    saveToHistory(newElements)
    setActiveTab('elements')
  }

  // Add new element
  const addElement = (componentType) => {
    const component = COMPONENT_LIBRARY.find(c => c.id === componentType)
    if (!component) return

    const newElement = {
      id: `${componentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: componentType,
      x: 100,
      y: 100 + (elements.length * 80),
      width: 300,
      height: componentType === 'textarea' ? 100 : componentType === 'file-upload' ? 120 : 50,
      properties: { ...component.defaultProps }
    }

    const newElements = [...elements, newElement]
    setElements(newElements)
    saveToHistory(newElements)
    setSelectedElement(newElement)
    setActiveTab('properties')
  }

  // Handle saving
  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token')
      const formData = {
        title: formTitle,
        elements: elements,
        status: 'draft'
      }

      await api.post('/api/requests', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Form saved as draft!')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save form. Please try again.')
    }
  }

  // Handle publishing
  const handlePublish = async () => {
    try {
      const token = localStorage.getItem('token')
      const formData = {
        title: formTitle,
        elements: elements,
        status: 'active'
      }

      const response = await api.post('/api/requests', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Form published successfully!')
      navigate('/management')
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('Failed to publish form. Please try again.')
    }
  }

  return (
    <>
      <Sidebar />
      <div style={{
        minHeight: '100vh',
        background: theme.colors.bg.page,
        color: theme.colors.text.primary,
        paddingTop: '54px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '80px 32px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '48px' }}>
            {isEditingTitle ? (
              <input
                type="text"
                value={formTitle}
                maxLength={50}
                onChange={(e) => setFormTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                autoFocus
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid #373737',
                  color: '#FFFFFF',
                  fontSize: '48px',
                  fontWeight: '600',
                  padding: '0 0 8px 0',
                  outline: 'none',
                  fontFamily: 'inherit',
                  width: '100%',
                  letterSpacing: '-0.02em'
                }}
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                style={{
                  fontSize: '48px',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                  color: theme.colors.text.primary,
                  letterSpacing: '-0.02em',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                {formTitle}
              </h1>
            )}

            <p style={{
              fontSize: '16px',
              color: theme.colors.text.secondary,
              margin: '0 0 24px 0',
              fontWeight: '400'
            }}>
              Build custom forms to collect files and information
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => setShowPreviewModal(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#FFFFFF',
                  border: '1px solid #373737',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Preview
              </button>

              <button
                onClick={handleSave}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#FFFFFF',
                  border: '1px solid #373737',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Save Draft
              </button>

              <button
                onClick={handlePublish}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  border: '1px solid #515151',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '8px 20px',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Publish
              </button>

              {/* History Controls */}
              <div style={{
                display: 'flex',
                gap: '4px',
                marginLeft: '16px',
                padding: '2px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '6px',
                border: '1px solid #2F2F2F'
              }}>
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  title="Undo"
                  style={{
                    background: 'transparent',
                    color: historyIndex <= 0 ? '#6C6C6C' : '#9B9A97',
                    cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
                    border: 'none',
                    fontSize: '12px',
                    padding: '6px 10px',
                    fontFamily: 'inherit',
                    borderRadius: '4px'
                  }}
                >
                  Undo
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  title="Redo"
                  style={{
                    background: 'transparent',
                    color: historyIndex >= history.length - 1 ? '#6C6C6C' : '#9B9A97',
                    cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer',
                    border: 'none',
                    fontSize: '12px',
                    padding: '6px 10px',
                    fontFamily: 'inherit',
                    borderRadius: '4px'
                  }}
                >
                  Redo
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ display: 'flex', gap: '48px' }}>

            {/* Left Sidebar */}
            <div style={{
              width: '320px',
              flexShrink: 0
            }}>

              {/* Tab Navigation */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '24px',
                borderBottom: '1px solid #2F2F2F',
                paddingBottom: '16px'
              }}>
                {[
                  { key: 'templates', label: 'Templates' },
                  { key: 'elements', label: 'Elements' },
                  { key: 'properties', label: 'Properties' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      background: activeTab === tab.key ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      color: activeTab === tab.key ? '#FFFFFF' : '#9B9A97',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'templates' && (
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    margin: '0 0 16px 0'
                  }}>
                    Templates
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {TEMPLATE_LIBRARY.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => loadTemplate(template)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid #2F2F2F',
                          borderRadius: '8px',
                          padding: '16px',
                          cursor: 'pointer'
                        }}
                      >
                        <h4 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#FFFFFF',
                          margin: '0 0 8px 0'
                        }}>
                          {template.name}
                        </h4>
                        <p style={{
                          fontSize: '12px',
                          color: '#9B9A97',
                          margin: 0
                        }}>
                          {template.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'elements' && (
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    margin: '0 0 16px 0'
                  }}>
                    Elements
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {COMPONENT_LIBRARY.map((component) => (
                      <div
                        key={component.id}
                        onClick={() => addElement(component.id)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid #2F2F2F',
                          borderRadius: '6px',
                          padding: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#FFFFFF',
                          marginBottom: '4px'
                        }}>
                          {component.label}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#9B9A97'
                        }}>
                          {component.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'properties' && (
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    margin: '0 0 16px 0'
                  }}>
                    Properties
                  </h3>

                  {selectedElement ? (
                    <div>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid #2F2F2F',
                        borderRadius: '6px',
                        padding: '16px',
                        marginBottom: '16px'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#FFFFFF',
                          marginBottom: '8px'
                        }}>
                          {COMPONENT_LIBRARY.find(c => c.id === selectedElement.type)?.label || selectedElement.type}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#9B9A97'
                        }}>
                          Configure the properties for this element
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      color: '#9B9A97',
                      fontSize: '13px',
                      textAlign: 'center',
                      padding: '40px 20px'
                    }}>
                      Select an element to edit its properties
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Canvas Area */}
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#FFFFFF',
                margin: '0 0 24px 0',
                letterSpacing: '-0.02em'
              }}>
                Form Builder
              </h2>

              <div
                ref={canvasRef}
                style={{
                  minHeight: '500px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid #2F2F2F',
                  borderRadius: '8px',
                  padding: '40px',
                  position: 'relative'
                }}
              >
                {elements.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '400px',
                    textAlign: 'center'
                  }}>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#FFFFFF',
                      margin: '0 0 12px 0'
                    }}>
                      Start Building Your Form
                    </h3>

                    <p style={{
                      fontSize: '14px',
                      color: '#9B9A97',
                      margin: '0 0 24px 0',
                      maxWidth: '300px'
                    }}>
                      Choose a template to get started quickly, or add individual elements to build from scratch.
                    </p>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => setActiveTab('templates')}
                        style={{
                          background: 'rgba(255, 255, 255, 0.12)',
                          color: '#FFFFFF',
                          border: '1px solid #515151',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          padding: '10px 20px',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        Browse Templates
                      </button>

                      <button
                        onClick={() => setActiveTab('elements')}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#FFFFFF',
                          border: '1px solid #373737',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          padding: '10px 20px',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        Add Elements
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Render Elements */
                  elements.map((element) => (
                    <div
                      key={element.id}
                      onClick={() => setSelectedElement(element)}
                      style={{
                        position: 'absolute',
                        left: element.x,
                        top: element.y,
                        width: element.width,
                        height: element.height,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: selectedElement?.id === element.id ? '2px solid #FFFFFF' : '2px solid transparent',
                        borderRadius: '4px',
                        padding: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        color: '#FFFFFF'
                      }}
                    >
                      {COMPONENT_LIBRARY.find(c => c.id === element.type)?.label || element.type}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

export default Requests