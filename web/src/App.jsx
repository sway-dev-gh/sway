import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import ErrorBoundary from './components/ErrorBoundary'
import { PageLoadingFallback, DashboardSkeleton, TableSkeleton, FormSkeleton } from './components/LoadingFallback'
import './App.css'
import './styles/mobile.css'
import './styles/clean.css'

// Auth routes - separate chunk
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))

// Public upload route - separate chunk
const Upload = lazy(() => import('./pages/Upload'))

// Dashboard (Workspace-Centric) - critical route with custom skeleton
const Dashboard = lazy(() => import('./pages/Dashboard'))

// Review Platform Routes
const Projects = lazy(() => import('./pages/EnhancedProjects'))
const ProjectWorkspace = lazy(() => import('./components/ProjectWorkspace'))
const Collaboration = lazy(() => import('./pages/Collaboration'))
const Reviews = lazy(() => import('./pages/Management'))

// Legacy routes for backward compatibility
const RequestView = lazy(() => import('./pages/RequestView'))

// File management routes - grouped chunk
const Uploads = lazy(() => import('./pages/Uploads'))

// Settings and support routes - grouped chunk
const Settings = lazy(() => import('./pages/Settings'))
const Plan = lazy(() => import('./pages/Plan'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Support = lazy(() => import('./pages/Support'))

// Notification route - separate chunk
const Notifications = lazy(() => import('./pages/Notifications'))

// Prefetch critical routes on idle
function prefetchCriticalRoutes() {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      // Prefetch likely next routes
      import('./pages/Dashboard').catch(() => {}) // Dashboard (workspace-centric)
      import('./pages/EnhancedProjects').catch(() => {}) // Enhanced Projects with review workflow
      import('./pages/Management').catch(() => {})
    }, { timeout: 2000 })
  } else {
    setTimeout(() => {
      import('./pages/Dashboard').catch(() => {})
      import('./pages/EnhancedProjects').catch(() => {})
      import('./pages/Management').catch(() => {})
    }, 2000)
  }
}

function App() {
  useEffect(() => {
    // Prefetch critical routes after initial render
    prefetchCriticalRoutes()
  }, [])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Auth routes */}
        <Route path="/login" element={
          <Suspense fallback={<FormSkeleton />}>
            <Login />
          </Suspense>
        } />
        <Route path="/signup" element={
          <Suspense fallback={<FormSkeleton />}>
            <Signup />
          </Suspense>
        } />

        {/* Public upload route */}
        <Route path="/r/:shortCode" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <Upload />
          </Suspense>
        } />

        {/* Dashboard (Builder) - critical route */}
        <Route path="/dashboard" element={
          <Suspense fallback={<DashboardSkeleton />}>
            <Dashboard />
          </Suspense>
        } />

        {/* Legacy routes for backward compatibility */}
        <Route path="/requests/:id" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <RequestView />
          </Suspense>
        } />

        {/* Review Platform Routes */}
        <Route path="/collaboration" element={
          <Suspense fallback={<DashboardSkeleton />}>
            <Collaboration />
          </Suspense>
        } />
        <Route path="/projects" element={
          <Suspense fallback={<TableSkeleton />}>
            <Projects />
          </Suspense>
        } />
        <Route path="/projects/:id" element={
          <Suspense fallback={<DashboardSkeleton />}>
            <ProjectWorkspace />
          </Suspense>
        } />
        <Route path="/reviews" element={
          <Suspense fallback={<TableSkeleton />}>
            <Reviews />
          </Suspense>
        } />

        {/* Legacy Management Route */}
        <Route path="/management" element={
          <Suspense fallback={<TableSkeleton />}>
            <Reviews />
          </Suspense>
        } />

        {/* File management */}
        <Route path="/uploads" element={
          <Suspense fallback={<TableSkeleton />}>
            <Uploads />
          </Suspense>
        } />

        {/* Settings and support */}
        <Route path="/settings" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <Settings />
          </Suspense>
        } />
        <Route path="/plan" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <Plan />
          </Suspense>
        } />
        <Route path="/faq" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <FAQ />
          </Suspense>
        } />
        <Route path="/support" element={
          <Suspense fallback={<FormSkeleton />}>
            <Support />
          </Suspense>
        } />

        {/* Notifications */}
        <Route path="/notifications" element={
          <Suspense fallback={<TableSkeleton />}>
            <Notifications />
          </Suspense>
        } />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
