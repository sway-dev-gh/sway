import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Requests from './pages/Requests'
import Uploads from './pages/Uploads'
import Files from './pages/Files'
import Notifications from './pages/Notifications'
import Templates from './pages/Templates'
import Plan from './pages/Plan'
import Billing from './pages/Billing'
import Settings from './pages/Settings'
import RequestView from './pages/RequestView'
import Upload from './pages/Upload'
import Login from './pages/Login'
import Signup from './pages/Signup'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/r/:shortCode" element={<Upload />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/requests/:id" element={<RequestView />} />
        <Route path="/uploads" element={<Uploads />} />
        <Route path="/files" element={<Files />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
