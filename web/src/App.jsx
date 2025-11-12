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

// Fresh Review Platform Routes
const Projects = lazy(() => import('./pages/Projects'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const Collaboration = lazy(() => import('./pages/Collaboration'))
const FileReview = lazy(() => import('./pages/FileReview'))
const ExternalReview = lazy(() => import('./pages/ExternalReview'))

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
      import('./pages/Projects').catch(() => {}) // Fresh Projects with review workflow
      import('./pages/ProjectDetail').catch(() => {})
    }, { timeout: 2000 })
  } else {
    setTimeout(() => {
      import('./pages/Dashboard').catch(() => {})
      import('./pages/Projects').catch(() => {})
      import('./pages/ProjectDetail').catch(() => {})
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

        {/* Fresh Review Platform Routes */}
        <Route path="/projects" element={
          <Suspense fallback={<TableSkeleton />}>
            <Projects />
          </Suspense>
        } />
        <Route path="/collaboration" element={
          <Suspense fallback={<TableSkeleton />}>
            <Collaboration />
          </Suspense>
        } />
        <Route path="/projects/:id" element={
          <Suspense fallback={<DashboardSkeleton />}>
            <ProjectDetail />
          </Suspense>
        } />
        <Route path="/projects/:projectId/files/:fileId" element={
          <Suspense fallback={<DashboardSkeleton />}>
            <FileReview />
          </Suspense>
        } />

        {/* External Review Route (no signup required) */}
        <Route path="/external/:token" element={
          <Suspense fallback={<PageLoadingFallback />}>
            <ExternalReview />
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
