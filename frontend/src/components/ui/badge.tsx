import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-sm font-medium transition-colors duration-fast focus:outline-none focus:ring-1 focus:ring-accent',
  {
    variants: {
      variant: {
        default: 'border border-border-subtle bg-surface text-fg-muted hover:border-border-hover hover:text-fg',
        subtle: 'bg-surface text-fg-subtle border-none',
        accent: 'bg-accent/10 border border-accent/20 text-accent',
        destructive: 'bg-destructive/10 border border-destructive/20 text-destructive',
        outline: 'border border-border-subtle bg-transparent text-fg-muted',
      },
      size: {
        sm: 'h-5 px-1.5 text-[11px] gap-1',
        md: 'h-6 px-2 text-xs gap-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

export { Badge, badgeVariants }
