import { useTelemetry } from '@/hooks'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'

const PALETTE = [
  'oklch(0.72 0.19 260)',
  'oklch(0.72 0.19 145)',
  'oklch(0.78 0.18 75)',
  'oklch(0.65 0.22 25)',
  'oklch(0.72 0.19 310)',
]

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-xl px-4 py-3.5 space-y-0.5"
      style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}
    >
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      <p className="text-xl font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>}
    </div>
  )
}

export function ObservabilityDashboard() {
  const { stats, loading } = useTelemetry()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xs animate-pulse" style={{ color: 'var(--color-text-muted)' }}>Loading telemetry…</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No telemetry data</p>
      </div>
    )
  }

  // Prepare area chart data from recent turns (group by hour)
  const hourMap: Record<string, number> = {}
  stats.recent_turns.forEach(t => {
    const h = new Date(t.ts * 1000).getHours()
    const key = `${h}:00`
    hourMap[key] = (hourMap[key] ?? 0) + t.tokens_out
  })
  const areaData = Object.entries(hourMap)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([hour, tokens]) => ({ hour, tokens }))

  // Tokens by model bar data
  const barData = Object.entries(stats.tokens_by_model).map(([model, tokens]) => ({
    model: model.split('-').slice(-2).join('-'),
    tokens,
  }))

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      <div>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          LLM Observability
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Live usage and performance metrics
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total turns"
          value={stats.total_turns.toLocaleString()}
          sub={`${stats.total_sessions} sessions`}
        />
        <StatCard
          label="Total tokens"
          value={`${(stats.total_tokens / 1_000_000).toFixed(2)}M`}
          sub={`${stats.avg_tokens_per_turn.toFixed(0)} avg / turn`}
        />
        <StatCard
          label="Tool calls"
          value={stats.tool_calls.toLocaleString()}
        />
        <StatCard
          label="Errors"
          value={stats.total_errors.toLocaleString()}
          sub={`${((stats.total_errors / Math.max(stats.total_turns, 1)) * 100).toFixed(1)}% rate`}
        />
      </div>

      {/* Token trend */}
      {areaData.length > 0 && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Output tokens / hour (recent)
          </p>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={areaData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="tokGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              <Area
                type="monotone"
                dataKey="tokens"
                stroke="var(--color-accent)"
                strokeWidth={1.5}
                fill="url(#tokGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tokens by model */}
      {barData.length > 0 && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Tokens by model
          </p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="model" tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              <Bar dataKey="tokens" radius={[3, 3, 0, 0]}>
                {barData.map((_, idx) => (
                  <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent turns table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div
          className="px-4 py-2.5 text-xs font-medium"
          style={{
            background: 'var(--color-elevated)',
            color: 'var(--color-text-secondary)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          Recent turns
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Provider', 'Model', 'In', 'Out', 'Tool', 'Err'].map(h => (
                  <th
                    key={h}
                    className="px-3 py-1.5 text-left font-medium"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recent_turns.slice(0, 15).map(turn => (
                <tr
                  key={turn.id}
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                  <td className="px-3 py-1.5">{turn.provider}</td>
                  <td className="px-3 py-1.5 font-mono" style={{ fontSize: 10 }}>
                    {turn.model.split('-').slice(-2).join('-')}
                  </td>
                  <td className="px-3 py-1.5 tabular-nums">{turn.tokens_in.toLocaleString()}</td>
                  <td className="px-3 py-1.5 tabular-nums">{turn.tokens_out.toLocaleString()}</td>
                  <td className="px-3 py-1.5" style={{ color: turn.tool_name ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                    {turn.tool_name ?? '—'}
                  </td>
                  <td className="px-3 py-1.5" style={{ color: turn.error ? 'oklch(0.65 0.22 25)' : 'var(--color-text-muted)' }}>
                    {turn.error ? '✗' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
