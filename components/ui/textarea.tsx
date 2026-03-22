import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  showCount?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, showCount, maxLength, id, value, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const currentLength = typeof value === 'string' ? value.length : 0

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-semibold text-gray-800">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          maxLength={maxLength}
          value={value}
          className={cn(
            'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-400 focus:ring-red-500',
            className
          )}
          {...props}
        />
        <div className="flex justify-between">
          <span>
            {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
            {hint && !error && <span className="text-xs text-gray-500">{hint}</span>}
          </span>
          {showCount && maxLength && (
            <span className="text-xs text-gray-400">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
