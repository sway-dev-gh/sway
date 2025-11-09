import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/axios'
import theme from '../theme'

function Upload() {
  const { shortCode } = useParams()
  const [requestData, setRequestData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    customFields: {},
    password: ''
  })
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [brandingData, setBrandingData] = useState(null)
  const [validationError, setValidationError] = useState('')
  const [passwordVerified, setPasswordVerified] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)

  useEffect(() => {
    fetchRequest()
  }, [shortCode])

  const fetchRequest = async () => {
    try {
      console.log('[Upload] Fetching request with shortCode:', shortCode)
      const { data } = await api.get(`/api/r/${shortCode}`)
      console.log('[Upload] Received data:', data)
      setRequestData(data.request)
      setBrandingData(data.branding)

      // If password required, show password prompt
      if (data.request.requiresPassword) {
        setShowPasswordPrompt(true)
      } else {
        setPasswordVerified(true)
      }
    } catch (error) {
      console.error('[Upload] Failed to fetch request:', error)
      console.error('[Upload] Error response:', error.response?.data)
      console.error('[Upload] Error status:', error.response?.status)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files))
  }

  const validateRequiredFields = () => {
    // Clear previous errors
    setValidationError('')

    // Check if fieldRequirements exists in requestData
    if (!requestData.fieldRequirements) {
      return true
    }

    // Check each custom field for required status
    for (const [fieldId, isRequired] of Object.entries(requestData.fieldRequirements)) {
      if (isRequired) {
        const fieldValue = formData.customFields[fieldId]
        if (!fieldValue || fieldValue.trim() === '') {
          // Find the field label for better error message
          const field = requestData.customFields?.find(f => f.id === fieldId)
          const fieldLabel = field?.label || 'A required field'
          setValidationError(`${fieldLabel} is required`)
          return false
        }
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (files.length === 0) {
      alert('Please select at least one file')
      return
    }

    // Validate required fields
    if (!validateRequiredFields()) {
      return
    }

    setUploading(true)
    try {
      const formDataObj = new FormData()
      formDataObj.append('name', formData.name)
      formDataObj.append('email', formData.email)

      // Add password if required
      if (requestData.requiresPassword && formData.password) {
        formDataObj.append('password', formData.password)
      }

      // Add custom fields
      Object.keys(formData.customFields).forEach(key => {
        formDataObj.append(`customFields[${key}]`, formData.customFields[key])
      })

      files.forEach(file => {
        formDataObj.append('files', file)
      })

      await api.post(`/api/r/${shortCode}/upload`, formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess(true)
    } catch (error) {
      console.error('Upload error:', error)
      if (error.response?.status === 401) {
        alert('Incorrect password. Please try again.')
      } else {
        alert(error.response?.data?.error || 'Failed to upload files')
      }
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove))
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000'
      }}>
        <div style={{
          fontSize: '18px',
          color: '#a1a1a1'
        }}>
          Loading...
        </div>
      </div>
    )
  }

  if (!requestData) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#ffffff',
            marginBottom: '12px'
          }}>
            Request Not Found
          </div>
          <div style={{
            fontSize: theme.fontSize.base,
            color: '#a1a1a1'
          }}>
            This upload link is invalid or has expired.
          </div>
        </div>
      </div>
    )
  }

  // PASSWORD PROMPT
  if (showPasswordPrompt && !passwordVerified) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000',
        padding: '40px 20px'
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 600,
            color: '#ffffff',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            Password Required
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#999',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            This request is password-protected
          </p>
          <form onSubmit={(e) => {
            e.preventDefault()
            if (formData.password) {
              setPasswordVerified(true)
              setShowPasswordPrompt(false)
            }
          }}>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter password"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '16px 20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid #2a2a2a',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '16px',
                fontFamily: 'inherit',
                outline: 'none',
                marginBottom: '16px'
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '16px',
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    )
  }

  // SUCCESS PAGE
  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000',
        padding: '40px 20px'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '480px'
        }}>
          {/* Checkmark Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: '3px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            color: '#ffffff',
            margin: '0 auto 32px auto'
          }}>
            ✓
          </div>

          {/* Success Title */}
          <h1 style={{
            fontSize: theme.fontSize['2xl'],
            fontWeight: 700,
            color: '#ffffff',
            margin: '0 0 16px 0',
            letterSpacing: '-0.02em'
          }}>
            Files uploaded successfully
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: theme.fontSize.base,
            color: '#a1a1a1',
            margin: '0 0 40px 0',
            lineHeight: '1.5'
          }}>
            You can now close this tab
          </p>

          {/* Optional: Upload Again Button */}
          <button
            onClick={() => {
              setSuccess(false)
              setFiles([])
              setFormData({ name: '', email: '', customFields: {} })
            }}
            style={{
              background: 'transparent',
              border: '1px solid #333333',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '12px 24px',
              fontSize: theme.fontSize.sm,
              fontWeight: 500,
              fontFamily: 'inherit'
            }}
          >
            Upload again
          </button>
        </div>
      </div>
    )
  }

  // UPLOAD PAGE
  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      padding: '40px 20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '540px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Small Branding/Domain at Top */}
        <div style={{
          fontSize: '11px',
          color: '#666',
          marginBottom: '32px',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          fontWeight: 500
        }}>
          {brandingData?.customDomain || 'SWAY'}
        </div>

        {/* Large Title */}
        <h1 style={{
          fontSize: '42px',
          fontWeight: 600,
          color: '#ffffff',
          margin: '0 0 12px 0',
          textAlign: 'center',
          letterSpacing: '-0.04em',
          lineHeight: '1.1'
        }}>
          {requestData.title}
        </h1>

        {/* Subtitle with Instructions */}
        {requestData.description && (
          <p style={{
            fontSize: '17px',
            color: '#999',
            margin: '0 0 56px 0',
            textAlign: 'center',
            lineHeight: '1.6',
            maxWidth: '440px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            {requestData.description}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {/* Upload Dropzone */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minHeight: '220px',
              border: '1px dashed #2a2a2a',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
              padding: '48px 24px',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#444'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2a2a2a'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
            }}
            >
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                required
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: '1px',
                  height: '1px',
                  pointerEvents: 'none'
                }}
              />
              <div style={{
                fontSize: '56px',
                color: '#fff',
                marginBottom: '20px',
                lineHeight: '1',
                opacity: 0.9
              }}>
                ↑
              </div>
              <div style={{
                fontSize: '17px',
                fontWeight: 500,
                color: '#ffffff',
                marginBottom: '8px',
                letterSpacing: '-0.01em'
              }}>
                Click to browse or drag files here
              </div>
              <div style={{
                fontSize: '15px',
                color: '#666',
                fontWeight: 400
              }}>
                Multiple files supported
              </div>
            </label>
          </div>

          {/* File Preview List */}
          {files.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                fontSize: theme.fontSize.xs,
                fontWeight: 600,
                color: '#a1a1a1',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {files.map((file, idx) => (
                  <div key={idx} style={{
                    padding: '12px 16px',
                    background: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      overflow: 'hidden',
                      marginRight: '12px',
                      flex: 1
                    }}>
                      <div style={{
                        fontSize: theme.fontSize.sm,
                        fontWeight: 500,
                        color: '#ffffff',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.name}
                      </div>
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        color: '#666666'
                      }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#666666',
                        cursor: 'pointer',
                        fontSize: '20px',
                        padding: '4px 8px',
                        lineHeight: '1',
                        fontFamily: 'inherit'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Name Input - Only if required */}
          {requestData.requireName && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#a1a1a1',
                marginBottom: '8px'
              }}>
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required={requestData.requireName}
                placeholder="Enter your name"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: theme.fontSize.sm,
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#333333'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#1a1a1a'}
              />
            </div>
          )}

          {/* Optional Email Input - Only if required */}
          {requestData.requireEmail && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#a1a1a1',
                marginBottom: '8px'
              }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required={requestData.requireEmail}
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: theme.fontSize.sm,
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#333333'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#1a1a1a'}
              />
            </div>
          )}

          {/* Custom Fields */}
          {requestData.customFields && requestData.customFields.length > 0 && (
            requestData.customFields.map((field) => {
              const isRequired = requestData.fieldRequirements?.[field.id] === true
              return (
                <div key={field.id} style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#a1a1a1',
                    marginBottom: '8px'
                  }}>
                    {field.label}
                    {isRequired && (
                      <span style={{ color: theme.colors.error, marginLeft: '4px' }}>*</span>
                    )}
                  </label>
                {field.type === 'select' ? (
                  <select
                    value={formData.customFields[field.id] || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customFields: { ...prev.customFields, [field.id]: e.target.value }
                    }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#0a0a0a',
                      border: '1px solid #1a1a1a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: theme.fontSize.sm,
                      fontFamily: 'inherit',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#333333'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#1a1a1a'}
                  >
                    <option value="" style={{ background: '#0a0a0a' }}>Select {field.label}</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt} style={{ background: '#0a0a0a' }}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={formData.customFields[field.id] || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customFields: { ...prev.customFields, [field.id]: e.target.value }
                    }))}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#0a0a0a',
                      border: '1px solid #1a1a1a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: theme.fontSize.sm,
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#333333'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#1a1a1a'}
                  />
                )}
              </div>
              )
            })
          )}

          {/* Validation Error Message */}
          {validationError && (
            <div style={{
              marginBottom: '20px',
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: theme.colors.error,
              fontSize: theme.fontSize.sm,
              textAlign: 'center'
            }}>
              {validationError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || files.length === 0}
            style={{
              width: '100%',
              padding: '18px 24px',
              background: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: (uploading || files.length === 0) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: (uploading || files.length === 0) ? 0.4 : 1,
              transition: 'all 0.2s ease',
              letterSpacing: '-0.01em'
            }}
            onMouseEnter={(e) => {
              if (!uploading && files.length > 0) {
                e.currentTarget.style.background = '#f5f5f5'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff'
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>

          {/* Powered by Text at Bottom */}
          <div style={{
            fontSize: '13px',
            color: '#555',
            textAlign: 'center',
            marginTop: '40px',
            fontWeight: 400
          }}>
            Powered by Sway
          </div>
        </form>
      </div>

      {/* Branded Elements (positioned absolutely, behind main content) */}
      {brandingData && brandingData.elements && brandingData.elements.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden'
        }}>
          {brandingData.elements.map((el, index) => {
            // Text and Heading elements
            if (el.type === 'text' || el.type === 'heading') {
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    fontSize: `${el.fontSize}px`,
                    fontWeight: el.fontWeight,
                    color: el.color,
                    textAlign: el.align || 'center',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {el.content}
                </div>
              )
            }

            // Button elements (can have links!)
            if (el.type === 'button') {
              const buttonContent = (
                <div
                  style={{
                    padding: `${el.paddingY}px ${el.paddingX}px`,
                    background: el.backgroundColor,
                    color: el.textColor,
                    fontSize: `${el.fontSize}px`,
                    fontWeight: el.fontWeight,
                    borderRadius: `${el.borderRadius}px`,
                    whiteSpace: 'nowrap',
                    display: 'inline-block'
                  }}
                >
                  {el.content}
                </div>
              )

              // If button has a link, wrap it in an anchor tag and enable pointer events
              if (el.link && el.link.trim()) {
                return (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      pointerEvents: 'auto'  // Enable clicks for links
                    }}
                  >
                    <a
                      href={el.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        textDecoration: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {buttonContent}
                    </a>
                  </div>
                )
              }

              // Decorative button (no link)
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`
                  }}
                >
                  {buttonContent}
                </div>
              )
            }

            // Shape elements
            if (el.type === 'shape') {
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    background: el.backgroundColor,
                    borderRadius: `${el.borderRadius}px`,
                    opacity: el.opacity ?? 1
                  }}
                />
              )
            }

            // Image elements
            if (el.type === 'image' && el.url) {
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    borderRadius: `${el.borderRadius}px`,
                    opacity: el.opacity ?? 1,
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={el.url}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )
            }

            return null
          })}
        </div>
      )}
    </div>
  )
}

export default Upload
