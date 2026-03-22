import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

interface AvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: { container: 'h-7 w-7', text: 'text-xs' },
  md: { container: 'h-9 w-9', text: 'text-sm' },
  lg: { container: 'h-12 w-12', text: 'text-base' },
  xl: { container: 'h-16 w-16', text: 'text-lg' },
}

function Avatar({ src, alt = '', fallback, size = 'md', className }: AvatarProps) {
  const { container, text } = sizeMap[size]
  const initials = fallback
    ? fallback.slice(0, 2).toUpperCase()
    : alt.slice(0, 2).toUpperCase()

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full bg-gray-200 overflow-hidden flex-shrink-0',
        container,
        className
      )}
    >
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" />
      ) : (
        <span className={cn('font-medium text-gray-600', text)}>{initials}</span>
      )}
    </div>
  )
}

export { Avatar }
