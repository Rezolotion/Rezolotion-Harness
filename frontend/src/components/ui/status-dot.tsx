interface Props {
  connected: boolean
  size?: 'sm' | 'md'
  title?: string
}

export function StatusDot({ connected, size = 'sm', title }: Props) {
  const dim = size === 'md' ? 8 : 6
  return (
    <span
      title={title}
      style={{
        display: 'inline-block',
        width: dim,
        height: dim,
        borderRadius: '50%',
        flexShrink: 0,
        background: connected
          ? 'oklch(0.72 0.19 145)'
          : 'oklch(0.45 0 0)',
        boxShadow: connected ? '0 0 0 2px oklch(0.72 0.19 145 / 0.2)' : 'none',
      }}
    />
  )
}
