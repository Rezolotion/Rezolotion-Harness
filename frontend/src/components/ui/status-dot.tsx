import * as React from 'react'
import { cn } from '@/lib/utils'

export type AgentType = 'claude' | 'gemini' | 'deepseek' | 'codex' | 'default'

interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  agent?: AgentType
  status?: 'idle' | 'running' | 'error' | 'success'
  pulse?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const StatusDot = React.forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ className, agent = 'default', status, pulse = false, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5',
    }

    const colorClasses: Record<AgentType, string> = {
      claude: 'bg-agent-claude',
      gemini: 'bg-agent-gemini',
      deepseek: 'bg-agent-deepseek',
      codex: 'bg-agent-codex',
      default: 'bg-fg-muted',
    }

    const statusClasses = status
      ? {
          idle: 'bg-fg-subtle',
          running: 'bg-accent animate-pulse',
          error: 'bg-destructive',
          success: 'bg-agent-gemini',
        }[status]
      : undefined

    return (
      <span className="relative inline-flex items-center justify-center" ref={ref} {...props}>
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              statusClasses || colorClasses[agent]
            )}
          />
        )}
        <span
          className={cn(
            'inline-block rounded-full flex-shrink-0',
            sizeClasses[size],
            statusClasses || colorClasses[agent],
            className
          )}
        />
      </span>
    )
  }
)
StatusDot.displayName = 'StatusDot'
