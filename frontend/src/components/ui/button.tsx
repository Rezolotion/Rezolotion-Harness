import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40 active:translate-y-[1px]',
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-fg hover:opacity-90',
        subtle: 'bg-surface text-fg border border-border-subtle hover:border-border-hover hover:bg-elevated',
        ghost: 'text-fg-muted hover:text-fg hover:bg-surface',
        destructive: 'bg-destructive text-destructive-fg hover:opacity-90',
        outline: 'border border-border-subtle bg-transparent text-fg hover:bg-surface hover:border-border-hover',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs gap-1.5',
        md: 'h-8 px-3 text-sm gap-2',
        lg: 'h-9 px-4 text-base gap-2.5',
        icon: 'h-8 w-8 p-0',
        iconSm: 'h-7 w-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
