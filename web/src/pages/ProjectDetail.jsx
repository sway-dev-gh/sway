import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [activeTab, setActiveTab] = useState('files') // files, reviews, collaborators, settings

  useEffect(() => {
    fetchProjectData()
  }, [id])

  const fetchProjectData = async () => {
    try {
      const token = localStorage.getItem('token')

      // Fetch project info
      const projectRes = await fetch(`/api/projects/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (projectRes.ok) {
        const projectData = await projectRes.json()
        setProject(projectData.project)
      }

      // Fetch files
      const filesRes = await fetch(`/api/projects/${id}/files`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (filesRes.ok) {
        const filesData = await filesRes.json()
        setFiles(filesData.files || [])
      }
    } catch (error) {
      console.error('Failed to fetch project data:', error)
    } finally {
      setLoading(false)
    }
  }

  const uploadFile = async (fileData) => {
    try {
      setUploading(true)
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/projects/${id}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(fileData)
      })

      if (response.ok) {
        await fetchProjectData()
        setShowUpload(false)
      }
    } catch (error) {
      console.error('Failed to upload file:', error)
    } finally {
      setUploading(false)
    }
  }

  const getStatusDisplay = (status) => {
    const statusMap = {
      'draft': { label: 'Draft', color: '#666666' },
      'under_review': { label: 'Under Review', color: '#ffffff' },
      'changes_requested': { label: 'Changes Requested', color: '#ff6b6b' },
      'approved': { label: 'Approved', color: '#51cf66' },
      'delivered': { label: 'Delivered', color: '#4c6ef5' }
    }
    return statusMap[status] || statusMap['draft']
  }

  const openFileReview = (fileId) => {
    navigate(`/projects/${id}/files/${fileId}`)
  }

  const generateShareableLink = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/projects/${id}/external-link`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        navigator.clipboard.writeText(data.link)
        // Show success message
      }
    } catch (error) {
      console.error('Failed to generate link:', error)
    }
  }

  if (loading) {
    return (
      <>
        <Sidebar />
        <div style={{
          minHeight: '100vh',
          background: '#000000',
          color: '#ffffff',
          paddingTop: '68px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '48px 32px'
          }}>
            Loading project...
          </div>
        </div>
      </>
    )
  }

  if (!project) {
    return (
      <>
        <Sidebar />
        <div style={{
          minHeight: '100vh',
          background: '#000000',
          color: '#ffffff',
          paddingTop: '68px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '48px 32px'
          }}>
            Project not found
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Sidebar />
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: '#ffffff',
        paddingTop: '68px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '48px 32px'
        }}>

          {/* Header */}
          <div style={{
            marginBottom: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <button
                onClick={() => navigate('/projects')}
                style={{
                  background: 'transparent',
                  color: '#a3a3a3',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '4px 0'
                }}
              >
                ← Back to Projects
              </button>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#ffffff',
                  margin: '0 0 8px 0'
                }}>
                  {project.title}
                </h1>
                <p style={{
                  fontSize: '16px',
                  color: '#a3a3a3',
                  margin: '0'
                }}>
                  {project.description || 'No description'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={generateShareableLink}
                  style={{
                    background: 'transparent',
                    color: '#a3a3a3',
                    border: '1px solid #333333',
                    borderRadius: '4px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Share Project
                </button>
                <button
                  onClick={() => setShowUpload(true)}
                  style={{
                    background: '#ffffff',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Upload File
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #333333',
            marginBottom: '32px'
          }}>
            {['files', 'reviews', 'collaborators', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'transparent',
                  color: activeTab === tab ? '#ffffff' : '#a3a3a3',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #ffffff' : '2px solid transparent',
                  padding: '16px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div>
              {files.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gap: '16px'
                }}>
                  {files.map(file => (
                    <div
                      key={file.id}
                      onClick={() => openFileReview(file.id)}
                      style={{
                        background: '#1a1a1a',
                        border: '1px solid #333333',
                        borderRadius: '8px',
                        padding: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#666666'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#333333'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '24px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#ffffff',
                            margin: '0 0 8px 0'
                          }}>
                            {file.name}
                          </h3>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            fontSize: '14px',
                            color: '#a3a3a3',
                            marginBottom: '12px'
                          }}>
                            <div>Type: {file.type || 'Unknown'}</div>
                            <div>Size: {file.size || '0 KB'}</div>
                            <div>Sections: {file.section_count || 0}</div>
                            <div>Reviews: {file.review_count || 0}</div>
                          </div>

                          {file.sections && file.sections.length > 0 && (
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px'
                            }}>
                              {file.sections.slice(0, 5).map((section, index) => (
                                <div
                                  key={index}
                                  style={{
                                    padding: '4px 8px',
                                    background: '#333333',
                                    color: '#ffffff',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                  }}
                                >
                                  {section.title || `Section ${index + 1}`}
                                </div>
                              ))}
                              {file.sections.length > 5 && (
                                <div style={{
                                  padding: '4px 8px',
                                  background: '#333333',
                                  color: '#a3a3a3',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}>
                                  +{file.sections.length - 5} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '8px'
                        }}>
                          <div style={{
                            padding: '6px 12px',
                            background: getStatusDisplay(file.status).color,
                            color: file.status === 'under_review' ? '#000000' : '#000000',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            textTransform: 'uppercase'
                          }}>
                            {getStatusDisplay(file.status).label}
                          </div>

                          {file.completion_percentage !== undefined && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div style={{
                                width: '80px',
                                height: '4px',
                                background: '#333333',
                                borderRadius: '2px'
                              }}>
                                <div style={{
                                  width: `${file.completion_percentage}%`,
                                  height: '100%',
                                  background: '#ffffff',
                                  borderRadius: '2px'
                                }} />
                              </div>
                              <span style={{
                                fontSize: '12px',
                                color: '#a3a3a3'
                              }}>
                                {file.completion_percentage}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '80px 40px',
                  background: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRadius: '8px'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#ffffff',
                    margin: '0 0 8px 0'
                  }}>
                    No files uploaded
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#a3a3a3',
                    margin: '0 0 24px 0'
                  }}>
                    Upload your first file to start the review process
                  </p>
                  <button
                    onClick={() => setShowUpload(true)}
                    style={{
                      background: '#ffffff',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Upload File
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#a3a3a3'
            }}>
              Review management interface coming soon
            </div>
          )}

          {/* Collaborators Tab */}
          {activeTab === 'collaborators' && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#a3a3a3'
            }}>
              Collaborator management coming soon
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#a3a3a3'
            }}>
              Project settings coming soon
            </div>
          )}

          {/* Upload Modal */}
          {showUpload && (
            <FileUploadModal
              onUpload={uploadFile}
              onCancel={() => setShowUpload(false)}
              uploading={uploading}
            />
          )}

        </div>
      </div>
    </>
  )
}

// File Upload Modal Component
const FileUploadModal = ({ onUpload, onCancel, uploading }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'document',
    content: '',
    sections: []
  })
  const [currentSection, setCurrentSection] = useState('')

  const handleAddSection = () => {
    if (!currentSection.trim()) return

    setFormData({
      ...formData,
      sections: [...formData.sections, {
        title: currentSection.trim(),
        content: '',
        order: formData.sections.length + 1,
        status: 'draft'
      }]
    })
    setCurrentSection('')
  }

  const removeSection = (index) => {
    const newSections = formData.sections.filter((_, i) => i !== index)
      .map((section, i) => ({ ...section, order: i + 1 }))

    setFormData({
      ...formData,
      sections: newSections
    })
  }

  const updateSectionContent = (index, content) => {
    const newSections = [...formData.sections]
    newSections[index] = { ...newSections[index], content }
    setFormData({
      ...formData,
      sections: newSections
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    onUpload(formData)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #333333',
        borderRadius: '8px',
        padding: '32px',
        width: '700px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#ffffff',
          margin: '0 0 24px 0'
        }}>
          Upload File for Review
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              marginBottom: '8px'
            }}>
              File Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({
                ...formData,
                name: e.target.value
              })}
              style={{
                width: '100%',
                background: '#000000',
                border: '1px solid #333333',
                borderRadius: '4px',
                padding: '12px',
                color: '#ffffff',
                fontSize: '14px'
              }}
              placeholder="Enter file name"
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              marginBottom: '8px'
            }}>
              File Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({
                ...formData,
                type: e.target.value
              })}
              style={{
                width: '100%',
                background: '#000000',
                border: '1px solid #333333',
                borderRadius: '4px',
                padding: '12px',
                color: '#ffffff',
                fontSize: '14px'
              }}
            >
              <option value="document">Document</option>
              <option value="image">Image</option>
              <option value="code">Code</option>
              <option value="design">Design</option>
              <option value="video">Video</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              marginBottom: '8px'
            }}>
              Content (optional)
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({
                ...formData,
                content: e.target.value
              })}
              style={{
                width: '100%',
                background: '#000000',
                border: '1px solid #333333',
                borderRadius: '4px',
                padding: '12px',
                color: '#ffffff',
                fontSize: '14px',
                minHeight: '80px',
                resize: 'vertical'
              }}
              placeholder="Paste content or description"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              marginBottom: '8px'
            }}>
              Review Sections
            </label>
            <p style={{
              fontSize: '12px',
              color: '#a3a3a3',
              margin: '0 0 12px 0'
            }}>
              Divide your file into sections that can be reviewed independently
            </p>

            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <input
                type="text"
                value={currentSection}
                onChange={(e) => setCurrentSection(e.target.value)}
                style={{
                  flex: 1,
                  background: '#000000',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  padding: '12px',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
                placeholder="Section title (e.g., 'Introduction', 'Chapter 1', 'Header Component')"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSection()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSection}
                disabled={!currentSection.trim()}
                style={{
                  background: currentSection.trim() ? '#ffffff' : '#666666',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: currentSection.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Add
              </button>
            </div>

            {formData.sections.length > 0 && (
              <div style={{
                border: '1px solid #333333',
                borderRadius: '4px',
                padding: '12px'
              }}>
                {formData.sections.map((section, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: index < formData.sections.length - 1 ? '16px' : 0,
                      paddingBottom: index < formData.sections.length - 1 ? '16px' : 0,
                      borderBottom: index < formData.sections.length - 1 ? '1px solid #333333' : 'none'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>
                        {section.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        style={{
                          background: 'transparent',
                          color: '#a3a3a3',
                          border: 'none',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSectionContent(index, e.target.value)}
                      style={{
                        width: '100%',
                        background: '#000000',
                        border: '1px solid #333333',
                        borderRadius: '4px',
                        padding: '8px',
                        color: '#ffffff',
                        fontSize: '12px',
                        minHeight: '60px',
                        resize: 'vertical'
                      }}
                      placeholder="Section content (optional)"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: 'transparent',
                color: '#a3a3a3',
                border: '1px solid #333333',
                borderRadius: '4px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !formData.name.trim()}
              style={{
                background: uploading || !formData.name.trim() ? '#666666' : '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: uploading || !formData.name.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectDetail