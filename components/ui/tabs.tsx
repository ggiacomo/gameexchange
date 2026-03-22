'use client'

import * as RadixTabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils/cn'

const Tabs = RadixTabs.Root

function TabsList({ className, ...props }: RadixTabs.TabsListProps) {
  return (
    <RadixTabs.List
      className={cn(
        'flex border-b border-gray-200 gap-0',
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: RadixTabs.TabsTriggerProps) {
  return (
    <RadixTabs.Trigger
      className={cn(
        'px-4 py-2.5 text-sm font-medium text-gray-500 border-b-2 border-transparent -mb-px',
        'hover:text-gray-700 transition-colors',
        'data-[state=active]:text-brand data-[state=active]:border-brand',
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: RadixTabs.TabsContentProps) {
  return <RadixTabs.Content className={cn('mt-4', className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
