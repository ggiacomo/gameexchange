import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { proposals, users, userLibrary, games, messages } from '@/lib/db/schema'
import { eq, or, and, inArray, isNull, ne } from 'drizzle-orm'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { ChatClient } from '@/components/chat/chat-client'
import type { MessageRow, UserRow } from '@/types/database'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ proposalId: string }>
}) {
  const { proposalId } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [proposal] = await db
    .select()
    .from(proposals)
    .where(
      and(
        eq(proposals.id, proposalId),
        or(eq(proposals.proposerId, user.id), eq(proposals.receiverId, user.id)),
        inArray(proposals.status, ['accepted', 'completed'])
      )
    )
    .limit(1)

  if (!proposal) notFound()

  const otherUserId = proposal.proposerId === user.id ? proposal.receiverId : proposal.proposerId
  const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId)).limit(1)

  const [li] = await db
    .select()
    .from(userLibrary)
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .where(eq(userLibrary.id, proposal.requestedItemId))
    .limit(1)

  const msgRows = await db
    .select()
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.proposalId, proposalId))
    .orderBy(messages.createdAt)

  // Mark unread as read
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.proposalId, proposalId),
        ne(messages.senderId, user.id),
        isNull(messages.readAt)
      )
    )

  const mappedMessages: (MessageRow & { sender: UserRow })[] = msgRows.map(({ messages: m, users: u }) => ({
    id: m.id, proposal_id: m.proposalId, sender_id: m.senderId, content: m.content,
    read_at: m.readAt?.toISOString() ?? null, created_at: m.createdAt.toISOString(),
    sender: {
      id: u.id, username: u.username, avatar_url: u.avatarUrl, bio: u.bio, city: u.city, country: u.country,
      email_confirmed: u.emailConfirmed, plan: u.plan as 'free' | 'pro', plan_expires_at: u.planExpiresAt?.toISOString() ?? null,
      rating_avg: Number(u.ratingAvg), swaps_completed: u.swapsCompleted, is_suspended: u.isSuspended,
      created_at: u.createdAt.toISOString(), updated_at: u.updatedAt.toISOString(),
    },
  }))

  const isReadOnly = proposal.status === 'completed'

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex items-center gap-3">
        <Link href="/inbox" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Avatar src={otherUser?.avatarUrl} alt={otherUser?.username} fallback={otherUser?.username} size="md" />
        <div className="flex-1">
          <Link href={`/profile/${otherUser?.username}`} className="font-medium text-gray-900 hover:text-brand text-sm">
            @{otherUser?.username}
          </Link>
          <p className="text-xs text-gray-500">{li?.games.title}</p>
        </div>
        {isReadOnly && <Badge variant="default">Sola lettura</Badge>}
        <Link href={`/proposals/${proposalId}`} className="text-xs text-brand hover:underline">Vedi proposta</Link>
      </div>
      <ChatClient
        proposalId={proposalId}
        currentUserId={user.id}
        messages={mappedMessages}
        isReadOnly={isReadOnly}
      />
    </div>
  )
}
