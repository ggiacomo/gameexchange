import { cn } from '@/lib/utils/cn'
import { Button } from './button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
          <div className="text-gray-400">{icon}</div>
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-xs mb-6">{description}</p>}
      {action && (
        <Button
          variant="default"
          size="md"
          onClick={action.onClick}
          {...(action.href ? { as: 'a', href: action.href } : {})}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { EmptyState }
