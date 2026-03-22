'use client'

import * as RadixToast from '@radix-ui/react-toast'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { createContext, useContext, useState, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'

type ToastVariant = 'default' | 'success' | 'destructive' | 'info'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const variantStyles: Record<ToastVariant, string> = {
  default: 'bg-white border-gray-200',
  success: 'bg-white border-green-200',
  destructive: 'bg-white border-red-200',
  info: 'bg-white border-blue-200',
}

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  default: null,
  success: <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />,
  destructive: <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />,
  info: <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />,
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...opts, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <RadixToast.Root
            key={t.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-4 shadow-lg',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[swipe=end]:animate-out data-[state=closed]:fade-out-80',
              'data-[state=open]:slide-in-from-bottom-full',
              variantStyles[t.variant ?? 'default']
            )}
            open
          >
            {variantIcons[t.variant ?? 'default']}
            <div className="flex-1">
              <RadixToast.Title className="text-sm font-semibold text-gray-900">
                {t.title}
              </RadixToast.Title>
              {t.description && (
                <RadixToast.Description className="text-sm text-gray-500 mt-0.5">
                  {t.description}
                </RadixToast.Description>
              )}
            </div>
            <RadixToast.Close className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[380px] max-w-[calc(100vw-32px)]" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}
