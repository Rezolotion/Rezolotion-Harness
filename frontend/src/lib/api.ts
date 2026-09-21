const BASE = 'http://localhost:8000'

export const api = {
  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`)
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return res.json() as Promise<T>
  },
  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return res.json() as Promise<T>
  },
  async del(path: string): Promise<void> {
    const res = await fetch(`${BASE}${path}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  },

  ws(sessionId: string): WebSocket {
    return new WebSocket(`ws://localhost:8000/ws/chat/${sessionId}`)
  },
}
