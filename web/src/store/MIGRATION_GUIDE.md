# Migration Guide: Integrating Zustand Stores

Step-by-step guide to integrate the new Zustand stores into the Sway application.

## Phase 1: Setup (5 minutes)

### 1. Verify Zustand Installation
Zustand is already installed in package.json. If you need to update:
```bash
npm install zustand@latest
```

### 2. Update Import Paths (Optional)
Add path alias to vite.config.js for cleaner imports:
```javascript
// vite.config.js
export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
      '@/store': '/src/store'
    }
  }
})
```

### 3. Test Store Import
Create a test component to verify stores work:
```javascript
// src/components/TestStore.jsx
import { useAuth } from '../store'

function TestStore() {
  const { user, token } = useAuth()
  console.log('Store working:', { user, token })
  return <div>Store Test</div>
}
```

---

## Phase 2: UI Store Integration (30 minutes)

Replace the existing `useToast` hook with the new UI store.

### Step 1: Update ToastContainer Component

**File:** `src/components/ToastContainer.jsx`

**Before:**
```javascript
// Used with useToast hook
function ToastContainer({ toasts, removeToast }) {
  // ...
}
```

**After:**
```javascript
import { useUI } from '../store'

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

export default ToastContainer
```

### Step 2: Update Pages to Use UI Store

**Example: Login.jsx**

**Before:**
```javascript
import { useToast } from '../hooks/useToast'

function Login() {
  const toast = useToast()
  // ...
  toast.success('Login successful!')
}
```

**After:**
```javascript
import { useUI } from '../store'

function Login() {
  const { success, error } = useUI()
  // ...
  success('Login successful!')
}
```

### Step 3: Remove Old Hook (After All Migrations)
Once all files are migrated:
```bash
# Verify no files use the old hook
grep -r "useToast" src/pages/
grep -r "useToast" src/components/

# If clear, remove the old hook file
# rm src/hooks/useToast.js
```

---

## Phase 3: Auth Store Integration (45 minutes)

Replace localStorage auth logic with the auth store.

### Step 1: Update Login Page

**File:** `src/pages/Login.jsx`

**Before:**
```javascript
const [formData, setFormData] = useState({ email: '', password: '' })
const [error, setError] = useState('')
const [loading, setLoading] = useState(false)

const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    const { data } = await api.post('/api/auth/login', formData)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    navigate('/requests')
  } catch (err) {
    setError(err.response?.data?.error || 'Login failed')
  } finally {
    setLoading(false)
  }
}
```

**After:**
```javascript
import { useAuth } from '../store'
import { useUI } from '../store'

const { login, error, isLoading } = useAuth()
const { success } = useUI()
const [formData, setFormData] = useState({ email: '', password: '' })

const handleSubmit = async (e) => {
  e.preventDefault()

  try {
    await login(formData.email, formData.password)
    success('Welcome back!')
    navigate('/requests')
  } catch (err) {
    // Error is already set in store
  }
}
```

### Step 2: Create Protected Route Component

**File:** `src/components/ProtectedRoute.jsx` (New)

```javascript
import { useAuth } from '../store'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuth(state => state.isAuthenticated())

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
```

### Step 3: Update App.jsx to Use ProtectedRoute

**File:** `src/App.jsx`

```javascript
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/requests" element={
        <ProtectedRoute>
          <Requests />
        </ProtectedRoute>
      } />
      {/* ... more protected routes */}
    </Routes>
  )
}
```

### Step 4: Update Sidebar to Use Auth Store

**File:** `src/components/Sidebar.jsx`

**Before:**
```javascript
const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  navigate('/login')
}
```

**After:**
```javascript
import { useAuth } from '../store'
import { useUI } from '../store'

const { user, logout } = useAuth()
const { success } = useUI()

const handleLogout = () => {
  logout()
  success('Logged out successfully')
  navigate('/login')
}
```

---

## Phase 4: Request Store Integration (1 hour)

Replace request management state with the request store.

### Step 1: Update Responses Page

**File:** `src/pages/Responses.jsx`

**Before:**
```javascript
const [forms, setForms] = useState([])
const [loading, setLoading] = useState(true)
const [searchQuery, setSearchQuery] = useState('')
const [filterStatus, setFilterStatus] = useState('all')
const [sortBy, setSortBy] = useState('newest')

const fetchData = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await api.get('/api/requests', {
      headers: { Authorization: `Bearer ${token}` }
    })
    setForms(response.data.requests || [])
  } catch (err) {
    console.error('Failed to fetch data:', err)
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  fetchData()
}, [])
```

**After:**
```javascript
import { useRequest } from '../store'

const {
  requests,
  isLoading,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  getFilteredRequests,
  fetchRequests
} = useRequest()

useEffect(() => {
  fetchRequests()
}, [fetchRequests])

const filteredForms = getFilteredRequests()
```

### Step 2: Update Delete Functionality

**Before:**
```javascript
const handleDelete = async (formId) => {
  try {
    const token = localStorage.getItem('token')
    await api.delete(`/api/requests/${formId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    fetchData() // Refetch all data
    toast.success('Request deleted successfully')
  } catch (err) {
    toast.error('Failed to delete request')
  }
}
```

**After:**
```javascript
import { useRequest } from '../store'
import { useUI } from '../store'

const { deleteRequest } = useRequest()
const { success, error, confirm } = useUI()

const handleDelete = async (formId) => {
  const confirmed = await confirm({
    title: 'Delete Request',
    message: 'Are you sure you want to delete this request?',
    danger: true
  })

  if (!confirmed) return

  try {
    await deleteRequest(formId)
    success('Request deleted successfully')
  } catch (err) {
    error('Failed to delete request')
  }
}
```

---

## Phase 5: Builder Store Integration (2 hours)

This is the most complex migration. Take it step by step.

### Step 1: Update Requests.jsx Form Builder

**File:** `src/pages/Requests.jsx`

**Before:**
```javascript
const [canvasElements, setCanvasElements] = useState([])
const [selectedElement, setSelectedElement] = useState(null)
const [formTitle, setFormTitle] = useState('Untitled File Request')
const [history, setHistory] = useState([])
const [historyIndex, setHistoryIndex] = useState(-1)
const [zoom, setZoom] = useState(1)
// ... many more state variables
```

**After:**
```javascript
import { useBuilder } from '../store'

const {
  canvasElements,
  selectedElement,
  formTitle,
  setFormTitle,
  addElement,
  updateElement,
  deleteElement,
  selectElement,
  undo,
  redo,
  canUndo,
  canRedo,
  zoom,
  setZoom,
  // ... all other builder methods
} = useBuilder()
```

### Step 2: Replace State Updates with Store Actions

**Before:**
```javascript
const handleAddElement = (element) => {
  const newElements = [...canvasElements, element]
  setCanvasElements(newElements)
  saveToHistory(newElements)
}
```

**After:**
```javascript
const handleAddElement = (element) => {
  addElement(element) // Store handles everything
}
```

### Step 3: Update Element Selection

**Before:**
```javascript
const handleSelectElement = (element) => {
  setSelectedElement(element)
  setSelectedElements([])
}
```

**After:**
```javascript
const handleSelectElement = (element) => {
  selectElement(element) // Automatically clears multi-select
}
```

---

## Phase 6: Upload Store Integration (1 hour)

### Step 1: Update Upload Page

**File:** `src/pages/Upload.jsx`

**Before:**
```javascript
const [files, setFiles] = useState([])
const [uploading, setUploading] = useState(false)
const [uploadProgress, setUploadProgress] = useState(0)

const handleFileChange = (e) => {
  const fileList = Array.from(e.target.files)
  if (validateFiles(fileList)) {
    setFiles(fileList)
  }
}

const handleSubmit = async (e) => {
  e.preventDefault()
  setUploading(true)
  // ... upload logic
}
```

**After:**
```javascript
import { useUpload } from '../store'
import { useUI } from '../store'

const {
  selectedFiles,
  addFiles,
  validateFiles,
  uploadFile,
  uploadProgress,
  isUploading
} = useUpload()
const { success, error } = useUI()

const handleFileChange = (e) => {
  const fileList = Array.from(e.target.files)

  const validation = validateFiles(fileList, {
    maxFileSize: requestData?.settings?.maxFileSize,
    allowedFileTypes: requestData?.settings?.allowedFileTypes,
    maxFiles: requestData?.settings?.maxFiles
  })

  if (validation.valid) {
    addFiles(fileList)
  } else {
    validation.errors.forEach(err => error(err.message))
  }
}

const handleSubmit = async (e) => {
  e.preventDefault()

  const formData = new FormData()
  // ... add form fields

  try {
    await uploadFile(shortCode, formData)
    success('Files uploaded successfully!')
  } catch (err) {
    // Error already shown by store
  }
}
```

---

## Phase 7: Analytics Store Integration (30 minutes)

### Step 1: Update Dashboard

**File:** `src/pages/Dashboard.jsx`

**Before:**
```javascript
const [stats, setStats] = useState({
  totalRequests: 0,
  totalUploads: 0,
  // ...
})

const fetchDashboardData = async () => {
  const analyticsResponse = await api.get('/api/analytics', {
    headers: { Authorization: `Bearer ${token}` }
  })
  setStats(analyticsResponse.data)
}
```

**After:**
```javascript
import { useAnalytics } from '../store'

const { stats, fetchAnalytics, formatStorage } = useAnalytics()

useEffect(() => {
  fetchAnalytics()
}, [fetchAnalytics])
```

### Step 2: Update Responses Analytics

**File:** `src/pages/Responses.jsx`

**Before:**
```javascript
const getFormViews = (shortCode) => {
  const storageKey = `form_views_${shortCode}`
  return parseInt(localStorage.getItem(storageKey) || '0', 10)
}

const getConversionRate = (views, uploads) => {
  if (views === 0) return '—'
  return ((uploads / views) * 100).toFixed(1) + '%'
}
```

**After:**
```javascript
import { useAnalytics } from '../store'

const { getFormViews, getConversionRate, getTimeToFirstUpload } = useAnalytics()

// Use directly
const views = getFormViews(form.shortCode)
const conversionRate = getConversionRate(views, uploadCount)
```

---

## Phase 8: Cleanup (30 minutes)

### Step 1: Remove Duplicate Code

After migrating all files, search for and remove:

```bash
# Find remaining localStorage usage
grep -r "localStorage.getItem('token')" src/

# Find remaining manual state management
grep -r "useState.*loading" src/
grep -r "useState.*error" src/
```

### Step 2: Update Components

Remove ToastContainer from individual pages:

**Before:**
```javascript
// Every page had this
<ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
```

**After:**
```javascript
// Add once to App.jsx
import ToastContainer from './components/ToastContainer'

function App() {
  return (
    <>
      <Routes>
        {/* ... routes */}
      </Routes>
      <ToastContainer />
    </>
  )
}
```

### Step 3: Add Global Store Initialization

**File:** `src/main.jsx` or `src/App.jsx`

```javascript
import { useAuth, useUI } from './store'

function App() {
  // Initialize stores on app mount
  useEffect(() => {
    const { initialize } = useAuth.getState()
    const { initialize: initUI } = useUI.getState()

    initialize()
    initUI()
  }, [])

  return <Routes>{/* ... */}</Routes>
}
```

---

## Testing Checklist

After migration, test these scenarios:

### Authentication
- [ ] Login works and persists on refresh
- [ ] Logout clears state
- [ ] Protected routes redirect correctly
- [ ] Plan detection works (Free/Pro)
- [ ] Admin override still works

### Form Builder
- [ ] Can add/remove elements
- [ ] Undo/redo works
- [ ] Element selection works
- [ ] Zoom works
- [ ] Grid snapping works
- [ ] Template loading works
- [ ] Publishing works

### File Upload
- [ ] File validation works
- [ ] Upload progress shows correctly
- [ ] Multiple files work
- [ ] File type restrictions work
- [ ] Success/error messages show

### UI
- [ ] Toasts appear and dismiss
- [ ] Modals open/close
- [ ] Loading states work
- [ ] Confirmations work

### Requests
- [ ] List loads correctly
- [ ] Search/filter/sort work
- [ ] Delete works
- [ ] Bulk operations work

### Analytics
- [ ] Dashboard stats load
- [ ] Form views track correctly
- [ ] Metrics calculate correctly

---

## Troubleshooting

### Store not updating?
```javascript
// Make sure you're calling the action, not just getting it
const { login } = useAuth()
await login(email, password) // ✅ Correct

const login = useAuth(state => state.login)
login(email, password) // ✅ Also correct

const login = useAuth().login
login(email, password) // ❌ Won't work, creates new hook instance
```

### Infinite re-renders?
```javascript
// Use selective subscription
const user = useAuth(state => state.user) // ✅ Only re-render on user change

const { user } = useAuth() // ⚠️ Re-renders on any auth state change
```

### localStorage not persisting?
```javascript
// Auth store uses persist middleware automatically
// Just use the store normally, it handles persistence

const { login } = useAuth()
await login(email, password) // Automatically saved to localStorage
```

### DevTools not showing?
```javascript
// Install Redux DevTools Extension
// Stores will appear under "Zustand" section
// Auth store won't appear (no devtools for security)
```

---

## Performance Optimization

### 1. Use Selective Subscriptions
```javascript
// Only subscribe to what you need
const user = useAuth(state => state.user)
const login = useAuth(state => state.login)

// Instead of
const { user, login, token, error, ... } = useAuth()
```

### 2. Memoize Computed Values
```javascript
const filteredRequests = useMemo(() =>
  getFilteredRequests(),
  [requests, searchQuery, filterStatus, sortBy]
)
```

### 3. Use Shallow Comparison
```javascript
import shallow from 'zustand/shallow'

const { user, token } = useAuth(
  state => ({ user: state.user, token: state.token }),
  shallow
)
```

---

## Rollback Plan

If issues arise, you can rollback phase by phase:

1. Keep old code commented out initially
2. Test each phase thoroughly before moving to next
3. Use git branches for each phase
4. Keep old hooks until fully migrated

```javascript
// During transition, you can use both
import { useAuth } from '../store' // New
// import { useToast } from '../hooks/useToast' // Old (commented)

const { success } = useAuth() // New
// const toast = useToast() // Old
```

---

## Timeline Estimate

- **Phase 1 (Setup):** 5 minutes
- **Phase 2 (UI Store):** 30 minutes
- **Phase 3 (Auth Store):** 45 minutes
- **Phase 4 (Request Store):** 1 hour
- **Phase 5 (Builder Store):** 2 hours
- **Phase 6 (Upload Store):** 1 hour
- **Phase 7 (Analytics Store):** 30 minutes
- **Phase 8 (Cleanup):** 30 minutes

**Total:** ~6.5 hours for complete migration

Can be done incrementally over several days if needed.

---

## Support

For questions or issues:
1. Check README.md for documentation
2. Check EXAMPLES.md for usage patterns
3. Check Zustand documentation: https://docs.pmnd.rs/zustand
4. Use DevTools to inspect state

Happy coding! 🚀
