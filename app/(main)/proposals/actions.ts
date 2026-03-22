'use server'

import { db } from '@/lib/db'
import { users, proposals, proposalItems, userLibrary, reviews, games } from '@/lib/db/schema'
import { eq, or, and, inArray, avg } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { canSendProposal } from '@/lib/utils/proposals'
import { createNotification } from '@/lib/notifications/create'
import {
  sendProposalReceivedEmail,
  sendProposalAcceptedEmail,
  sendCounterProposalEmail,
  sendSwapCompletedEmail,
} from '@/lib/email/templates'

const createProposalSchema = z.object({
  receiverId: z.string(),
  requestedItemId: z.string().uuid(),
  offeredItemIds: z.array(z.string().uuid()).min(1, 'Offer at least one game'),
  compensations: z.record(z.string(), z.number().min(0)),
  message: z.string().max(300).optional(),
})

export async function createProposal(
  data: z.infer<typeof createProposalSchema>
): Promise<{ error?: string; proposalId?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = createProposalSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const [profile] = await db
    .select({ emailConfirmed: users.emailConfirmed, plan: users.plan })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  if (!profile?.emailConfirmed) {
    return { error: 'Please confirm your email first' }
  }

  const canSend = await canSendProposal(
    user.id,
    (profile.plan as 'free' | 'pro') ?? 'free',
    parsed.data.requestedItemId
  )
  if (!canSend) {
    return { error: 'You have reached the proposal limit for this game' }
  }

  const [newProposal] = await db
    .insert(proposals)
    .values({
      proposerId: user.id,
      receiverId: parsed.data.receiverId,
      requestedItemId: parsed.data.requestedItemId,
      message: parsed.data.message ?? null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .returning({ id: proposals.id })

  if (!newProposal) return { error: 'Failed to create proposal' }

  await db.insert(proposalItems).values(
    parsed.data.offeredItemIds.map((libItemId) => ({
      proposalId: newProposal.id,
      libraryItemId: libItemId,
      compensationAmount: String(parsed.data.compensations[libItemId] ?? 0),
      offeredBy: 'proposer' as const,
    }))
  )

  // Get game title for notification
  const [requestedItem] = await db
    .select({ gameTitle: games.title })
    .from(userLibrary)
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .where(eq(userLibrary.id, parsed.data.requestedItemId))
    .limit(1)

  const [proposer] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  const [receiver] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, parsed.data.receiverId))
    .limit(1)

  const gameName = requestedItem?.gameTitle ?? 'a game'
  const proposerName = proposer?.username ?? 'Someone'

  await createNotification(parsed.data.receiverId, 'proposal_received', {
    proposalId: newProposal.id,
    proposerName,
    gameName,
  })

  if (receiver) {
    await sendProposalReceivedEmail(parsed.data.receiverId, proposerName, gameName, newProposal.id)
  }

  revalidatePath('/proposals')
  return { proposalId: newProposal.id }
}

export async function acceptProposal(id: string): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const [profile] = await db
    .select({ emailConfirmed: users.emailConfirmed })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  if (!profile?.emailConfirmed) return { error: 'Please confirm your email first' }

  const [proposal] = await db
    .select()
    .from(proposals)
    .where(and(eq(proposals.id, id), eq(proposals.receiverId, user.id)))
    .limit(1)

  if (!proposal) return { error: 'Proposal not found' }

  await db
    .update(proposals)
    .set({ status: 'accepted', updatedAt: new Date() })
    .where(eq(proposals.id, id))

  const [currentUser] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  await createNotification(proposal.proposerId, 'proposal_accepted', { proposalId: id })

  const [requestedItem] = await db
    .select({ gameTitle: games.title })
    .from(userLibrary)
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .where(eq(userLibrary.id, proposal.requestedItemId))
    .limit(1)

  await sendProposalAcceptedEmail(
    proposal.proposerId,
    currentUser?.username ?? 'Someone',
    requestedItem?.gameTitle ?? 'a game',
    id
  )

  revalidatePath('/proposals')
  revalidatePath(`/proposals/${id}`)
  return {}
}

export async function declineProposal(id: string): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  await db
    .update(proposals)
    .set({ status: 'declined', updatedAt: new Date() })
    .where(and(eq(proposals.id, id), eq(proposals.receiverId, user.id)))

  await createNotification(id, 'proposal_declined', { proposalId: id })

  revalidatePath('/proposals')
  revalidatePath(`/proposals/${id}`)
  return {}
}

export async function cancelProposal(id: string): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  await db
    .update(proposals)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(
      and(
        eq(proposals.id, id),
        eq(proposals.proposerId, user.id),
        inArray(proposals.status, ['pending', 'counter_proposed'])
      )
    )

  revalidatePath('/proposals')
  revalidatePath(`/proposals/${id}`)
  return {}
}

export async function counterProposal(
  id: string,
  data: { offeredItemIds: string[]; compensations: Record<string, number> }
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const [proposal] = await db
    .select()
    .from(proposals)
    .where(
      and(eq(proposals.id, id), or(eq(proposals.proposerId, user.id), eq(proposals.receiverId, user.id)))
    )
    .limit(1)

  if (!proposal) return { error: 'Proposal not found' }

  const offeredBy = user.id === proposal.proposerId ? 'proposer' : 'receiver'

  await db
    .delete(proposalItems)
    .where(and(eq(proposalItems.proposalId, id), eq(proposalItems.offeredBy, offeredBy)))

  await db.insert(proposalItems).values(
    data.offeredItemIds.map((libItemId) => ({
      proposalId: id,
      libraryItemId: libItemId,
      compensationAmount: String(data.compensations[libItemId] ?? 0),
      offeredBy,
    }))
  )

  await db
    .update(proposals)
    .set({ status: 'counter_proposed', updatedAt: new Date() })
    .where(eq(proposals.id, id))

  const otherPartyId = user.id === proposal.proposerId ? proposal.receiverId : proposal.proposerId
  await createNotification(otherPartyId, 'counter_received', { proposalId: id })

  const [currentUser] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  await sendCounterProposalEmail(otherPartyId, currentUser?.username ?? 'Someone', '', id)

  revalidatePath('/proposals')
  revalidatePath(`/proposals/${id}`)
  return {}
}

export async function markCompleted(id: string): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const [proposal] = await db
    .select()
    .from(proposals)
    .where(
      and(
        eq(proposals.id, id),
        or(eq(proposals.proposerId, user.id), eq(proposals.receiverId, user.id)),
        eq(proposals.status, 'accepted')
      )
    )
    .limit(1)

  if (!proposal) return { error: 'Proposal not found' }

  await db
    .update(proposals)
    .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
    .where(eq(proposals.id, id))

  const items = await db
    .select({ libraryItemId: proposalItems.libraryItemId })
    .from(proposalItems)
    .where(eq(proposalItems.proposalId, id))

  if (items.length > 0) {
    await db
      .delete(userLibrary)
      .where(
        inArray(
          userLibrary.id,
          items.map((i) => i.libraryItemId)
        )
      )
  }

  // Increment swaps_completed for both users
  await db
    .update(users)
    .set({ swapsCompleted: users.swapsCompleted })
    .where(eq(users.id, proposal.proposerId))
  // Using raw SQL increment would be better here, but for simplicity:
  const [proposerData] = await db
    .select({ swapsCompleted: users.swapsCompleted })
    .from(users)
    .where(eq(users.id, proposal.proposerId))
    .limit(1)
  await db
    .update(users)
    .set({ swapsCompleted: (proposerData?.swapsCompleted ?? 0) + 1 })
    .where(eq(users.id, proposal.proposerId))

  const [receiverData] = await db
    .select({ swapsCompleted: users.swapsCompleted })
    .from(users)
    .where(eq(users.id, proposal.receiverId))
    .limit(1)
  await db
    .update(users)
    .set({ swapsCompleted: (receiverData?.swapsCompleted ?? 0) + 1 })
    .where(eq(users.id, proposal.receiverId))

  const otherPartyId = user.id === proposal.proposerId ? proposal.receiverId : proposal.proposerId
  await createNotification(otherPartyId, 'swap_completed', { proposalId: id })

  const [currentUser] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  await sendSwapCompletedEmail(otherPartyId, currentUser?.username ?? 'Someone', '', id)
  await sendSwapCompletedEmail(user.id, currentUser?.username ?? 'Someone', '', id)

  revalidatePath('/proposals')
  revalidatePath(`/proposals/${id}`)
  return {}
}

export async function submitReview(
  proposalId: string,
  revieweeId: string,
  rating: number,
  comment: string
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  if (rating < 1 || rating > 5) return { error: 'Rating must be 1-5' }

  try {
    await db.insert(reviews).values({
      proposalId,
      reviewerId: user.id,
      revieweeId,
      rating,
      comment: comment || null,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to submit review'
    return { error: msg }
  }

  const allReviews = await db
    .select({ rating: reviews.rating })
    .from(reviews)
    .where(eq(reviews.revieweeId, revieweeId))

  if (allReviews.length > 0) {
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    await db
      .update(users)
      .set({ ratingAvg: avgRating.toFixed(2) })
      .where(eq(users.id, revieweeId))
  }

  await createNotification(revieweeId, 'review_received', { proposalId, rating })

  revalidatePath(`/proposals/${proposalId}`)
  return {}
}
