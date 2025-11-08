import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

// Request types from Requests.jsx
const REQUEST_TYPES = [
  { id: 'general-upload', name: 'General Upload' },
  { id: 'photos', name: 'Photos' },
  { id: 'videos', name: 'Videos' },
  { id: 'documents', name: 'Documents' },
  { id: 'code-submission', name: 'Code' },
  { id: 'design-assets', name: 'Design' },
  { id: 'event-photos', name: 'Event Photos' },
  { id: 'application-materials', name: 'Applications' },
  { id: 'invoices', name: 'Invoices' },
  { id: 'forms', name: 'Forms' },
  { id: 'client-deliverables', name: 'Deliverables' },
  { id: 'feedback', name: 'Feedback' },
  { id: 'content', name: 'Content' },
  { id: 'assignments', name: 'Assignments' },
  { id: 'contracts', name: 'Contracts' },
  { id: 'audio', name: 'Audio' },
  { id: 'spreadsheets', name: 'Spreadsheets' },
  { id: 'presentations', name: 'Presentations' },
  { id: 'legal', name: 'Legal Docs' },
  { id: 'id-verification', name: 'ID Verification' }
]

// Default elements for new canvas
const DEFAULT_ELEMENTS = [
  {
    id: 'title',
    type: 'text',
    content: 'Upload Your Files',
    x: 50,
    y: 30,
    fontSize: 32,
    fontWeight: '300',
    color: '#ffffff',
    align: 'center'
  },
  {
    id: 'subtitle',
    type: 'text',
    content: 'Drag and drop your files here or click to browse',
    x: 50,
    y: 45,
    fontSize: 16,
    fontWeight: '400',
    color: '#ffffff',
    align: 'center',
    opacity: 0.7
  },
  {
    id: 'upload-zone',
    type: 'upload-zone',
    x: 50,
    y: 60,
    width: 400,
    height: 200
  },
  {
    id: 'button',
    type: 'button',
    content: 'Choose Files',
    x: 50,
    y: 80,
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontSize: 14,
    fontWeight: '600',
    paddingX: 32,
    paddingY: 14,
    borderRadius: 8
  }
]

function Branding() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const canvasRef = useRef(null)
  const [dragging, setDragging] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Request type selection
  const [selectedRequestType, setSelectedRequestType] = useState('general-upload')

  // Store designs for all request types
  const [allDesigns, setAllDesigns] = useState({})

  // Canvas settings (for current request type)
  const [backgroundColor, setBackgroundColor] = useState('#000000')
  const [removeBranding, setRemoveBranding] = useState(true)
  const [logoUrl, setLogoUrl] = useState(null)

  // Elements on canvas (for current request type)
  const [elements, setElements] = useState(DEFAULT_ELEMENTS)
  const [selectedElement, setSelectedElement] = useState(null)

  // Left sidebar state
  const [activePanel, setActivePanel] = useState('elements') // 'elements' | 'properties'

  useEffect(() => {
    fetchBrandingSettings()
  }, [])

  // When request type changes, load that type's design
  useEffect(() => {
    loadRequestTypeDesign(selectedRequestType)
  }, [selectedRequestType, allDesigns])

  const fetchBrandingSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const { data } = await api.get('/api/branding/settings', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.settings) {
        setRemoveBranding(data.settings.remove_branding ?? true)
        setLogoUrl(data.settings.logo_url)

        // Load per-request-type designs
        if (data.settings.request_type_designs) {
          try {
            const designs = JSON.parse(data.settings.request_type_designs)
            setAllDesigns(designs)
          } catch (e) {
            console.error('Failed to parse request type designs:', e)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching branding settings:', error)
    } finally {
      setInitialLoad(false)
    }
  }

  // Load design for specific request type
  const loadRequestTypeDesign = (requestType) => {
    if (!allDesigns[requestType]) {
      // Use defaults if no design exists for this type
      setBackgroundColor('#000000')
      setElements(DEFAULT_ELEMENTS)
      return
    }

    const design = allDesigns[requestType]
    setBackgroundColor(design.backgroundColor || '#000000')
    setElements(design.elements || DEFAULT_ELEMENTS)
  }

  // Save current design before switching request types
  const saveCurrentDesignToState = () => {
    setAllDesigns(prev => ({
      ...prev,
      [selectedRequestType]: {
        backgroundColor,
        elements
      }
    }))
  }

  // Handle request type change
  const handleRequestTypeChange = (newType) => {
    saveCurrentDesignToState()
    setSelectedRequestType(newType)
    setSelectedElement(null)
  }

  const handleSave = async () => {
    setLoading(true)

    // Save current design to state first
    saveCurrentDesignToState()

    try {
      const token = localStorage.getItem('token')

      // Include current type's latest changes
      const designsToSave = {
        ...allDesigns,
        [selectedRequestType]: {
          backgroundColor,
          elements
        }
      }

      await api.post('/api/branding/settings', {
        remove_branding: removeBranding,
        logo_url: logoUrl,
        request_type_designs: JSON.stringify(designsToSave)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      alert('Branding settings saved successfully!')
    } catch (error) {
      console.error('Error saving branding settings:', error)
      if (error.response?.status === 403) {
        alert('Pro or Business plan required for custom branding')
      } else {
        alert('Failed to save branding settings. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setLogoUrl(URL.createObjectURL(file))
    }
  }

  // Add new element to canvas
  const addElement = (type) => {
    const newElement = {
      id: `element-${Date.now()}`,
      type,
      x: 50,
      y: 50,
      ...(type === 'text' && {
        content: 'New Text',
        fontSize: 16,
        fontWeight: '400',
        color: '#ffffff',
        align: 'center'
      }),
      ...(type === 'button' && {
        content: 'Button',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        fontSize: 14,
        fontWeight: '600',
        paddingX: 24,
        paddingY: 12,
        borderRadius: 8
      }),
      ...(type === 'shape' && {
        width: 200,
        height: 100,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        opacity: 0.5
      }),
      ...(type === 'upload-zone' && {
        width: 400,
        height: 200
      })
    }
    setElements([...elements, newElement])
    setSelectedElement(newElement.id)
    setActivePanel('properties')
  }

  // Update element property
  const updateElement = (id, updates) => {
    setElements(elements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    ))
  }

  // Delete element
  const deleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id))
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }

  // Mouse down on element - start drag
  const handleMouseDown = (e, elementId) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const element = elements.find(el => el.id === elementId)
    if (!element) return

    const clickX = ((e.clientX - rect.left) / rect.width) * 100
    const clickY = ((e.clientY - rect.top) / rect.height) * 100

    setDragging(elementId)
    setDragOffset({
      x: clickX - element.x,
      y: clickY - element.y
    })
    setSelectedElement(elementId)
    setActivePanel('properties')
    e.stopPropagation()
  }

  // Mouse move - update element position
  const handleMouseMove = (e) => {
    if (!dragging || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x
    const y = ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y

    updateElement(dragging, {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    })
  }

  // Mouse up - stop drag
  const handleMouseUp = () => {
    setDragging(null)
  }

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, dragOffset])

  const selectedEl = elements.find(el => el.id === selectedElement)

  if (initialLoad) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.bg.page
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: `2px solid ${theme.colors.border.medium}`,
          borderTopColor: theme.colors.white,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <>
      <Sidebar />
      <div style={{
        minHeight: '100vh',
        background: theme.colors.bg.page,
        color: theme.colors.text.primary,
        marginTop: '60px'
      }}>
        <div style={{
          maxWidth: '100%',
          height: 'calc(100vh - 60px)',
          display: 'flex'
        }}>
          {/* LEFT PANEL - Elements & Properties */}
          <div style={{
            width: '320px',
            background: 'rgba(255, 255, 255, 0.01)',
            borderRight: `1px solid ${theme.colors.border.light}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto'
          }}>
            {/* Panel Header */}
            <div style={{
              padding: '24px 20px',
              borderBottom: `1px solid ${theme.colors.border.light}`
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '400',
                margin: 0,
                color: theme.colors.text.primary
              }}>
                Branding Editor
              </h2>
              <p style={{
                fontSize: '12px',
                color: theme.colors.text.muted,
                margin: '6px 0 12px 0'
              }}>
                Customize your upload page
              </p>

              {/* Request Type Selector */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  color: theme.colors.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '8px',
                  fontWeight: '600'
                }}>
                  Request Type
                </label>
                <select
                  value={selectedRequestType}
                  onChange={(e) => handleRequestTypeChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: theme.colors.bg.page,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '6px',
                    color: theme.colors.text.primary,
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  {REQUEST_TYPES.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <p style={{
                  fontSize: '11px',
                  color: theme.colors.text.tertiary,
                  margin: '6px 0 0 0'
                }}>
                  Each request type can have its own design
                </p>
              </div>
            </div>

            {/* Panel Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: `1px solid ${theme.colors.border.light}`
            }}>
              <button
                onClick={() => setActivePanel('elements')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: activePanel === 'elements' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  border: 'none',
                  borderBottom: activePanel === 'elements' ? `2px solid ${theme.colors.white}` : '2px solid transparent',
                  color: activePanel === 'elements' ? theme.colors.white : theme.colors.text.secondary,
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: theme.transition.fast
                }}
              >
                Elements
              </button>
              <button
                onClick={() => setActivePanel('properties')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: activePanel === 'properties' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  border: 'none',
                  borderBottom: activePanel === 'properties' ? `2px solid ${theme.colors.white}` : '2px solid transparent',
                  color: activePanel === 'properties' ? theme.colors.white : theme.colors.text.secondary,
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: theme.transition.fast
                }}
              >
                Properties
              </button>
            </div>

            {/* Panel Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              {activePanel === 'elements' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Canvas Settings */}
                  <div>
                    <h3 style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: theme.colors.text.tertiary,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      margin: '0 0 12px 0'
                    }}>
                      Canvas
                    </h3>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        color: theme.colors.text.secondary,
                        marginBottom: '6px'
                      }}>
                        Background Color
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          style={{
                            width: '40px',
                            height: '40px',
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        />
                        <input
                          type="text"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            background: theme.colors.bg.page,
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '6px',
                            color: theme.colors.text.primary,
                            fontSize: '12px',
                            fontFamily: 'monospace'
                          }}
                        />
                      </div>
                    </div>

                    {/* Logo Upload */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        color: theme.colors.text.secondary,
                        marginBottom: '6px'
                      }}>
                        Logo
                      </label>
                      {logoUrl && (
                        <div style={{
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          textAlign: 'center'
                        }}>
                          <img src={logoUrl} alt="Logo" style={{ maxHeight: '40px', maxWidth: '100%' }} />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        style={{ display: 'none' }}
                        id="logo-upload-new"
                      />
                      <label
                        htmlFor="logo-upload-new"
                        style={{
                          display: 'block',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${theme.colors.border.medium}`,
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: theme.colors.text.secondary,
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: theme.transition.fast
                        }}
                      >
                        {logoUrl ? 'Change Logo' : 'Upload Logo'}
                      </label>
                    </div>

                    {/* Remove Branding */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '6px'
                    }}>
                      <span style={{ fontSize: '12px', color: theme.colors.text.secondary }}>
                        Remove Sway Branding
                      </span>
                      <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '40px',
                        height: '20px',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={removeBranding}
                          onChange={(e) => setRemoveBranding(e.target.checked)}
                          style={{ display: 'none' }}
                        />
                        <span style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: removeBranding ? theme.colors.white : theme.colors.border.medium,
                          borderRadius: '20px',
                          transition: theme.transition.normal
                        }}>
                          <span style={{
                            position: 'absolute',
                            height: '14px',
                            width: '14px',
                            left: removeBranding ? '23px' : '3px',
                            bottom: '3px',
                            background: removeBranding ? theme.colors.black : theme.colors.white,
                            borderRadius: '50%',
                            transition: theme.transition.normal
                          }} />
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Add Elements */}
                  <div>
                    <h3 style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: theme.colors.text.tertiary,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      margin: '0 0 12px 0'
                    }}>
                      Add Elements
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        onClick={() => addElement('text')}
                        style={{
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${theme.colors.border.medium}`,
                          borderRadius: '6px',
                          color: theme.colors.text.secondary,
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: theme.transition.fast
                        }}
                      >
                        + Text
                      </button>
                      <button
                        onClick={() => addElement('button')}
                        style={{
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${theme.colors.border.medium}`,
                          borderRadius: '6px',
                          color: theme.colors.text.secondary,
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: theme.transition.fast
                        }}
                      >
                        + Button
                      </button>
                      <button
                        onClick={() => addElement('shape')}
                        style={{
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${theme.colors.border.medium}`,
                          borderRadius: '6px',
                          color: theme.colors.text.secondary,
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: theme.transition.fast
                        }}
                      >
                        + Shape
                      </button>
                      <button
                        onClick={() => addElement('upload-zone')}
                        style={{
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${theme.colors.border.medium}`,
                          borderRadius: '6px',
                          color: theme.colors.text.secondary,
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: theme.transition.fast
                        }}
                      >
                        + Upload Zone
                      </button>
                    </div>
                  </div>

                  {/* Layers List */}
                  <div>
                    <h3 style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: theme.colors.text.tertiary,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      margin: '0 0 12px 0'
                    }}>
                      Layers ({elements.length})
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {elements.map((el, index) => (
                        <div
                          key={el.id}
                          onClick={() => {
                            setSelectedElement(el.id)
                            setActivePanel('properties')
                          }}
                          style={{
                            padding: '10px 12px',
                            background: selectedElement === el.id ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${selectedElement === el.id ? theme.colors.white : theme.colors.border.light}`,
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: theme.colors.text.secondary,
                            cursor: 'pointer',
                            transition: theme.transition.fast,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span>
                            {el.type === 'text' && `Text: ${el.content?.slice(0, 20)}...`}
                            {el.type === 'button' && `Button: ${el.content}`}
                            {el.type === 'shape' && 'Shape'}
                            {el.type === 'upload-zone' && 'Upload Zone'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteElement(el.id)
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: theme.colors.text.tertiary,
                              cursor: 'pointer',
                              fontSize: '14px',
                              padding: '0 4px'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Properties Panel
                <div>
                  {selectedEl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        margin: 0
                      }}>
                        {selectedEl.type.toUpperCase()} PROPERTIES
                      </h3>

                      {/* Position */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          color: theme.colors.text.secondary,
                          marginBottom: '8px'
                        }}>
                          Position
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <span style={{ fontSize: '10px', color: theme.colors.text.tertiary }}>X (%)</span>
                            <input
                              type="number"
                              value={Math.round(selectedEl.x)}
                              onChange={(e) => updateElement(selectedEl.id, { x: parseFloat(e.target.value) })}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                background: theme.colors.bg.page,
                                border: `1px solid ${theme.colors.border.medium}`,
                                borderRadius: '4px',
                                color: theme.colors.text.primary,
                                fontSize: '12px'
                              }}
                            />
                          </div>
                          <div>
                            <span style={{ fontSize: '10px', color: theme.colors.text.tertiary }}>Y (%)</span>
                            <input
                              type="number"
                              value={Math.round(selectedEl.y)}
                              onChange={(e) => updateElement(selectedEl.id, { y: parseFloat(e.target.value) })}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                background: theme.colors.bg.page,
                                border: `1px solid ${theme.colors.border.medium}`,
                                borderRadius: '4px',
                                color: theme.colors.text.primary,
                                fontSize: '12px'
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Text Content */}
                      {(selectedEl.type === 'text' || selectedEl.type === 'button') && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            color: theme.colors.text.secondary,
                            marginBottom: '6px'
                          }}>
                            Content
                          </label>
                          <input
                            type="text"
                            value={selectedEl.content}
                            onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              background: theme.colors.bg.page,
                              border: `1px solid ${theme.colors.border.medium}`,
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '12px'
                            }}
                          />
                        </div>
                      )}

                      {/* Font Size */}
                      {(selectedEl.type === 'text' || selectedEl.type === 'button') && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            color: theme.colors.text.secondary,
                            marginBottom: '6px'
                          }}>
                            Font Size
                          </label>
                          <input
                            type="number"
                            value={selectedEl.fontSize}
                            onChange={(e) => updateElement(selectedEl.id, { fontSize: parseInt(e.target.value) })}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              background: theme.colors.bg.page,
                              border: `1px solid ${theme.colors.border.medium}`,
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '12px'
                            }}
                          />
                        </div>
                      )}

                      {/* Text Color */}
                      {(selectedEl.type === 'text' || selectedEl.type === 'button') && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            color: theme.colors.text.secondary,
                            marginBottom: '6px'
                          }}>
                            {selectedEl.type === 'button' ? 'Text Color' : 'Color'}
                          </label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="color"
                              value={selectedEl.type === 'button' ? selectedEl.textColor : selectedEl.color}
                              onChange={(e) => updateElement(selectedEl.id, selectedEl.type === 'button' ? { textColor: e.target.value } : { color: e.target.value })}
                              style={{
                                width: '40px',
                                height: '40px',
                                border: `1px solid ${theme.colors.border.medium}`,
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            />
                            <input
                              type="text"
                              value={selectedEl.type === 'button' ? selectedEl.textColor : selectedEl.color}
                              onChange={(e) => updateElement(selectedEl.id, selectedEl.type === 'button' ? { textColor: e.target.value } : { color: e.target.value })}
                              style={{
                                flex: 1,
                                padding: '8px 10px',
                                background: theme.colors.bg.page,
                                border: `1px solid ${theme.colors.border.medium}`,
                                borderRadius: '6px',
                                color: theme.colors.text.primary,
                                fontSize: '12px',
                                fontFamily: 'monospace'
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Background Color (Button & Shape) */}
                      {(selectedEl.type === 'button' || selectedEl.type === 'shape') && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            color: theme.colors.text.secondary,
                            marginBottom: '6px'
                          }}>
                            Background Color
                          </label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="color"
                              value={selectedEl.backgroundColor}
                              onChange={(e) => updateElement(selectedEl.id, { backgroundColor: e.target.value })}
                              style={{
                                width: '40px',
                                height: '40px',
                                border: `1px solid ${theme.colors.border.medium}`,
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            />
                            <input
                              type="text"
                              value={selectedEl.backgroundColor}
                              onChange={(e) => updateElement(selectedEl.id, { backgroundColor: e.target.value })}
                              style={{
                                flex: 1,
                                padding: '8px 10px',
                                background: theme.colors.bg.page,
                                border: `1px solid ${theme.colors.border.medium}`,
                                borderRadius: '6px',
                                color: theme.colors.text.primary,
                                fontSize: '12px',
                                fontFamily: 'monospace'
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Size (Shape & Upload Zone) */}
                      {(selectedEl.type === 'shape' || selectedEl.type === 'upload-zone') && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            color: theme.colors.text.secondary,
                            marginBottom: '8px'
                          }}>
                            Size
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <span style={{ fontSize: '10px', color: theme.colors.text.tertiary }}>Width (px)</span>
                              <input
                                type="number"
                                value={selectedEl.width}
                                onChange={(e) => updateElement(selectedEl.id, { width: parseInt(e.target.value) })}
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  background: theme.colors.bg.page,
                                  border: `1px solid ${theme.colors.border.medium}`,
                                  borderRadius: '4px',
                                  color: theme.colors.text.primary,
                                  fontSize: '12px'
                                }}
                              />
                            </div>
                            <div>
                              <span style={{ fontSize: '10px', color: theme.colors.text.tertiary }}>Height (px)</span>
                              <input
                                type="number"
                                value={selectedEl.height}
                                onChange={(e) => updateElement(selectedEl.id, { height: parseInt(e.target.value) })}
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  background: theme.colors.bg.page,
                                  border: `1px solid ${theme.colors.border.medium}`,
                                  borderRadius: '4px',
                                  color: theme.colors.text.primary,
                                  fontSize: '12px'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Opacity */}
                      {selectedEl.opacity !== undefined && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            color: theme.colors.text.secondary,
                            marginBottom: '6px'
                          }}>
                            Opacity
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={selectedEl.opacity}
                            onChange={(e) => updateElement(selectedEl.id, { opacity: parseFloat(e.target.value) })}
                            style={{ width: '100%' }}
                          />
                          <div style={{ fontSize: '11px', color: theme.colors.text.tertiary, marginTop: '4px' }}>
                            {Math.round(selectedEl.opacity * 100)}%
                          </div>
                        </div>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteElement(selectedEl.id)}
                        style={{
                          padding: '10px',
                          background: 'rgba(255, 0, 0, 0.1)',
                          border: `1px solid rgba(255, 0, 0, 0.3)`,
                          borderRadius: '6px',
                          color: '#ff4444',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          marginTop: '8px'
                        }}
                      >
                        Delete Element
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: theme.colors.text.muted,
                      fontSize: '13px'
                    }}>
                      Select an element to edit its properties
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div style={{
              padding: '20px',
              borderTop: `1px solid ${theme.colors.border.light}`
            }}>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: theme.colors.white,
                  color: theme.colors.black,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Saving...' : 'Save Branding'}
              </button>
            </div>
          </div>

          {/* CENTER - Canvas Preview */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            overflow: 'auto'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '800px',
              aspectRatio: '16 / 10',
              position: 'relative'
            }}>
              {/* Canvas */}
              <div
                ref={canvasRef}
                onClick={() => setSelectedElement(null)}
                style={{
                  width: '100%',
                  height: '100%',
                  background: backgroundColor,
                  borderRadius: '12px',
                  border: `2px solid ${theme.colors.border.medium}`,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: dragging ? 'grabbing' : 'default'
                }}
              >
                {/* Logo */}
                {logoUrl && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1
                  }}>
                    <img src={logoUrl} alt="Logo" style={{ maxHeight: '60px', maxWidth: '200px' }} />
                  </div>
                )}

                {/* Render Elements */}
                {elements.map((el) => {
                  const isSelected = selectedElement === el.id

                  if (el.type === 'text') {
                    return (
                      <div
                        key={el.id}
                        onMouseDown={(e) => handleMouseDown(e, el.id)}
                        style={{
                          position: 'absolute',
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          transform: 'translate(-50%, -50%)',
                          fontSize: `${el.fontSize}px`,
                          fontWeight: el.fontWeight,
                          color: el.color,
                          textAlign: el.align,
                          cursor: dragging === el.id ? 'grabbing' : 'grab',
                          userSelect: 'none',
                          opacity: el.opacity ?? 1,
                          border: isSelected ? '2px dashed rgba(255, 255, 255, 0.5)' : 'none',
                          padding: isSelected ? '4px 8px' : '0',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {el.content}
                      </div>
                    )
                  }

                  if (el.type === 'button') {
                    return (
                      <div
                        key={el.id}
                        onMouseDown={(e) => handleMouseDown(e, el.id)}
                        style={{
                          position: 'absolute',
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          transform: 'translate(-50%, -50%)',
                          padding: `${el.paddingY}px ${el.paddingX}px`,
                          background: el.backgroundColor,
                          color: el.textColor,
                          fontSize: `${el.fontSize}px`,
                          fontWeight: el.fontWeight,
                          borderRadius: `${el.borderRadius}px`,
                          cursor: dragging === el.id ? 'grabbing' : 'grab',
                          userSelect: 'none',
                          border: isSelected ? '2px dashed rgba(255, 255, 255, 0.8)' : 'none',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {el.content}
                      </div>
                    )
                  }

                  if (el.type === 'shape') {
                    return (
                      <div
                        key={el.id}
                        onMouseDown={(e) => handleMouseDown(e, el.id)}
                        style={{
                          position: 'absolute',
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          transform: 'translate(-50%, -50%)',
                          width: `${el.width}px`,
                          height: `${el.height}px`,
                          background: el.backgroundColor,
                          borderRadius: `${el.borderRadius}px`,
                          opacity: el.opacity ?? 1,
                          cursor: dragging === el.id ? 'grabbing' : 'grab',
                          border: isSelected ? '2px dashed rgba(255, 255, 255, 0.8)' : 'none'
                        }}
                      />
                    )
                  }

                  if (el.type === 'upload-zone') {
                    return (
                      <div
                        key={el.id}
                        onMouseDown={(e) => handleMouseDown(e, el.id)}
                        style={{
                          position: 'absolute',
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          transform: 'translate(-50%, -50%)',
                          width: `${el.width}px`,
                          height: `${el.height}px`,
                          border: `2px dashed rgba(255, 255, 255, 0.3)`,
                          borderRadius: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: dragging === el.id ? 'grabbing' : 'grab',
                          userSelect: 'none',
                          ...(isSelected && { borderColor: 'rgba(255, 255, 255, 0.8)', borderStyle: 'solid' })
                        }}
                      >
                        <div style={{ fontSize: '48px', marginBottom: '8px', opacity: 0.4 }}>↑</div>
                        <div style={{ fontSize: '12px', color: '#ffffff', opacity: 0.4 }}>Drop files here</div>
                      </div>
                    )
                  }

                  return null
                })}

                {/* Sway Branding */}
                {!removeBranding && (
                  <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '11px',
                    color: '#ffffff',
                    opacity: 0.3
                  }}>
                    Powered by Sway
                  </div>
                )}
              </div>

              {/* Canvas Info */}
              <div style={{
                marginTop: '16px',
                textAlign: 'center',
                fontSize: '11px',
                color: theme.colors.text.tertiary
              }}>
                Click and drag elements to reposition • {elements.length} element{elements.length !== 1 ? 's' : ''} on canvas
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Branding
