import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import useReviewStore from '../store/reviewStore'
import toast from 'react-hot-toast'
import { standardStyles, getFilterButtonStyle } from '../components/StandardStyles'

function Uploads() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const {
    projects,
    reviews,
    isLoading,
    error,
    fetchProjects,
    fetchProjectFiles
  } = useReviewStore()

  // Computed data
  const [projectFiles, setProjectFiles] = useState([])
  const [fileStats, setFileStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    recentFiles: 0
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    loadProjectFiles()
  }, [navigate])

  const loadProjectFiles = async () => {
    try {
      setLoading(true)

      await fetchProjects()

      // Gather all files across projects (mock for now since we need file endpoint)
      const allFiles = []
      let totalSize = 0

      for (const project of projects) {
        try {
          // Mock file data for each project (replace with actual API call)
          const mockFiles = [
            {
              id: `${project.id}_file_1`,
              filename: `${project.title}_design_v1.pdf`,
              size: Math.floor(Math.random() * 5000000) + 100000, // Random size
              uploadedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
              uploadedBy: 'Team Member',
              uploadedByEmail: 'member@company.com',
              project: project,
              fileType: 'pdf',
              section: 'Design Review'
            },
            {
              id: `${project.id}_file_2`,
              filename: `${project.title}_feedback.docx`,
              size: Math.floor(Math.random() * 2000000) + 50000,
              uploadedAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
              uploadedBy: 'Reviewer',
              uploadedByEmail: 'reviewer@company.com',
              project: project,
              fileType: 'docx',
              section: 'Content Review'
            }
          ]

          allFiles.push(...mockFiles)
          totalSize += mockFiles.reduce((sum, file) => sum + file.size, 0)
        } catch (error) {
          console.error(`Failed to fetch files for project ${project.id}:`, error)
        }
      }

      // Sort files
      allFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))

      // Calculate stats
      const recentFiles = allFiles.filter(file => {
        const uploadDate = new Date(file.uploadedAt)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return uploadDate > sevenDaysAgo
      }).length

      setProjectFiles(allFiles)
      setFileStats({
        totalFiles: allFiles.length,
        totalSize,
        recentFiles
      })

    } catch (error) {
      console.error('Failed to load project files:', error)
      toast.error('Failed to load project files')
      setProjectFiles([])
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (fileId, filename) => {
    try {
      // Mock download for now
      toast.success(`Downloading ${filename}...`)

      // In real implementation, this would be:
      // const token = localStorage.getItem('token')
      // const response = await fetch(`/api/files/${fileId}`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // })
      // Handle download...

    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download file')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return '1 day ago'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return formatDate(dateString)
  }

  const getFileTypeIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf': return '📄'
      case 'doc':
      case 'docx': return '📝'
      case 'xls':
      case 'xlsx': return '📊'
      case 'ppt':
      case 'pptx': return '📋'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️'
      case 'mp4':
      case 'mov':
      case 'avi': return '🎥'
      case 'zip':
      case 'rar': return '📦'
      default: return '📁'
    }
  }

  // Filter and sort files
  const filteredFiles = projectFiles
    .filter(file => {
      if (searchQuery && !file.filename.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !file.project.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (filterStatus !== 'all') {
        if (filterStatus === 'recent') {
          const uploadDate = new Date(file.uploadedAt)
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return uploadDate > sevenDaysAgo
        }
        if (filterStatus === 'large') {
          return file.size > 1024 * 1024 // Files larger than 1MB
        }
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.uploadedAt) - new Date(a.uploadedAt)
        case 'oldest':
          return new Date(a.uploadedAt) - new Date(b.uploadedAt)
        case 'largest':
          return b.size - a.size
        case 'smallest':
          return a.size - b.size
        case 'name':
          return a.filename.localeCompare(b.filename)
        default:
          return 0
      }
    })

  if (loading || isLoading) {
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
        paddingTop: '54px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '80px 32px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '48px' }}>
            <h1 style={standardStyles.pageHeader}>
              Project Files
            </h1>
            <p style={standardStyles.pageDescription}>
              All files uploaded across your review projects
            </p>
          </div>

          {/* File Statistics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}>
            <div style={{
              padding: '28px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              transition: 'all 0.2s ease'
            }}>
              <div style={standardStyles.statsLabel}>Total Files</div>
              <div style={standardStyles.statsNumber}>{fileStats.totalFiles}</div>
              <div style={standardStyles.statsDescription}>Across all projects</div>
            </div>

            <div style={{
              padding: '28px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              transition: 'all 0.2s ease'
            }}>
              <div style={standardStyles.statsLabel}>Storage Used</div>
              <div style={standardStyles.statsNumber}>{formatFileSize(fileStats.totalSize)}</div>
              <div style={standardStyles.statsDescription}>Total file storage</div>
            </div>

            <div style={{
              padding: '28px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: `1px solid #10b981`,
              borderRadius: theme.radius.lg,
              transition: 'all 0.2s ease'
            }}>
              <div style={standardStyles.statsLabel}>Recent Files</div>
              <div style={{...standardStyles.statsNumber, color: '#10b981'}}>{fileStats.recentFiles}</div>
              <div style={standardStyles.statsDescription}>Uploaded this week</div>
            </div>

            <div style={{
              padding: '28px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              transition: 'all 0.2s ease'
            }}>
              <div style={standardStyles.statsLabel}>Active Projects</div>
              <div style={standardStyles.statsNumber}>{projects.filter(p => p.status === 'active').length}</div>
              <div style={standardStyles.statsDescription}>With file uploads</div>
            </div>
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search files or projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: '6px',
                  color: theme.colors.text.primary,
                  fontSize: '14px',
                  width: '250px'
                }}
              />

              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary,
                  fontWeight: '500'
                }}>
                  Filter:
                </span>
                {['all', 'recent', 'large'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setFilterStatus(filter)}
                    style={getFilterButtonStyle(filterStatus === filter)}
                  >
                    {filter === 'all' ? 'All' : filter === 'recent' ? 'Recent' : 'Large Files'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                fontWeight: '500'
              }}>
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '6px 12px',
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: '6px',
                  color: theme.colors.text.primary,
                  fontSize: '14px'
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="largest">Largest First</option>
                <option value="smallest">Smallest First</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>

          {/* Files Table */}
          {filteredFiles.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '12px',
              background: theme.colors.bg.secondary
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                {projectFiles.length === 0 ? 'No files yet' : 'No files match your search'}
              </h3>
              <p style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                marginBottom: '24px'
              }}>
                {projectFiles.length === 0
                  ? 'Files uploaded to review projects will appear here'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {projectFiles.length === 0 && (
                <Link
                  to="/projects"
                  style={{
                    padding: '12px 24px',
                    background: theme.colors.text.primary,
                    color: theme.colors.bg.page,
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  Create Project
                </Link>
              )}
            </div>
          ) : (
            <div style={{
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '12px',
              background: theme.colors.bg.secondary,
              overflow: 'hidden'
            }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr auto',
                gap: '24px',
                padding: '20px 24px',
                background: theme.colors.bg.page,
                borderBottom: `1px solid ${theme.colors.border.light}`,
                fontSize: '12px',
                fontWeight: '600',
                color: theme.colors.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                alignItems: 'center'
              }}>
                <div>File</div>
                <div>Project</div>
                <div>Uploaded By</div>
                <div>Size</div>
                <div>Date</div>
                <div>Actions</div>
              </div>

              {/* Table Rows */}
              {filteredFiles.map((file, index) => (
                <div
                  key={file.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr auto',
                    gap: '24px',
                    padding: '20px 24px',
                    borderBottom: index < filteredFiles.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* File Name */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontSize: '16px' }}>
                        {getFileTypeIcon(file.fileType)}
                      </span>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: theme.colors.text.primary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.filename}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary
                    }}>
                      {file.section}
                    </div>
                  </div>

                  {/* Project */}
                  <div style={{ minWidth: 0 }}>
                    <Link
                      to={`/projects/${file.project.id}`}
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: theme.colors.text.primary,
                        textDecoration: 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block'
                      }}
                    >
                      {file.project.title}
                    </Link>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary
                    }}>
                      {file.project.status}
                    </div>
                  </div>

                  {/* Uploaded By */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: theme.colors.text.primary,
                      marginBottom: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {file.uploadedBy}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {file.uploadedByEmail}
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <div style={{
                      fontSize: '13px',
                      color: theme.colors.text.primary
                    }}>
                      {formatFileSize(file.size)}
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <div style={{
                      fontSize: '13px',
                      color: theme.colors.text.primary,
                      marginBottom: '2px'
                    }}>
                      {getTimeAgo(file.uploadedAt)}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: theme.colors.text.secondary
                    }}>
                      {formatDate(file.uploadedAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <button
                      onClick={() => downloadFile(file.id, file.filename)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: 'transparent',
                        border: `1px solid ${theme.colors.border.light}`,
                        borderRadius: '4px',
                        color: theme.colors.text.primary,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Uploads