'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import {
  acceptProposal,
  declineProposal,
  cancelProposal,
  markCompleted,
} from '@/app/(main)/proposals/actions'
import type { ProposalRow } from '@/types/database'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface ProposalActionsProps {
  proposal: ProposalRow
  isProposer: boolean
  isReceiver: boolean
  currentUserId: string
}

export function ProposalActions({
  proposal,
  isProposer,
  isReceiver,
}: ProposalActionsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [confirmDecline, setConfirmDecline] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const handle = async (action: string, fn: () => Promise<{ error?: string }>) => {
    setLoading(action)
    const { error } = await fn()
    setLoading(null)
    if (error) {
      toast({ title: error, variant: 'destructive' })
    } else {
      router.refresh()
    }
  }

  const { status } = proposal

  if (status === 'completed' || status === 'expired' || status === 'cancelled' || status === 'declined') {
    return null
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {/* Receiver: accept/decline pending or counter */}
        {isReceiver && (status === 'pending' || status === 'counter_proposed') && (
          <>
            <Button
              onClick={() => handle('accept', () => acceptProposal(proposal.id))}
              isLoading={loading === 'accept'}
              className="flex-1"
            >
              Accept proposal
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmDecline(true)}
              className="flex-1"
            >
              Decline
            </Button>
          </>
        )}

        {/* Proposer: cancel pending */}
        {isProposer && (status === 'pending' || status === 'counter_proposed') && (
          <Button
            variant="outline"
            onClick={() => setConfirmCancel(true)}
            className="flex-1"
          >
            Cancel proposal
          </Button>
        )}

        {/* Both: mark completed when accepted */}
        {status === 'accepted' && (
          <Button
            variant="outline"
            onClick={() => setConfirmComplete(true)}
            isLoading={loading === 'complete'}
            className="w-full"
          >
            Mark as completed
          </Button>
        )}
      </div>

      <Dialog open={confirmComplete} onOpenChange={setConfirmComplete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm swap completed</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            This will remove the swapped games from both libraries and unlock the review form. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmComplete(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setConfirmComplete(false)
                handle('complete', () => markCompleted(proposal.id))
              }}
              isLoading={loading === 'complete'}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDecline} onOpenChange={setConfirmDecline}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline proposal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Are you sure you want to decline this proposal?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDecline(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDecline(false)
                handle('decline', () => declineProposal(proposal.id))
              }}
            >
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel proposal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Are you sure you want to cancel this proposal?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancel(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmCancel(false)
                handle('cancel', () => cancelProposal(proposal.id))
              }}
            >
              Yes, cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
