import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center h-screen p-8"
          style={{ background: 'var(--color-base, #111)', color: 'var(--color-text-primary, #fff)' }}
        >
          <div
            className="p-6 rounded-xl max-w-lg w-full space-y-4"
            style={{
              background: 'var(--color-surface, #1e1e1e)',
              border: '1px solid var(--color-border, #333)',
            }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-semibold">Render Error Encountered</h2>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary, #aaa)' }}>
              A UI component encountered an issue:
            </p>
            <pre
              className="text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap"
              style={{
                background: 'var(--color-base, #0a0a0a)',
                color: 'oklch(0.65 0.22 25)',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg text-xs font-medium cursor-pointer"
              style={{ background: 'var(--color-accent, #3b82f6)', color: '#fff' }}
            >
              Reload Studio
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
