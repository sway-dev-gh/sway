import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

// TEMPLATES - Pre-configured form layouts
const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from scratch with an empty canvas',
    plan: 'free',
    preview: 'Empty canvas - build exactly what you need',
    elements: []
  },
  {
    id: 'simple',
    name: 'Simple Upload',
    description: 'Heading + description + file upload',
    plan: 'free',
    preview: 'Perfect for basic file collection forms',
    elements: [
      {
        id: 'template-heading-1',
        type: 'heading',
        x: 100,
        y: 100,
        properties: {
          content: 'Upload Your Files',
          fontSize: '36px',
          color: '#ffffff',
          fontWeight: '600',
          textAlign: 'center',
          padding: '16px',
          width: '100%'
        }
      },
      {
        id: 'template-text-1',
        type: 'text',
        x: 100,
        y: 180,
        properties: {
          content: 'Please upload your documents below. We accept all file types.',
          fontSize: '16px',
          color: '#cccccc',
          fontWeight: '400',
          textAlign: 'center',
          padding: '12px',
          width: '100%'
        }
      },
      {
        id: 'template-upload-1',
        type: 'file-upload',
        x: 100,
        y: 280,
        properties: {
          label: 'Drop your files here',
          accept: '*',
          multiple: true,
          backgroundColor: '#1a1a1a',
          borderColor: '#3a3a3a',
          borderStyle: 'dashed',
          padding: '40px',
          width: '100%'
        }
      },
      {
        id: 'template-button-1',
        type: 'button',
        x: 450,
        y: 500,
        properties: {
          label: 'Submit',
          backgroundColor: '#ffffff',
          color: '#000000',
          fontSize: '16px',
          fontWeight: '600',
          padding: '14px 40px',
          borderRadius: '8px',
          width: 'auto'
        }
      }
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Logo + heading + description + upload + terms',
    plan: 'free',
    preview: 'Professional branded file upload form',
    elements: [
      {
        id: 'template-image-1',
        type: 'image',
        x: 500,
        y: 50,
        properties: {
          src: '',
          alt: 'Company Logo',
          width: '200px',
          height: '80px',
          objectFit: 'contain',
          borderRadius: '0px'
        }
      },
      {
        id: 'template-heading-2',
        type: 'heading',
        x: 100,
        y: 160,
        properties: {
          content: 'Submit Your Application',
          fontSize: '32px',
          color: '#ffffff',
          fontWeight: '600',
          textAlign: 'center',
          padding: '16px',
          width: '100%'
        }
      },
      {
        id: 'template-text-2',
        type: 'text',
        x: 100,
        y: 230,
        properties: {
          content: 'Complete the form below to submit your application. All fields are required.',
          fontSize: '15px',
          color: '#cccccc',
          fontWeight: '400',
          textAlign: 'center',
          padding: '12px',
          width: '100%'
        }
      },
      {
        id: 'template-input-1',
        type: 'text-input',
        x: 100,
        y: 320,
        properties: {
          placeholder: 'Full Name',
          label: 'Name',
          width: '100%',
          padding: '12px',
          fontSize: '14px',
          borderColor: '#3a3a3a'
        }
      },
      {
        id: 'template-upload-2',
        type: 'file-upload',
        x: 100,
        y: 420,
        properties: {
          label: 'Upload Documents',
          accept: '*',
          multiple: true,
          backgroundColor: '#1a1a1a',
          borderColor: '#3a3a3a',
          borderStyle: 'dashed',
          padding: '40px',
          width: '100%'
        }
      },
      {
        id: 'template-checkbox-1',
        type: 'checkbox',
        x: 100,
        y: 620,
        properties: {
          label: 'I agree to the terms and conditions',
          fontSize: '13px',
          padding: '8px'
        }
      },
      {
        id: 'template-button-2',
        type: 'button',
        x: 450,
        y: 680,
        properties: {
          label: 'Submit Application',
          backgroundColor: '#ffffff',
          color: '#000000',
          fontSize: '16px',
          fontWeight: '600',
          padding: '14px 40px',
          borderRadius: '8px',
          width: 'auto'
        }
      }
    ]
  },
  {
    id: 'advanced',
    name: 'Advanced Form',
    description: 'Multi-section form with conditional fields',
    plan: 'pro',
    preview: 'Complex forms with advanced logic - Pro Only',
    elements: []
  },
  {
    id: 'multistep',
    name: 'Multi-Step Wizard',
    description: 'Wizard-style form with progress bar',
    plan: 'pro',
    preview: 'Step-by-step user experience - Pro Only',
    elements: []
  }
]

// Component Library - Elements that can be dragged onto canvas
const COMPONENT_LIBRARY = [
  {
    id: 'text',
    label: 'Text Block',
    icon: 'T',
    description: 'Paragraph text',
    plan: 'free'
  },
  {
    id: 'heading',
    label: 'Heading',
    icon: 'H',
    description: 'Title or heading',
    plan: 'free'
  },
  {
    id: 'file-upload',
    label: 'File Upload',
    icon: '↑',
    description: 'File upload zone',
    plan: 'free'
  },
  {
    id: 'text-input',
    label: 'Text Input',
    icon: 'I',
    description: 'Single line input',
    plan: 'free'
  },
  {
    id: 'button',
    label: 'Button',
    icon: 'B',
    description: 'Action button',
    plan: 'free'
  },
  {
    id: 'select',
    label: 'Dropdown',
    icon: '▼',
    description: 'Select menu',
    plan: 'pro'
  },
  {
    id: 'checkbox',
    label: 'Checkbox',
    icon: '□',
    description: 'Checkbox field',
    plan: 'pro'
  },
  {
    id: 'image',
    label: 'Image',
    icon: 'IMG',
    description: 'Image placeholder',
    plan: 'pro'
  }
]

// Default properties for each component type
const DEFAULT_PROPERTIES = {
  'text': {
    content: 'Enter your text here',
    fontSize: '16px',
    color: '#cccccc',
    fontWeight: '400',
    textAlign: 'left',
    padding: '12px',
    width: '100%'
  },
  'heading': {
    content: 'Heading Text',
    fontSize: '32px',
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    padding: '16px',
    width: '100%'
  },
  'file-upload': {
    label: 'Upload your files',
    accept: '*',
    multiple: true,
    backgroundColor: '#1a1a1a',
    borderColor: '#3a3a3a',
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
    borderColor: '#3a3a3a'
  },
  'select': {
    label: 'Select Option',
    options: 'Option 1,Option 2,Option 3',
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    borderColor: '#3a3a3a'
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
    backgroundColor: '#ffffff',
    color: '#000000',
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

  // New state for templates and plan gating
  const [activeTab, setActiveTab] = useState('templates') // 'templates' or 'elements'
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [userPlan, setUserPlan] = useState('free') // Get from localStorage or API

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
    }

    // Load user plan from localStorage
    const plan = localStorage.getItem('userPlan') || 'free'
    setUserPlan(plan)
  }, [navigate])

  // Generate unique ID for elements
  const generateId = () => `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Handle template selection
  const handleTemplateClick = (template) => {
    if (template.plan === 'pro' && userPlan === 'free') {
      setShowUpgradeModal(true)
      return
    }
    setSelectedTemplate(template)
    setShowTemplateModal(true)
  }

  // Apply template to canvas
  const handleUseTemplate = () => {
    if (selectedTemplate) {
      setCanvasElements(selectedTemplate.elements.map(el => ({
        ...el,
        id: generateId() // Generate new IDs for template elements
      })))
      setShowTemplateModal(false)
      setSelectedTemplate(null)
    }
  }

  // Handle drag start from component library
  const handleDragStart = (component) => {
    // Check if element requires pro plan
    if (component.plan === 'pro' && userPlan === 'free') {
      setShowUpgradeModal(true)
      return
    }
    setDraggedComponent(component)
    setIsDragging(true)
  }

  // Handle element click (check plan gating)
  const handleElementClick = (component) => {
    if (component.plan === 'pro' && userPlan === 'free') {
      setShowUpgradeModal(true)
      return false
    }
    return true
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
  const handleElementSelect = (element, e) => {
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
            onClick={(e) => handleElementSelect(element, e)}
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
            onClick={(e) => handleElementSelect(element, e)}
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
            onClick={(e) => handleElementSelect(element, e)}
          >
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>↑</div>
            <div style={{ fontSize: '16px', fontWeight: '500', color: '#ffffff' }}>{properties.label}</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {properties.multiple ? 'Multiple files' : 'Single file'} • {properties.accept || 'All types'}
            </div>
          </div>
        )

      case 'text-input':
        return (
          <div
            key={element.id}
            style={{ ...elementStyle, width: properties.width === '100%' ? '600px' : properties.width }}
            onClick={(e) => handleElementSelect(element, e)}
          >
            {properties.label && (
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#ffffff' }}>
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
                pointerEvents: 'none',
                backgroundColor: '#1a1a1a',
                color: '#ffffff'
              }}
            />
          </div>
        )

      case 'select':
        return (
          <div
            key={element.id}
            style={{ ...elementStyle, width: properties.width === '100%' ? '600px' : properties.width }}
            onClick={(e) => handleElementSelect(element, e)}
          >
            {properties.label && (
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#ffffff' }}>
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
                backgroundColor: '#1a1a1a',
                color: '#ffffff'
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
            onClick={(e) => handleElementSelect(element, e)}
          >
            <input
              type="checkbox"
              readOnly
              style={{ width: '18px', height: '18px', pointerEvents: 'none' }}
            />
            <span style={{ fontSize: properties.fontSize, color: '#ffffff' }}>{properties.label}</span>
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
              backgroundColor: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: properties.borderRadius,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
            onClick={(e) => handleElementSelect(element, e)}
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
              <div style={{ textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: '48px' }}>IMG</div>
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
            onClick={(e) => handleElementSelect(element, e)}
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
          {/* LEFT SIDEBAR - Templates & Component Library */}
          <div style={{
            width: '280px',
            borderRight: '1px solid #2a2a2a',
            background: '#0a0a0a',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #2a2a2a',
              background: '#0a0a0a'
            }}>
              <button
                onClick={() => setActiveTab('templates')}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: activeTab === 'templates' ? '#1a1a1a' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'templates' ? '2px solid #ffffff' : '2px solid transparent',
                  color: activeTab === 'templates' ? '#ffffff' : '#666',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease'
                }}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveTab('elements')}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: activeTab === 'elements' ? '#1a1a1a' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'elements' ? '2px solid #ffffff' : '2px solid transparent',
                  color: activeTab === 'elements' ? '#ffffff' : '#666',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease'
                }}
              >
                Elements
              </button>
            </div>

            {/* Tab Content */}
            <div style={{ padding: '20px 16px' }}>
              {activeTab === 'templates' ? (
                <>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#666',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Choose a Template
                  </div>

                  {TEMPLATES.map((template) => {
                    const isPro = template.plan === 'pro'
                    const isLocked = isPro && userPlan === 'free'

                    return (
                      <div
                        key={template.id}
                        onClick={() => handleTemplateClick(template)}
                        style={{
                          padding: '14px',
                          marginBottom: '10px',
                          background: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '8px',
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                          opacity: isLocked ? 0.6 : 1,
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          if (!isLocked) {
                            e.currentTarget.style.borderColor = '#3a3a3a'
                            e.currentTarget.style.background = '#252525'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#2a2a2a'
                          e.currentTarget.style.background = '#1a1a1a'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '6px'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#ffffff'
                          }}>
                            {template.name}
                          </div>
                          {isPro && (
                            <div style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              color: isLocked ? '#888' : '#fbbf24',
                              background: isLocked ? '#2a2a2a' : 'rgba(251, 191, 36, 0.15)',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {isLocked && '🔒'} PRO
                            </div>
                          )}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#999',
                          lineHeight: '1.4'
                        }}>
                          {template.description}
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                <>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#666',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Drag to Canvas
                  </div>

                  {COMPONENT_LIBRARY.map((component) => {
                    const isPro = component.plan === 'pro'
                    const isLocked = isPro && userPlan === 'free'

                    return (
                      <div
                        key={component.id}
                        draggable={!isLocked}
                        onDragStart={() => !isLocked && handleDragStart(component)}
                        onClick={() => isLocked && handleElementClick(component)}
                        style={{
                          padding: '12px',
                          marginBottom: '8px',
                          background: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '6px',
                          cursor: isLocked ? 'not-allowed' : 'grab',
                          transition: 'all 0.15s ease',
                          userSelect: 'none',
                          opacity: isLocked ? 0.6 : 1,
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          if (!isLocked) {
                            e.currentTarget.style.borderColor = '#3a3a3a'
                            e.currentTarget.style.background = '#252525'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#2a2a2a'
                          e.currentTarget.style.background = '#1a1a1a'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <div style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#ffffff',
                            minWidth: '32px',
                            textAlign: 'center',
                            background: '#2a2a2a',
                            borderRadius: '6px',
                            padding: '6px',
                            lineHeight: '1'
                          }}>
                            {component.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '2px'
                            }}>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#ffffff'
                              }}>
                                {component.label}
                              </div>
                              {isPro && (
                                <div style={{
                                  fontSize: '9px',
                                  fontWeight: '700',
                                  color: isLocked ? '#888' : '#fbbf24',
                                  background: isLocked ? '#2a2a2a' : 'rgba(251, 191, 36, 0.15)',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.3px'
                                }}>
                                  {isLocked && '🔒'} PRO
                                </div>
                              )}
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
                    )
                  })}
                </>
              )}
            </div>
          </div>

          {/* CENTER - Canvas */}
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
                background: '#000000', // BLACK BACKGROUND
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                borderRadius: '8px',
                position: 'relative',
                border: isDragging ? '2px dashed #3b82f6' : '1px solid #2a2a2a'
              }}
            >
              {canvasElements.length === 0 && !isDragging && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: '#444',
                  pointerEvents: 'none'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>↓</div>
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
                  color: '#666',
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

                  {/* Select Properties */}
                  {selectedElement.type === 'select' && (
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
                    </>
                  )}

                  {/* Checkbox Properties */}
                  {selectedElement.type === 'checkbox' && (
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
                    </>
                  )}

                  {/* Image Properties */}
                  {selectedElement.type === 'image' && (
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
                          Image URL
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.src}
                          onChange={(e) => handlePropertyChange('src', e.target.value)}
                          placeholder="https://example.com/image.jpg"
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

      {/* TEMPLATE PREVIEW MODAL */}
      {showTemplateModal && selectedTemplate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '40px'
        }}
        onClick={() => {
          setShowTemplateModal(false)
          setSelectedTemplate(null)
        }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '12px'
            }}>
              {selectedTemplate.name}
            </div>
            <div style={{
              fontSize: '15px',
              color: '#999',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              {selectedTemplate.preview}
            </div>

            {/* Template Preview Area */}
            <div style={{
              background: '#0a0a0a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              padding: '40px',
              marginBottom: '24px',
              textAlign: 'center',
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ color: '#666', fontSize: '14px' }}>
                {selectedTemplate.elements.length > 0
                  ? `Contains ${selectedTemplate.elements.length} pre-configured elements`
                  : 'Empty canvas - start from scratch'
                }
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowTemplateModal(false)
                  setSelectedTemplate(null)
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #2a2a2a',
                  color: '#888',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3a3a3a'
                  e.currentTarget.style.color = '#ffffff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2a2a2a'
                  e.currentTarget.style.color = '#888'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUseTemplate}
                style={{
                  background: '#ffffff',
                  border: 'none',
                  color: '#000000',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e5e5e5'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
              >
                Use Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '40px'
        }}
        onClick={() => setShowUpgradeModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a1a',
              border: '1px solid #fbbf24',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(251, 191, 36, 0.2)'
            }}
          >
            <div style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#fbbf24',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              Upgrade to Pro
            </div>
            <div style={{
              fontSize: '15px',
              color: '#ccc',
              marginBottom: '24px',
              lineHeight: '1.6',
              textAlign: 'center'
            }}>
              This feature requires a Pro plan. Upgrade now to unlock advanced form elements, templates, and more powerful features.
            </div>

            {/* Pro Features */}
            <div style={{
              background: '#0a0a0a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#fbbf24', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pro Features Include:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#999', fontSize: '14px', lineHeight: '2' }}>
                <li>Advanced form elements (Dropdown, Checkbox, Image)</li>
                <li>Premium templates and layouts</li>
                <li>Advanced file upload with restrictions</li>
                <li>Custom branding options</li>
                <li>Priority support</li>
              </ul>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowUpgradeModal(false)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid #2a2a2a',
                  color: '#888',
                  padding: '14px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3a3a3a'
                  e.currentTarget.style.color = '#ffffff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2a2a2a'
                  e.currentTarget.style.color = '#888'
                }}
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false)
                  alert('Redirecting to pricing page...')
                }}
                style={{
                  flex: 1,
                  background: '#fbbf24',
                  border: 'none',
                  color: '#000000',
                  padding: '14px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f59e0b'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fbbf24'}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Requests
