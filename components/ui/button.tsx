'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-tight',
  {
    variants: {
      variant: {
        default: 'bg-brand text-white hover:bg-brand-dark active:scale-[0.97]',
        outline: 'border-2 border-[#1a1a1a] bg-transparent text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white active:scale-[0.97]',
        ghost: 'text-gray-700 hover:bg-gray-100 rounded-lg',
        destructive: 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.97]',
        secondary: 'bg-[#1a1a1a] text-white hover:bg-[#333] active:scale-[0.97]',
        link: 'text-brand underline-offset-4 hover:underline p-0 h-auto rounded-none font-medium',
      },
      size: {
        sm: 'h-8 px-4 text-xs',
        md: 'h-10 px-5 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10 rounded-full',
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
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
