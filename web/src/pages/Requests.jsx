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

  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedElement, setDraggedElement] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
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
      name: 'Start Fresh',
      description: 'Build your collection from scratch with complete creative control',
      elements: []
    },
    {
      id: 'contact-form',
      name: 'Contact Collection',
      description: 'Gather contact information and messages from visitors',
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
      name: 'File Collection',
      description: 'Streamlined form for collecting documents and files',
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
  }

  // Update element properties
  const updateElementProperty = (elementId, propertyName, value) => {
    const newElements = elements.map(element => {
      if (element.id === elementId) {
        return {
          ...element,
          properties: {
            ...element.properties,
            [propertyName]: value
          }
        }
      }
      return element
    })
    setElements(newElements)
    saveToHistory(newElements)

    // Update selected element if it's the one being edited
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement(newElements.find(el => el.id === elementId))
    }
  }

  // Delete element
  const deleteElement = (elementId) => {
    const newElements = elements.filter(element => element.id !== elementId)
    setElements(newElements)
    saveToHistory(newElements)
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement(null)
    }
  }

  // Drag and drop handlers
  const handleMouseDown = (e, element) => {
    e.preventDefault()
    e.stopPropagation()

    const rect = canvasRef.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left - element.x
    const offsetY = e.clientY - rect.top - element.y

    setDraggedElement(element)
    setDragOffset({ x: offsetX, y: offsetY })
    setIsDragging(true)
    setSelectedElement(element)

    // Add cursor change to body
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
  }

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !draggedElement) return

    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - draggedElement.width))
    const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - draggedElement.height))

    const newElements = elements.map(element =>
      element.id === draggedElement.id
        ? { ...element, x: newX, y: newY }
        : element
    )

    setElements(newElements)
    setDraggedElement({ ...draggedElement, x: newX, y: newY })
  }, [isDragging, draggedElement, dragOffset, elements])

  const handleMouseUp = useCallback(() => {
    if (isDragging && draggedElement) {
      saveToHistory(elements)
      // Restore cursor
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    setIsDragging(false)
    setDraggedElement(null)
    setDragOffset({ x: 0, y: 0 })
  }, [isDragging, draggedElement, elements, saveToHistory])

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Render realistic form element
  const renderFormElement = (element) => {
    const isSelected = selectedElement?.id === element.id
    const isBeingDragged = draggedElement?.id === element.id
    const baseStyle = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      border: isSelected ? '2px solid #FFFFFF' : '2px solid transparent',
      borderRadius: '4px',
      cursor: isBeingDragged ? 'grabbing' : 'grab',
      boxSizing: 'border-box',
      transform: isBeingDragged ? 'scale(1.02)' : 'scale(1)',
      boxShadow: isBeingDragged ? '0 8px 24px rgba(0, 0, 0, 0.5)' : isSelected ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
      zIndex: isBeingDragged ? 1000 : isSelected ? 100 : 1,
      transition: isBeingDragged ? 'none' : 'all 0.2s ease',
      opacity: isBeingDragged ? 0.9 : 1
    }

    switch (element.type) {
      case 'heading':
        return (
          <div
            key={element.id}
            onClick={() => setSelectedElement(element)}
            onMouseDown={(e) => handleMouseDown(e, element)}
            style={{
              ...baseStyle,
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '12px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <h1 style={{
              margin: 0,
              fontSize: element.properties.fontSize || '32px',
              fontWeight: element.properties.fontWeight || '700',
              color: element.properties.color || '#FFFFFF',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}>
              {element.properties.content || 'Heading'}
            </h1>
          </div>
        )

      case 'paragraph':
        return (
          <div
            key={element.id}
            onClick={() => setSelectedElement(element)}
            onMouseDown={(e) => handleMouseDown(e, element)}
            style={{
              ...baseStyle,
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '12px',
              display: 'flex',
              alignItems: 'flex-start'
            }}
          >
            <p style={{
              margin: 0,
              fontSize: element.properties.fontSize || '16px',
              fontWeight: element.properties.fontWeight || '400',
              color: element.properties.color || '#9B9A97',
              lineHeight: '1.5',
              overflow: 'hidden'
            }}>
              {element.properties.content || 'Paragraph text...'}
            </p>
          </div>
        )

      case 'textfield':
      case 'email':
      case 'phone':
        return (
          <div
            key={element.id}
            onClick={() => setSelectedElement(element)}
            onMouseDown={(e) => handleMouseDown(e, element)}
            style={{
              ...baseStyle,
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#FFFFFF'
            }}>
              {element.properties.label || 'Input Field'}
              {element.properties.required && (
                <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
              )}
            </label>
            <input
              type={element.type === 'email' ? 'email' : element.type === 'phone' ? 'tel' : 'text'}
              placeholder={element.properties.placeholder || 'Enter text...'}
              style={{
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #2F2F2F',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#FFFFFF',
                outline: 'none',
                pointerEvents: 'none'
              }}
              readOnly
            />
          </div>
        )

      case 'textarea':
        return (
          <div
            key={element.id}
            onClick={() => setSelectedElement(element)}
            onMouseDown={(e) => handleMouseDown(e, element)}
            style={{
              ...baseStyle,
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#FFFFFF'
            }}>
              {element.properties.label || 'Text Area'}
              {element.properties.required && (
                <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
              )}
            </label>
            <textarea
              placeholder={element.properties.placeholder || 'Enter text...'}
              rows={element.properties.rows || 4}
              style={{
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #2F2F2F',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#FFFFFF',
                outline: 'none',
                resize: 'none',
                flex: 1,
                pointerEvents: 'none'
              }}
              readOnly
            />
          </div>
        )

      case 'file-upload':
        return (
          <div
            key={element.id}
            onClick={() => setSelectedElement(element)}
            onMouseDown={(e) => handleMouseDown(e, element)}
            style={{
              ...baseStyle,
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#FFFFFF'
            }}>
              {element.properties.label || 'File Upload'}
            </label>
            <div style={{
              border: '2px dashed #2F2F2F',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#9B9A97'
              }}>
                📁 Drop files here or click to upload
              </div>
            </div>
          </div>
        )

      case 'button':
        return (
          <div
            key={element.id}
            onClick={() => setSelectedElement(element)}
            onMouseDown={(e) => handleMouseDown(e, element)}
            style={{
              ...baseStyle,
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <button style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              border: '1px solid #373737',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'default',
              pointerEvents: 'none'
            }}>
              {element.properties.content || 'Button'}
            </button>
          </div>
        )

      default:
        return (
          <div
            key={element.id}
            onClick={() => setSelectedElement(element)}
            onMouseDown={(e) => handleMouseDown(e, element)}
            style={{
              ...baseStyle,
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: '#FFFFFF'
            }}
          >
            {COMPONENT_LIBRARY.find(c => c.id === element.type)?.label || element.type}
          </div>
        )
    }
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

          {/* Header - Clean Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: '24px',
            alignItems: 'start',
            marginBottom: '40px',
            padding: '32px',
            background: '#0F0F0F',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px'
          }}>
            {/* Left: Project Info */}
            <div>
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
                    borderBottom: '1px solid #373737',
                    color: '#FFFFFF',
                    fontSize: '24px',
                    fontWeight: '600',
                    padding: '0 0 8px 0',
                    outline: 'none',
                    fontFamily: 'inherit',
                    width: '100%'
                  }}
                />
              ) : (
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    margin: '0 0 8px 0',
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  {formTitle}
                </h1>
              )}

              <div style={{
                fontSize: '14px',
                color: '#808080',
                marginBottom: '16px'
              }}>
                Collection Form • {elements.length} field{elements.length !== 1 ? 's' : ''} • Last saved 2 min ago
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowPreviewModal(true)}
                  style={{
                    background: 'transparent',
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
                    background: 'transparent',
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
              </div>
            </div>

            {/* Center: Stats */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#FFFFFF',
                marginBottom: '4px'
              }}>
                0
              </div>
              <div style={{
                fontSize: '12px',
                color: '#808080',
                textTransform: 'uppercase',
                fontWeight: '500',
                letterSpacing: '0.5px'
              }}>
                Submissions
              </div>
            </div>

            {/* Right: Publish */}
            <button
              onClick={handlePublish}
              style={{
                background: '#FFFFFF',
                color: '#000000',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                padding: '12px 24px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Publish Collection
            </button>
          </div>

          {/* Main Builder - Horizontal Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: '32px',
            height: '700px'
          }}>

            {/* Left: Tools Panel */}
            <div style={{
              background: '#0F0F0F',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {/* Add Fields Section */}
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  margin: '0 0 16px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Add Fields
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {COMPONENT_LIBRARY.filter(c => c.category === 'input').map((component) => (
                    <button
                      key={component.id}
                      onClick={() => addElement(component.id)}
                      style={{
                        background: 'transparent',
                        color: '#FFFFFF',
                        border: '1px solid #373737',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                        width: '100%'
                      }}
                    >
                      + {component.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Section */}
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  margin: '0 0 16px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Content
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {COMPONENT_LIBRARY.filter(c => c.category === 'text').map((component) => (
                    <button
                      key={component.id}
                      onClick={() => addElement(component.id)}
                      style={{
                        background: 'transparent',
                        color: '#FFFFFF',
                        border: '1px solid #373737',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                        width: '100%'
                      }}
                    >
                      + {component.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates */}
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  margin: '0 0 16px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Quick Start
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {TEMPLATE_LIBRARY.slice(1).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => loadTemplate(template)}
                      style={{
                        background: 'transparent',
                        color: '#FFFFFF',
                        border: '1px solid #373737',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                        width: '100%'
                      }}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Form Canvas */}
            <div style={{
              background: '#0F0F0F',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Canvas Header */}
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                background: '#000000',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFFFFF'
                }}>
                  Form Preview
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    style={{
                      background: 'transparent',
                      color: historyIndex <= 0 ? '#4A4A4A' : '#FFFFFF',
                      border: '1px solid #373737',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      padding: '6px 10px',
                      cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    Undo
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    style={{
                      background: 'transparent',
                      color: historyIndex >= history.length - 1 ? '#4A4A4A' : '#FFFFFF',
                      border: '1px solid #373737',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      padding: '6px 10px',
                      cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    Redo
                  </button>
                </div>
              </div>

              {/* Canvas Content */}
              <div
                ref={canvasRef}
                style={{
                  height: 'calc(100% - 57px)',
                  padding: '32px',
                  position: 'relative',
                  overflow: 'auto',
                  background: '#0A0A0A'
                }}
              >
                {elements.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '400px',
                    color: '#808080',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '40px'
                  }}>
                    <div style={{
                      marginBottom: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#FFFFFF'
                    }}>
                      Start building your collection
                    </div>
                    <div style={{
                      fontSize: '14px',
                      lineHeight: '1.5',
                      maxWidth: '260px'
                    }}>
                      Add form fields from the panel on the left to begin creating your collection form
                    </div>
                  </div>
                ) : (
                  /* Render Form Elements */
                  elements.map(renderFormElement)
                )}
              </div>
            </div>
          </div>

          {/* Properties Panel - Shows when element is selected */}
          {selectedElement && (
            <div style={{
              position: 'fixed',
              right: '32px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '320px',
              background: '#0F0F0F',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '24px',
              zIndex: 1000
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    marginBottom: '4px'
                  }}>
                    {COMPONENT_LIBRARY.find(c => c.id === selectedElement.type)?.label}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#808080'
                  }}>
                    Field Properties
                  </div>
                </div>
                <button
                  onClick={() => setSelectedElement(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#808080',
                    fontSize: '16px',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(selectedElement.properties).map(([propertyName, value]) => (
                  <div key={propertyName}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#FFFFFF',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {propertyName.replace(/([A-Z])/g, ' $1')}
                    </label>

                    {typeof value === 'boolean' ? (
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateElementProperty(selectedElement.id, propertyName, e.target.checked)}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span style={{ fontSize: '13px', color: '#808080' }}>
                          {value ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    ) : (
                      <input
                        type={typeof value === 'number' ? 'number' : 'text'}
                        value={value}
                        onChange={(e) => updateElementProperty(
                          selectedElement.id,
                          propertyName,
                          typeof value === 'number' ? parseInt(e.target.value) || 0 : e.target.value
                        )}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '13px',
                          border: '1px solid #373737',
                          borderRadius: '6px',
                          background: 'transparent',
                          color: '#FFFFFF',
                          outline: 'none'
                        }}
                      />
                    )}
                  </div>
                ))}

                <button
                  onClick={() => deleteElement(selectedElement.id)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    border: '1px solid #EF4444',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: '#EF4444',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  Delete Field
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default Requests