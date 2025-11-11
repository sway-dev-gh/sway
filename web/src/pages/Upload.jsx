import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/axios'
import theme from '../theme'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'
import {
  validateFileType,
  validateFileSize,
  sanitizeFileName,
  validateSVGSafety,
  sanitizeTextInput,
  sanitizeEmail,
  escapeHTML,
  validateURL
} from '../utils/security/sanitize'

function Upload() {
  const { shortCode } = useParams()
  const toast = useToast()
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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [brandingData, setBrandingData] = useState(null)
  const [validationError, setValidationError] = useState('')
  const [passwordVerified, setPasswordVerified] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)

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

  useEffect(() => {
    fetchRequest()

    // Track view count (once per session)
    const viewKey = `form_viewed_${shortCode}`
    const hasViewedThisSession = sessionStorage.getItem(viewKey)

    if (!hasViewedThisSession) {
      // Increment view count in localStorage
      const storageKey = `form_views_${shortCode}`
      const currentViews = parseInt(localStorage.getItem(storageKey) || '0', 10)
      localStorage.setItem(storageKey, (currentViews + 1).toString())

      // Mark as viewed this session
      sessionStorage.setItem(viewKey, 'true')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortCode])

  const validateFiles = async (fileList) => {
    const settings = requestData?.settings || {}
    const maxFileSize = settings.maxFileSize || 104857600 // 100MB default
    const maxFiles = settings.maxFiles || 10
    const allowedTypes = settings.allowedFileTypes || ['*']

    // Check file count
    if (fileList.length > maxFiles) {
      toast.error(`Too many files. Maximum: ${maxFiles} files`)
      return false
    }

    // Validate each file
    for (const file of fileList) {
      // Validate filename for path traversal and dangerous characters
      try {
        sanitizeFileName(file.name)
      } catch (error) {
        toast.error(`Invalid filename: ${file.name}`)
        return false
      }

      // Check file size using secure validation
      if (!validateFileSize(file, maxFileSize)) {
        const sizeMB = (maxFileSize / 1024 / 1024).toFixed(0)
        toast.error(`File too large: ${file.name}. Maximum size: ${sizeMB}MB`)
        return false
      }

      // Check file type with MIME type validation
      if (!validateFileType(file, allowedTypes)) {
        const typeNames = allowedTypes.join(', ')
        toast.error(`File type not allowed: ${file.name}. Allowed types: ${typeNames}`)
        return false
      }

      // Special check for SVG files to prevent XSS
      if (file.type === 'image/svg+xml') {
        const isSafeSVG = await validateSVGSafety(file)
        if (!isSafeSVG) {
          toast.error(`SVG file contains unsafe content: ${file.name}`)
          return false
        }
      }
    }

    return true
  }

  const handleFileChange = async (e) => {
    const fileList = Array.from(e.target.files)
    const isValid = await validateFiles(fileList)
    if (isValid) {
      setFiles(fileList)
    } else {
      e.target.value = '' // Clear the input
      setFiles([])
    }
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
      toast.error('Please select at least one file')
      return
    }

    // Validate required fields
    if (!validateRequiredFields()) {
      return
    }

    setUploading(true)
    try {
      const formDataObj = new FormData()

      // Sanitize text inputs before sending
      const sanitizedName = sanitizeTextInput(formData.name)
      formDataObj.append('name', sanitizedName)

      // Validate and sanitize email
      if (formData.email) {
        const sanitizedEmail = sanitizeEmail(formData.email)
        if (sanitizedEmail) {
          formDataObj.append('email', sanitizedEmail)
        } else {
          toast.error('Invalid email address')
          setUploading(false)
          return
        }
      }

      // Add password if required (no sanitization for passwords)
      if (requestData.requiresPassword && formData.password) {
        formDataObj.append('password', formData.password)
      }

      // Add custom fields with sanitization
      Object.keys(formData.customFields).forEach(key => {
        const sanitizedValue = sanitizeTextInput(formData.customFields[key])
        formDataObj.append(`customFields[${key}]`, sanitizedValue)
      })

      // Append files with sanitized names
      files.forEach(file => {
        try {
          const sanitizedFileName = sanitizeFileName(file.name)
          // Create new file with sanitized name
          const sanitizedFile = new File([file], sanitizedFileName, { type: file.type })
          formDataObj.append('files', sanitizedFile)
        } catch (error) {
          throw new Error(`Invalid filename: ${file.name}`)
        }
      })

      await api.post(`/api/r/${shortCode}/upload`, formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
        }
      })

      setSuccess(true)
      setUploadProgress(0)
    } catch (error) {
      console.error('Upload error:', error)
      if (error.response?.status === 401) {
        toast.error('Incorrect password. Please try again.')
      } else {
        toast.error(error.response?.data?.error || 'Failed to upload files')
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
        background: theme.colors.bg.page
      }}>
        <div style={{
          fontSize: '13px',
          color: theme.colors.text.tertiary,
          fontWeight: '400',
          letterSpacing: '-0.01em'
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
        background: theme.colors.bg.page,
        padding: '40px'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '480px'
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: '500',
            color: theme.colors.text.primary,
            marginBottom: '16px',
            letterSpacing: '-0.03em',
            lineHeight: '1.2'
          }}>
            Request Not Found
          </div>
          <div style={{
            fontSize: '14px',
            color: theme.colors.text.secondary,
            lineHeight: '1.6',
            fontWeight: '400'
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
        background: theme.colors.bg.page,
        padding: '40px 24px'
      }}>
        <div style={{
          maxWidth: '420px',
          width: '100%',
          background: theme.colors.bg.secondary,
          border: `1px solid ${theme.colors.border.light}`,
          borderRadius: '12px',
          padding: '48px'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '500',
            color: theme.colors.text.primary,
            marginBottom: '12px',
            textAlign: 'center',
            letterSpacing: '-0.02em',
            lineHeight: '1.2'
          }}>
            Password Required
          </h1>
          <p style={{
            fontSize: '14px',
            color: theme.colors.text.secondary,
            marginBottom: '40px',
            textAlign: 'center',
            lineHeight: '1.6',
            fontWeight: '400'
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
                padding: '14px 16px',
                background: theme.colors.bg.page,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: '8px',
                color: theme.colors.text.primary,
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                marginBottom: '16px',
                fontWeight: '400',
                letterSpacing: '-0.01em'
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px 20px',
                background: theme.colors.white,
                color: theme.colors.black,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '-0.01em'
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
        background: theme.colors.bg.page,
        padding: '40px 24px'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '520px',
          background: theme.colors.bg.secondary,
          border: `1px solid ${theme.colors.border.light}`,
          borderRadius: '12px',
          padding: '80px 48px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: `2px solid ${theme.colors.white}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            color: theme.colors.white,
            margin: '0 auto 32px auto',
            fontWeight: '400'
          }}>
            Success
          </div>

          <h1 style={{
            fontSize: '28px',
            fontWeight: '500',
            color: theme.colors.text.primary,
            margin: '0 0 16px 0',
            letterSpacing: '-0.02em',
            lineHeight: '1.2'
          }}>
            {requestData.branding?.successMessage || 'Thank you! Your file has been uploaded successfully.'}
          </h1>

          <p style={{
            fontSize: '14px',
            color: theme.colors.text.secondary,
            margin: '0 0 48px 0',
            lineHeight: '1.6',
            fontWeight: '400'
          }}>
            You can now close this tab
          </p>

          <button
            onClick={() => {
              setSuccess(false)
              setFiles([])
              setFormData({ name: '', email: '', customFields: {} })
            }}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: '8px',
              color: theme.colors.text.primary,
              cursor: 'pointer',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'inherit',
              letterSpacing: '-0.01em'
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
      background: theme.colors.bg.page,
      padding: '80px 24px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '640px'
      }}>
        {/* Small Branding/Domain at Top */}
        <div style={{
          fontSize: '11px',
          color: theme.colors.text.tertiary,
          marginBottom: '64px',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          fontWeight: '500'
        }}>
          {brandingData?.customDomain || 'SWAY'}
        </div>

        {/* Card Container */}
        <div style={{
          background: theme.colors.bg.secondary,
          border: `1px solid ${theme.colors.border.light}`,
          borderRadius: '12px',
          padding: '64px 48px'
        }}>
          {/* Title */}
          <h1 style={{
            fontSize: '32px',
            fontWeight: '500',
            color: theme.colors.text.primary,
            margin: '0 0 16px 0',
            textAlign: 'center',
            letterSpacing: '-0.03em',
            lineHeight: '1.2'
          }}>
            {requestData.branding?.pageTitle || requestData.title}
          </h1>

          {/* Subtitle with Instructions */}
          {requestData.description && (
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.secondary,
              margin: '0 0 64px 0',
              textAlign: 'center',
              lineHeight: '1.6',
              fontWeight: '400'
            }}>
              {requestData.description}
            </p>
          )}

        <form onSubmit={handleSubmit}>
          {/* Custom Instructions */}
          {requestData.branding?.instructions && (
            <div style={{
              fontSize: '14px',
              color: theme.colors.text.secondary,
              marginBottom: '48px',
              lineHeight: '1.6',
              textAlign: 'center',
              fontWeight: '400'
            }}>
              {requestData.branding.instructions}
            </div>
          )}

          {/* Upload Dropzone */}
          <div style={{ marginBottom: '48px' }}>
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minHeight: '240px',
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: '12px',
              background: theme.colors.bg.page,
              cursor: 'pointer',
              padding: '64px 32px',
              position: 'relative',
              transition: 'border-color 0.2s ease'
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
                fontSize: '40px',
                color: theme.colors.text.tertiary,
                marginBottom: '24px',
                lineHeight: '1',
                fontWeight: '300'
              }}>

              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: theme.colors.text.primary,
                marginBottom: '8px',
                letterSpacing: '-0.01em'
              }}>
                Click to browse or drag files here
              </div>
              <div style={{
                fontSize: '13px',
                color: theme.colors.text.tertiary,
                fontWeight: '400'
              }}>
                Multiple files supported
              </div>
            </label>
          </div>

          {/* File Preview List */}
          {files.length > 0 && (
            <div style={{ marginBottom: '48px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '500',
                color: theme.colors.text.tertiary,
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '1.2px'
              }}>
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {files.map((file, idx) => (
                  <div key={idx} style={{
                    padding: '20px 24px',
                    background: theme.colors.bg.page,
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      overflow: 'hidden',
                      marginRight: '16px',
                      flex: 1
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: theme.colors.text.primary,
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        letterSpacing: '-0.01em'
                      }}>
                        {file.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: theme.colors.text.tertiary,
                        fontWeight: '400'
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
                        color: theme.colors.text.tertiary,
                        cursor: 'pointer',
                        fontSize: '24px',
                        padding: '4px 8px',
                        lineHeight: '1',
                        fontFamily: 'inherit',
                        fontWeight: '300'
                      }}
                    >
                      Close
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Name Input - Only if required */}
          {requestData.requireName && (
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: theme.colors.text.secondary,
                marginBottom: '12px',
                letterSpacing: '0.3px'
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
                  padding: '14px 16px',
                  background: theme.colors.bg.page,
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: '8px',
                  color: theme.colors.text.primary,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  fontWeight: '400',
                  letterSpacing: '-0.01em'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.border.dark}
                onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.medium}
              />
            </div>
          )}

          {/* Optional Email Input - Only if required */}
          {requestData.requireEmail && (
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: theme.colors.text.secondary,
                marginBottom: '12px',
                letterSpacing: '0.3px'
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
                  padding: '14px 16px',
                  background: theme.colors.bg.page,
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: '8px',
                  color: theme.colors.text.primary,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  fontWeight: '400',
                  letterSpacing: '-0.01em'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.border.dark}
                onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.medium}
              />
            </div>
          )}

          {/* Custom Fields */}
          {requestData.customFields && requestData.customFields.length > 0 && (
            requestData.customFields.map((field) => {
              const isRequired = requestData.fieldRequirements?.[field.id] === true
              return (
                <div key={field.id} style={{ marginBottom: '32px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: theme.colors.text.secondary,
                    marginBottom: '12px',
                    letterSpacing: '0.3px'
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
                      padding: '14px 16px',
                      background: theme.colors.bg.page,
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '8px',
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      cursor: 'pointer',
                      fontWeight: '400',
                      letterSpacing: '-0.01em'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.border.dark}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.medium}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
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
                      padding: '14px 16px',
                      background: theme.colors.bg.page,
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '8px',
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      fontWeight: '400',
                      letterSpacing: '-0.01em'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.border.dark}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.border.medium}
                  />
                )}
              </div>
              )
            })
          )}

          {/* Validation Error Message */}
          {validationError && (
            <div style={{
              marginBottom: '32px',
              padding: '16px 20px',
              background: theme.colors.bg.page,
              border: `1px solid ${theme.colors.error}`,
              borderRadius: '8px',
              color: theme.colors.error,
              fontSize: '13px',
              textAlign: 'center',
              fontWeight: '400'
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
              padding: '16px 24px',
              background: theme.colors.white,
              color: theme.colors.black,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: (uploading || files.length === 0) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: (uploading || files.length === 0) ? 0.4 : 1,
              letterSpacing: '-0.01em',
              transition: 'opacity 0.2s ease'
            }}
          >
            {uploading ? `Uploading... ${uploadProgress}%` : 'Upload Files'}
          </button>

          {/* Upload Progress Bar */}
          {uploading && uploadProgress > 0 && (
            <div style={{
              width: '100%',
              height: '2px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '1px',
              overflow: 'hidden',
              marginTop: '16px'
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                height: '100%',
                background: theme.colors.white,
                transition: 'width 0.3s ease'
              }} />
            </div>
          )}

          {/* Powered by Text at Bottom */}
          {(requestData.branding?.showPoweredBy !== false) && (
            <div style={{
              fontSize: '11px',
              color: theme.colors.text.tertiary,
              textAlign: 'center',
              marginTop: '48px',
              fontWeight: '400',
              letterSpacing: '0.3px'
            }}>
              Powered by Sway
            </div>
          )}
        </form>
        </div>
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
                  {escapeHTML(el.content)}
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
                  {escapeHTML(el.content)}
                </div>
              )

              // If button has a link, wrap it in an anchor tag and enable pointer events
              // Validate URL to prevent javascript: and data: URLs
              if (el.link && el.link.trim() && validateURL(el.link)) {
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

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </div>
  )
}

export default Upload
