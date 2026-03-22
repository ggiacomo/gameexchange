'use server'

import { db } from '@/lib/db'
import { proposals, messages, users } from '@/lib/db/schema'
import { eq, or, and } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/lib/notifications/create'
import { sendMessageEmail } from '@/lib/email/templates'

export async function sendMessage(
  proposalId: string,
  content: string
): Promise<{ error?: string }> {
  if (!content.trim()) return { error: 'Message cannot be empty' }
  if (content.length > 1000) return { error: 'Message too long (max 1000 chars)' }

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const [proposal] = await db
    .select()
    .from(proposals)
    .where(
      and(
        eq(proposals.id, proposalId),
        or(eq(proposals.proposerId, user.id), eq(proposals.receiverId, user.id))
      )
    )
    .limit(1)

  if (!proposal) return { error: 'Proposal not found' }
  if (proposal.status !== 'accepted' && proposal.status !== 'completed') {
    return { error: 'Chat is only available for accepted proposals' }
  }

  await db.insert(messages).values({
    proposalId,
    senderId: user.id,
    content: content.trim(),
  })

  const otherPartyId = user.id === proposal.proposerId ? proposal.receiverId : proposal.proposerId
  await createNotification(otherPartyId, 'message_received', { proposalId })

  const [currentUser] = await db.select({ username: users.username }).from(users).where(eq(users.id, user.id)).limit(1)
  const [otherUser] = await db.select({ email: users.id }).from(users).where(eq(users.id, otherPartyId)).limit(1)

  if (otherUser) {
    await sendMessageEmail(otherPartyId, currentUser?.username ?? 'Someone', proposalId)
  }

  revalidatePath(`/inbox/${proposalId}`)
  return {}
}
