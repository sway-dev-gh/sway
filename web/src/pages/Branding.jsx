import { useState, useEffect, useRef, useCallback } from 'react'
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

function Branding() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const canvasRef = useRef(null)
  const [dragging, setDragging] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizing, setResizing] = useState(null) // { elementId, handle: 'nw'|'ne'|'sw'|'se'|'n'|'s'|'e'|'w', startX, startY, startWidth, startHeight }

  // Request type selection
  const [selectedRequestType, setSelectedRequestType] = useState('general-upload')

  // Store designs for all request types
  const [allDesigns, setAllDesigns] = useState({})

  // Canvas settings (for current request type)
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')
  const [removeBranding, setRemoveBranding] = useState(true)
  const [logoUrl, setLogoUrl] = useState(null)

  // Elements on canvas (for current request type) - START WITH BLANK CANVAS
  const [elements, setElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)

  // Left sidebar state
  const [activeTab, setActiveTab] = useState('design') // 'design' | 'elements' | 'uploads'

  // Save status
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'unsaved' | 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const autoSaveTimerRef = useRef(null)

  // Save current design before switching request types
  const saveCurrentDesignToState = useCallback(() => {
    setAllDesigns(prev => ({
      ...prev,
      [selectedRequestType]: {
        backgroundColor,
        elements
      }
    }))
  }, [selectedRequestType, backgroundColor, elements])

  // Load design for specific request type
  const loadRequestTypeDesign = useCallback((requestType, designs = allDesigns) => {
    if (!designs[requestType]) {
      // Start with blank canvas if no design exists
      setBackgroundColor('#FFFFFF')
      setElements([])
      setSelectedElement(null)
      return
    }

    const design = designs[requestType]
    setBackgroundColor(design.backgroundColor || '#FFFFFF')
    setElements(design.elements || [])
    setSelectedElement(null)
  }, [allDesigns])

  // Auto-save function (using useCallback to avoid dependency issues)
  const handleAutoSave = useCallback(async () => {
    setSaveStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')

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

      setSaveStatus('saved')
      setSuccessMessage('Auto-saved')
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (error) {
      console.error('Error auto-saving branding settings:', error)
      setSaveStatus('error')
      setErrorMessage('Auto-save failed')
    }
  }, [allDesigns, selectedRequestType, backgroundColor, elements, removeBranding, logoUrl])

  const fetchBrandingSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found')
        setErrorMessage('Please log in to access branding settings')
        setInitialLoad(false)
        return
      }

      const { data } = await api.get('/api/branding/settings', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000 // 5 second timeout
      })

      if (data.settings) {
        setRemoveBranding(data.settings.remove_branding ?? true)
        setLogoUrl(data.settings.logo_url)

        // Load per-request-type designs
        if (data.settings.request_type_designs) {
          try {
            const designs = JSON.parse(data.settings.request_type_designs)
            setAllDesigns(designs)
            // Load the first request type's design
            loadRequestTypeDesign(selectedRequestType, designs)
          } catch (e) {
            console.error('Failed to parse request type designs:', e)
            // If parsing fails, just start with empty designs
            setAllDesigns({})
          }
        }
      }
      // Clear any previous error messages on successful load
      setErrorMessage('')
      setInitialLoad(false)
    } catch (error) {
      console.error('Error fetching branding settings:', error)

      // Handle specific error cases
      if (error.response?.status === 401) {
        setErrorMessage('Session expired. Please log in again.')
      } else if (error.response?.status === 403) {
        setErrorMessage('Pro or Business plan required for custom branding')
      } else {
        setErrorMessage(`Failed to load branding settings: ${error.response?.data?.error || error.message}`)
      }
      setInitialLoad(false)
    }
  }, [selectedRequestType, loadRequestTypeDesign])

  // When request type changes, load that type's design
  useEffect(() => {
    if (!initialLoad) {
      loadRequestTypeDesign(selectedRequestType)
    }
  }, [selectedRequestType, initialLoad, loadRequestTypeDesign])

  useEffect(() => {
    fetchBrandingSettings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mark as unsaved when changes are made AND trigger auto-save
  useEffect(() => {
    if (!initialLoad && saveStatus === 'saved') {
      setSaveStatus('unsaved')
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      // Set new auto-save timer (3 seconds after last change)
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave()
      }, 3000)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [backgroundColor, elements, removeBranding, initialLoad, saveStatus, handleAutoSave])

  // Auto-save before page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saveStatus === 'unsaved') {
        // Trigger save synchronously
        handleAutoSave()
        // Show browser warning
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveStatus, handleAutoSave])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Delete key - remove selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement && !e.target.matches('input, textarea')) {
        e.preventDefault()
        setElements(elements.filter(el => el.id !== selectedElement))
        setSelectedElement(null)
      }
      // Escape key - deselect
      if (e.key === 'Escape' && selectedElement) {
        setSelectedElement(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElement, elements])

  // Handle request type change
  const handleRequestTypeChange = (newType) => {
    saveCurrentDesignToState()
    setSelectedRequestType(newType)
  }

  const handleSave = async () => {
    setSaveStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')

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

      setSaveStatus('saved')
      setSuccessMessage('Branding saved successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error saving branding settings:', error)
      setSaveStatus('error')
      if (error.response?.status === 403) {
        setErrorMessage('Pro or Business plan required for custom branding')
      } else {
        setErrorMessage('Failed to save branding settings')
      }
    }
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setLogoUrl(event.target.result)
      }
      reader.readAsDataURL(file)
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
        content: 'Add your text',
        fontSize: 24,
        fontWeight: '400',
        color: '#000000',
        align: 'center'
      }),
      ...(type === 'heading' && {
        content: 'Add a heading',
        fontSize: 48,
        fontWeight: '700',
        color: '#000000',
        align: 'center'
      }),
      ...(type === 'button' && {
        content: 'Click here',
        link: '',
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        paddingX: 32,
        paddingY: 16,
        borderRadius: 8
      }),
      ...(type === 'shape' && {
        shape: 'rectangle',
        width: 200,
        height: 100,
        backgroundColor: '#000000',
        borderRadius: 8,
        opacity: 1
      }),
      ...(type === 'image' && {
        url: '',
        width: 200,
        height: 200,
        borderRadius: 0,
        opacity: 1
      })
    }
    setElements([...elements, newElement])
    setSelectedElement(newElement.id)
    setActiveTab('design')
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

  // Duplicate element
  const duplicateElement = (id) => {
    const element = elements.find(el => el.id === id)
    if (element) {
      const newElement = {
        ...element,
        id: `element-${Date.now()}`,
        x: element.x + 5,
        y: element.y + 5
      }
      setElements([...elements, newElement])
      setSelectedElement(newElement.id)
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
    e.stopPropagation()
  }

  // Mouse down on resize handle - start resize
  const handleResizeMouseDown = (e, elementId, handle) => {
    if (!canvasRef.current) return
    e.stopPropagation()

    const element = elements.find(el => el.id === elementId)
    if (!element) return

    setResizing({ elementId, handle, initialElement: { ...element } })
    setSelectedElement(elementId)
  }

  // Mouse move - update element position or size
  const handleMouseMove = (e) => {
    if (!canvasRef.current) return
    if (!dragging && !resizing) return

    const rect = canvasRef.current.getBoundingClientRect()

    // Handle resize
    if (resizing) {
      const { elementId, handle, initialElement } = resizing
      const element = elements.find(el => el.id === elementId)
      if (!element) return

      const canvasWidth = rect.width
      const canvasHeight = rect.height

      const currentMouseX = e.clientX - rect.left
      const currentMouseY = e.clientY - rect.top

      const initialWidth = initialElement.width || 200
      const initialHeight = initialElement.height || 200
      const centerX = (initialElement.x / 100) * canvasWidth
      const centerY = (initialElement.y / 100) * canvasHeight

      let newWidth = initialWidth
      let newHeight = initialHeight

      // Calculate new dimensions based on handle
      if (handle.includes('e')) {
        const dx = currentMouseX - centerX
        newWidth = Math.max(20, dx * 2)
      }
      if (handle.includes('w')) {
        const dx = centerX - currentMouseX
        newWidth = Math.max(20, dx * 2)
      }
      if (handle.includes('s')) {
        const dy = currentMouseY - centerY
        newHeight = Math.max(20, dy * 2)
      }
      if (handle.includes('n')) {
        const dy = centerY - currentMouseY
        newHeight = Math.max(20, dy * 2)
      }

      updateElement(elementId, {
        width: Math.round(newWidth),
        height: Math.round(newHeight)
      })
      return
    }

    // Handle drag
    if (dragging) {
      const x = ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x
      const y = ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y

      updateElement(dragging, {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y))
      })
    }
  }

  // Mouse up - stop drag or resize
  const handleMouseUp = () => {
    setDragging(null)
    setResizing(null)
  }

  useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, resizing, dragOffset])

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
        {/* Top Bar */}
        <div style={{
          height: '60px',
          borderBottom: `1px solid ${theme.colors.border.light}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: theme.colors.bg.sidebar
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '500',
              margin: 0
            }}>
              Branding Editor
            </h2>
            <div style={{
              fontSize: '11px',
              color: theme.colors.text.tertiary,
              padding: '4px 8px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px'
            }}>
              {REQUEST_TYPES.find(t => t.id === selectedRequestType)?.name}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Save Status */}
            {saveStatus === 'unsaved' && (
              <span style={{ fontSize: '12px', color: theme.colors.text.tertiary }}>
                Unsaved changes
              </span>
            )}
            {saveStatus === 'saving' && (
              <span style={{ fontSize: '12px', color: theme.colors.text.secondary }}>
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && successMessage && (
              <span style={{ fontSize: '12px', color: theme.colors.white }}>
                {successMessage}
              </span>
            )}
            {errorMessage && (
              <span style={{ fontSize: '12px', color: '#ff4444' }}>
                {errorMessage}
              </span>
            )}

            <button
              onClick={handleSave}
              disabled={loading || saveStatus === 'saving'}
              style={{
                padding: '8px 20px',
                background: theme.colors.white,
                color: theme.colors.black,
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: loading || saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                opacity: loading || saveStatus === 'saving' ? 0.6 : 1
              }}
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save Design'}
            </button>
          </div>
        </div>

        <div style={{
          maxWidth: '100%',
          height: 'calc(100vh - 120px)',
          display: 'flex'
        }}>
          {/* LEFT SIDEBAR */}
          <div style={{
            width: '280px',
            background: 'rgba(255, 255, 255, 0.01)',
            borderRight: `1px solid ${theme.colors.border.light}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto'
          }}>
            {/* Request Type Selector */}
            <div style={{
              padding: '16px',
              borderBottom: `1px solid ${theme.colors.border.light}`
            }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                color: theme.colors.text.tertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
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
                  padding: '8px 10px',
                  background: theme.colors.bg.page,
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: '6px',
                  color: theme.colors.text.primary,
                  fontSize: '12px',
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
                fontSize: '10px',
                color: theme.colors.text.tertiary,
                margin: '6px 0 0 0'
              }}>
                Each type can have unique branding
              </p>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: `1px solid ${theme.colors.border.light}`
            }}>
              {[
                { id: 'design', label: 'Design' },
                { id: 'elements', label: 'Elements' },
                { id: 'uploads', label: 'Uploads' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? `2px solid ${theme.colors.white}` : '2px solid transparent',
                    color: activeTab === tab.id ? theme.colors.white : theme.colors.text.secondary,
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: theme.transition.fast,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              {activeTab === 'design' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Selected Element Properties */}
                  {selectedEl ? (
                    <>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: theme.colors.text.primary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        paddingBottom: '8px',
                        borderBottom: `1px solid ${theme.colors.border.light}`
                      }}>
                        {selectedEl.type.toUpperCase()} PROPERTIES
                      </div>

                      {/* Content (for text, heading, button) */}
                      {(selectedEl.type === 'text' || selectedEl.type === 'heading' || selectedEl.type === 'button') && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '11px',
                            color: theme.colors.text.secondary,
                            marginBottom: '6px',
                            fontWeight: '500'
                          }}>
                            Text Content
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

                      {/* Link (for buttons) */}
                      {selectedEl.type === 'button' && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '11px',
                            color: theme.colors.text.secondary,
                            marginBottom: '6px',
                            fontWeight: '500'
                          }}>
                            Button Link (optional)
                          </label>
                          <input
                            type="text"
                            value={selectedEl.link || ''}
                            onChange={(e) => updateElement(selectedEl.id, { link: e.target.value })}
                            placeholder="https://example.com"
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
                          <p style={{
                            fontSize: '10px',
                            color: theme.colors.text.tertiary,
                            margin: '4px 0 0 0'
                          }}>
                            Leave empty for decorative button
                          </p>
                        </div>
                      )}

                      {/* Image URL */}
                      {selectedEl.type === 'image' && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '11px',
                            color: theme.colors.text.secondary,
                            marginBottom: '6px',
                            fontWeight: '500'
                          }}>
                            Image URL
                          </label>
                          <input
                            type="text"
                            value={selectedEl.url || ''}
                            onChange={(e) => updateElement(selectedEl.id, { url: e.target.value })}
                            placeholder="https://example.com/image.jpg"
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
                      {(selectedEl.type === 'text' || selectedEl.type === 'heading' || selectedEl.type === 'button') && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '11px',
                            color: theme.colors.text.secondary,
                            marginBottom: '6px',
                            fontWeight: '500'
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
                      {(selectedEl.type === 'text' || selectedEl.type === 'heading' || selectedEl.type === 'button') && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '11px',
                            color: theme.colors.text.secondary,
                            marginBottom: '6px',
                            fontWeight: '500'
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
                                fontSize: '11px',
                                fontFamily: 'monospace'
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Background Color */}
                      {(selectedEl.type === 'button' || selectedEl.type === 'shape') && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '11px',
                            color: theme.colors.text.secondary,
                            marginBottom: '6px',
                            fontWeight: '500'
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
                                fontSize: '11px',
                                fontFamily: 'monospace'
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Size */}
                      {(selectedEl.type === 'shape' || selectedEl.type === 'image') && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '11px',
                            color: theme.colors.text.secondary,
                            marginBottom: '8px',
                            fontWeight: '500'
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

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', borderTop: `1px solid ${theme.colors.border.light}` }}>
                        <button
                          onClick={() => duplicateElement(selectedEl.id)}
                          style={{
                            padding: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '6px',
                            color: theme.colors.text.secondary,
                            fontSize: '11px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Duplicate Element
                        </button>
                        <button
                          onClick={() => deleteElement(selectedEl.id)}
                          style={{
                            padding: '8px',
                            background: 'rgba(255, 0, 0, 0.1)',
                            border: `1px solid rgba(255, 0, 0, 0.3)`,
                            borderRadius: '6px',
                            color: '#ff4444',
                            fontSize: '11px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Delete Element
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Page Background */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: theme.colors.text.secondary,
                          marginBottom: '6px',
                          fontWeight: '500'
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
                              fontSize: '11px',
                              fontFamily: 'monospace'
                            }}
                          />
                        </div>
                      </div>

                      {/* Logo */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '11px',
                          color: theme.colors.text.secondary,
                          marginBottom: '6px',
                          fontWeight: '500'
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
                            <img src={logoUrl} alt="Logo" style={{ maxHeight: '50px', maxWidth: '100%' }} />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          style={{ display: 'none' }}
                          id="logo-upload"
                        />
                        <label
                          htmlFor="logo-upload"
                          style={{
                            display: 'block',
                            padding: '8px 12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${theme.colors.border.medium}`,
                            borderRadius: '6px',
                            fontSize: '11px',
                            color: theme.colors.text.secondary,
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: theme.transition.fast,
                            fontWeight: '500'
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
                        <span style={{ fontSize: '11px', color: theme.colors.text.secondary, fontWeight: '500' }}>
                          Remove "Powered by Sway"
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

                      <div style={{
                        fontSize: '10px',
                        color: theme.colors.text.tertiary,
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '6px',
                        marginTop: '8px'
                      }}>
                        Click an element on the canvas to edit its properties, or add new elements from the Elements tab.
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'elements' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    fontSize: '10px',
                    color: theme.colors.text.tertiary,
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '6px'
                  }}>
                    Click to add elements to your canvas
                  </div>

                  <button
                    onClick={() => addElement('heading')}
                    style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '6px',
                      color: theme.colors.text.primary,
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: '500',
                      transition: theme.transition.fast
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  >
                    + Add Heading
                  </button>

                  <button
                    onClick={() => addElement('text')}
                    style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '6px',
                      color: theme.colors.text.primary,
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: '500',
                      transition: theme.transition.fast
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  >
                    + Add Text
                  </button>

                  <button
                    onClick={() => addElement('button')}
                    style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '6px',
                      color: theme.colors.text.primary,
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: '500',
                      transition: theme.transition.fast
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  >
                    + Add Button
                  </button>

                  <button
                    onClick={() => addElement('shape')}
                    style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '6px',
                      color: theme.colors.text.primary,
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: '500',
                      transition: theme.transition.fast
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  >
                    + Add Shape
                  </button>

                  <button
                    onClick={() => addElement('image')}
                    style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '6px',
                      color: theme.colors.text.primary,
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: '500',
                      transition: theme.transition.fast
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  >
                    + Add Image
                  </button>
                </div>
              )}

              {activeTab === 'uploads' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    fontSize: '10px',
                    color: theme.colors.text.tertiary,
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '6px'
                  }}>
                    Note: The actual file upload form appears automatically on your branded page. You're only designing the decorative background and text elements here.
                  </div>

                  {/* Layers List */}
                  <div>
                    <h3 style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: theme.colors.text.tertiary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      margin: '0 0 10px 0'
                    }}>
                      Layers ({elements.length})
                    </h3>

                    {elements.length === 0 ? (
                      <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: theme.colors.text.muted,
                        fontSize: '11px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '6px'
                      }}>
                        No elements yet. Add elements from the Elements tab.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {elements.map((el) => (
                          <div
                            key={el.id}
                            onClick={() => {
                              setSelectedElement(el.id)
                              setActiveTab('design')
                            }}
                            style={{
                              padding: '10px 12px',
                              background: selectedElement === el.id ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                              border: `1px solid ${selectedElement === el.id ? theme.colors.white : theme.colors.border.light}`,
                              borderRadius: '6px',
                              fontSize: '11px',
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
                              {el.type === 'heading' && `Heading: ${el.content?.slice(0, 20)}...`}
                              {el.type === 'button' && `Button: ${el.content}`}
                              {el.type === 'shape' && 'Shape'}
                              {el.type === 'image' && 'Image'}
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
                                fontSize: '16px',
                                padding: '0 4px',
                                lineHeight: 1
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CENTER - Canvas */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            overflow: 'auto',
            background: 'rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '900px',
              aspectRatio: '16 / 10',
              position: 'relative'
            }}>
              {/* Canvas */}
              <div
                ref={canvasRef}
                onClick={(e) => {
                  // Only deselect if clicking directly on canvas background (not on elements)
                  if (e.target === canvasRef.current) {
                    setSelectedElement(null)
                  }
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  background: backgroundColor,
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
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
                    zIndex: 10,
                    pointerEvents: 'none'
                  }}>
                    <img src={logoUrl} alt="Logo" style={{ maxHeight: '60px', maxWidth: '200px' }} />
                  </div>
                )}

                {/* Placeholder hint when empty */}
                {elements.length === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: backgroundColor === '#FFFFFF' ? '#cccccc' : 'rgba(255, 255, 255, 0.3)',
                    pointerEvents: 'none'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>+</div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>Start designing</div>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>Add elements from the sidebar</div>
                  </div>
                )}

                {/* Render Elements */}
                {elements.map((el) => {
                  const isSelected = selectedElement === el.id

                  if (el.type === 'text' || el.type === 'heading') {
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
                          border: isSelected ? '2px dashed rgba(0, 123, 255, 0.6)' : 'none',
                          padding: isSelected ? '8px 12px' : '0',
                          background: isSelected ? 'rgba(0, 123, 255, 0.1)' : 'none',
                          borderRadius: '4px',
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
                          border: isSelected ? '3px solid rgba(0, 123, 255, 0.8)' : 'none',
                          outline: isSelected ? '2px solid rgba(0, 123, 255, 0.3)' : 'none',
                          outlineOffset: '2px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {el.content}
                      </div>
                    )
                  }

                  if (el.type === 'shape') {
                    return (
                      <div key={el.id} style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%, -50%)' }}>
                        <div
                          onMouseDown={(e) => handleMouseDown(e, el.id)}
                          style={{
                            width: `${el.width}px`,
                            height: `${el.height}px`,
                            background: el.backgroundColor,
                            borderRadius: `${el.borderRadius}px`,
                            opacity: el.opacity ?? 1,
                            cursor: dragging === el.id ? 'grabbing' : 'grab',
                            border: isSelected ? '3px solid rgba(0, 123, 255, 0.8)' : 'none',
                            outline: isSelected ? '2px solid rgba(0, 123, 255, 0.3)' : 'none',
                            outlineOffset: '2px',
                            position: 'relative'
                          }}
                        >
                          {isSelected && (
                            <>
                              {/* Resize handles */}
                              {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(handle => (
                                <div
                                  key={handle}
                                  onMouseDown={(e) => handleResizeMouseDown(e, el.id, handle)}
                                  style={{
                                    position: 'absolute',
                                    width: '8px',
                                    height: '8px',
                                    background: 'white',
                                    border: '2px solid rgba(0, 123, 255, 0.8)',
                                    borderRadius: '50%',
                                    cursor: `${handle}-resize`,
                                    ...(handle === 'nw' && { top: '-6px', left: '-6px' }),
                                    ...(handle === 'n' && { top: '-6px', left: '50%', transform: 'translateX(-50%)' }),
                                    ...(handle === 'ne' && { top: '-6px', right: '-6px' }),
                                    ...(handle === 'e' && { top: '50%', right: '-6px', transform: 'translateY(-50%)' }),
                                    ...(handle === 'se' && { bottom: '-6px', right: '-6px' }),
                                    ...(handle === 's' && { bottom: '-6px', left: '50%', transform: 'translateX(-50%)' }),
                                    ...(handle === 'sw' && { bottom: '-6px', left: '-6px' }),
                                    ...(handle === 'w' && { top: '50%', left: '-6px', transform: 'translateY(-50%)' })
                                  }}
                                />
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  }

                  if (el.type === 'image') {
                    return (
                      <div key={el.id} style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%, -50%)' }}>
                        <div
                          onMouseDown={(e) => handleMouseDown(e, el.id)}
                          style={{
                            width: `${el.width}px`,
                            height: `${el.height}px`,
                            borderRadius: `${el.borderRadius}px`,
                            opacity: el.opacity ?? 1,
                            cursor: dragging === el.id ? 'grabbing' : 'grab',
                            border: isSelected ? '3px solid rgba(0, 123, 255, 0.8)' : 'none',
                            outline: isSelected ? '2px solid rgba(0, 123, 255, 0.3)' : 'none',
                            outlineOffset: '2px',
                            overflow: 'hidden',
                            background: el.url ? 'none' : 'rgba(200, 200, 200, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                          }}
                        >
                          {el.url ? (
                            <img src={el.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '11px', color: '#999', userSelect: 'none' }}>Image</span>
                          )}
                          {isSelected && (
                            <>
                              {/* Resize handles */}
                              {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(handle => (
                                <div
                                  key={handle}
                                  onMouseDown={(e) => handleResizeMouseDown(e, el.id, handle)}
                                  style={{
                                    position: 'absolute',
                                    width: '8px',
                                    height: '8px',
                                    background: 'white',
                                    border: '2px solid rgba(0, 123, 255, 0.8)',
                                    borderRadius: '50%',
                                    cursor: `${handle}-resize`,
                                    zIndex: 10,
                                    ...(handle === 'nw' && { top: '-6px', left: '-6px' }),
                                    ...(handle === 'n' && { top: '-6px', left: '50%', transform: 'translateX(-50%)' }),
                                    ...(handle === 'ne' && { top: '-6px', right: '-6px' }),
                                    ...(handle === 'e' && { top: '50%', right: '-6px', transform: 'translateY(-50%)' }),
                                    ...(handle === 'se' && { bottom: '-6px', right: '-6px' }),
                                    ...(handle === 's' && { bottom: '-6px', left: '50%', transform: 'translateX(-50%)' }),
                                    ...(handle === 'sw' && { bottom: '-6px', left: '-6px' }),
                                    ...(handle === 'w' && { top: '50%', left: '-6px', transform: 'translateY(-50%)' })
                                  }}
                                />
                              ))}
                            </>
                          )}
                        </div>
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
                    color: backgroundColor === '#FFFFFF' ? '#999999' : 'rgba(255, 255, 255, 0.4)',
                    pointerEvents: 'none'
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
                {selectedElement ? (
                  <>Selected: {elements.find(e => e.id === selectedElement)?.type} • Click and drag to move</>
                ) : (
                  <>Click and drag elements to reposition • {elements.length} element{elements.length !== 1 ? 's' : ''} on canvas</>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Branding
