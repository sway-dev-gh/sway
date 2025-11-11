import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './animations.css'
import './styles/accessibility.css'
import { initAccessibility } from './utils/accessibility.js'

// Initialize accessibility features
initAccessibility()

// Remove preload class after page loads to enable transitions
window.addEventListener('load', () => {
  document.body.classList.remove('preload')
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
/* Cache buster: 1762740331 */
