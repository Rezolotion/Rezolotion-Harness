import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import type { Provider, Project, TelemetryStats, ChatMessage } from '@/types'

// ─── useProviders ────────────────────────────────────────────────────────────
export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ providers: Provider[] }>('/api/auth/providers')
      setProviders(data.providers)
    } catch (_) {
      // silently keep stale data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  return { providers, loading, refresh }
}

// ─── useProjects ─────────────────────────────────────────────────────────────
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ projects: Project[] }>('/api/projects')
      setProjects(data.projects)
    } catch (_) {
      // silently keep stale data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  return { projects, loading, refresh }
}

// ─── useTelemetry ────────────────────────────────────────────────────────────
export function useTelemetry() {
  const [stats, setStats] = useState<TelemetryStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<TelemetryStats>('/api/telemetry/stats')
      .then(setStats)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}

// ─── useChat ─────────────────────────────────────────────────────────────────
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

  const sendMessage = useCallback((
    content: string,
    provider: string,
    model: string,
  ) => {
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
