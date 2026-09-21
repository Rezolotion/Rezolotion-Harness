import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import type { Provider, Project, TelemetryStats, ChatMessage } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Raw API response types (match actual backend shape)
// ─────────────────────────────────────────────────────────────────────────────

interface RawProvider {
  name: string
  type: string
  connected: boolean
  auth_method: string
  details: string
  models: string[]
  has_key: boolean
}

interface RawThread {
  id: string
  project_id: string
  title: string
  harness: string
  model: string
  pinned: number
  created_at: string
  updated_at: string
}

interface RawProject {
  id: string
  name: string
  root_path: string
  description: string
  pinned: number
  created_at: string
  threads: RawThread[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalizers
// ─────────────────────────────────────────────────────────────────────────────

function normalizeProviders(raw: Record<string, RawProvider>): Provider[] {
  return Object.entries(raw).map(([id, p]) => ({
    id,
    name: p.name,
    icon: '',
    connected: p.connected,
    mode: p.auth_method.toLowerCase().includes('cli') ? 'cli' : 'api_key',
    env_var: p.type.includes('api') ? `${id.toUpperCase()}_API_KEY` : null,
    note: p.details,
  }))
}

function normalizeProjects(raw: RawProject[]): Project[] {
  return raw.map(p => ({
    id: p.id,
    name: p.name,
    root_path: p.root_path,
    description: p.description,
    created_at: p.created_at,
    thread_count: p.threads.length,
    threads: p.threads.map(t => ({
      id: t.id,
      project_id: t.project_id,
      title: t.title,
      provider: t.harness,
      created_at: t.created_at,
      message_count: 0,
    })),
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<Record<string, RawProvider>>('/api/auth/providers')
      setProviders(normalizeProviders(data))
    } catch (e) {
      console.error('useProviders:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  return { providers, loading, refresh }
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<RawProject[]>('/api/projects')
      setProjects(normalizeProjects(data))
    } catch (e) {
      console.error('useProjects:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  return { projects, loading, refresh }
}

export function useTelemetry() {
  const [stats, setStats] = useState<TelemetryStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<TelemetryStats>('/api/telemetry/stats')
      .then(setStats)
      .catch(e => console.error('useTelemetry:', e))
      .finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [tokenCount, setTokenCount] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const msgIdRef = useRef(0)

  useEffect(() => {
    return () => { wsRef.current?.close() }
  }, [sessionId])

  const sendMessage = useCallback((content: string, provider: string, model: string) => {
    const ws = api.ws(sessionId)
    wsRef.current = ws
    setStreaming(true)
    setStreamText('')

    const userMsg: ChatMessage = {
      id: String(++msgIdRef.current),
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])

    ws.onopen = () => {
      ws.send(JSON.stringify({ content, provider, model }))
    }

    let buffer = ''
    ws.onmessage = (ev: MessageEvent) => {
      try {
        const evt = JSON.parse(ev.data as string) as {
          type: string
          text?: string
          tokens_used?: number
        }
        if (evt.type === 'text_delta' && evt.text) {
          buffer += evt.text
          setStreamText(buffer)
          setTokenCount(t => t + Math.ceil(evt.text!.length / 4))
        } else if (evt.type === 'message_stop' || evt.type === 'done') {
          const assistantMsg: ChatMessage = {
            id: String(++msgIdRef.current),
            role: 'assistant',
            content: buffer,
            provider,
            model,
            tokens_used: evt.tokens_used,
            timestamp: Date.now(),
          }
          setMessages(prev => [...prev, assistantMsg])
          setStreamText('')
          setStreaming(false)
          ws.close()
        }
      } catch (_) { /* skip malformed */ }
    }

    ws.onclose = () => setStreaming(false)
    ws.onerror = () => setStreaming(false)
  }, [sessionId])

  return { messages, streaming, streamText, tokenCount, sendMessage }
}
