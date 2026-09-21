// ─── Provider ──────────────────────────────────────────────────────────────

export interface Provider {
  id: string
  name: string
  icon: string
  connected: boolean
  mode: 'cli' | 'api_key' | 'oauth'
  env_var: string | null
  note: string
}

export interface ProvidersResponse {
  providers: Provider[]
}

// ─── Projects ──────────────────────────────────────────────────────────────

export interface Thread {
  id: string
  project_id: string
  title: string
  provider: string
  created_at: string
  message_count: number
}

export interface Project {
  id: string
  name: string
  root_path: string
  description: string
  created_at: string
  thread_count: number
  threads: Thread[]
}

export interface ProjectsResponse {
  projects: Project[]
}

// ─── File System ────────────────────────────────────────────────────────────

export interface FSNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FSNode[]
}

// ─── Messages ───────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'tool' | 'system'

export interface ToolCall {
  name: string
  input?: unknown
  output?: unknown
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  provider?: string
  model?: string
  tool_calls?: ToolCall[]
  thinking?: string
  tokens_used?: number
  timestamp: number
}

// ─── Telemetry ──────────────────────────────────────────────────────────────

export interface TelemetryStats {
  total_turns: number
  total_sessions: number
  total_tokens_in: number
  total_tokens_out: number
  total_tokens: number
  total_errors: number
  tool_calls: number
  avg_tokens_per_turn: number
  tokens_by_model: Record<string, number>
  tokens_by_type: Record<string, number>
  recent_turns: RecentTurn[]
}

export interface RecentTurn {
  id: number
  session_id: string
  provider: string
  model: string
  tokens_in: number
  tokens_out: number
  tool_name: string | null
  error: number
  ts: number
}
