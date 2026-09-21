import React from 'react'

export interface IconProps {
  className?: string
  size?: number
}

export function ClaudeIcon({ className = 'w-4 h-4', size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={{ color: 'var(--color-claude, #d97757)' }}
    >
      <path d="m19.64 12.25-1.54-3.21a.7.7 0 0 0-.27-.29l-3.26-1.51a.7.7 0 0 0-.84.21L12 9.57l-1.73-2.12a.7.7 0 0 0-.84-.21L6.17 8.75a.7.7 0 0 0-.27.29L4.36 12.25a.7.7 0 0 0 .11.83l2.67 2.76a.7.7 0 0 0 .8.14l3.41-1.42 1.34 3.39a.7.7 0 0 0 .65.45h1.32a.7.7 0 0 0 .65-.45l1.34-3.39 3.41 1.42a.7.7 0 0 0 .8-.14l2.67-2.76a.7.7 0 0 0 .11-.88z" />
    </svg>
  )
}

export function GeminiIcon({ className = 'w-4 h-4', size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={{ color: 'var(--color-gemini, #22d3ee)' }}
    >
      <path d="M12 2a9.96 9.96 0 0 1 2.93 7.07A9.96 9.96 0 0 1 22 12a9.96 9.96 0 0 1-7.07 2.93A9.96 9.96 0 0 1 12 22a9.96 9.96 0 0 1-2.93-7.07A9.96 9.96 0 0 1 2 12a9.96 9.96 0 0 1 7.07-2.93A9.96 9.96 0 0 1 12 2z" />
    </svg>
  )
}

export function OpenAIIcon({ className = 'w-4 h-4', size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color: 'var(--color-openai, #10a37f)' }}
    >
      <path d="M12 2a5 5 0 0 0-4.8 3.6L6 9.3a5 5 0 0 0-2.3 4.2 5 5 0 0 0 2.5 4.3v1.2a5 5 0 0 0 7.3 4.4l3.1-1.8a5 5 0 0 0 2.4-4.3 5 5 0 0 0-2.5-4.3v-1.2A5 5 0 0 0 12 2z" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  )
}

export function DeepSeekIcon({ className = 'w-4 h-4', size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={{ color: 'var(--color-deepseek, #3b82f6)' }}
    >
      <path d="M18.8 6.4C17.2 4.9 14.8 4 12 4c-4.4 0-8 2.7-8 6 0 1.9 1.2 3.6 3 4.7l-1 3.3 3.6-1.5c.8.3 1.6.5 2.4.5 4.4 0 8-2.7 8-6 0-1.8-.7-3.4-2.2-4.6zM13 14c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" />
    </svg>
  )
}

export function OpenRouterIcon({ className = 'w-4 h-4', size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color: 'var(--color-openrouter, #a855f7)' }}
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="3" x2="12" y2="8" />
      <line x1="12" y1="16" x2="12" y2="21" />
      <line x1="3" y1="12" x2="8" y2="12" />
      <line x1="16" y1="12" x2="21" y2="12" />
    </svg>
  )
}

export function HermesIcon({ className = 'w-4 h-4', size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color: 'var(--color-hermes, #f59e0b)' }}
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

export function NineRouterIcon({ className = 'w-4 h-4', size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color: 'var(--color-accent, #6366f1)' }}
    >
      <rect x="2" y="2" width="6" height="6" rx="1.5" />
      <rect x="16" y="2" width="6" height="6" rx="1.5" />
      <rect x="9" y="16" width="6" height="6" rx="1.5" />
      <path d="M5 8v4a3 3 0 0 0 3 3h4" />
      <path d="M19 8v4a3 3 0 0 1-3 3h-4" />
    </svg>
  )
}

export function GCatIcon({ className = 'w-4 h-4', size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color: '#10b981' }}
    >
      <path d="M12 5c-4.5 0-8 3.5-8 8 0 4 3 6.5 8 6.5s8-2.5 8-6.5c0-4.5-3.5-8-8-8z" />
      <path d="M7 6.5 4 2l4.5 1.5" />
      <path d="M17 6.5 20 2l-4.5 1.5" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <path d="m11 15 1 1 1-1" />
    </svg>
  )
}

export function CustomGatewayIcon({ className = 'w-4 h-4', size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color: '#8b5cf6' }}
    >
      <rect width="20" height="8" x="2" y="2" rx="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  )
}

export function getProviderIcon(providerId: string, className = 'w-4 h-4', size = 16): React.ReactElement {
  switch (providerId.toLowerCase()) {
    case 'claude':
      return <ClaudeIcon className={className} size={size} />
    case 'gemini':
    case 'antigravity':
      return <GeminiIcon className={className} size={size} />
    case 'openai':
    case 'chatgpt':
    case 'codex':
      return <OpenAIIcon className={className} size={size} />
    case 'deepseek':
      return <DeepSeekIcon className={className} size={size} />
    case 'openrouter':
      return <OpenRouterIcon className={className} size={size} />
    case 'hermes':
    case 'ollama':
      return <HermesIcon className={className} size={size} />
    case 'ninerouter':
      return <NineRouterIcon className={className} size={size} />
    case 'gcat':
      return <GCatIcon className={className} size={size} />
    case 'custom':
      return <CustomGatewayIcon className={className} size={size} />
    default:
      return <ClaudeIcon className={className} size={size} />
  }
}
