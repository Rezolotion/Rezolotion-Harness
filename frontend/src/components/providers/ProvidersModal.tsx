import { useState } from 'react'
import type { Provider } from '@/types'
import { api } from '@/lib/api'
import { StatusDot } from '@/components/ui/status-dot'
import { getProviderIcon } from '@/components/ui/brand-icons'
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Terminal,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  LogOut,
  Sparkles,
} from 'lucide-react'

interface Props {
  providers: Provider[]
  onClose: () => void
  onRefresh: () => void
}

interface ConfigResult {
  success: boolean
  message: string
}

interface TestResult {
  success: boolean
  message: string
}

interface OAuthAuthorizeResponse {
  authUrl: string
  state: string
  codeVerifier?: string
  redirectUri?: string
}

export function ProvidersModal({ providers, onClose, onRefresh }: Props) {
  const [selected, setSelected] = useState<string>(providers[0]?.id ?? 'antigravity')
  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [copiedCli, setCopiedCli] = useState(false)

  const selectedProvider = providers.find(p => p.id === selected)

  const handleOAuthLogin = async (providerId: string) => {
    setOauthLoading(true)
    setStatus('Requesting official OAuth authorization url…')
    try {
      const oauthTarget = providerId === 'openai' ? 'codex' : providerId
      const res = await api.get<OAuthAuthorizeResponse>(`/api/oauth/${oauthTarget}/authorize`)
      if (res.authUrl) {
        window.open(res.authUrl, '_blank')
        setStatus('Browser authorization window opened. Complete login in browser…')
        // Poll for completion
        let attempts = 0
        const interval = setInterval(() => {
          attempts += 1
          onRefresh()
          if (attempts >= 10) {
            clearInterval(interval)
            setOauthLoading(false)
          }
        }, 3000)
      } else {
        setStatus('Failed: 9Router did not return authorization URL')
        setOauthLoading(false)
      }
    } catch (e: any) {
      setStatus(`OAuth request failed: ${e?.message || 'Server error'}`)
      setOauthLoading(false)
    }
  }

  const handleDisconnect = async (connId?: string | null) => {
    setLoading(true)
    setStatus('Disconnecting provider session…')
    try {
      if (connId) {
        await api.del(`/api/connections/${connId}`)
      } else {
        await api.post('/api/auth/configure', {
          provider_id: selected,
          api_key: '',
        })
      }
      setStatus('Disconnected successfully.')
      onRefresh()
    } catch (_) {
      setStatus('Disconnect failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    if (!selectedProvider) return
    setLoading(true)
    setStatus('Testing connection latency…')
    try {
      const res = await api.post<TestResult>('/api/auth/test', {
        provider_id: selected,
        api_key: keyInput || undefined,
      })
      setStatus(res.success ? (res.message || 'Connected successfully') : `Failed: ${res.message}`)
    } catch (_) {
      setStatus('Failed: Request timed out or server unavailable')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedProvider || !keyInput.trim()) return
    setLoading(true)
    setStatus('Writing to environment…')
    try {
      const res = await api.post<ConfigResult>('/api/auth/configure', {
        provider_id: selected,
        api_key: keyInput,
      })
      setStatus(res.success ? 'Key saved to .env' : `Save failed: ${res.message}`)
      onRefresh()
      setKeyInput('')
    } catch (_) {
      setStatus('Save failed: Disk write error')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCli = async (cmd: string) => {
    await navigator.clipboard.writeText(cmd)
    setCopiedCli(true)
    setTimeout(() => setCopiedCli(false), 2000)
  }

  const cliCmd =
    selected === 'claude'
      ? 'claude auth login'
      : selected === 'antigravity'
      ? 'gcloud auth application-default login'
      : 'ollama serve'

  const supportsOAuth = ['antigravity', 'claude', 'openai', 'codex'].includes(selected)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl flex flex-col border border-[var(--color-border)] shadow-2xl"
        style={{ background: 'var(--color-surface)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--color-elevated)]/50 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[var(--color-accent)]" />
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Multi-Provider Authentication Hub
              </h2>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Native zero-risk OAuth sessions, official CLI bridges, and API credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-elevated)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Provider Selection Column */}
          <div className="w-56 flex-shrink-0 overflow-y-auto py-2 border-r border-[var(--color-border)] bg-[var(--color-base)]/40">
            {providers.map(p => {
              const isSelected = selected === p.id
              const modelCount = p.models?.length || 0
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelected(p.id)
                    setKeyInput('')
                    setStatus('')
                  }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-[var(--color-elevated)] font-medium' : 'hover:bg-[var(--color-elevated)]/50'
                  }`}
                  style={{
                    color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  }}
                >
                  <div className="flex-shrink-0">{getProviderIcon(p.id, 'w-4 h-4', 16)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs truncate">{p.name}</div>
                    <div className="text-[10px] font-mono text-[var(--color-text-muted)]">
                      {p.connected ? `${modelCount} model${modelCount === 1 ? '' : 's'}` : 'Offline'}
                    </div>
                  </div>
                  <StatusDot connected={p.connected} size="sm" />
                </button>
              )
            })}
          </div>

          {/* Right: Configuration & Status Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            {selectedProvider && (
              <>
                {/* Active Connection Banner */}
                <div
                  className="flex items-center justify-between p-4 rounded-xl border"
                  style={{
                    background: selectedProvider.connected
                      ? 'oklch(0.20 0.04 145 / 0.3)'
                      : 'var(--color-elevated)',
                    borderColor: selectedProvider.connected
                      ? 'oklch(0.40 0.12 145 / 0.4)'
                      : 'var(--color-border)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <StatusDot connected={selectedProvider.connected} size="md" />
                    <div>
                      <h4 className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {selectedProvider.connected ? 'Active Session Connected' : 'Offline / Not Connected'}
                      </h4>
                      <p className="text-[11px] font-mono text-[var(--color-text-muted)] mt-0.5">
                        {selectedProvider.note || 'Ready for configuration'}
                      </p>
                      {selectedProvider.email && (
                        <p className="text-[11px] font-mono text-emerald-400 mt-0.5">
                          Account: {selectedProvider.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--color-base)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                    {selectedProvider.mode}
                  </span>
                </div>

                {/* OAuth Login Action Card (for AntiGravity, Claude, OpenAI Codex) */}
                {supportsOAuth && (
                  <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-elevated)]/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-primary)]">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span>Native 9Router OAuth Connection</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                        Zero Ban Risk
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                      Authenticate with your official {selectedProvider.name} account via browser OAuth. No API key required.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => void handleOAuthLogin(selected)}
                        disabled={oauthLoading}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--color-base)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-primary)] transition-all cursor-pointer shadow-sm hover:shadow-md"
                      >
                        {oauthLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        ) : (
                          getProviderIcon(selected, 'w-3.5 h-3.5', 14)
                        )}
                        <span>
                          {selectedProvider.connected ? 'Re-authenticate with OAuth' : `Sign in with ${selectedProvider.name}`}
                        </span>
                        <ExternalLink className="w-3 h-3 text-[var(--color-text-muted)]" />
                      </button>

                      {selectedProvider.connected && (
                        <button
                          onClick={() => void handleDisconnect(selectedProvider.connection_id)}
                          disabled={loading}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Disconnect</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* CLI Native Instructions */}
                {selectedProvider.mode === 'cli' && (
                  <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-elevated)] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-primary)]">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      <span>Zero-Risk Native CLI Execution</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                      Rezolotion uses your local official CLI session directly without reverse-proxy scrapers or session hijacking.
                    </p>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--color-base)] border border-[var(--color-border)] font-mono text-xs">
                      <span className="text-emerald-400">$ {cliCmd}</span>
                      <button
                        onClick={() => void handleCopyCli(cliCmd)}
                        className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                      >
                        {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCli ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Unlocked Models List */}
                {selectedProvider.connected && (selectedProvider.models?.length || 0) > 0 && (
                  <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-base)]/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        Unlocked Active Models ({selectedProvider.models?.length})
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">Ready in Studio</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                      {selectedProvider.models?.map(m => (
                        <span
                          key={m}
                          className="px-2 py-0.5 rounded-md text-[11px] font-mono border border-[var(--color-border)] bg-[var(--color-elevated)] text-[var(--color-text-secondary)]"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* API Key Form (Secondary or Primary) */}
                <div className="space-y-2 pt-1 border-t border-[var(--color-border)]/60">
                  <label className="flex items-center justify-between text-xs font-medium text-[var(--color-text-secondary)]">
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>{selectedProvider.env_var || 'API Key (Optional / Alternate)'}</span>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)]">Saved locally to .env</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={keyInput}
                      onChange={e => setKeyInput(e.target.value)}
                      placeholder="sk-••••••••••••••••••••••••"
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl text-xs font-mono outline-none bg-[var(--color-base)] border border-[var(--color-border)] focus:border-[var(--color-accent)] text-[var(--color-text-primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    onClick={() => void handleTest()}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[var(--color-elevated)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] text-[var(--color-text-primary)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Test Latency</span>
                  </button>

                  <button
                    onClick={() => void handleSave()}
                    disabled={loading || !keyInput.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-accent)] text-white hover:opacity-95 transition-all cursor-pointer disabled:opacity-40"
                  >
                    <span>Save Key</span>
                  </button>
                </div>

                {/* Status Feedback */}
                {status && (
                  <div className="flex items-center gap-2 text-xs font-mono">
                    {status.includes('successfully') || status.includes('saved') || status.includes('active') ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : status.includes('Failed') || status.includes('failed') ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
                    )}
                    <span
                      style={{
                        color:
                          status.includes('successfully') || status.includes('saved') || status.includes('active')
                            ? '#34d399'
                            : status.includes('Failed') || status.includes('failed')
                            ? '#f87171'
                            : 'var(--color-text-muted)',
                      }}
                    >
                      {status}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

