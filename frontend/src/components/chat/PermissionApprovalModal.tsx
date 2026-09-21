import { ShieldAlert, Terminal, Check, X, Lock } from 'lucide-react'

interface Props {
  open: boolean
  toolName: string
  command?: string
  description?: string
  onAllowOnce: () => void
  onAllowAlways: () => void
  onDeny: () => void
}

export function PermissionApprovalModal({
  open,
  toolName,
  command,
  description = 'The agent requested permission to execute a system command.',
  onAllowOnce,
  onAllowAlways,
  onDeny,
}: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans select-none"
      style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-amber-500/40 shadow-2xl p-6 space-y-4"
        style={{ background: 'var(--color-surface)' }}
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/30 text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Security Permission Required
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Tool execution gate ({toolName})
            </p>
          </div>
        </div>

        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {description}
        </p>

        {command && (
          <div className="p-3 rounded-xl bg-[var(--color-base)] border border-[var(--color-border)] font-mono text-xs text-amber-300 break-all leading-relaxed">
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] mb-1 uppercase font-semibold">
              <Terminal className="w-3 h-3" /> Command to Run:
            </div>
            $ {command}
          </div>
        )}

        <div className="pt-2 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={onAllowOnce}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-[var(--color-accent)] text-white hover:opacity-95 cursor-pointer shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Allow Once</span>
            </button>
            <button
              onClick={onDeny}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-rose-900/40 border border-rose-700/50 text-rose-300 hover:bg-rose-900/60 cursor-pointer shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
              <span>Deny</span>
            </button>
          </div>
          <button
            onClick={onAllowAlways}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-elevated)] cursor-pointer transition-colors"
          >
            <Lock className="w-3 h-3" />
            <span>Allow All for this Session</span>
          </button>
        </div>
      </div>
    </div>
  )
}
