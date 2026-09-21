import { useState, useRef, type KeyboardEvent } from 'react'
import type { Provider } from '@/types'
import {
  Zap,
  FileText,
  MessageSquare,
  ChevronDown,
  ArrowUp,
  Sparkles,
  Command,
  Flame,
  Cpu,
} from 'lucide-react'
import { getProviderIcon } from '@/components/ui/brand-icons'
import { SlashCommandMenu, SlashCommand } from '@/components/chat/SlashCommandMenu'

export type AgentMode = 'build' | 'plan' | 'ask'

interface ModelTier {
  id: string
  name: string
  provider: string
  tier: 'Fast' | 'Reasoning' | 'Heavy'
  desc: string
}

const MODEL_TIERS: ModelTier[] = [
  // Fast
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 3.5', provider: 'claude', tier: 'Fast', desc: 'Ultra-low latency sub-second turn' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'antigravity', tier: 'Fast', desc: 'High-speed multimodal agent' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', tier: 'Fast', desc: 'Fast utility & test runner' },

  // Reasoning
  { id: 'claude-3-7-thinking', name: 'Claude 3.7 Thinking', provider: 'claude', tier: 'Reasoning', desc: 'Deep hybrid reasoning architecture' },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1', provider: 'deepseek', tier: 'Reasoning', desc: 'Open weights chain-of-thought engine' },
  { id: 'o3-mini', name: 'OpenAI o3-mini', provider: 'openai', tier: 'Reasoning', desc: 'Math, STEM & logic synthesis' },

  // Heavy / Expert
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'claude', tier: 'Heavy', desc: 'Flagship engineering & code autonomy' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'antigravity', tier: 'Heavy', desc: 'Massive 1M+ token context orchestration' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', tier: 'Heavy', desc: 'Universal reasoning and structured output' },
]

interface Props {
  providers?: Provider[]
  streaming: boolean
  tokenCount: number
  maxTokens?: number
  onSend: (content: string, provider: string, model: string, mode: AgentMode) => void
}

export function Composer({
  streaming,
  tokenCount,
  maxTokens = 200000,
  onSend,
}: Props) {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<AgentMode>('build')
  const [modelPop, setModelPop] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelTier>(MODEL_TIERS[6]) // Claude 3.7 Sonnet default
  const [showSlash, setShowSlash] = useState(false)
  const [slashFilter, setSlashFilter] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !showSlash) {
      e.preventDefault()
      submit()
    }
  }

  const handleTextChange = (val: string) => {
    setText(val)
    if (val.startsWith('/')) {
      setShowSlash(true)
      setSlashFilter(val)
    } else {
      setShowSlash(false)
    }
  }

  const handleSelectSlash = (cmd: SlashCommand) => {
    if (cmd.id === '/plan') setMode('plan')
    else if (cmd.id === '/build') setMode('build')
    else if (cmd.id === '/review') setMode('plan')
    setText(`${cmd.id} `)
    setShowSlash(false)
    textareaRef.current?.focus()
  }

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || streaming) return
    onSend(trimmed, selectedModel.provider, selectedModel.id, mode)
    setText('')
    setShowSlash(false)
  }

  const approxTokens = Math.ceil(text.length / 4) + tokenCount
  const tokenPct = Math.min((approxTokens / maxTokens) * 100, 100)

  return (
    <div className="relative mx-6 mb-4 flex-shrink-0">
      {/* Slash Command Popover */}
      {showSlash && (
        <SlashCommandMenu
          filter={slashFilter}
          onSelect={handleSelectSlash}
          onClose={() => setShowSlash(false)}
        />
      )}

      {/* Floating Island Container */}
      <div
        className="rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden transition-all duration-200"
        style={{ background: 'var(--color-surface)' }}
      >
        {/* Top Control Bar: Mode Switcher + Token Gauge */}
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-[var(--color-border)] bg-[var(--color-elevated)]/50">
          {/* Tri-mode Switcher */}
          <div className="flex items-center gap-1 bg-[var(--color-base)] p-1 rounded-lg border border-[var(--color-border)]">
            <button
              onClick={() => setMode('build')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mode === 'build'
                  ? 'bg-[var(--color-elevated)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Build</span>
            </button>
            <button
              onClick={() => setMode('plan')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mode === 'plan'
                  ? 'bg-[var(--color-elevated)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Plan</span>
            </button>
            <button
              onClick={() => setMode('ask')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mode === 'ask'
                  ? 'bg-[var(--color-elevated)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ask</span>
            </button>
          </div>

          {/* Token Gauge */}
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)]">
            <div className="w-20 h-1.5 bg-[var(--color-base)] rounded-full overflow-hidden border border-[var(--color-border)]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${tokenPct}%`,
                  background:
                    tokenPct > 80
                      ? 'oklch(0.65 0.22 25)'
                      : tokenPct > 50
                      ? 'oklch(0.78 0.18 75)'
                      : 'var(--color-accent)',
                }}
              />
            </div>
            <span>
              {(approxTokens / 1000).toFixed(1)}k / {(maxTokens / 1000).toFixed(0)}k
            </span>
          </div>
        </div>

        {/* Text Area */}
        <div className="p-3 bg-[var(--color-base)]">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            rows={3}
            placeholder={
              mode === 'build'
                ? 'Type instructions or code to build... (type / for commands)'
                : mode === 'plan'
                ? 'Describe architectural goals or ask for system plan...'
                : 'Ask a fast question about the workspace or code...'
            }
            className="w-full resize-none text-xs leading-relaxed outline-none bg-transparent font-sans"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>

        {/* Bottom Bar: Model Selector + Quick Slash button + Send */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--color-elevated)] border-t border-[var(--color-border)]">
          {/* Model Selector Popover */}
          <div className="relative">
            <button
              onClick={() => setModelPop(prev => !prev)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all cursor-pointer shadow-sm"
            >
              <span className="flex items-center justify-center">
                {getProviderIcon(selectedModel.provider, 'w-3.5 h-3.5', 14)}
              </span>
              <span className="font-mono text-[11px]" style={{ color: 'var(--color-text-primary)' }}>
                {selectedModel.name}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--color-base)] text-[var(--color-text-muted)]">
                {selectedModel.tier}
              </span>
              <ChevronDown className="w-3 h-3 text-[var(--color-text-muted)]" />
            </button>

            {/* Popover Dropdown */}
            {modelPop && (
              <div
                className="absolute bottom-full mb-2 left-0 w-80 rounded-xl overflow-hidden border border-[var(--color-border)] shadow-2xl z-30"
                style={{ background: 'var(--color-surface)' }}
              >
                <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
                  {(['Reasoning', 'Heavy', 'Fast'] as const).map(tier => {
                    const tierModels = MODEL_TIERS.filter(m => m.tier === tier)
                    return (
                      <div key={tier} className="mb-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
                          {tier === 'Reasoning' && <Cpu className="w-3 h-3 text-purple-400" />}
                          {tier === 'Heavy' && <Flame className="w-3 h-3 text-amber-400" />}
                          {tier === 'Fast' && <Zap className="w-3 h-3 text-blue-400" />}
                          <span>{tier} Tier</span>
                        </div>
                        {tierModels.map(m => {
                          const isSelected = selectedModel.id === m.id
                          return (
                            <button
                              key={m.id}
                              onClick={() => {
                                setSelectedModel(m)
                                setModelPop(false)
                              }}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[var(--color-elevated)] border border-[var(--color-border)]'
                                  : 'hover:bg-[var(--color-elevated)]/60'
                              }`}
                            >
                              <div className="flex-shrink-0">{getProviderIcon(m.provider, 'w-4 h-4', 16)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-mono font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                                  {m.name}
                                </div>
                                <div className="text-[10px] truncate text-[var(--color-text-muted)]">
                                  {m.desc}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Group */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowSlash(true)
                setSlashFilter('')
              }}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer border border-transparent hover:border-[var(--color-border)]"
              title="Slash commands"
            >
              <Command className="w-3 h-3" />
              <span>/</span>
            </button>

            <button
              onClick={submit}
              disabled={!text.trim() || streaming}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 shadow-sm"
              style={{
                background: 'var(--color-accent)',
                color: '#fff',
              }}
            >
              {streaming ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking…</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <ArrowUp className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
