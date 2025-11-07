import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Requests from './pages/Requests'
import Uploads from './pages/Uploads'
import Plan from './pages/Plan'
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
        <Route path="/plan" element={<Plan />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
