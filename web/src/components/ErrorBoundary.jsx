import { Component } from 'react'
import '../styles/ErrorBoundary.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console (in production, you'd send this to an error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Store error details in state
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))

    // Optional: Send to analytics/error tracking service
    // Example: logErrorToService(error, errorInfo)
    this.logError(error, errorInfo)
  }

  logError(error, errorInfo) {
    // Log to console with detailed information
    const errorLog = {
      message: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    console.group('Error Boundary - Error Details')
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Full Error Log:', errorLog)
    console.groupEnd()

    // In production, send to error tracking service:
    // - Sentry
    // - LogRocket
    // - Rollbar
    // - Custom logging endpoint
    if (import.meta.env.PROD) {
      // Example: fetch('/api/log-error', { method: 'POST', body: JSON.stringify(errorLog) })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })

    // Optional: Navigate to home page
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      window.location.href = '/dashboard'
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h1 className="error-title">Something went wrong</h1>

            <p className="error-message">
              We're sorry, but something unexpected happened.
              {this.state.errorCount > 1 && (
                <span className="error-count">
                  {' '}This error has occurred {this.state.errorCount} times.
                </span>
              )}
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Mode)</summary>
                <div className="error-stack">
                  <p><strong>Error:</strong> {this.state.error.toString()}</p>
                  {this.state.error.stack && (
                    <pre>{this.state.error.stack}</pre>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <p><strong>Component Stack:</strong></p>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="error-actions">
              <button
                className="btn-primary error-btn"
                onClick={this.handleReset}
              >
                Go to Dashboard
              </button>

              <button
                className="btn-secondary error-btn"
                onClick={this.handleReload}
              >
                Reload Page
              </button>
            </div>

            <p className="error-support">
              If this problem persists, please{' '}
              <a href="/support" className="error-link">contact support</a>
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
