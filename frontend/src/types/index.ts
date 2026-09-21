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
  is_dir: boolean
  size?: number
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

export interface TokenTypeStat {
  name: string
  value: number
  color?: string
}

export interface ModelTokenStat {
  model: string
  tokens: number
}

export interface ToolStatItem {
  tool: string
  calls: number
  success: number
}

export interface TelemetryStats {
  total_tokens: number
  total_sessions: number
  total_turns: number
  total_errors: number
  p95_duration_ms: number
  tokens_by_type: TokenTypeStat[]
  tokens_by_model: ModelTokenStat[]
  tool_stats: ToolStatItem[]
  tool_outcomes: {
    success: number
    error: number
  }
  errors_by_category: Record<string, number>
}
