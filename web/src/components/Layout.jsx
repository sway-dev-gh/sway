import Sidebar from './Sidebar'
import './Layout.css'

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="skip-link"
        style={{
          position: 'absolute',
          left: '-9999px',
          zIndex: 999999,
          padding: '12px 20px',
          background: '#ffffff',
          color: '#000000',
          textDecoration: 'none',
          borderRadius: '4px',
          fontWeight: '600',
          fontSize: '14px',
          top: '10px'
        }}
        onFocus={(e) => {
          e.target.style.left = '10px'
        }}
        onBlur={(e) => {
          e.target.style.left = '-9999px'
        }}
      >
        Skip to main content
      </a>
      <Sidebar />
      <main id="main-content" className="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
