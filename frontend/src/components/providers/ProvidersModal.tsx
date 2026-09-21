import { useState } from 'react'
import type { Provider } from '@/types'
import { api } from '@/lib/api'
import { StatusDot } from '@/components/ui/status-dot'

const PROVIDER_ICONS: Record<string, string> = {
  claude: '◆',
  antigravity: '✦',
  openai: '⬡',
  deepseek: '◈',
  openrouter: '⊕',
  hermes: '⊞',
  ninerouter: '⊛',
}

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

export function ProvidersModal({ providers, onClose, onRefresh }: Props) {
  const [selected, setSelected] = useState<string>(providers[0]?.id ?? '')
  const [keyInput, setKeyInput] = useState('')
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const selectedProvider = providers.find(p => p.id === selected)

  const handleTest = async () => {
    if (!selectedProvider) return
    setLoading(true)
    setStatus('Testing connection...')
    try {
      const res = await api.post<TestResult>('/api/auth/test', {
        provider_id: selected,
        api_key: keyInput || undefined,
      })
      setStatus(res.success ? '✓ Connected' : `✗ ${res.message}`)
    } catch (e) {
      setStatus('✗ Request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedProvider || !keyInput.trim()) return
    setLoading(true)
    setStatus('Saving...')
    try {
      const res = await api.post<ConfigResult>('/api/auth/configure', {
        provider_id: selected,
        api_key: keyInput,
      })
      setStatus(res.success ? '✓ Saved' : `✗ ${res.message}`)
      onRefresh()
      setKeyInput('')
    } catch (e) {
      setStatus('✗ Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-[680px] max-h-[80vh] overflow-hidden rounded-xl flex flex-col"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Connect Providers</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Configure API keys or use native CLI sessions
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-xs transition-colors cursor-pointer"
            style={{ color: 'var(--color-text-muted)', background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-elevated)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: provider list */}
          <div className="w-48 flex-shrink-0 overflow-y-auto py-2" style={{ borderRight: '1px solid var(--color-border)' }}>
            {providers.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelected(p.id); setKeyInput(''); setStatus('') }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors cursor-pointer"
                style={{
                  background: selected === p.id ? 'var(--color-elevated)' : 'transparent',
                  color: selected === p.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                }}
              >
                <span className="text-base leading-none">{PROVIDER_ICONS[p.id] ?? '○'}</span>
                <span className="text-xs font-medium flex-1">{p.name}</span>
                <StatusDot connected={p.connected} size="sm" />
              </button>
            ))}
          </div>

          {/* Right: config panel */}
          <div className="flex-1 p-5 overflow-y-auto">
            {selectedProvider && (
              <div className="space-y-4">
                {/* Status banner */}
                <div
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg"
                  style={{
                    background: selectedProvider.connected
                      ? 'oklch(0.25 0.07 145 / 0.35)'
                      : 'var(--color-elevated)',
                    border: `1px solid ${selectedProvider.connected ? 'oklch(0.45 0.15 145 / 0.4)' : 'var(--color-border)'}`,
                  }}
                >
                  <StatusDot connected={selectedProvider.connected} size="md" />
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {selectedProvider.connected ? 'Connected' : 'Not connected'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{selectedProvider.note}</p>
                  </div>
                </div>

                {/* Mode badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Auth mode:</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-mono"
                    style={{ background: 'var(--color-elevated)', color: 'var(--color-accent)' }}
                  >
                    {selectedProvider.mode}
                  </span>
                </div>

                {/* API key input (skip for CLI-only providers) */}
                {selectedProvider.mode !== 'cli' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      {selectedProvider.env_var ?? 'API Key'}
                    </label>
                    <input
                      type="password"
                      value={keyInput}
                      onChange={e => setKeyInput(e.target.value)}
                      placeholder="sk-••••••••••••••••"
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono outline-none"
                      style={{
                        background: 'var(--color-base)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>
                )}

                {/* CLI note for native providers */}
                {selectedProvider.mode === 'cli' && (
                  <div
                    className="rounded-lg px-3.5 py-3 text-xs"
                    style={{
                      background: 'var(--color-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    Uses native CLI session. Run <span style={{ color: 'var(--color-accent)' }}>claude auth login</span> or{' '}
                    <span style={{ color: 'var(--color-accent)' }}>antigravity login</span> in your terminal.
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => void handleTest()}
                    disabled={loading}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    style={{
                      background: 'var(--color-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Test connection
                  </button>
                  {selectedProvider.mode !== 'cli' && (
                    <button
                      onClick={() => void handleSave()}
                      disabled={loading || !keyInput.trim()}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                      style={{
                        background: 'var(--color-accent)',
                        color: '#000',
                      }}
                    >
                      Save key
                    </button>
                  )}
                </div>

                {/* Feedback */}
                {status && (
                  <p
                    className="text-xs"
                    style={{
                      color: status.startsWith('✓')
                        ? 'oklch(0.72 0.19 145)'
                        : status.startsWith('✗')
                        ? 'oklch(0.65 0.22 25)'
                        : 'var(--color-text-muted)',
                    }}
                  >
                    {status}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
