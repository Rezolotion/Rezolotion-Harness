import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import type {
  Provider,
  Project,
  TelemetryStats,
  ChatMessage,
  ModelOption,
  ExecutionType,
  MultiModelResponseItem,
  AgentTeamRoleOutput,
} from '@/types'
import type { ExecutionStep } from '@/components/chat/TaskStepTracker'

// ─────────────────────────────────────────────────────────────────────────────
// Project & Thread CRUD API Helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteProject(id: string): Promise<void> {
  await api.del(`/api/projects/${id}`)
}

export async function renameProject(id: string, name: string): Promise<Project> {
  return await api.put<Project>(`/api/projects/${id}`, { name })
}

export async function deleteThread(id: string): Promise<void> {
  await api.del(`/api/threads/${id}`)
}

export async function renameThread(id: string, title: string): Promise<void> {
  await api.put<void>(`/api/threads/${id}`, { title })
}

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
  email?: string | null
  connection_id?: string | null
  endpoint?: string | null
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
    mode: p.auth_method.toLowerCase().includes('cli')
      ? 'cli'
      : p.auth_method.toLowerCase().includes('oauth')
      ? 'oauth'
      : id === 'gcat' || id === 'custom' || p.type === 'gateway'
      ? 'gateway'
      : 'api_key',
    env_var:
      id === 'gcat'
        ? 'GCAT_API_KEY'
        : id === 'custom'
        ? 'CUSTOM_API_KEY'
        : p.type.includes('api')
        ? `${id.toUpperCase()}_API_KEY`
        : null,
    note: p.details,
    models: p.models || [],
    email: p.email,
    auth_method: p.auth_method,
    connection_id: p.connection_id,
    endpoint: p.endpoint,
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

export function useModels() {
  const [models, setModels] = useState<ModelOption[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ models: ModelOption[] }>('/api/models')
      setModels(data.models || [])
    } catch (e) {
      console.error('useModels:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  return { models, loading, refresh }
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
  const [streamThinking, setStreamThinking] = useState('')
  const [activeSteps, setActiveSteps] = useState<ExecutionStep[]>([])
  const [tokenCount, setTokenCount] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const msgIdRef = useRef(0)

  useEffect(() => {
    return () => { wsRef.current?.close() }
  }, [sessionId])

  const sendMessage = useCallback(
    (
      content: string,
      provider: string,
      model: string,
      mode: string = 'build',
      chatMode: ExecutionType = 'single',
      models?: ModelOption[]
    ) => {
      const ws = api.ws(sessionId)
      wsRef.current = ws
      setStreaming(true)
      setStreamText('')
      setStreamThinking('')
      setActiveSteps([])

      const userMsg: ChatMessage = {
        id: String(++msgIdRef.current),
        role: 'user',
        content,
        timestamp: Date.now(),
        execution_type: chatMode,
      }
      setMessages(prev => [...prev, userMsg])

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            content,
            provider,
            model,
            mode,
            chat_mode: chatMode,
            models:
              models && models.length > 0
                ? models.map(m => ({ provider: m.provider, model: m.id }))
                : [{ provider, model }],
          })
        )
      }

      let buffer = ''
      let thinkingBuffer = ''

      ws.onmessage = (ev: MessageEvent) => {
        try {
          const evt = JSON.parse(ev.data as string) as {
            type: string
            step_id?: string
            title?: string
            tool?: string
            input?: string
            output?: string
            status?: 'running' | 'completed' | 'failed' | 'pending'
            duration_ms?: number
            text?: string
            harness?: string
            model?: string
            content?: string
            tokens_used?: number
            responses?: MultiModelResponseItem[]
            agent_team_report?: AgentTeamRoleOutput[]
          }

          if (evt.type === 'step_start') {
            const step: ExecutionStep = {
              id: evt.step_id || String(Date.now()),
              title: evt.title || `Executing with ${provider}`,
              toolName: evt.tool || 'run_command',
              input: evt.input,
              status: 'running',
            }
            setActiveSteps(prev => [...prev.filter(s => s.id !== step.id), step])
          } else if (evt.type === 'step_output') {
            setActiveSteps(prev =>
              prev.map(s => (s.id === evt.step_id ? { ...s, output: evt.output } : s))
            )
          } else if (evt.type === 'step_finish') {
            setActiveSteps(prev =>
              prev.map(s =>
                s.id === evt.step_id
                  ? {
                      ...s,
                      status: (evt.status as 'completed' | 'failed') || 'completed',
                      durationMs: evt.duration_ms || s.durationMs,
                      output: evt.output ?? s.output,
                    }
                  : s
              )
            )
          } else if (evt.type === 'thinking_delta' && evt.text) {
            thinkingBuffer += evt.text
            setStreamThinking(thinkingBuffer)
          } else if (evt.type === 'text_delta' && evt.text) {
            buffer += evt.text
            setStreamText(buffer)
            setTokenCount(t => t + Math.ceil(evt.text!.length / 4))
          } else if (evt.type === 'multi_model_done') {
            const assistantMsg: ChatMessage = {
              id: String(++msgIdRef.current),
              role: 'assistant',
              content: 'Parallel multi-model comparison evaluation completed.',
              execution_type: 'multi_model',
              multi_model_responses: evt.responses,
              tokens_used: evt.tokens_used,
              timestamp: Date.now(),
            }
            setMessages(prev => [...prev, assistantMsg])
            setStreamText('')
            setStreamThinking('')
            setStreaming(false)
            ws.close()
          } else if (evt.type === 'multi_agent_done') {
            const assistantMsg: ChatMessage = {
              id: String(++msgIdRef.current),
              role: 'assistant',
              content: evt.content || 'Multi-agent engineering report completed.',
              execution_type: 'multi_agent',
              agent_team_report: evt.agent_team_report,
              tokens_used: evt.tokens_used,
              timestamp: Date.now(),
            }
            setMessages(prev => [...prev, assistantMsg])
            setStreamText('')
            setStreamThinking('')
            setStreaming(false)
            ws.close()
          } else if (evt.type === 'message_stop' || evt.type === 'done') {
            const assistantMsg: ChatMessage = {
              id: String(++msgIdRef.current),
              role: 'assistant',
              content: buffer || evt.content || '',
              provider: evt.harness || provider,
              model: evt.model || model,
              thinking: thinkingBuffer || undefined,
              tokens_used: evt.tokens_used,
              timestamp: Date.now(),
              execution_type: 'single',
            }
            setMessages(prev => [...prev, assistantMsg])
            setStreamText('')
            setStreamThinking('')
            setStreaming(false)
            ws.close()
          }
        } catch (_) {
          /* skip malformed */
        }
      }

      ws.onclose = () => setStreaming(false)
      ws.onerror = () => setStreaming(false)
    },
    [sessionId]
  )

  return {
    messages,
    streaming,
    streamText,
    streamThinking,
    activeSteps,
    tokenCount,
    sendMessage,
    setMessages,
    setActiveSteps,
  }
}
