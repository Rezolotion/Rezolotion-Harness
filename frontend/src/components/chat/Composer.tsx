import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import type { Provider, ModelOption, ExecutionType } from '@/types'
import { useModels } from '@/hooks'
import {
  Zap,
  FileText,
  MessageSquare,
  ChevronDown,
  ArrowUp,
  Sparkles,
  Command,
  AlertCircle,
  Columns2,
  Users2,
  Plus,
  X,
} from 'lucide-react'
import { getProviderIcon } from '@/components/ui/brand-icons'
import { SlashCommandMenu, SlashCommand } from '@/components/chat/SlashCommandMenu'
import { ModelPickerPopover } from '@/components/chat/ModelPickerPopover'

export type AgentMode = 'build' | 'plan' | 'ask'
export type ExecutionPipelineMode = ExecutionType

interface Props {
  providers?: Provider[]
  streaming: boolean
  tokenCount: number
  maxTokens?: number
  onSend: (
    content: string,
    provider: string,
    model: string,
    mode: AgentMode,
    chatMode: ExecutionPipelineMode,
    models?: ModelOption[]
  ) => void
  onOpenProviders?: () => void
}

export function Composer({
  providers,
  streaming,
  tokenCount,
  maxTokens = 200000,
  onSend,
  onOpenProviders,
}: Props) {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<AgentMode>('build')
  const [execMode, setExecMode] = useState<ExecutionPipelineMode>('single')
  const [modelPop, setModelPop] = useState(false)
  const [showSlash, setShowSlash] = useState(false)
  const [slashFilter, setSlashFilter] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { models: fetchedModels } = useModels()

  // Dynamically filter models strictly to actively connected providers
  const availableModels = fetchedModels.filter(m => {
    if (!providers || providers.length === 0) return true
    const prov = providers.find(p => p.id === m.provider || (p.id === 'antigravity' && m.provider === 'antigravity'))
    return prov ? prov.connected : true
  })

  const [selectedModel, setSelectedModel] = useState<ModelOption | null>(null)
  const [selectedMultiModels, setSelectedMultiModels] = useState<ModelOption[]>([])

  useEffect(() => {
    if (availableModels.length > 0) {
      if (!selectedModel || !availableModels.some(m => m.id === selectedModel.id)) {
        const preferred =
          availableModels.find(m => m.id.includes('claude-3-7') || m.id.includes('gemini-3.8') || m.id.includes('gemini-3.7')) ||
          availableModels[0]
        setSelectedModel(preferred)
      }

      // Initialize multi models if empty
      if (selectedMultiModels.length === 0) {
        const top2 = availableModels.slice(0, 2)
        setSelectedMultiModels(top2)
      }
    } else {
      setSelectedModel(null)
      setSelectedMultiModels([])
    }
  }, [availableModels, selectedModel, selectedMultiModels.length])

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

  const handleToggleMultiModel = (target: ModelOption) => {
    setSelectedMultiModels(prev => {
      const exists = prev.some(m => m.id === target.id)
      if (exists) {
        if (prev.length <= 1) return prev // Keep at least 1
        return prev.filter(m => m.id !== target.id)
      }
      if (prev.length >= 4) return prev // Max 4
      return [...prev, target]
    })
  }

  const handleRemoveMultiModel = (modelId: string) => {
    if (selectedMultiModels.length <= 1) return
    setSelectedMultiModels(prev => prev.filter(m => m.id !== modelId))
  }

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || streaming) return

    if (execMode === 'single') {
      if (!selectedModel) return
      onSend(trimmed, selectedModel.provider, selectedModel.id, mode, 'single')
    } else if (execMode === 'multi_model') {
      if (selectedMultiModels.length === 0) return
      const primary = selectedMultiModels[0]
      onSend(trimmed, primary.provider, primary.id, mode, 'multi_model', selectedMultiModels)
    } else if (execMode === 'multi_agent') {
      const prov = selectedModel?.provider || 'claude'
      const mod = selectedModel?.id || 'claude-3-7-sonnet'
      onSend(trimmed, prov, mod, mode, 'multi_agent')
    }

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
        className="rounded-2xl border border-[var(--color-border)] shadow-2xl transition-all duration-200"
        style={{ background: 'var(--color-surface)' }}
      >
        {/* Top Control Bar: Execution Pipeline Mode + Turn Mode + Token Gauge */}
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-[var(--color-border)] bg-[var(--color-elevated)]/60 rounded-t-2xl">
          <div className="flex items-center gap-2">
            {/* Execution Engine Selector (Single, Multi-Model, Multi-Agent) */}
            <div className="flex items-center gap-1 bg-[var(--color-base)] p-1 rounded-lg border border-[var(--color-border)]">
              <button
                onClick={() => setExecMode('single')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  execMode === 'single'
                    ? 'bg-[var(--color-elevated)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
                title="Single Agent Turn"
              >
                <Sparkles className="w-3 h-3 text-[var(--color-accent)]" />
                <span>Single</span>
              </button>

              <button
                onClick={() => setExecMode('multi_model')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  execMode === 'multi_model'
                    ? 'bg-[var(--color-elevated)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
                title="Parallel Multi-Model Comparison"
              >
                <Columns2 className="w-3 h-3 text-cyan-400" />
                <span>Multi-Model</span>
              </button>

              <button
                onClick={() => setExecMode('multi_agent')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  execMode === 'multi_agent'
                    ? 'bg-[var(--color-elevated)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
                title="Autonomous Multi-Agent Team (Architect ➔ Coder ➔ Reviewer)"
              >
                <Users2 className="w-3 h-3 text-purple-400" />
                <span>Multi-Agent</span>
              </button>
            </div>

            <span className="w-px h-4 bg-[var(--color-border)]" />

            {/* Tri-mode Switcher */}
            <div className="flex items-center gap-1 bg-[var(--color-base)] p-1 rounded-lg border border-[var(--color-border)]">
              <button
                onClick={() => setMode('build')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  mode === 'build'
                    ? 'bg-[var(--color-elevated)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Build</span>
              </button>
              <button
                onClick={() => setMode('plan')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  mode === 'plan'
                    ? 'bg-[var(--color-elevated)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                <FileText className="w-3 h-3 text-blue-400" />
                <span>Plan</span>
              </button>
              <button
                onClick={() => setMode('ask')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  mode === 'ask'
                    ? 'bg-[var(--color-elevated)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                <MessageSquare className="w-3 h-3 text-emerald-400" />
                <span>Ask</span>
              </button>
            </div>
          </div>

          {/* Token Gauge */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--color-text-muted)]">
            <div className="w-16 h-1 bg-[var(--color-base)] rounded-full overflow-hidden border border-[var(--color-border)]">
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
              !selectedModel && availableModels.length === 0
                ? 'No LLM provider connected. Click below to add an account...'
                : execMode === 'multi_model'
                ? 'Enter prompt to execute across selected models simultaneously for side-by-side comparison...'
                : execMode === 'multi_agent'
                ? 'Enter high-level engineering task for the Architect ➔ Coder ➔ Reviewer autonomous team...'
                : mode === 'build'
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
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--color-elevated)] border-t border-[var(--color-border)] rounded-b-2xl">
          {/* Model Selector / Multi-Model Chips */}
          <div className="relative flex items-center gap-1.5 flex-wrap">
            {availableModels.length === 0 ? (
              <button
                type="button"
                onClick={onOpenProviders}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer shadow-sm"
                title="Click to authenticate a provider"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>No Connected Provider • Click to Connect</span>
              </button>
            ) : execMode === 'single' ? (
              /* Single Model Selector */
              selectedModel && (
                <>
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

                  {/* High-density zero-scroll model picker popover */}
                  {modelPop && (
                    <ModelPickerPopover
                      models={availableModels}
                      selectedModel={selectedModel}
                      onSelect={m => setSelectedModel(m)}
                      onClose={() => setModelPop(false)}
                    />
                  )}
                </>
              )
            ) : execMode === 'multi_model' ? (
              /* Multi-Model Chips & Add Button */
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedMultiModels.map(m => (
                  <span
                    key={m.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-mono bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm"
                  >
                    {getProviderIcon(m.provider, 'w-3 h-3', 12)}
                    <span className="text-[var(--color-text-primary)] font-medium truncate max-w-[130px]">
                      {m.name}
                    </span>
                    {selectedMultiModels.length > 1 && (
                      <button
                        onClick={() => handleRemoveMultiModel(m.id)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                        title="Remove model"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </span>
                ))}

                <button
                  onClick={() => setModelPop(prev => !prev)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] bg-[var(--color-base)] border border-dashed border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Model</span>
                </button>

                {modelPop && (
                  <ModelPickerPopover
                    models={availableModels}
                    selectedModel={selectedModel}
                    selectedModels={selectedMultiModels}
                    isMultiModelMode={true}
                    onSelect={() => {}}
                    onToggleMultiModel={handleToggleMultiModel}
                    onClose={() => setModelPop(false)}
                  />
                )}
              </div>
            ) : (
              /* Multi-Agent Team Badge */
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-mono shadow-sm">
                <span className="text-blue-400 font-medium">🧠 Architect</span>
                <span className="text-[var(--color-text-muted)]">➔</span>
                <span className="text-emerald-400 font-medium">⚡ Coder</span>
                <span className="text-[var(--color-text-muted)]">➔</span>
                <span className="text-amber-400 font-medium">🔍 Reviewer</span>
              </div>
            )}
          </div>

          {/* Right Action Group */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
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
              disabled={!text.trim() || streaming || availableModels.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 shadow-sm"
              style={{
                background: 'var(--color-accent)',
                color: '#fff',
              }}
            >
              {streaming ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    {execMode === 'multi_agent'
                      ? 'Team Working…'
                      : execMode === 'multi_model'
                      ? 'Comparing…'
                      : 'Thinking…'}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {execMode === 'multi_agent'
                      ? 'Dispatch Team'
                      : execMode === 'multi_model'
                      ? 'Compare Models'
                      : 'Send'}
                  </span>
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

