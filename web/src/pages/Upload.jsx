import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const Upload = () => {
  const { shortCode } = useParams()
  const [requestData, setRequestData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState([])
  const [uploadSuccess, setUploadSuccess] = useState(false)

  useEffect(() => {
    fetchRequestData()
  }, [shortCode])

  const fetchRequestData = async () => {
    try {
      const response = await fetch(`/api/upload/${shortCode}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Upload link not found or expired')
        } else {
          setError('Failed to load upload page')
        }
        return
      }

      const data = await response.json()
      setRequestData(data.request)
    } catch (error) {
      console.error('Failed to fetch request data:', error)
      setError('Failed to load upload page')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles(selectedFiles)
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch(`/api/upload/${shortCode}/files`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        setUploadSuccess(true)
        setFiles([])
      } else {
        setError('Failed to upload files')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      setError('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          Loading upload page...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '400px',
          padding: '32px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            ❌
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#ffffff',
            margin: '0 0 16px 0'
          }}>
            Upload Error
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#a3a3a3',
            margin: 0
          }}>
            {error}
          </p>
        </div>
      </div>
    )
  }

  if (uploadSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '400px',
          padding: '32px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            ✅
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#ffffff',
            margin: '0 0 16px 0'
          }}>
            Upload Successful
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#a3a3a3',
            margin: 0
          }}>
            Your files have been uploaded successfully. The project owner will be notified.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '64px 32px'
      }}>

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '48px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ffffff',
            margin: '0 0 16px 0'
          }}>
            Upload Files
          </h1>
          {requestData && (
            <p style={{
              fontSize: '16px',
              color: '#a3a3a3',
              margin: 0
            }}>
              Upload files for: {requestData.title || 'Project'}
            </p>
          )}
        </div>

        {/* Upload Area */}
        <div style={{
          background: '#1a1a1a',
          border: '2px dashed #333333',
          borderRadius: '8px',
          padding: '48px 24px',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '32px',
            marginBottom: '16px'
          }}>
            📁
          </div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#ffffff',
            margin: '0 0 8px 0'
          }}>
            Select Files to Upload
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#a3a3a3',
            margin: '0 0 24px 0'
          }}>
            Choose files from your computer to upload
          </p>

          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{
              display: 'none'
            }}
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            style={{
              background: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '4px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'inline-block'
            }}
          >
            Choose Files
          </label>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#ffffff',
              margin: '0 0 16px 0'
            }}>
              Selected Files ({files.length})
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {files.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#000000',
                    border: '1px solid #333333',
                    borderRadius: '4px'
                  }}
                >
                  <div style={{
                    fontSize: '14px',
                    color: '#ffffff'
                  }}>
                    {file.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#a3a3a3'
                  }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          style={{
            background: (files.length > 0 && !uploading) ? '#ffffff' : '#666666',
            color: '#000000',
            border: 'none',
            borderRadius: '4px',
            padding: '16px 32px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: (files.length > 0 && !uploading) ? 'pointer' : 'not-allowed',
            width: '100%'
          }}
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
        </button>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          fontSize: '12px',
          color: '#666666'
        }}>
          Powered by SwayFiles
        </div>

      </div>
    </div>
  )
}

export default Upload