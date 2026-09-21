import { useState, useRef, type KeyboardEvent } from 'react'
import type { Provider } from '@/types'

const MODELS: Record<string, string[]> = {
  claude: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
  antigravity: ['gemini-2.5-pro', 'gemini-2.5-flash'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'o3'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  openrouter: ['auto'],
  hermes: ['hermes-3-llama-3.1-70b'],
  ninerouter: ['auto'],
}

interface Props {
  providers: Provider[]
  streaming: boolean
  tokenCount: number
  maxTokens?: number
  onSend: (content: string, provider: string, model: string) => void
}

export function Composer({ providers, streaming, tokenCount, maxTokens = 200000, onSend }: Props) {
  const [text, setText] = useState('')
  const [providerPop, setProviderPop] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>(
    providers.find(p => p.connected)?.id ?? providers[0]?.id ?? 'claude'
  )
  const [selectedModel, setSelectedModel] = useState<string>(
    MODELS[providers.find(p => p.connected)?.id ?? 'claude']?.[0] ?? 'claude-opus-4-5'
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const connectedProviders = providers.filter(p => p.connected)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || streaming) return
    onSend(trimmed, selectedProvider, selectedModel)
    setText('')
  }

  const approxTokens = Math.ceil(text.length / 4) + tokenCount
  const tokenPct = Math.min((approxTokens / maxTokens) * 100, 100)
  const tokenColor =
    tokenPct > 80 ? 'oklch(0.65 0.22 25)' :
    tokenPct > 50 ? 'oklch(0.78 0.18 75)' :
    'var(--color-accent)'

  return (
    <div
      className="flex flex-col"
      style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        padding: '12px 16px',
        gap: '8px',
      }}
    >
      {/* Token gauge */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex-1 h-px rounded-full overflow-hidden"
          style={{ background: 'var(--color-border)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${tokenPct}%`, background: tokenColor }}
          />
        </div>
        <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
          {approxTokens.toLocaleString()} / {(maxTokens / 1000).toFixed(0)}K
        </span>
      </div>

      {/* Textarea */}
      <div
        className="relative rounded-xl"
        style={{
          background: 'var(--color-base)',
          border: '1px solid var(--color-border)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={streaming}
          rows={3}
          placeholder="Message… (Enter to send, Shift+Enter for newline)"
          className="w-full px-4 pt-3 pb-2 resize-none text-sm outline-none bg-transparent"
          style={{
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-sans)',
            lineHeight: '1.5',
          }}
        />

        {/* Bottom bar inside textarea area */}
        <div className="flex items-center gap-2 px-3 pb-2.5">
          {/* Provider / model selector */}
          <div className="relative">
            <button
              onClick={() => setProviderPop(p => !p)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              style={{
                background: 'var(--color-elevated)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {selectedProvider}
              <span className="text-xs opacity-50 font-mono">{selectedModel.split('-').pop()}</span>
              <span style={{ fontSize: 9 }}>▾</span>
            </button>

            {providerPop && (
              <div
                className="absolute bottom-full mb-1.5 left-0 rounded-xl overflow-hidden z-20"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  minWidth: '200px',
                }}
              >
                {(connectedProviders.length > 0 ? connectedProviders : providers).map(p => {
                  const models = MODELS[p.id] ?? ['default']
                  return (
                    <div key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <div
                        className="px-3 py-1.5 text-xs font-semibold"
                        style={{ color: 'var(--color-text-muted)', background: 'var(--color-elevated)' }}
                      >
                        {p.name}
                      </div>
                      {models.map(m => (
                        <button
                          key={m}
                          onClick={() => {
                            setSelectedProvider(p.id)
                            setSelectedModel(m)
                            setProviderPop(false)
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs cursor-pointer transition-colors"
                          style={{
                            color: selectedProvider === p.id && selectedModel === m
                              ? 'var(--color-text-primary)'
                              : 'var(--color-text-secondary)',
                            background: selectedProvider === p.id && selectedModel === m
                              ? 'var(--color-elevated)'
                              : 'transparent',
                            fontFamily: 'var(--font-mono)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-elevated)')}
                          onMouseLeave={e => {
                            if (!(selectedProvider === p.id && selectedModel === m))
                              e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Send button */}
          <button
            onClick={submit}
            disabled={!text.trim() || streaming}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
            style={{
              background: 'var(--color-accent)',
              color: '#000',
            }}
          >
            {streaming ? (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: '#000' }}
                />
                Streaming
              </span>
            ) : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
