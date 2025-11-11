// COMPLETELY REDESIGNED DASHBOARD - v2.0.0 - Cache Bust: 2024-11-11-FIX
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

// Component Library - All available form elements
const COMPONENT_LIBRARY = [
  {
    id: 'heading',
    label: 'Heading',
    icon: '📝',
    category: 'text',
    description: 'Large title text for sections',
    defaultProps: {
      content: 'Section Heading',
      fontSize: '32px',
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'left'
    }
  },
  {
    id: 'paragraph',
    label: 'Paragraph',
    icon: '📄',
    category: 'text',
    description: 'Body text and descriptions',
    defaultProps: {
      content: 'Add your description text here...',
      fontSize: '16px',
      fontWeight: '400',
      color: '#9B9A97',
      textAlign: 'left'
    }
  },
  {
    id: 'textfield',
    label: 'Text Field',
    icon: '📝',
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
    icon: '📄',
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
    icon: '📧',
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
    icon: '📞',
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
    icon: '📎',
    category: 'input',
    description: 'File upload with drag & drop',
    defaultProps: {
      label: 'Upload Files',
      acceptedTypes: 'image/*,application/pdf,.doc,.docx',
      maxFiles: 5,
      maxSize: '10MB'
    }
  },
  {
    id: 'button',
    label: 'Button',
    icon: '🔘',
    category: 'action',
    description: 'Submit or action button',
    defaultProps: {
      content: 'Submit',
      type: 'submit',
      style: 'primary'
    }
  },
  {
    id: 'spacer',
    label: 'Spacer',
    icon: '⬜',
    category: 'layout',
    description: 'Add vertical spacing',
    defaultProps: {
      height: '40px'
    }
  }
]

const TEMPLATE_LIBRARY = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch with an empty form',
    icon: '⬜',
    elements: []
  },
  {
    id: 'contact-form',
    name: 'Contact Form',
    description: 'Basic contact form with name, email, and message',
    icon: '📧',
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
          color: '#FFFFFF',
          textAlign: 'left'
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
      },
      {
        id: 'submit-btn',
        type: 'button',
        x: 50,
        y: 410,
        width: 150,
        height: 45,
        properties: {
          content: 'Send Message',
          type: 'submit'
        }
      }
    ]
  },
  {
    id: 'file-request',
    name: 'File Request',
    description: 'Simple file upload form with description',
    icon: '📎',
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
        id: 'description',
        type: 'paragraph',
        x: 50,
        y: 120,
        width: 400,
        height: 60,
        properties: {
          content: 'Please upload your files using the form below. Accepted formats: PDF, DOC, Images',
          fontSize: '16px',
          color: '#9B9A97'
        }
      },
      {
        id: 'name-field',
        type: 'textfield',
        x: 50,
        y: 200,
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
        y: 270,
        width: 400,
        height: 120,
        properties: {
          label: 'Upload Files',
          acceptedTypes: 'image/*,application/pdf,.doc,.docx',
          maxFiles: 3
        }
      },
      {
        id: 'submit-btn',
        type: 'button',
        x: 50,
        y: 410,
        width: 150,
        height: 45,
        properties: {
          content: 'Submit Files'
        }
      }
    ]
  },
  {
    id: 'survey-form',
    name: 'Survey Form',
    description: 'Multi-question survey with various input types',
    icon: '📊',
    elements: [
      {
        id: 'heading-1',
        type: 'heading',
        x: 50,
        y: 50,
        width: 400,
        height: 60,
        properties: {
          content: 'Quick Survey',
          fontSize: '32px',
          fontWeight: '700',
          color: '#FFFFFF'
        }
      },
      {
        id: 'intro-text',
        type: 'paragraph',
        x: 50,
        y: 120,
        width: 400,
        height: 40,
        properties: {
          content: 'Help us improve by answering a few quick questions.',
          fontSize: '16px',
          color: '#9B9A97'
        }
      },
      {
        id: 'name-field',
        type: 'textfield',
        x: 50,
        y: 180,
        width: 400,
        height: 50,
        properties: {
          label: 'Name (Optional)',
          placeholder: 'Your name'
        }
      },
      {
        id: 'email-field',
        type: 'email',
        x: 50,
        y: 250,
        width: 400,
        height: 50,
        properties: {
          label: 'Email',
          placeholder: 'your.email@example.com'
        }
      },
      {
        id: 'feedback-field',
        type: 'textarea',
        x: 50,
        y: 320,
        width: 400,
        height: 100,
        properties: {
          label: 'Feedback',
          placeholder: 'Share your thoughts...',
          required: true
        }
      },
      {
        id: 'submit-btn',
        type: 'button',
        x: 50,
        y: 440,
        width: 150,
        height: 45,
        properties: {
          content: 'Submit Survey'
        }
      }
    ]
  }
]

function Requests() {
  const navigate = useNavigate()

  // Core state
  const [elements, setElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)
  const [formTitle, setFormTitle] = useState('Untitled Request')
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  // UI state
  const [activeTab, setActiveTab] = useState('templates')
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // Interaction state
  const [isDragging, setIsDragging] = useState(false)
  const [draggedComponent, setDraggedComponent] = useState(null)
  const [clipboard, setClipboard] = useState(null)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const canvasRef = useRef()

  // Save current state to history for undo/redo
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

  // Filter components
  const filteredComponents = COMPONENT_LIBRARY.filter(component => {
    const matchesCategory = activeCategory === 'all' || component.category === activeCategory
    const matchesSearch = component.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories = [
    { id: 'all', label: 'All', count: COMPONENT_LIBRARY.length },
    { id: 'text', label: 'Text', count: COMPONENT_LIBRARY.filter(c => c.category === 'text').length },
    { id: 'input', label: 'Inputs', count: COMPONENT_LIBRARY.filter(c => c.category === 'input').length },
    { id: 'action', label: 'Actions', count: COMPONENT_LIBRARY.filter(c => c.category === 'action').length },
    { id: 'layout', label: 'Layout', count: COMPONENT_LIBRARY.filter(c => c.category === 'layout').length }
  ]

  return (
    <>
      <Sidebar />

      {/* REDESIGNED MAIN CONTAINER */}
      <div style={{
        height: '100vh',
        background: '#000000',
        color: '#FFFFFF',
        paddingTop: '54px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* REDESIGNED HEADER - Clean & Professional */}
        <div style={{
          height: '72px',
          borderBottom: '1px solid #2F2F2F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          background: '#000000',
          flexShrink: 0
        }}>

          {/* Left: Title & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
                  fontSize: '20px',
                  fontWeight: '600',
                  padding: '8px 0',
                  outline: 'none',
                  fontFamily: 'inherit',
                  minWidth: '300px'
                }}
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: 0,
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  transition: 'background 0.15s ease',
                  color: '#FFFFFF'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                {formTitle}
              </h1>
            )}

            <div style={{
              padding: '4px 10px',
              background: 'rgba(115, 115, 115, 0.2)',
              border: '1px solid #373737',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#9B9A97',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Draft
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            {/* History Controls */}
            <div style={{
              display: 'flex',
              gap: '2px',
              padding: '2px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '6px',
              border: '1px solid #2F2F2F'
            }}>
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title="Undo (Cmd+Z)"
                style={{
                  background: 'transparent',
                  color: historyIndex <= 0 ? '#6C6C6C' : '#9B9A97',
                  cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
                  opacity: historyIndex <= 0 ? 0.5 : 1,
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '500',
                  padding: '6px 10px',
                  fontFamily: 'inherit',
                  borderRadius: '4px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => !e.target.disabled && (e.target.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                ↶
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="Redo (Cmd+Shift+Z)"
                style={{
                  background: 'transparent',
                  color: historyIndex >= history.length - 1 ? '#6C6C6C' : '#9B9A97',
                  cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: historyIndex >= history.length - 1 ? 0.5 : 1,
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '500',
                  padding: '6px 10px',
                  fontFamily: 'inherit',
                  borderRadius: '4px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => !e.target.disabled && (e.target.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                ↷
              </button>
            </div>

            {/* Action Buttons */}
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
                fontFamily: 'inherit',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.10)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.06)'}
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
                fontFamily: 'inherit',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.10)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.06)'}
            >
              Save
            </button>

            <button
              onClick={handlePublish}
              style={{
                background: '#FFFFFF',
                color: '#000000',
                border: '1px solid #FFFFFF',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                padding: '8px 20px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#E5E5E5'
                e.target.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#FFFFFF'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              Publish
            </button>
          </div>
        </div>

        {/* REDESIGNED MAIN WORKSPACE */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* REDESIGNED SIDEBAR - Modern & Organized */}
          <div style={{
            width: '340px',
            borderRight: '1px solid #2F2F2F',
            background: '#000000',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>

            {/* Tab Navigation */}
            <div style={{
              padding: '20px 24px 0 24px',
              borderBottom: '1px solid #2F2F2F',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '20px' }}>
                {[
                  { key: 'templates', label: 'Templates', icon: '📄' },
                  { key: 'elements', label: 'Elements', icon: '🧩' },
                  { key: 'properties', label: 'Properties', icon: '⚙️' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      background: activeTab === tab.key ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      color: activeTab === tab.key ? '#FFFFFF' : '#9B9A97',
                      border: activeTab === tab.key ? '1px solid #373737' : '1px solid transparent',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                      flex: 1,
                      justifyContent: 'center'
                    }}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>

              {/* TEMPLATES TAB */}
              {activeTab === 'templates' && (
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    margin: '0 0 16px 0'
                  }}>
                    Get Started
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
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          ':hover': {
                            background: 'rgba(255, 255, 255, 0.06)',
                            borderColor: '#373737'
                          }
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.06)'
                          e.target.style.borderColor = '#373737'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.03)'
                          e.target.style.borderColor = '#2F2F2F'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '20px' }}>{template.icon}</span>
                          <h4 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#FFFFFF',
                            margin: 0
                          }}>
                            {template.name}
                          </h4>
                        </div>
                        <p style={{
                          fontSize: '12px',
                          color: '#9B9A97',
                          margin: 0,
                          lineHeight: 1.4
                        }}>
                          {template.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ELEMENTS TAB */}
              {activeTab === 'elements' && (
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    margin: '0 0 16px 0'
                  }}>
                    Add Elements
                  </h3>

                  {/* Search */}
                  <input
                    type="text"
                    placeholder="Search elements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid #2F2F2F',
                      borderRadius: '6px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      marginBottom: '16px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />

                  {/* Categories */}
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '20px',
                    flexWrap: 'wrap'
                  }}>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        style={{
                          background: activeCategory === category.id ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                          color: activeCategory === category.id ? '#FFFFFF' : '#9B9A97',
                          border: '1px solid #2F2F2F',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {category.label} ({category.count})
                      </button>
                    ))}
                  </div>

                  {/* Components Grid */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredComponents.map((component) => (
                      <div
                        key={component.id}
                        onClick={() => addElement(component.id)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid #2F2F2F',
                          borderRadius: '6px',
                          padding: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.06)'
                          e.target.style.borderColor = '#373737'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.03)'
                          e.target.style.borderColor = '#2F2F2F'
                        }}
                      >
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>{component.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#FFFFFF',
                            marginBottom: '2px'
                          }}>
                            {component.label}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: '#9B9A97',
                            lineHeight: 1.3
                          }}>
                            {component.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PROPERTIES TAB */}
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
                        marginBottom: '20px'
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

                      {/* Properties form would go here */}
                      <div style={{
                        color: '#9B9A97',
                        fontSize: '13px',
                        textAlign: 'center',
                        padding: '40px 20px'
                      }}>
                        Properties panel coming soon...
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
          </div>

          {/* REDESIGNED CANVAS AREA */}
          <div style={{ flex: 1, background: '#0A0A0A', overflow: 'hidden', position: 'relative' }}>

            {/* Canvas Header */}
            <div style={{
              padding: '20px 32px',
              borderBottom: '1px solid #1A1A1A',
              background: '#050505'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    margin: '0 0 4px 0'
                  }}>
                    Form Builder
                  </h2>
                  <p style={{
                    fontSize: '13px',
                    color: '#9B9A97',
                    margin: 0
                  }}>
                    Drag elements from the sidebar or choose a template to get started
                  </p>
                </div>

                <div style={{
                  fontSize: '12px',
                  color: '#6C6C6C',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <span>{elements.length} elements</span>
                  <span>•</span>
                  <span>Auto-save enabled</span>
                </div>
              </div>
            </div>

            {/* Canvas Content */}
            <div
              ref={canvasRef}
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '40px',
                background: `
                  radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
                  radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.01) 0%, transparent 50%),
                  #0A0A0A
                `,
                backgroundSize: '800px 800px, 1000px 1000px',
                position: 'relative'
              }}
            >
              {elements.length === 0 ? (
                /* Enhanced Empty State */
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '500px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '64px',
                    marginBottom: '24px',
                    opacity: 0.3
                  }}>
                    📝
                  </div>

                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    margin: '0 0 12px 0'
                  }}>
                    Start Building Your Form
                  </h3>

                  <p style={{
                    fontSize: '16px',
                    color: '#9B9A97',
                    margin: '0 0 32px 0',
                    maxWidth: '400px',
                    lineHeight: 1.5
                  }}>
                    Choose a template to get started quickly, or add individual elements to build from scratch.
                  </p>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setActiveTab('templates')}
                      style={{
                        background: '#FFFFFF',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        padding: '12px 24px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                      onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
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
                        fontSize: '14px',
                        fontWeight: '500',
                        padding: '12px 24px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.12)'
                        e.target.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                        e.target.style.transform = 'translateY(0)'
                      }}
                    >
                      Add Elements
                    </button>
                  </div>
                </div>
              ) : (
                /* Elements Rendering */
                <div style={{
                  minHeight: '600px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid #1A1A1A',
                  borderRadius: '8px',
                  padding: '40px',
                  position: 'relative'
                }}>
                  {elements.map((element) => (
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
                        transition: 'border-color 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        color: '#FFFFFF'
                      }}
                    >
                      {COMPONENT_LIBRARY.find(c => c.id === element.type)?.label || element.type}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Requests