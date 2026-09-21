import { useTelemetry } from '@/hooks'
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie,
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
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-xs animate-pulse" style={{ color: 'var(--color-text-muted)' }}>Loading telemetry…</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No telemetry data recorded yet.</p>
      </div>
    )
  }

  const modelData = Array.isArray(stats.tokens_by_model)
    ? stats.tokens_by_model.map(m => ({
        model: m.model.split('-').slice(-2).join('-'),
        tokens: m.tokens,
      }))
    : []

  const typeData = Array.isArray(stats.tokens_by_type) ? stats.tokens_by_type : []

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          LLM Observability
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Live metrics, token distribution & tool diagnostics
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard
          label="Total tokens"
          value={`${((stats.total_tokens || 0) / 1_000_000).toFixed(2)}M`}
          sub={`${stats.total_turns || 0} turns across ${stats.total_sessions || 0} sessions`}
        />
        <StatCard
          label="p95 Latency"
          value={`${stats.p95_duration_ms || 0}ms`}
          sub="Turn round-trip"
        />
        <StatCard
          label="Errors"
          value={String(stats.total_errors || 0)}
          sub={`${(((stats.total_errors || 0) / Math.max(stats.total_turns || 1, 1)) * 100).toFixed(1)}% error rate`}
        />
        <StatCard
          label="Tool executions"
          value={String(stats.tool_outcomes?.success ?? (stats.tool_stats?.length || 0))}
          sub={`${stats.tool_outcomes?.error || 0} failed calls`}
        />
      </div>

      {/* Tokens by model */}
      {modelData.length > 0 && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Tokens by model
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={modelData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
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
                {modelData.map((_, idx) => (
                  <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tokens by type breakdown */}
      {typeData.length > 0 && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Token distribution
          </p>
          <div className="flex items-center justify-between">
            <ResponsiveContainer width="45%" height={100}>
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={25}
                  outerRadius={45}
                  stroke="none"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 text-xs w-[50%]">
              {typeData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full" style={{ background: item.color || '#fff' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>{item.name}</span>
                  </span>
                  <span className="font-mono tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                    {(item.value / 1000).toFixed(0)}k
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tool usage table */}
      {Array.isArray(stats.tool_stats) && stats.tool_stats.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div
            className="px-3 py-2 text-xs font-medium"
            style={{
              background: 'var(--color-elevated)',
              color: 'var(--color-text-secondary)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            Tool Performance
          </div>
          <table className="w-full text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="px-3 py-1.5 text-left font-medium" style={{ color: 'var(--color-text-muted)' }}>Tool</th>
                <th className="px-3 py-1.5 text-right font-medium" style={{ color: 'var(--color-text-muted)' }}>Calls</th>
                <th className="px-3 py-1.5 text-right font-medium" style={{ color: 'var(--color-text-muted)' }}>Success</th>
              </tr>
            </thead>
            <tbody>
              {stats.tool_stats.slice(0, 8).map(ts => (
                <tr key={ts.tool} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-3 py-1.5 font-mono text-[11px]" style={{ color: 'var(--color-accent)' }}>
                    {ts.tool}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{ts.calls}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums" style={{ color: 'oklch(0.72 0.19 145)' }}>
                    {ts.success}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
