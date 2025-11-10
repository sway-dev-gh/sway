import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

// Component Library - Elements that can be dragged onto canvas
const COMPONENT_LIBRARY = [
  {
    id: 'text',
    label: 'Text Block',
    icon: '📝',
    description: 'Paragraph text'
  },
  {
    id: 'heading',
    label: 'Heading',
    icon: '📰',
    description: 'Title or heading'
  },
  {
    id: 'file-upload',
    label: 'File Upload',
    icon: '📎',
    description: 'File upload zone'
  },
  {
    id: 'text-input',
    label: 'Text Input',
    icon: '✏️',
    description: 'Single line input'
  },
  {
    id: 'select',
    label: 'Dropdown',
    icon: '▼',
    description: 'Select menu'
  },
  {
    id: 'checkbox',
    label: 'Checkbox',
    icon: '☑',
    description: 'Checkbox field'
  },
  {
    id: 'image',
    label: 'Image',
    icon: '🖼',
    description: 'Image placeholder'
  },
  {
    id: 'button',
    label: 'Button',
    icon: '🔘',
    description: 'Action button'
  }
]

// Default properties for each component type
const DEFAULT_PROPERTIES = {
  'text': {
    content: 'Enter your text here',
    fontSize: '16px',
    color: '#333333',
    fontWeight: '400',
    textAlign: 'left',
    padding: '12px',
    width: '100%'
  },
  'heading': {
    content: 'Heading Text',
    fontSize: '32px',
    color: '#000000',
    fontWeight: '600',
    textAlign: 'center',
    padding: '16px',
    width: '100%'
  },
  'file-upload': {
    label: 'Upload your files',
    accept: '*',
    multiple: true,
    backgroundColor: '#f5f5f5',
    borderColor: '#cccccc',
    borderStyle: 'dashed',
    padding: '40px',
    width: '100%'
  },
  'text-input': {
    placeholder: 'Enter text',
    label: 'Input Field',
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    borderColor: '#cccccc'
  },
  'select': {
    label: 'Select Option',
    options: 'Option 1,Option 2,Option 3',
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    borderColor: '#cccccc'
  },
  'checkbox': {
    label: 'I agree to the terms',
    fontSize: '14px',
    padding: '8px'
  },
  'image': {
    src: '',
    alt: 'Image placeholder',
    width: '300px',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '8px'
  },
  'button': {
    label: 'Submit',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '500',
    padding: '12px 32px',
    borderRadius: '8px',
    width: 'auto'
  }
}

function Requests() {
  const navigate = useNavigate()
  const [canvasElements, setCanvasElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedComponent, setDraggedComponent] = useState(null)
  const [formTitle, setFormTitle] = useState('Untitled Form')
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  // Generate unique ID for elements
  const generateId = () => `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Handle drag start from component library
  const handleDragStart = (component) => {
    setDraggedComponent(component)
    setIsDragging(true)
  }

  // Handle drop on canvas
  const handleCanvasDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    if (!draggedComponent) return

    const canvasRect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - canvasRect.left
    const y = e.clientY - canvasRect.top

    const newElement = {
      id: generateId(),
      type: draggedComponent.id,
      x: x - 100, // Center on cursor
      y: y - 25,
      properties: { ...DEFAULT_PROPERTIES[draggedComponent.id] }
    }

    setCanvasElements([...canvasElements, newElement])
    setDraggedComponent(null)
  }

  // Handle element selection
  const handleElementClick = (element, e) => {
    e.stopPropagation()
    setSelectedElement(element)
  }

  // Handle element deletion
  const handleDeleteElement = () => {
    if (selectedElement) {
      setCanvasElements(canvasElements.filter(el => el.id !== selectedElement.id))
      setSelectedElement(null)
    }
  }

  // Handle property changes
  const handlePropertyChange = (propertyName, value) => {
    if (!selectedElement) return

    setCanvasElements(canvasElements.map(el => {
      if (el.id === selectedElement.id) {
        const updatedElement = {
          ...el,
          properties: {
            ...el.properties,
            [propertyName]: value
          }
        }
        setSelectedElement(updatedElement)
        return updatedElement
      }
      return el
    }))
  }

  // Handle canvas click (deselect)
  const handleCanvasClick = () => {
    setSelectedElement(null)
  }

  // Render element on canvas
  const renderCanvasElement = (element) => {
    const { type, properties } = element
    const isSelected = selectedElement?.id === element.id

    const elementStyle = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      cursor: 'move',
      border: isSelected ? '2px solid #3b82f6' : '1px solid transparent',
      outline: isSelected ? '2px solid rgba(59, 130, 246, 0.2)' : 'none',
      outlineOffset: '2px',
      transition: 'all 0.15s ease'
    }

    switch (type) {
      case 'text':
        return (
          <div
            key={element.id}
            style={{
              ...elementStyle,
              fontSize: properties.fontSize,
              color: properties.color,
              fontWeight: properties.fontWeight,
              textAlign: properties.textAlign,
              padding: properties.padding,
              width: properties.width === '100%' ? '600px' : properties.width,
              maxWidth: '100%'
            }}
            onClick={(e) => handleElementClick(element, e)}
          >
            {properties.content}
          </div>
        )

      case 'heading':
        return (
          <div
            key={element.id}
            style={{
              ...elementStyle,
              fontSize: properties.fontSize,
              color: properties.color,
              fontWeight: properties.fontWeight,
              textAlign: properties.textAlign,
              padding: properties.padding,
              width: properties.width === '100%' ? '600px' : properties.width,
              maxWidth: '100%'
            }}
            onClick={(e) => handleElementClick(element, e)}
          >
            {properties.content}
          </div>
        )

      case 'file-upload':
        return (
          <div
            key={element.id}
            style={{
              ...elementStyle,
              backgroundColor: properties.backgroundColor,
              border: `2px ${properties.borderStyle} ${properties.borderColor}`,
              padding: properties.padding,
              width: properties.width === '100%' ? '600px' : properties.width,
              maxWidth: '100%',
              textAlign: 'center',
              borderRadius: '8px'
            }}
            onClick={(e) => handleElementClick(element, e)}
          >
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>📎</div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>{properties.label}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {properties.multiple ? 'Multiple files' : 'Single file'} • {properties.accept || 'All types'}
            </div>
          </div>
        )

      case 'text-input':
        return (
          <div
            key={element.id}
            style={{ ...elementStyle, width: properties.width === '100%' ? '600px' : properties.width }}
            onClick={(e) => handleElementClick(element, e)}
          >
            {properties.label && (
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#333' }}>
                {properties.label}
              </div>
            )}
            <input
              type="text"
              placeholder={properties.placeholder}
              readOnly
              style={{
                width: '100%',
                padding: properties.padding,
                fontSize: properties.fontSize,
                border: `1px solid ${properties.borderColor}`,
                borderRadius: '4px',
                outline: 'none',
                pointerEvents: 'none'
              }}
            />
          </div>
        )

      case 'select':
        return (
          <div
            key={element.id}
            style={{ ...elementStyle, width: properties.width === '100%' ? '600px' : properties.width }}
            onClick={(e) => handleElementClick(element, e)}
          >
            {properties.label && (
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#333' }}>
                {properties.label}
              </div>
            )}
            <select
              disabled
              style={{
                width: '100%',
                padding: properties.padding,
                fontSize: properties.fontSize,
                border: `1px solid ${properties.borderColor}`,
                borderRadius: '4px',
                outline: 'none',
                pointerEvents: 'none',
                backgroundColor: '#ffffff'
              }}
            >
              <option>Select option...</option>
            </select>
          </div>
        )

      case 'checkbox':
        return (
          <div
            key={element.id}
            style={{
              ...elementStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: properties.padding
            }}
            onClick={(e) => handleElementClick(element, e)}
          >
            <input
              type="checkbox"
              readOnly
              style={{ width: '18px', height: '18px', pointerEvents: 'none' }}
            />
            <span style={{ fontSize: properties.fontSize }}>{properties.label}</span>
          </div>
        )

      case 'image':
        return (
          <div
            key={element.id}
            style={{
              ...elementStyle,
              width: properties.width,
              height: properties.height,
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: properties.borderRadius,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
            onClick={(e) => handleElementClick(element, e)}
          >
            {properties.src ? (
              <img
                src={properties.src}
                alt={properties.alt}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: properties.objectFit
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#999' }}>
                <div style={{ fontSize: '48px' }}>🖼</div>
                <div style={{ fontSize: '12px' }}>Image Placeholder</div>
              </div>
            )}
          </div>
        )

      case 'button':
        return (
          <button
            key={element.id}
            style={{
              ...elementStyle,
              backgroundColor: properties.backgroundColor,
              color: properties.color,
              fontSize: properties.fontSize,
              fontWeight: properties.fontWeight,
              padding: properties.padding,
              borderRadius: properties.borderRadius,
              border: 'none',
              cursor: 'pointer',
              width: properties.width === 'auto' ? 'auto' : properties.width
            }}
            onClick={(e) => handleElementClick(element, e)}
          >
            {properties.label}
          </button>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Sidebar />
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ffffff',
        marginTop: '54px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Toolbar */}
        <div style={{
          height: '64px',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          background: '#0a0a0a'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#888',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ←
            </button>
            {isEditingTitle ? (
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false)
                }}
                autoFocus
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #3b82f6',
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: '500',
                  padding: '4px 0',
                  outline: 'none',
                  fontFamily: 'inherit',
                  minWidth: '200px'
                }}
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                style={{
                  fontSize: '18px',
                  fontWeight: '500',
                  margin: 0,
                  cursor: 'pointer',
                  color: '#ffffff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {formTitle}
              </h1>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            <button
              style={{
                background: 'transparent',
                color: '#ffffff',
                border: '1px solid #2a2a2a',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1a1a1a'
                e.currentTarget.style.borderColor = '#3a3a3a'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = '#2a2a2a'
              }}
              onClick={() => alert('Preview feature coming soon!')}
            >
              Preview
            </button>
            <button
              style={{
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e5e5e5'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
              onClick={() => alert('Publishing feature coming soon!')}
            >
              Publish
            </button>
          </div>
        </div>

        {/* Three Column Layout */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}>
          {/* LEFT SIDEBAR - Component Library */}
          <div style={{
            width: '200px',
            borderRight: '1px solid #2a2a2a',
            background: '#0a0a0a',
            overflowY: 'auto',
            padding: '20px 16px'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#666',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Elements
            </div>

            {COMPONENT_LIBRARY.map((component) => (
              <div
                key={component.id}
                draggable
                onDragStart={() => handleDragStart(component)}
                style={{
                  padding: '10px 12px',
                  marginBottom: '6px',
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '6px',
                  cursor: 'grab',
                  transition: 'all 0.15s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3a3a3a'
                  e.currentTarget.style.background = '#252525'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2a2a2a'
                  e.currentTarget.style.background = '#1a1a1a'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    fontSize: '18px'
                  }}>
                    {component.icon}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#ffffff',
                      marginBottom: '2px'
                    }}>
                      {component.label}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#666'
                    }}>
                      {component.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CENTER - Canvas (HORIZONTAL/LANDSCAPE) */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'auto',
            background: '#1a1a1a',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
          }}>
            <div
              onDrop={handleCanvasDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={handleCanvasClick}
              style={{
                width: '1200px',
                height: '800px',
                background: '#ffffff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                borderRadius: '8px',
                position: 'relative',
                border: isDragging ? '2px dashed #3b82f6' : 'none'
              }}
            >
              {canvasElements.length === 0 && !isDragging && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: '#ccc',
                  pointerEvents: 'none'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>↓</div>
                  <div style={{ fontSize: '16px' }}>Drag elements here to start building</div>
                </div>
              )}

              {canvasElements.map(renderCanvasElement)}

              {isDragging && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '18px',
                  color: '#999',
                  pointerEvents: 'none'
                }}>
                  Drop here to add element
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR - Properties Panel */}
          <div style={{
            width: '280px',
            borderLeft: '1px solid #2a2a2a',
            background: '#0a0a0a',
            overflowY: 'auto',
            padding: '20px'
          }}>
            {selectedElement ? (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#ffffff'
                  }}>
                    {COMPONENT_LIBRARY.find(c => c.id === selectedElement.type)?.label}
                  </div>
                  <button
                    onClick={handleDeleteElement}
                    style={{
                      background: 'transparent',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      color: '#888',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#ff4444'
                      e.currentTarget.style.color = '#ff4444'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2a2a2a'
                      e.currentTarget.style.color = '#888'
                    }}
                  >
                    Delete
                  </button>
                </div>

                {/* Dynamic Properties Based on Element Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Text Properties */}
                  {selectedElement.type === 'text' && (
                    <>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#888',
                          marginBottom: '8px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Content
                        </label>
                        <textarea
                          value={selectedElement.properties.content}
                          onChange={(e) => handlePropertyChange('content', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '13px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            color: '#ffffff',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            minHeight: '80px',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#888',
                          marginBottom: '8px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Font Size
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.fontSize}
                          onChange={(e) => handlePropertyChange('fontSize', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '13px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            color: '#ffffff',
                            fontFamily: 'inherit',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#888',
                          marginBottom: '8px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Text Color
                        </label>
                        <input
                          type="color"
                          value={selectedElement.properties.color}
                          onChange={(e) => handlePropertyChange('color', e.target.value)}
                          style={{
                            width: '100%',
                            height: '40px',
                            padding: '4px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </>
                  )}

                  {/* Heading Properties */}
                  {selectedElement.type === 'heading' && (
                    <>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#888',
                          marginBottom: '8px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Content
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.content}
                          onChange={(e) => handlePropertyChange('content', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '13px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            color: '#ffffff',
                            fontFamily: 'inherit',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#888',
                          marginBottom: '8px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Font Size
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.fontSize}
                          onChange={(e) => handlePropertyChange('fontSize', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '13px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            color: '#ffffff',
                            fontFamily: 'inherit',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#888',
                          marginBottom: '8px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Text Color
                        </label>
                        <input
                          type="color"
                          value={selectedElement.properties.color}
                          onChange={(e) => handlePropertyChange('color', e.target.value)}
                          style={{
                            width: '100%',
                            height: '40px',
                            padding: '4px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </>
                  )}

                  {/* File Upload Properties */}
                  {selectedElement.type === 'file-upload' && (
                    <>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#888',
                          marginBottom: '8px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Label
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.label}
                          onChange={(e) => handlePropertyChange('label', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '13px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            color: '#ffffff',
                            fontFamily: 'inherit',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#888',
                          marginBottom: '8px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Background Color
                        </label>
                        <input
                          type="color"
                          value={selectedElement.properties.backgroundColor}
                          onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                          style={{
                            width: '100%',
                            height: '40px',
                            padding: '4px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </>
                  )}

                  {/* Text Input Properties */}
                  {selectedElement.type === 'text-input' && (
                    <>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#888',
                          marginBottom: '8px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Label
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.label}
                          onChange={(e) => handlePropertyChange('label', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '13px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            color: '#ffffff',
                            fontFamily: 'inherit',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#888',
                          marginBottom: '8px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Placeholder
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.placeholder}
                          onChange={(e) => handlePropertyChange('placeholder', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '13px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            color: '#ffffff',
                            fontFamily: 'inherit',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </>
                  )}

                  {/* Button Properties */}
                  {selectedElement.type === 'button' && (
                    <>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#888',
                          marginBottom: '8px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Label
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.label}
                          onChange={(e) => handlePropertyChange('label', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '13px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            color: '#ffffff',
                            fontFamily: 'inherit',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#888',
                          marginBottom: '8px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Background Color
                        </label>
                        <input
                          type="color"
                          value={selectedElement.properties.backgroundColor}
                          onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                          style={{
                            width: '100%',
                            height: '40px',
                            padding: '4px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#888',
                          marginBottom: '8px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Text Color
                        </label>
                        <input
                          type="color"
                          value={selectedElement.properties.color}
                          onChange={(e) => handlePropertyChange('color', e.target.value)}
                          style={{
                            width: '100%',
                            height: '40px',
                            padding: '4px',
                            border: '1px solid #2a2a2a',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#666',
                padding: '60px 20px'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '16px', opacity: 0.3 }}>◇</div>
                <div style={{ fontSize: '13px' }}>
                  Select an element to edit its properties
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Requests
