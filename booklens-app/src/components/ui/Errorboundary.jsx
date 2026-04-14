import { Component } from 'react'

/**
 * ErrorBoundary — catches render errors and shows a recovery UI
 * instead of a blank screen. Wrap any page-level component with this.
 *
 * Usage: <ErrorBoundary><BookDetailPage /></ErrorBoundary>
 * Or wrap at route level in App.jsx.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[BookLens] Render error caught by ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center'
        }}>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 28,
            fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12
          }}>
            Something went wrong
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            This page ran into an error. Try refreshing — if the problem persists,
            go back to the home page.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              textAlign: 'left', background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: 16, fontSize: 11, color: 'var(--accent-red)',
              overflowX: 'auto', marginBottom: 24, lineHeight: 1.5
            }}>
              {this.state.error.toString()}
            </pre>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '9px 20px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                background: 'var(--accent-green)', color: '#0a1a0f', border: 'none', cursor: 'pointer'
              }}
            >
              Refresh page
            </button>
            <button
              onClick={() => { window.location.href = '/' }}
              style={{
                padding: '9px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                background: 'transparent', border: '1px solid var(--border-light)',
                color: 'var(--text-secondary)', cursor: 'pointer'
              }}
            >
              Go home
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}