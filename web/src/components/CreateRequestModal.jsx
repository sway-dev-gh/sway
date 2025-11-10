import { useState, useEffect } from 'react'
import api from '../api/axios'
import './CreateRequestModal.css'
import { canCreateForm, getMaxActiveForms } from '../utils/planUtils'

export default function CreateRequestModal({ isOpen, onClose, onSuccess }) {
  const [requestType, setRequestType] = useState('document')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fileTypes, setFileTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentFormCount, setCurrentFormCount] = useState(0)

  // Fetch current form count when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFormCount()
    }
  }, [isOpen])

  const fetchFormCount = async () => {
    try {
      const token = localStorage.getItem('token')
      const { data } = await api.get('/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCurrentFormCount(data.requests?.length || 0)
    } catch (err) {
      console.error('Failed to fetch form count:', err)
    }
  }

  const requestTypes = [
    { id: 'document', label: 'Document Request', icon: '📄' },
    { id: 'code', label: 'Code Snippet', icon: '💻' },
    { id: 'file', label: 'File Upload', icon: '📁' },
    { id: 'form', label: 'Form Submission', icon: '📝' }
  ]

  const availableFileTypes = ['PDF', 'PNG', 'JPG', 'JPEG', 'DOCX', 'TXT', 'ZIP', 'CSV']

  const toggleFileType = (type) => {
    setFileTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Check if user can create a new form based on their plan
    const validation = canCreateForm(currentFormCount)
    if (!validation.allowed) {
      setError(validation.reason)
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const { data } = await api.post(
        '/api/requests',
        {
          title,
          description,
          requestType,
          fileTypes: fileTypes.length > 0 ? fileTypes.join(',') : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      onSuccess(data.request)
      handleClose()
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setFileTypes([])
    setRequestType('document')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Request</h2>
          <button className="modal-close" onClick={handleClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div className="form-section">
            <label>Request Type</label>
            <div className="request-type-grid">
              {requestTypes.map(type => (
                <button
                  key={type.id}
                  type="button"
                  className={`type-button ${requestType === type.id ? 'active' : ''}`}
                  onClick={() => setRequestType(type.id)}
                >
                  <span className="type-icon">{type.icon}</span>
                  <span className="type-label">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q4 Financial Documents"
              required
            />
          </div>

          <div className="form-section">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you need..."
              rows="4"
            />
          </div>

          {requestType === 'document' && (
            <div className="form-section">
              <label>Accepted File Types (optional)</label>
              <div className="file-types-grid">
                {availableFileTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`file-type-chip ${fileTypes.includes(type) ? 'active' : ''}`}
                    onClick={() => toggleFileType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
