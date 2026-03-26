import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', color: '#dc2626' }}>
          <h1 style={{ fontSize: 24 }}>Runtime Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 16 }}>
            {this.state.error.toString()}
          </pre>
          {this.state.errorInfo && (
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 16, color: '#666', fontSize: 12 }}>
              {this.state.errorInfo.componentStack}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
