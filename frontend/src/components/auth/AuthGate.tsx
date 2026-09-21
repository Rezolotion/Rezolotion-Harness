import { useState, useEffect, ReactNode } from 'react'
import { ShieldCheck, ArrowRight, Lock, User, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'

interface Props {
  children: ReactNode
}

export function AuthGate({ children }: Props) {
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [username, setUsername] = useState('developer')
  const [passphrase, setPassphrase] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('rezolotion_session_token')
    if (saved) {
      setSessionToken(saved)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await api.post<{ success: boolean; token: string; user: { username: string } }>(
        '/api/auth/login',
        { username, passphrase }
      )
      if (res.success && res.token) {
        localStorage.setItem('rezolotion_session_token', res.token)
        localStorage.setItem('rezolotion_user', res.user.username)
        setSessionToken(res.token)
      } else {
        setError('Authentication failed')
      }
    } catch (_) {
      setError('Connection error to auth daemon')
    } finally {
      setLoading(false)
    }
  }

  if (sessionToken) {
    return <>{children}</>
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen p-6 select-none font-sans"
      style={{
        background: 'var(--color-base, #09090b)',
        color: 'var(--color-text-primary, #fff)',
      }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl border border-[var(--color-border)] shadow-2xl space-y-6"
        style={{ background: 'var(--color-surface, #121215)' }}
      >
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border border-[var(--color-border)] shadow-lg"
            style={{ background: 'var(--color-elevated)' }}
          >
            <ShieldCheck className="w-6 h-6 text-[var(--color-accent)]" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Rezolotion Studio Auth
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] max-w-xs leading-relaxed">
            Local workspace session isolation. Authenticate to access projects and orchestrate agent harnesses.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
              <User className="w-3.5 h-3.5" />
              <span>Workspace Profile / Username</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              placeholder="e.g. developer"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none bg-[var(--color-base)] border border-[var(--color-border)] focus:border-[var(--color-accent)] text-[var(--color-text-primary)] font-mono transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
              <Lock className="w-3.5 h-3.5" />
              <span>Session Passphrase (Optional for Local)</span>
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none bg-[var(--color-base)] border border-[var(--color-border)] focus:border-[var(--color-accent)] text-[var(--color-text-primary)] font-mono transition-colors"
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-mono text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md hover:opacity-95 disabled:opacity-50"
            style={{
              background: 'var(--color-accent)',
              color: '#fff',
            }}
          >
            <span>{loading ? 'Initializing Session…' : 'Enter Studio Workspace'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-mono">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[var(--color-accent)]" />
            Zero-Ban Risk Native CLI
          </span>
          <span>v2.0 Production</span>
        </div>
      </div>
    </div>
  )
}
