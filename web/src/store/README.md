# Sway Zustand Store Documentation

Comprehensive state management for the Sway file collection SaaS application using Zustand.

## Overview

This store architecture provides:
- **Type-safe state management** with JSDoc annotations
- **Persistent storage** for auth and critical data
- **Devtools integration** for debugging
- **Clean separation of concerns** across 6 specialized stores
- **Optimized performance** with selective re-renders

## Stores

### 1. authStore.js - Authentication & User Management

Handles all authentication-related state and operations.

**State:**
```javascript
{
  user: object | null,          // Current user data
  token: string | null,          // JWT token
  isLoading: boolean,            // Loading state
  error: string | null           // Error message
}
```

**Usage:**
```javascript
import { useAuth } from '@/store'

function LoginPage() {
  const { login, user, isAuthenticated } = useAuth()

  const handleLogin = async () => {
    try {
      await login(email, password)
      // User is now logged in
    } catch (error) {
      // Handle error
    }
  }
}
```

**Key Methods:**
- `login(email, password)` - Authenticate user
- `signup(credentials)` - Register new user
- `logout()` - Log out current user
- `updateUser(updates)` - Update user profile
- `changePassword(current, new)` - Change password
- `refreshUser()` - Refresh user data from server
- `isPro()` - Check if user has Pro plan
- `getStorageLimit()` - Get storage limit based on plan

**Persistence:**
- Automatically syncs with localStorage
- Maintains backward compatibility with existing localStorage keys

---

### 2. builderStore.js - Visual Form Builder

Manages the drag-and-drop form builder state with full undo/redo support.

**State:**
```javascript
{
  canvasElements: array,         // Elements on canvas
  selectedElement: object | null,// Currently selected element
  selectedElements: array,       // Multi-selection
  formTitle: string,             // Form title
  history: array,                // Undo/redo history
  historyIndex: number,          // Current position in history
  zoom: number,                  // Zoom level (0.25-2)
  snapToGrid: boolean,           // Grid snapping enabled
  lockedElements: array,         // Locked element IDs
  clipboard: object | null,      // Copied element
  branding: object,              // Form branding settings
  settings: object               // Form settings
}
```

**Usage:**
```javascript
import { useBuilder } from '@/store'

function FormBuilder() {
  const {
    canvasElements,
    addElement,
    updateElement,
    undo,
    redo,
    canUndo,
    canRedo
  } = useBuilder()

  const handleAddElement = () => {
    addElement({
      id: generateId(),
      type: 'heading',
      x: 100,
      y: 100,
      properties: { content: 'New Heading' }
    })
  }
}
```

**Key Methods:**
- `addElement(element)` - Add element to canvas
- `updateElement(id, updates)` - Update element properties
- `deleteElement(id)` - Remove element
- `duplicateElement(id)` - Duplicate element
- `selectElement(element)` - Select single element
- `undo()` / `redo()` - History navigation
- `copyToClipboard(element)` - Copy element
- `pasteFromClipboard()` - Paste element
- `setZoom(level)` - Set zoom level
- `toggleSnapToGrid()` - Toggle grid snapping
- `bringForward()` / `sendBackward()` - Z-order management
- `loadTemplate(elements)` - Load template

**Features:**
- Automatic history tracking (max 50 states)
- Grid snapping (10px grid)
- Element locking
- Multi-select support
- Z-order management

---

### 3. uploadStore.js - File Upload Management

Handles file uploads, validation, and progress tracking.

**State:**
```javascript
{
  uploads: array,                // Upload history
  currentUpload: string | null,  // Active upload ID
  isUploading: boolean,          // Upload in progress
  uploadProgress: number,        // Progress (0-100)
  selectedFiles: array,          // Files selected for upload
  validationErrors: array,       // Validation errors
  error: string | null           // Error message
}
```

**Usage:**
```javascript
import { useUpload } from '@/store'

function FileUploader() {
  const {
    selectedFiles,
    addFiles,
    validateFiles,
    uploadFile,
    uploadProgress
  } = useUpload()

  const handleUpload = async () => {
    const formData = new FormData()
    selectedFiles.forEach(file => formData.append('files', file))

    try {
      await uploadFile(shortCode, formData)
      // Upload complete
    } catch (error) {
      // Handle error
    }
  }
}
```

**Key Methods:**
- `addFiles(files)` - Add files to selection
- `removeFile(index)` - Remove file from selection
- `validateFile(file, rules)` - Validate single file
- `validateFiles(files, rules)` - Validate multiple files
- `uploadFile(shortCode, formData)` - Upload files
- `downloadFile(id, fileName)` - Download file
- `fetchUploads()` - Get upload history
- `formatFileSize(bytes)` - Format file size
- `isImage(fileName)` - Check if file is image
- `isDocument(fileName)` - Check if file is document

**Validation Rules:**
```javascript
{
  maxFileSize: 104857600,       // 100MB in bytes
  allowedFileTypes: ['*'],      // Array of allowed types or ['*']
  maxFiles: 10                  // Maximum file count
}
```

---

### 4. uiStore.js - Global UI State

Manages transient UI state like modals, toasts, and loading indicators.

**State:**
```javascript
{
  toasts: array,                 // Active toast notifications
  modals: object,                // Modal states by ID
  loading: object,               // Loading states by key
  theme: string,                 // Current theme
  sidebarOpen: boolean           // Sidebar visibility
}
```

**Usage:**
```javascript
import { useUI } from '@/store'

function MyComponent() {
  const { success, error, openModal, setLoading } = useUI()

  const handleAction = async () => {
    setLoading('action', true)
    try {
      await performAction()
      success('Action completed successfully!')
    } catch (err) {
      error('Action failed')
    } finally {
      setLoading('action', false)
    }
  }
}
```

**Key Methods:**

*Toast Notifications:*
- `showToast(message, type, duration)` - Show generic toast
- `success(message, duration)` - Show success toast
- `error(message, duration)` - Show error toast
- `warning(message, duration)` - Show warning toast
- `info(message, duration)` - Show info toast
- `removeToast(id)` - Remove specific toast
- `clearToasts()` - Clear all toasts

*Modal Management:*
- `openModal(id, props)` - Open modal with data
- `closeModal(id)` - Close specific modal
- `closeAllModals()` - Close all modals
- `isModalOpen(id)` - Check if modal is open
- `getModalData(id)` - Get modal data

*Loading States:*
- `setLoading(key, isLoading)` - Set loading state
- `isLoading(key)` - Check loading state
- `clearLoading()` - Clear all loading states

*Confirmation Dialogs:*
- `confirm(config)` - Show confirmation dialog (returns Promise)
- `confirmBulkAction(count, action)` - Confirm bulk actions

*Common Modals:*
- `showUpgradeModal()` - Show Pro upgrade prompt
- `showTemplateModal(template)` - Show template preview
- `showPreviewModal(data)` - Show general preview

---

### 5. requestStore.js - Request/Form Management

Handles CRUD operations and state for file collection requests.

**State:**
```javascript
{
  requests: array,               // All user requests
  currentRequest: object | null, // Active request
  isLoading: boolean,            // Loading state
  searchQuery: string,           // Search filter
  filterStatus: string,          // Status filter
  sortBy: string,                // Sort option
  error: string | null           // Error message
}
```

**Usage:**
```javascript
import { useRequest } from '@/store'

function RequestsList() {
  const {
    requests,
    fetchRequests,
    deleteRequest,
    getFilteredRequests
  } = useRequest()

  useEffect(() => {
    fetchRequests()
  }, [])

  const filteredRequests = getFilteredRequests()
}
```

**Key Methods:**
- `fetchRequests()` - Get all requests
- `fetchRequest(id)` - Get single request
- `createRequest(data)` - Create new request
- `updateRequest(id, updates)` - Update request
- `deleteRequest(id)` - Delete single request
- `deleteRequests(ids)` - Delete multiple requests
- `setSearchQuery(query)` - Set search filter
- `setFilterStatus(status)` - Set status filter
- `setSortBy(option)` - Set sort option
- `getFilteredRequests()` - Get filtered/sorted requests
- `getRequestStats()` - Get request statistics

**Filter/Sort Options:**
- Status: `all`, `live`, `draft`, `paused`, `expired`
- Sort: `newest`, `oldest`, `most-uploads`, `name-az`

---

### 6. analyticsStore.js - Analytics & Metrics

Provides analytics data and helper functions for metrics calculation.

**State:**
```javascript
{
  stats: {
    totalRequests: number,
    totalUploads: number,
    storageUsed: number,
    activeRequests: number,
    uploadsByDay: array,
    topRequests: array,
    fileTypeBreakdown: array,
    recentActivity: array
  },
  isLoading: boolean,
  lastFetched: number | null,
  error: string | null
}
```

**Usage:**
```javascript
import { useAnalytics } from '@/store'

function Dashboard() {
  const {
    stats,
    fetchAnalytics,
    getConversionRate,
    formatStorage
  } = useAnalytics()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const conversionRate = getConversionRate(views, uploads)
}
```

**Key Methods:**
- `fetchAnalytics(force)` - Fetch analytics (cached 5min)
- `trackFormView(shortCode)` - Track form view
- `getFormViews(shortCode)` - Get view count
- `getConversionRate(views, uploads)` - Calculate conversion
- `calculateStorageUsage(files)` - Calculate storage
- `formatStorage(gb)` - Format storage display
- `getTimeToFirstUpload(created, uploads)` - Time metric
- `getAverageUploadInterval(uploads)` - Interval metric
- `getFilesPerDay(created, uploads)` - Upload rate
- `getTimeSinceCreated(date)` - Format time since
- `getTimeAgo(date)` - Format time ago

**Helper Functions:**
All formatting and calculation helpers are available as store methods for consistent metrics across the app.

---

## Best Practices

### 1. Use Selectors for Derived State

```javascript
// Good - use computed selectors
const { isAuthenticated, isPro } = useAuth()

// Avoid - deriving in component
const isAuthenticated = !!token
```

### 2. Handle Loading States

```javascript
const { isLoading, fetchRequests } = useRequest()

useEffect(() => {
  fetchRequests()
}, [])

if (isLoading) return <Spinner />
```

### 3. Error Handling

```javascript
const { error, clearError, uploadFile } = useUpload()

const handleUpload = async () => {
  clearError() // Clear previous errors
  try {
    await uploadFile(shortCode, formData)
  } catch (err) {
    // Error is automatically set in store
    console.error(err)
  }
}
```

### 4. Avoid Prop Drilling

```javascript
// Instead of passing props through many levels
<Parent user={user}>
  <Child user={user}>
    <GrandChild user={user} />
  </Child>
</Parent>

// Use the store directly
function GrandChild() {
  const { user } = useAuth()
  // ...
}
```

### 5. Batch Updates

```javascript
// Good - single state update
const handleBulkDelete = async (ids) => {
  await deleteRequests(ids) // Handles all in one update
}

// Avoid - multiple updates
ids.forEach(id => deleteRequest(id)) // Causes multiple re-renders
```

## Performance Tips

### 1. Selective Subscriptions

```javascript
// Only subscribe to what you need
const user = useAuth(state => state.user)
const login = useAuth(state => state.login)

// Instead of
const { user, login, token, error, ... } = useAuth()
```

### 2. Stable References

```javascript
// Actions are stable - safe for dependency arrays
const { fetchRequests } = useRequest()

useEffect(() => {
  fetchRequests()
}, [fetchRequests]) // Won't cause infinite loops
```

### 3. Devtools

All stores (except auth) use Zustand devtools for debugging:

```javascript
// Install Redux DevTools Extension
// Stores will appear in DevTools panel
```

## Migration from Current Code

### localStorage Compatibility

Auth store maintains compatibility with existing localStorage:
- `token` key
- `user` key
- `adminPlanOverride` key

### Toast Hook Replacement

Replace `useToast` hook:

```javascript
// Old
import { useToast } from '../hooks/useToast'
const toast = useToast()

// New
import { useUI } from '@/store'
const { success, error } = useUI()
```

### State Lifting

Move component state to stores:

```javascript
// Old
const [requests, setRequests] = useState([])
const [loading, setLoading] = useState(false)

// New
const { requests, isLoading, fetchRequests } = useRequest()
```

## Testing

```javascript
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/store'

test('login sets user and token', async () => {
  const { result } = renderHook(() => useAuth())

  await act(async () => {
    await result.current.login('test@example.com', 'password')
  })

  expect(result.current.user).toBeTruthy()
  expect(result.current.token).toBeTruthy()
})
```

## TypeScript Support

Add TypeScript definitions (future enhancement):

```typescript
// types.ts
export interface User {
  id: string
  email: string
  plan: 'free' | 'pro'
  storage_limit_gb: number
}

export interface AuthStore {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  // ...
}
```

## License

MIT - Part of the Sway application
