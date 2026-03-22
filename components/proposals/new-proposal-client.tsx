'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowRight, Gamepad2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { createProposal } from '@/app/(main)/proposals/actions'
import { formatCondition } from '@/lib/utils/format'
import type { LibraryItemWithGame, UserRow } from '@/types/database'
import { cn } from '@/lib/utils/cn'

interface NewProposalClientProps {
  requestedItem: LibraryItemWithGame
  receiver: UserRow
  myLibrary: LibraryItemWithGame[]
  proposerId: string
}

export function NewProposalClient({
  requestedItem,
  receiver,
  myLibrary,
  proposerId,
}: NewProposalClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [compensations, setCompensations] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const game = requestedItem.games

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      toast({ title: 'Select at least one game to offer', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    const { error, proposalId } = await createProposal({
      receiverId: receiver.id,
      requestedItemId: requestedItem.id,
      offeredItemIds: selectedIds,
      compensations: Object.fromEntries(
        Object.entries(compensations).map(([k, v]) => [k, parseFloat(v) || 0])
      ),
      message: message || undefined,
    })
    setSubmitting(false)

    if (error) {
      toast({ title: error, variant: 'destructive' })
      return
    }

    toast({ title: 'Proposal sent!', variant: 'success' })
    router.push(`/proposals/${proposalId}`)
  }

  return (
    <div className="space-y-6">
      {/* What you want */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          You want
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-11 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            {game.cover_url ? (
              <Image src={game.cover_url} alt={game.title} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Gamepad2 className="h-6 w-6 text-gray-300" />
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{game.title}</p>
            <p className="text-sm text-gray-500">{formatCondition(requestedItem.condition)}</p>
            {requestedItem.min_compensation && (
              <Badge variant="warning" className="mt-1">
                +€{requestedItem.min_compensation} required
              </Badge>
            )}
          </div>
          <div className="ml-auto text-right">
            <div className="flex items-center gap-2">
              <Avatar src={receiver.avatar_url} alt={receiver.username} fallback={receiver.username} size="sm" />
              <span className="text-sm text-gray-600">@{receiver.username}</span>
            </div>
            <p className="text-xs text-gray-400">{receiver.city}</p>
          </div>
        </div>
      </div>

      {/* What you offer */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          You offer ({selectedIds.length} selected)
        </h2>
        {myLibrary.length === 0 ? (
          <p className="text-sm text-gray-500">
            No available games in your library.{' '}
            <a href="/library" className="text-brand hover:underline">Add some first</a>.
          </p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {myLibrary.map((item) => {
              const g = item.games
              const isSelected = selectedIds.includes(item.id)
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                      isSelected
                        ? 'border-brand bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                  >
                    <div className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      isSelected ? 'border-brand bg-brand' : 'border-gray-300'
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="relative h-10 w-7 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                      {g.cover_url ? (
                        <Image src={g.cover_url} alt={g.title} fill className="object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{g.title}</p>
                      <p className="text-xs text-gray-500">{formatCondition(item.condition)}</p>
                    </div>
                  </button>
                  {isSelected && (
                    <div className="mt-1 px-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.50"
                        placeholder="Add compensation (€ optional)"
                        value={compensations[item.id] ?? ''}
                        onChange={(e) => setCompensations((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Message */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <Textarea
          label="Message (optional)"
          placeholder={`Hi @${receiver.username}, I'd love to swap...`}
          maxLength={300}
          showCount
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* Summary & Submit */}
      <Button
        size="lg"
        className="w-full gap-2"
        onClick={handleSubmit}
        isLoading={submitting}
        disabled={selectedIds.length === 0}
      >
        Send proposal <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
