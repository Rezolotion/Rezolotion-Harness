import { useState, useMemo, useRef, useEffect, KeyboardEvent } from 'react'
import type { ModelOption } from '@/types'
import {
  Search,
  Check,
  Zap,
  Cpu,
  Flame,
  X,
  Plus,
} from 'lucide-react'
import { getProviderIcon } from '@/components/ui/brand-icons'

interface Props {
  models: ModelOption[]
  selectedModel: ModelOption | null
  selectedModels?: ModelOption[]
  isMultiModelMode?: boolean
  onSelect: (model: ModelOption) => void
  onToggleMultiModel?: (model: ModelOption) => void
  onClose: () => void
}

export function ModelPickerPopover({
  models,
  selectedModel,
  selectedModels = [],
  isMultiModelMode = false,
  onSelect,
  onToggleMultiModel,
  onClose,
}: Props) {
  const [search, setSearch] = useState('')
  const [activeProvider, setActiveProvider] = useState<string>('all')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on Escape or click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Get active provider counts
  const providerCounts = useMemo(() => {
    const counts: Record<string, number> = { all: models.length }
    for (const m of models) {
      counts[m.provider] = (counts[m.provider] || 0) + 1
    }
    return counts
  }, [models])

  // Unique connected providers that have models
  const providerTabs = useMemo(() => {
    const pids = Object.keys(providerCounts).filter(p => p !== 'all' && providerCounts[p] > 0)
    return ['all', ...pids]
  }, [providerCounts])

  // Filtered models by search query and provider tab
  const filteredModels = useMemo(() => {
    let list = models
    if (activeProvider !== 'all') {
      list = list.filter(m => m.provider === activeProvider)
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          m.tier.toLowerCase().includes(q) ||
          m.desc.toLowerCase().includes(q)
      )
    }
    return list
  }, [models, activeProvider, search])

  // Quick picks: 3 top flagship / fast models
  const quickPicks = useMemo(() => {
    const picks: ModelOption[] = []
    const high = models.find(m => m.id.includes('3.8-flash-high') || m.id.includes('2.5-pro'))
    if (high) picks.push(high)
    const sonnet = models.find(m => m.id.includes('sonnet') || m.id.includes('claude'))
    if (sonnet && !picks.some(p => p.id === sonnet.id)) picks.push(sonnet)
    const reasoning = models.find(m => m.id.includes('reason') || m.id.includes('r1') || m.tier === 'Reasoning')
    if (reasoning && !picks.some(p => p.id === reasoning.id)) picks.push(reasoning)
    return picks.slice(0, 3)
  }, [models])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex(prev => (prev + 1 < filteredModels.length ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex(prev => (prev - 1 >= 0 ? prev - 1 : filteredModels.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredModels[highlightIndex]) {
        const target = filteredModels[highlightIndex]
        if (isMultiModelMode && onToggleMultiModel) {
          onToggleMultiModel(target)
        } else {
          onSelect(target)
          onClose()
        }
      }
    }
  }

  const isModelChecked = (modelId: string) => {
    if (isMultiModelMode) {
      return selectedModels.some(m => m.id === modelId)
    }
    return selectedModel?.id === modelId
  }

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full mb-2 left-0 w-[420px] rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-2xl z-40 font-sans animate-in fade-in zoom-in-95 duration-150"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Header & Instant Search Bar */}
      <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-elevated)]/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {isMultiModelMode ? 'Select Multi-Models to Compare' : 'Select Active Model'}
            </span>
            {isMultiModelMode && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-medium">
                {selectedModels.length} selected
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-base)] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-[var(--color-text-muted)] pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setHighlightIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search models, providers, or tiers (e.g. flash, sonnet, r1)..."
            className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs bg-[var(--color-base)] border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none font-mono placeholder:text-[var(--color-text-muted)]"
            style={{ color: 'var(--color-text-primary)' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Provider Filter Tabs (Zero-scroll jump) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
          {providerTabs.map(p => {
            const count = providerCounts[p] || 0
            const active = activeProvider === p
            const label =
              p === 'all'
                ? `All (${count})`
                : p === 'antigravity'
                ? `Google (${count})`
                : p === 'claude'
                ? `Claude (${count})`
                : p === 'openrouter'
                ? `OpenRouter (${count})`
                : p === 'hermes' || p === 'ollama'
                ? `Local (${count})`
                : `${p} (${count})`

            return (
              <button
                key={p}
                onClick={() => {
                  setActiveProvider(p)
                  setHighlightIndex(0)
                }}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-[var(--color-accent)] text-white font-medium shadow-sm'
                    : 'bg-[var(--color-base)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                }`}
              >
                {p !== 'all' && (
                  <span className="flex items-center">{getProviderIcon(p, 'w-3 h-3', 12)}</span>
                )}
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Picks Bar */}
      {!search && activeProvider === 'all' && quickPicks.length > 0 && (
        <div className="px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-base)] flex items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase text-[var(--color-text-muted)] mr-1">
            Top Picks:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {quickPicks.map(m => {
              const active = isModelChecked(m.id)
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (isMultiModelMode && onToggleMultiModel) {
                      onToggleMultiModel(m)
                    } else {
                      onSelect(m)
                      onClose()
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer border ${
                    active
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-semibold'
                      : 'border-[var(--color-border)] bg-[var(--color-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                  }`}
                >
                  {getProviderIcon(m.provider, 'w-3 h-3', 12)}
                  <span className="truncate max-w-[120px]">{m.name}</span>
                  {active && <Check className="w-3 h-3 text-[var(--color-accent)]" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* High-Density Compact Models List */}
      <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
        {filteredModels.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--color-text-muted)] space-y-1">
            <p>No models match &ldquo;{search}&rdquo;</p>
            <p className="text-[11px]">Check spelling or switch provider filter tab</p>
          </div>
        ) : (
          filteredModels.map((m, idx) => {
            const isChecked = isModelChecked(m.id)
            const isHighlighted = idx === highlightIndex

            return (
              <button
                key={m.id}
                onClick={() => {
                  if (isMultiModelMode && onToggleMultiModel) {
                    onToggleMultiModel(m)
                  } else {
                    onSelect(m)
                    onClose()
                  }
                }}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition-colors ${
                  isChecked
                    ? 'bg-[var(--color-elevated)] border border-[var(--color-accent)]/50 shadow-sm'
                    : isHighlighted
                    ? 'bg-[var(--color-elevated)]/80 border border-[var(--color-border)]'
                    : 'hover:bg-[var(--color-elevated)]/50 border border-transparent'
                }`}
              >
                {/* Left: Icon + Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex-shrink-0">{getProviderIcon(m.provider, 'w-4 h-4', 16)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-mono font-medium truncate"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {m.name}
                      </span>
                      {/* Context badge if present */}
                      {(m.id.includes('3.8') || m.id.includes('2.5')) && (
                        <span className="text-[9px] font-mono px-1 rounded bg-blue-500/15 text-blue-400">
                          2M
                        </span>
                      )}
                      {(m.id.includes('sonnet') || m.id.includes('opus')) && (
                        <span className="text-[9px] font-mono px-1 rounded bg-orange-500/15 text-orange-400">
                          200k
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                      {m.id}
                    </div>
                  </div>
                </div>

                {/* Right: Tier Badge + Selection indicator */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span
                    className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded flex items-center gap-1 ${
                      m.tier === 'Reasoning'
                        ? 'bg-purple-500/15 text-purple-300'
                        : m.tier === 'Heavy'
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-emerald-500/15 text-emerald-300'
                    }`}
                  >
                    {m.tier === 'Reasoning' && <Cpu className="w-2.5 h-2.5" />}
                    {m.tier === 'Heavy' && <Flame className="w-2.5 h-2.5" />}
                    {m.tier === 'Fast' && <Zap className="w-2.5 h-2.5" />}
                    <span>{m.tier}</span>
                  </span>

                  {isMultiModelMode ? (
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                          : 'border-[var(--color-border)] bg-[var(--color-base)]'
                      }`}
                    >
                      {isChecked ? <Check className="w-3 h-3" /> : <Plus className="w-2.5 h-2.5 text-[var(--color-text-muted)]" />}
                    </div>
                  ) : (
                    isChecked && <Check className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer Hint */}
      <div className="px-3 py-1.5 bg-[var(--color-elevated)] border-t border-[var(--color-border)] flex items-center justify-between text-[10px] font-mono text-[var(--color-text-muted)]">
        <span>Use ↑↓ arrows to navigate, Enter to select</span>
        <span>{filteredModels.length} models</span>
      </div>
    </div>
  )
}
