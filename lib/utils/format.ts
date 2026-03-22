import type { GameCondition, ProposalStatus, LibraryStatus } from '@/types/database'

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor(diffMs / (1000 * 60))

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(d)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatCondition(condition: GameCondition): string {
  const map: Record<GameCondition, string> = {
    mint: 'Mint',
    good: 'Good',
    fair: 'Fair',
  }
  return map[condition]
}

export function formatProposalStatus(status: ProposalStatus): string {
  const map: Record<ProposalStatus, string> = {
    pending: 'Pending',
    counter_proposed: 'Counter Proposed',
    accepted: 'Accepted',
    declined: 'Declined',
    expired: 'Expired',
    cancelled: 'Cancelled',
    completed: 'Completed',
  }
  return map[status]
}

export function formatLibraryStatus(status: LibraryStatus): string {
  const map: Record<LibraryStatus, string> = {
    private: 'Private',
    available: 'Available',
    with_compensation: 'With Compensation',
  }
  return map[status]
}

export function daysUntil(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}
