import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="text-xl font-bold mb-2">Đã xảy ra lỗi</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            {this.state.error?.message ?? 'Lỗi không xác định'}
          </p>
          <button className="btn-primary" onClick={() => this.setState({ hasError: false, error: null })}>
            Thử lại
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
