import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Requests from './pages/Requests'
import Responses from './pages/Responses'
import Notifications from './pages/Notifications'
import Uploads from './pages/Uploads'
import Plan from './pages/Plan'
import FAQ from './pages/FAQ'
import Support from './pages/Support'
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
        <Route path="/responses" element={<Responses />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/uploads" element={<Uploads />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/support" element={<Support />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
