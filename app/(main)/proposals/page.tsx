import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { proposals, users, userLibrary, games } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { formatRelativeDate, formatProposalStatus, daysUntil } from '@/lib/utils/format'
import { ArrowLeftRight, Clock } from 'lucide-react'
import type { ProposalRow, UserRow, LibraryItemWithGame } from '@/types/database'

export const metadata = { title: 'Proposte — Gamexchange' }

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
  pending: 'warning', counter_proposed: 'info', accepted: 'success',
  declined: 'destructive', expired: 'default', cancelled: 'default', completed: 'success',
}

type ProposalWithDetails = ProposalRow & {
  proposer: UserRow
  receiver: UserRow
  requested_item: LibraryItemWithGame
}

function mapRow(
  p: typeof proposals.$inferSelect,
  proposer: typeof users.$inferSelect,
  receiver: typeof users.$inferSelect,
  li: typeof userLibrary.$inferSelect,
  g: typeof games.$inferSelect
): ProposalWithDetails {
  const mapUser = (u: typeof users.$inferSelect): UserRow => ({
    id: u.id, username: u.username, avatar_url: u.avatarUrl, bio: u.bio, city: u.city, country: u.country,
    email_confirmed: u.emailConfirmed, plan: u.plan as 'free' | 'pro', plan_expires_at: u.planExpiresAt?.toISOString() ?? null,
    rating_avg: Number(u.ratingAvg), swaps_completed: u.swapsCompleted, is_suspended: u.isSuspended,
    created_at: u.createdAt.toISOString(), updated_at: u.updatedAt.toISOString(),
  })
  return {
    id: p.id, proposer_id: p.proposerId, receiver_id: p.receiverId, requested_item_id: p.requestedItemId,
    status: p.status as ProposalRow['status'], message: p.message,
    expires_at: p.expiresAt.toISOString(), completed_at: p.completedAt?.toISOString() ?? null,
    created_at: p.createdAt.toISOString(), updated_at: p.updatedAt.toISOString(),
    proposer: mapUser(proposer), receiver: mapUser(receiver),
    requested_item: {
      id: li.id, user_id: li.userId, game_id: li.gameId, status: li.status as LibraryItemWithGame['status'],
      min_compensation: li.minCompensation ? Number(li.minCompensation) : null,
      condition: li.condition as LibraryItemWithGame['condition'], notes: li.notes,
      created_at: li.createdAt.toISOString(), updated_at: li.updatedAt.toISOString(),
      games: { id: g.id, title: g.title, cover_url: g.coverUrl, platforms: g.platforms ?? null, genres: g.genres ?? null, release_year: g.releaseYear, igdb_slug: g.igdbSlug },
    },
  }
}

export default async function ProposalsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const proposer = users
  const receiver = { ...users } as typeof users

  // Use aliases for the join
  const sentRows = await db.select({
    proposal: proposals,
    proposerUser: users,
  })
  .from(proposals)
  .innerJoin(users, eq(proposals.proposerId, users.id))
  .where(eq(proposals.proposerId, user.id))
  .orderBy(proposals.createdAt)
  .limit(50)

  // Build sent proposals with all details
  const sent: ProposalWithDetails[] = []
  for (const row of sentRows) {
    const [receiverUser] = await db.select().from(users).where(eq(users.id, row.proposal.receiverId)).limit(1)
    const [li] = await db.select().from(userLibrary).where(eq(userLibrary.id, row.proposal.requestedItemId)).limit(1)
    if (!receiverUser || !li) continue
    const [g] = await db.select().from(games).where(eq(games.id, li.gameId)).limit(1)
    if (!g) continue
    sent.push(mapRow(row.proposal, row.proposerUser, receiverUser, li, g))
  }

  const receivedRows = await db.select({
    proposal: proposals,
    receiverUser: users,
  })
  .from(proposals)
  .innerJoin(users, eq(proposals.receiverId, users.id))
  .where(eq(proposals.receiverId, user.id))
  .orderBy(proposals.createdAt)
  .limit(50)

  const received: ProposalWithDetails[] = []
  for (const row of receivedRows) {
    const [proposerUser] = await db.select().from(users).where(eq(users.id, row.proposal.proposerId)).limit(1)
    const [li] = await db.select().from(userLibrary).where(eq(userLibrary.id, row.proposal.requestedItemId)).limit(1)
    if (!proposerUser || !li) continue
    const [g] = await db.select().from(games).where(eq(games.id, li.gameId)).limit(1)
    if (!g) continue
    received.push(mapRow(row.proposal, proposerUser, row.receiverUser, li, g))
  }

  const sentActive = sent.filter((p) => ['pending', 'counter_proposed', 'accepted'].includes(p.status)).length
  const receivedActive = received.filter((p) => ['pending', 'counter_proposed'].includes(p.status)).length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight">Proposte</h1>
      </div>
      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">
            Ricevute {receivedActive > 0 && <Badge variant="brand" className="ml-2">{receivedActive}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent">
            Inviate {sentActive > 0 && <Badge variant="warning" className="ml-2">{sentActive}</Badge>}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="received">
          <ProposalList proposals={received} type="received" />
        </TabsContent>
        <TabsContent value="sent">
          <ProposalList proposals={sent} type="sent" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProposalList({ proposals: props, type }: { proposals: ProposalWithDetails[]; type: 'sent' | 'received' }) {
  if (props.length === 0) {
    return (
      <div className="py-16 text-center">
        <ArrowLeftRight className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Nessuna proposta ancora.</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {props.map((proposal) => {
        const otherUser = type === 'sent' ? proposal.receiver : proposal.proposer
        const game = proposal.requested_item?.games
        const days = daysUntil(proposal.expires_at)
        const isActive = ['pending', 'counter_proposed'].includes(proposal.status)
        return (
          <Link key={proposal.id} href={`/proposals/${proposal.id}`} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
            <Avatar src={otherUser?.avatar_url} alt={otherUser?.username} fallback={otherUser?.username} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-[#1a1a1a]">@{otherUser?.username}</span>
                <Badge variant={statusVariant[proposal.status] ?? 'default'}>{formatProposalStatus(proposal.status)}</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {type === 'received' ? 'Vuole il tuo' : 'Vuoi'}: <strong>{game?.title}</strong>
              </p>
              {isActive && days <= 2 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 text-amber-500" />
                  <span className="text-xs text-amber-600">Scade in {days}g</span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{formatRelativeDate(proposal.created_at)}</span>
          </Link>
        )
      })}
    </div>
  )
}
