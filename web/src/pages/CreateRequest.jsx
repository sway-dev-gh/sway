import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import '../styles/CreateRequest.css'

const PRESETS = [
  {
    id: 'tax-documents',
    title: 'Tax Documents',
    description: 'Please upload W-2, 1099, and any other tax-related forms',
    icon: '📋'
  },
  {
    id: 'receipts',
    title: 'Expense Receipts',
    description: 'Upload receipts for business expenses and reimbursements',
    icon: '🧾'
  },
  {
    id: 'invoices',
    title: 'Invoice Submissions',
    description: 'Submit invoices for payment processing',
    icon: '💰'
  },
  {
    id: 'photos',
    title: 'Photo Collection',
    description: 'Share photos and images for this project',
    icon: '📸'
  },
  {
    id: 'documents',
    title: 'General Documents',
    description: 'Upload documents and files',
    icon: '📄'
  },
  {
    id: 'custom',
    title: 'Custom Request',
    description: 'Create your own custom file request',
    icon: '✏️'
  }
]

export default function CreateRequest() {
  const navigate = useNavigate()
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(null)

  const selectPreset = (preset) => {
    setSelectedPreset(preset.id)
    if (preset.id !== 'custom') {
      setFormData({
        title: preset.title,
        description: preset.description
      })
    } else {
      setFormData({
        title: '',
        description: ''
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const { data } = await api.post('/api/requests', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCreated(data)
    } catch (error) {
      console.error('Error creating request:', error)
      alert('Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    const link = `${window.location.origin}/r/${created.shortCode}`
    navigator.clipboard.writeText(link)
    alert('Link copied!')
  }

  if (created) {
    return (
      <div className="create-request-page">
        <div className="create-request-container">
          <div className="success-state">
            <h2>Request Created!</h2>
            <p className="subtitle">Share this link to receive files</p>

            <div className="link-display">
              <code>{window.location.origin}/r/{created.shortCode}</code>
              <button onClick={copyLink} className="btn-primary">
                Copy Link
              </button>
            </div>

            <button onClick={() => navigate('/dashboard')} className="btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="create-request-page">
      <div className="create-request-container">
        <h2>Create Request</h2>
        <p className="subtitle">What files do you need?</p>

        {!selectedPreset ? (
          <div className="presets-grid">
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                className="preset-card"
                onClick={() => selectPreset(preset)}
              >
                <div className="preset-icon">{preset.icon}</div>
                <h3>{preset.title}</h3>
                <p>{preset.description}</p>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              placeholder="Please upload your tax documents"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              placeholder="I need W2, 1099, and any other tax forms..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setSelectedPreset(null)} className="btn-secondary">
              Back to Presets
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
