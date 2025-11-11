# Zustand Store Usage Examples

Practical examples showing how to use the Sway Zustand stores in real-world scenarios.

## Authentication Flow

### Login Page

```javascript
import { useAuth } from '@/store'
import { useNavigate } from 'react-router-dom'
import { useUI } from '@/store'

function LoginPage() {
  const { login, error, isLoading } = useAuth()
  const { success, error: showError } = useUI()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      await login(formData.email, formData.password)
      success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      showError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

### Protected Route

```javascript
import { useAuth } from '@/store'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuth(state => state.isAuthenticated())

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
```

### Profile Settings

```javascript
import { useAuth } from '@/store'
import { useUI } from '@/store'

function ProfileSettings() {
  const { user, updateUser, changePassword } = useAuth()
  const { success, error } = useUI()

  const handlePasswordChange = async (currentPassword, newPassword) => {
    try {
      await changePassword(currentPassword, newPassword)
      success('Password changed successfully!')
    } catch (err) {
      error(err.message)
    }
  }

  return (
    <div>
      <h1>Profile Settings</h1>
      <p>Email: {user.email}</p>
      <p>Plan: {user.plan}</p>
      {/* Password change form */}
    </div>
  )
}
```

---

## Form Builder

### Canvas Editor

```javascript
import { useBuilder } from '@/store'
import { useUI } from '@/store'

function FormBuilderCanvas() {
  const {
    canvasElements,
    selectedElement,
    addElement,
    updateElement,
    selectElement,
    undo,
    redo,
    canUndo,
    canRedo,
    zoom,
    setZoom
  } = useBuilder()

  const { success } = useUI()

  // Add element from component library
  const handleDrop = (componentType, x, y) => {
    const newElement = {
      id: generateId(),
      type: componentType,
      x,
      y,
      width: 400,
      height: 48,
      properties: getDefaultProperties(componentType)
    }
    addElement(newElement)
    selectElement(newElement)
  }

  // Update element position on drag
  const handleElementDrag = (elementId, newX, newY) => {
    updateElement(elementId, { x: newX, y: newY })
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo: Cmd/Ctrl + Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        undo()
      }

      // Redo: Cmd/Ctrl + Shift + Z
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <button onClick={undo} disabled={!canUndo()}>
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo()}>
          Redo
        </button>
        <button onClick={() => setZoom(zoom + 0.1)}>Zoom In</button>
        <button onClick={() => setZoom(zoom - 0.1)}>Zoom Out</button>
      </div>

      {/* Canvas */}
      <div
        className="canvas"
        style={{ transform: `scale(${zoom})` }}
        onDrop={(e) => handleDrop(e.dataTransfer.getData('componentType'), e.clientX, e.clientY)}
      >
        {canvasElements.map(element => (
          <CanvasElement
            key={element.id}
            element={element}
            isSelected={selectedElement?.id === element.id}
            onSelect={() => selectElement(element)}
            onDrag={(x, y) => handleElementDrag(element.id, x, y)}
          />
        ))}
      </div>
    </div>
  )
}
```

### Properties Panel

```javascript
import { useBuilder } from '@/store'

function PropertiesPanel() {
  const { selectedElement, updateElement } = useBuilder()

  if (!selectedElement) {
    return <div>Select an element to edit properties</div>
  }

  const handlePropertyChange = (key, value) => {
    updateElement(selectedElement.id, {
      properties: {
        ...selectedElement.properties,
        [key]: value
      }
    })
  }

  return (
    <div className="properties-panel">
      <h3>Properties</h3>

      {selectedElement.type === 'heading' && (
        <>
          <label>
            Text:
            <input
              value={selectedElement.properties.content}
              onChange={(e) => handlePropertyChange('content', e.target.value)}
            />
          </label>
          <label>
            Font Size:
            <input
              type="number"
              value={parseInt(selectedElement.properties.fontSize)}
              onChange={(e) => handlePropertyChange('fontSize', `${e.target.value}px`)}
            />
          </label>
        </>
      )}
    </div>
  )
}
```

### Template Loading

```javascript
import { useBuilder } from '@/store'
import { useUI } from '@/store'

function TemplateSelector() {
  const { loadTemplate } = useBuilder()
  const { openModal, closeModal } = useUI()

  const handleUseTemplate = (template) => {
    loadTemplate(template.elements)
    closeModal('template')
  }

  return (
    <div className="template-grid">
      {TEMPLATES.map(template => (
        <div key={template.id} onClick={() => handleUseTemplate(template)}>
          <h3>{template.name}</h3>
          <p>{template.description}</p>
        </div>
      ))}
    </div>
  )
}
```

### Publishing Form

```javascript
import { useBuilder } from '@/store'
import { useRequest } from '@/store'
import { useUI } from '@/store'
import { useNavigate } from 'react-router-dom'

function PublishButton() {
  const { formTitle, canvasElements, branding, settings } = useBuilder()
  const { createRequest } = useRequest()
  const { success, error, setLoading } = useUI()
  const navigate = useNavigate()

  const handlePublish = async () => {
    // Validation
    if (!formTitle.trim()) {
      error('Please add a form title')
      return
    }

    if (canvasElements.length === 0) {
      error('Please add at least one element')
      return
    }

    setLoading('publish', true)

    try {
      const request = await createRequest({
        title: formTitle,
        elements: canvasElements,
        branding,
        settings,
        status: 'live'
      })

      success('Form published successfully!')
      navigate(`/r/${request.shortCode}`)
    } catch (err) {
      error(err.message)
    } finally {
      setLoading('publish', false)
    }
  }

  return (
    <button onClick={handlePublish}>
      Publish Form
    </button>
  )
}
```

---

## File Upload

### Upload Page

```javascript
import { useUpload } from '@/store'
import { useUI } from '@/store'
import { useParams } from 'react-router-dom'

function UploadPage() {
  const { shortCode } = useParams()
  const {
    selectedFiles,
    addFiles,
    removeFile,
    validateFiles,
    uploadFile,
    uploadProgress,
    isUploading
  } = useUpload()
  const { success, error } = useUI()

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)

    // Validate files
    const validation = validateFiles(files, {
      maxFileSize: 104857600, // 100MB
      maxFiles: 10,
      allowedFileTypes: ['*']
    })

    if (!validation.valid) {
      validation.errors.forEach(err => error(err.message))
      return
    }

    addFiles(files)
  }

  const handleUpload = async (e) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append('name', 'John Doe')
    formData.append('email', 'john@example.com')

    selectedFiles.forEach(file => {
      formData.append('files', file)
    })

    try {
      await uploadFile(shortCode, formData)
      success('Files uploaded successfully!')
    } catch (err) {
      error(err.message)
    }
  }

  return (
    <form onSubmit={handleUpload}>
      <input
        type="file"
        multiple
        onChange={handleFileSelect}
      />

      {/* File list */}
      <div>
        {selectedFiles.map((file, idx) => (
          <div key={idx}>
            <span>{file.name}</span>
            <span>{formatFileSize(file.size)}</span>
            <button onClick={() => removeFile(idx)}>Remove</button>
          </div>
        ))}
      </div>

      {/* Upload button */}
      <button type="submit" disabled={isUploading || selectedFiles.length === 0}>
        {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload'}
      </button>

      {/* Progress bar */}
      {isUploading && (
        <div className="progress-bar">
          <div style={{ width: `${uploadProgress}%` }} />
        </div>
      )}
    </form>
  )
}
```

---

## Request Management

### Requests List

```javascript
import { useRequest } from '@/store'
import { useUI } from '@/store'

function RequestsList() {
  const {
    requests,
    isLoading,
    fetchRequests,
    deleteRequest,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    getFilteredRequests
  } = useRequest()
  const { success, confirm } = useUI()

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Request',
      message: 'Are you sure? This will also delete all uploaded files.',
      danger: true
    })

    if (confirmed) {
      await deleteRequest(id)
      success('Request deleted')
    }
  }

  const filteredRequests = getFilteredRequests()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {/* Filters */}
      <div className="filters">
        <input
          type="search"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="live">Live</option>
          <option value="draft">Draft</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="most-uploads">Most Uploads</option>
          <option value="name-az">Name A-Z</option>
        </select>
      </div>

      {/* List */}
      <div className="requests-list">
        {filteredRequests.map(request => (
          <div key={request.id}>
            <h3>{request.title}</h3>
            <p>Status: {request.status}</p>
            <p>Uploads: {request.uploadCount || 0}</p>
            <button onClick={() => handleDelete(request.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Bulk Actions

```javascript
import { useRequest } from '@/store'
import { useUI } from '@/store'

function BulkActions() {
  const { deleteRequests } = useRequest()
  const { confirmBulkAction, success } = useUI()
  const [selectedIds, setSelectedIds] = useState([])

  const handleBulkDelete = async () => {
    const confirmed = await confirmBulkAction(selectedIds.length, 'delete')

    if (confirmed) {
      await deleteRequests(selectedIds)
      success(`Deleted ${selectedIds.length} requests`)
      setSelectedIds([])
    }
  }

  return (
    <div>
      {selectedIds.length > 0 && (
        <button onClick={handleBulkDelete}>
          Delete {selectedIds.length} Selected
        </button>
      )}
    </div>
  )
}
```

---

## Analytics Dashboard

### Dashboard Stats

```javascript
import { useAnalytics } from '@/store'
import { useAuth } from '@/store'

function Dashboard() {
  const {
    stats,
    isLoading,
    fetchAnalytics,
    formatStorage,
    getConversionRate
  } = useAnalytics()
  const { getStorageLimit } = useAuth()

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const storagePercentage = (stats.storageUsed / (getStorageLimit() * 1024)) * 100

  if (isLoading) return <div>Loading analytics...</div>

  return (
    <div className="dashboard">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Requests</h3>
          <p>{stats.totalRequests}</p>
        </div>

        <div className="stat-card">
          <h3>Total Uploads</h3>
          <p>{stats.totalUploads}</p>
        </div>

        <div className="stat-card">
          <h3>Storage Used</h3>
          <p>{formatStorage(stats.storageUsed / 1024)}</p>
          <div className="progress-bar">
            <div style={{ width: `${storagePercentage}%` }} />
          </div>
        </div>

        <div className="stat-card">
          <h3>Active Requests</h3>
          <p>{stats.activeRequests}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="charts">
        <UploadTrendChart data={stats.uploadsByDay} />
        <FileTypeChart data={stats.fileTypeBreakdown} />
      </div>
    </div>
  )
}
```

### Form Analytics

```javascript
import { useAnalytics } from '@/store'

function FormAnalytics({ formId, shortCode, createdAt, uploads }) {
  const {
    getFormViews,
    getConversionRate,
    getTimeToFirstUpload,
    getAverageUploadInterval,
    getFilesPerDay
  } = useAnalytics()

  const views = getFormViews(shortCode)
  const conversionRate = getConversionRate(views, uploads.length)
  const timeToFirst = getTimeToFirstUpload(createdAt, uploads)
  const avgInterval = getAverageUploadInterval(uploads)
  const filesPerDay = getFilesPerDay(createdAt, uploads)

  return (
    <div className="form-analytics">
      <div className="metric">
        <label>Views</label>
        <span>{views}</span>
      </div>

      <div className="metric">
        <label>Conversion Rate</label>
        <span>{conversionRate}</span>
      </div>

      <div className="metric">
        <label>Time to First Upload</label>
        <span>{timeToFirst}</span>
      </div>

      <div className="metric">
        <label>Avg Upload Interval</label>
        <span>{avgInterval}</span>
      </div>

      <div className="metric">
        <label>Upload Rate</label>
        <span>{filesPerDay}</span>
      </div>
    </div>
  )
}
```

---

## UI Components

### Toast Notifications

```javascript
import { useUI } from '@/store'

function ToastContainer() {
  const { toasts, removeToast } = useUI()

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
```

### Confirm Modal

```javascript
import { useUI } from '@/store'

function ConfirmModal() {
  const { modals, getModalData, closeModal } = useUI()
  const confirmData = getModalData('confirm')

  if (!confirmData.isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{confirmData.title}</h2>
        <p>{confirmData.message}</p>
        <div className="actions">
          <button onClick={confirmData.onCancel}>
            {confirmData.cancelText || 'Cancel'}
          </button>
          <button
            className={confirmData.danger ? 'danger' : 'primary'}
            onClick={confirmData.onConfirm}
          >
            {confirmData.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Loading Overlay

```javascript
import { useUI } from '@/store'

function LoadingOverlay({ loadingKey }) {
  const isLoading = useUI(state => state.isLoading(loadingKey))

  if (!isLoading) return null

  return (
    <div className="loading-overlay">
      <div className="spinner" />
    </div>
  )
}
```

---

## Advanced Patterns

### Optimistic Updates

```javascript
import { useRequest } from '@/store'

function OptimisticUpdate() {
  const { requests, updateRequest } = useRequest()

  const handleToggleStatus = async (requestId) => {
    const request = requests.find(r => r.id === requestId)
    const newStatus = request.status === 'live' ? 'paused' : 'live'

    // Optimistically update UI
    updateRequest(requestId, { status: newStatus })

    try {
      // Actually update on server
      await api.put(`/api/requests/${requestId}`, { status: newStatus })
    } catch (error) {
      // Revert on error
      updateRequest(requestId, { status: request.status })
    }
  }
}
```

### Selective Subscriptions

```javascript
// Only re-render when user changes
const user = useAuth(state => state.user)

// Only re-render when loading changes
const isLoading = useRequest(state => state.isLoading)

// Multiple selective subscriptions
const user = useAuth(state => state.user)
const isPro = useAuth(state => state.isPro())
```

### Combining Multiple Stores

```javascript
function ComplexComponent() {
  const { user, isPro } = useAuth()
  const { canvasElements, addElement } = useBuilder()
  const { success, showUpgradeModal } = useUI()

  const handleAddElement = (type) => {
    // Check if Pro feature
    if (type.plan === 'pro' && !isPro()) {
      showUpgradeModal()
      return
    }

    // Check element limit
    if (canvasElements.length >= 5 && !isPro()) {
      showUpgradeModal()
      return
    }

    addElement({ type, ... })
    success('Element added')
  }
}
```

---

## Testing Examples

### Component Testing

```javascript
import { render, screen, waitFor } from '@testing-library/react'
import { useRequest } from '@/store'

// Mock the store
jest.mock('@/store', () => ({
  useRequest: jest.fn()
}))

test('displays requests', async () => {
  useRequest.mockReturnValue({
    requests: [
      { id: '1', title: 'Test Request', status: 'live' }
    ],
    isLoading: false,
    fetchRequests: jest.fn()
  })

  render(<RequestsList />)

  expect(screen.getByText('Test Request')).toBeInTheDocument()
})
```

### Store Testing

```javascript
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/store'

test('login updates state', async () => {
  const { result } = renderHook(() => useAuth())

  await act(async () => {
    await result.current.login('test@example.com', 'password')
  })

  expect(result.current.user).toBeTruthy()
  expect(result.current.isAuthenticated()).toBe(true)
})
```

## Summary

These examples demonstrate:
- ✅ Clean component code with minimal local state
- ✅ Proper error handling and loading states
- ✅ Optimistic updates for better UX
- ✅ Selective subscriptions for performance
- ✅ Integration between multiple stores
- ✅ Testable code with clear separation of concerns
