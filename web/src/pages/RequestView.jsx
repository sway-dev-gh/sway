import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const RequestView = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect legacy request URLs to new project URLs
    if (id) {
      navigate(`/projects/${id}`, { replace: true })
    } else {
      navigate('/projects', { replace: true })
    }
  }, [id, navigate])

  // Show loading state while redirecting
  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        textAlign: 'center'
      }}>
        Redirecting to new project view...
      </div>
    </div>
  )
}

export default RequestView