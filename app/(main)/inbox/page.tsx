import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { proposals, users, userLibrary, games, messages } from '@/lib/db/schema'
import { eq, or, and, inArray, isNull, ne } from 'drizzle-orm'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Inbox } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils/format'

export const metadata = { title: 'Inbox — Gamexchange' }

export default async function InboxPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const proposalRows = await db
    .select()
    .from(proposals)
    .where(
      and(
        or(eq(proposals.proposerId, user.id), eq(proposals.receiverId, user.id)),
        inArray(proposals.status, ['accepted', 'completed'])
      )
    )
    .orderBy(proposals.updatedAt)
    .limit(50)

  if (!proposalRows.length) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight mb-6">Inbox</h1>
        <div className="py-20 text-center">
          <Inbox className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#1a1a1a] mb-1">No conversations yet</h3>
          <p className="text-sm text-gray-400">Accepted proposals create a chat thread.</p>
        </div>
      </div>
    )
  }

  const proposalIds = proposalRows.map((p) => p.id)

  // Get last messages and unread counts
  const allMessages = await db
    .select()
    .from(messages)
    .where(inArray(messages.proposalId, proposalIds))
    .orderBy(messages.createdAt)

  const lastMessageMap: Record<string, typeof allMessages[0]> = {}
  const unreadMap: Record<string, number> = {}

  for (const msg of allMessages) {
    lastMessageMap[msg.proposalId] = msg
    if (msg.senderId !== user.id && msg.readAt === null) {
      unreadMap[msg.proposalId] = (unreadMap[msg.proposalId] ?? 0) + 1
    }
  }

  // Get all involved users
  const otherUserIds = proposalRows.map((p) =>
    p.proposerId === user.id ? p.receiverId : p.proposerId
  )
  const otherUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, [...new Set(otherUserIds)]))

  const userMap = Object.fromEntries(otherUsers.map((u) => [u.id, u]))

  // Get requested items and games
  const requestedItemIds = proposalRows.map((p) => p.requestedItemId)
  const libraryItems = await db
    .select()
    .from(userLibrary)
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .where(inArray(userLibrary.id, requestedItemIds))

  const itemMap = Object.fromEntries(libraryItems.map((r) => [r.user_library.id, r.games]))

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight mb-6">Inbox</h1>
      <div className="space-y-2">
        {proposalRows.map((p) => {
          const otherUserId = p.proposerId === user.id ? p.receiverId : p.proposerId
          const otherUser = userMap[otherUserId]
          const game = itemMap[p.requestedItemId]
          const lastMsg = lastMessageMap[p.id]
          const unread = unreadMap[p.id] ?? 0

          return (
            <Link
              key={p.id}
              href={`/inbox/${p.id}`}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="relative">
                <Avatar src={otherUser?.avatarUrl} alt={otherUser?.username} fallback={otherUser?.username} size="md" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-brand text-white text-[10px] flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${unread > 0 ? 'font-bold text-[#1a1a1a]' : 'font-semibold text-gray-700'}`}>
                    @{otherUser?.username}
                  </span>
                  {p.status === 'completed' && <Badge variant="success" className="text-[10px]">Completed</Badge>}
                </div>
                <p className="text-xs text-gray-500 truncate">{game?.title}</p>
                {lastMsg && (
                  <p className={`text-xs mt-0.5 truncate ${unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {lastMsg.senderId === user.id ? 'You: ' : ''}{lastMsg.content}
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {lastMsg ? formatRelativeDate(lastMsg.createdAt.toISOString()) : formatRelativeDate(p.updatedAt.toISOString())}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
