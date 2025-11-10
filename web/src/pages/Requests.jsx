import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

// Component Library - Elements that can be dragged onto canvas
const COMPONENT_LIBRARY = [
  { id: 'text', label: 'Text Block', icon: 'T', description: 'Paragraph text' },
  { id: 'heading', label: 'Heading', icon: 'H', description: 'Title or heading' },
  { id: 'file-upload', label: 'File Upload', icon: '↑', description: 'File upload zone' },
  { id: 'text-input', label: 'Text Input', icon: 'I', description: 'Single line input' },
  { id: 'select', label: 'Dropdown', icon: '▼', description: 'Select menu' },
  { id: 'checkbox', label: 'Checkbox', icon: '☑', description: 'Checkbox field' },
  { id: 'image', label: 'Image', icon: '◇', description: 'Image placeholder' },
  { id: 'button', label: 'Button', icon: 'B', description: 'Action button' }
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
  const [canvasBackground, setCanvasBackground] = useState('#ffffff')

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
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>↑</div>
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
                <div style={{ fontSize: '48px' }}>◇</div>
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
        background: theme.colors.bg.page,
        color: theme.colors.text.primary,
        marginTop: '54px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Bar */}
        <div style={{
          height: '60px',
          borderBottom: `1px solid ${theme.colors.border.light}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: theme.colors.bg.secondary
        }}>
          <div>
            <h1 style={{
              fontSize: theme.fontSize.lg,
              fontWeight: '500',
              margin: 0,
              color: theme.colors.text.primary
            }}>
              Builder
            </h1>
            <p style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.text.secondary,
              margin: '2px 0 0 0'
            }}>
              Build custom file upload forms
            </p>
          </div>
          <button
            style={{
              background: theme.colors.white,
              color: theme.colors.black,
              border: 'none',
              padding: '10px 24px',
              borderRadius: theme.radius.md,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.weight.medium,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
            onClick={() => alert('Publishing feature coming soon!')}
          >
            Publish
          </button>
        </div>

        {/* Three Column Layout */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}>
          {/* LEFT SIDEBAR - Component Library */}
          <div style={{
            width: '220px',
            borderRight: `1px solid ${theme.colors.border.light}`,
            background: theme.colors.bg.secondary,
            overflowY: 'auto',
            padding: '20px 12px'
          }}>
            <div style={{
              fontSize: theme.fontSize.xs,
              fontWeight: theme.weight.medium,
              color: theme.colors.text.secondary,
              marginBottom: '12px',
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
                  padding: '12px',
                  marginBottom: '8px',
                  background: theme.colors.bg.page,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.radius.md,
                  cursor: 'grab',
                  transition: 'all 0.15s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border.medium
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border.light
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '4px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: theme.colors.bg.tertiary,
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    {component.icon}
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.weight.medium,
                    color: theme.colors.text.primary
                  }}>
                    {component.label}
                  </div>
                </div>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.text.tertiary,
                  marginLeft: '42px'
                }}>
                  {component.description}
                </div>
              </div>
            ))}
          </div>

          {/* CENTER - Canvas */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            background: theme.colors.bg.tertiary,
            position: 'relative'
          }}>
            <div
              style={{
                minHeight: '100%',
                padding: '40px',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <div
                onDrop={handleCanvasDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={handleCanvasClick}
                style={{
                  width: '800px',
                  minHeight: '1000px',
                  background: canvasBackground,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  position: 'relative',
                  border: isDragging ? `2px dashed ${theme.colors.border.medium}` : 'none'
                }}
              >
                {canvasElements.length === 0 && !isDragging && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: theme.colors.text.tertiary,
                    pointerEvents: 'none'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>↓</div>
                    <div style={{ fontSize: theme.fontSize.base }}>Drag elements here to start building</div>
                  </div>
                )}

                {canvasElements.map(renderCanvasElement)}

                {isDragging && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: theme.fontSize.lg,
                    color: theme.colors.text.secondary,
                    pointerEvents: 'none'
                  }}>
                    Drop here to add element
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR - Properties Panel */}
          <div style={{
            width: '300px',
            borderLeft: `1px solid ${theme.colors.border.light}`,
            background: theme.colors.bg.secondary,
            overflowY: 'auto',
            padding: '20px'
          }}>
            {selectedElement ? (
              <>
                <div style={{
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.primary,
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>
                    {COMPONENT_LIBRARY.find(c => c.id === selectedElement.type)?.label}
                  </span>
                  <button
                    onClick={handleDeleteElement}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '4px',
                      padding: '4px 12px',
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.text.secondary,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    Delete
                  </button>
                </div>

                {/* Dynamic Properties Based on Element Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {selectedElement.type === 'text' && (
                    <>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.text.secondary,
                          marginBottom: '6px',
                          fontWeight: theme.weight.medium
                        }}>
                          Content
                        </label>
                        <textarea
                          value={selectedElement.properties.content}
                          onChange={(e) => handlePropertyChange('content', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: theme.fontSize.sm,
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '4px',
                            background: theme.colors.bg.page,
                            color: theme.colors.text.primary,
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            minHeight: '60px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.text.secondary,
                          marginBottom: '6px',
                          fontWeight: theme.weight.medium
                        }}>
                          Font Size
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.fontSize}
                          onChange={(e) => handlePropertyChange('fontSize', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: theme.fontSize.sm,
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '4px',
                            background: theme.colors.bg.page,
                            color: theme.colors.text.primary,
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.text.secondary,
                          marginBottom: '6px',
                          fontWeight: theme.weight.medium
                        }}>
                          Color
                        </label>
                        <input
                          type="color"
                          value={selectedElement.properties.color}
                          onChange={(e) => handlePropertyChange('color', e.target.value)}
                          style={{
                            width: '100%',
                            height: '40px',
                            padding: '4px',
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '4px',
                            background: theme.colors.bg.page,
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </>
                  )}

                  {selectedElement.type === 'heading' && (
                    <>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.text.secondary,
                          marginBottom: '6px',
                          fontWeight: theme.weight.medium
                        }}>
                          Content
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.content}
                          onChange={(e) => handlePropertyChange('content', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: theme.fontSize.sm,
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '4px',
                            background: theme.colors.bg.page,
                            color: theme.colors.text.primary,
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.text.secondary,
                          marginBottom: '6px',
                          fontWeight: theme.weight.medium
                        }}>
                          Font Size
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.fontSize}
                          onChange={(e) => handlePropertyChange('fontSize', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: theme.fontSize.sm,
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '4px',
                            background: theme.colors.bg.page,
                            color: theme.colors.text.primary,
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.text.secondary,
                          marginBottom: '6px',
                          fontWeight: theme.weight.medium
                        }}>
                          Color
                        </label>
                        <input
                          type="color"
                          value={selectedElement.properties.color}
                          onChange={(e) => handlePropertyChange('color', e.target.value)}
                          style={{
                            width: '100%',
                            height: '40px',
                            padding: '4px',
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '4px',
                            background: theme.colors.bg.page,
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </>
                  )}

                  {selectedElement.type === 'file-upload' && (
                    <>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.text.secondary,
                          marginBottom: '6px',
                          fontWeight: theme.weight.medium
                        }}>
                          Label
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.label}
                          onChange={(e) => handlePropertyChange('label', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: theme.fontSize.sm,
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '4px',
                            background: theme.colors.bg.page,
                            color: theme.colors.text.primary,
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.text.secondary,
                          marginBottom: '6px',
                          fontWeight: theme.weight.medium
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
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '4px',
                            background: theme.colors.bg.page,
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </>
                  )}

                  {selectedElement.type === 'text-input' && (
                    <>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.text.secondary,
                          marginBottom: '6px',
                          fontWeight: theme.weight.medium
                        }}>
                          Label
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.label}
                          onChange={(e) => handlePropertyChange('label', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: theme.fontSize.sm,
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '4px',
                            background: theme.colors.bg.page,
                            color: theme.colors.text.primary,
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.text.secondary,
                          marginBottom: '6px',
                          fontWeight: theme.weight.medium
                        }}>
                          Placeholder
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.placeholder}
                          onChange={(e) => handlePropertyChange('placeholder', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: theme.fontSize.sm,
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '4px',
                            background: theme.colors.bg.page,
                            color: theme.colors.text.primary,
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                    </>
                  )}

                  {selectedElement.type === 'button' && (
                    <>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.text.secondary,
                          marginBottom: '6px',
                          fontWeight: theme.weight.medium
                        }}>
                          Label
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.label}
                          onChange={(e) => handlePropertyChange('label', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: theme.fontSize.sm,
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '4px',
                            background: theme.colors.bg.page,
                            color: theme.colors.text.primary,
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.text.secondary,
                          marginBottom: '6px',
                          fontWeight: theme.weight.medium
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
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '4px',
                            background: theme.colors.bg.page,
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.text.secondary,
                          marginBottom: '6px',
                          fontWeight: theme.weight.medium
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
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '4px',
                            background: theme.colors.bg.page,
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </>
                  )}

                  {/* Canvas Background Control */}
                  <div style={{
                    marginTop: '24px',
                    paddingTop: '24px',
                    borderTop: `1px solid ${theme.colors.border.light}`
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.text.secondary,
                      marginBottom: '6px',
                      fontWeight: theme.weight.medium
                    }}>
                      Canvas Background
                    </label>
                    <input
                      type="color"
                      value={canvasBackground}
                      onChange={(e) => setCanvasBackground(e.target.value)}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '4px',
                        border: `1px solid ${theme.colors.border.medium}`,
                        borderRadius: '4px',
                        background: theme.colors.bg.page,
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                color: theme.colors.text.tertiary,
                padding: '40px 20px'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.3 }}>◇</div>
                <div style={{ fontSize: theme.fontSize.sm }}>
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
