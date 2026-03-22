import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { eq, and } from 'drizzle-orm'
import { Gamepad2 } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatProposalStatus, formatCondition, daysUntil } from '@/lib/utils/format'
import { ProposalActions } from '@/components/proposals/proposal-actions'
import { ReviewForm } from '@/components/proposals/review-form'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import {
  proposals,
  users,
  userLibrary,
  games,
  proposalItems,
  reviews,
} from '@/lib/db/schema'
import type { ProposalRow, UserRow, LibraryItemWithGame, ProposalItemRow } from '@/types/database'

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
  pending: 'warning',
  counter_proposed: 'info',
  accepted: 'success',
  declined: 'destructive',
  expired: 'default',
  cancelled: 'default',
  completed: 'success',
}

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Fetch proposal with relations
  const [proposalRow] = await db
    .select()
    .from(proposals)
    .where(eq(proposals.id, id))

  if (!proposalRow) notFound()
  if (proposalRow.proposerId !== user.id && proposalRow.receiverId !== user.id) notFound()

  // Fetch users
  const [proposerRow] = await db.select().from(users).where(eq(users.id, proposalRow.proposerId))
  const [receiverRow] = await db.select().from(users).where(eq(users.id, proposalRow.receiverId))

  if (!proposerRow || !receiverRow) notFound()

  // Fetch requested item with game
  const [requestedLibRow] = await db
    .select()
    .from(userLibrary)
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .where(eq(userLibrary.id, proposalRow.requestedItemId))

  if (!requestedLibRow) notFound()

  // Fetch proposal items with library + game
  const piRows = await db
    .select()
    .from(proposalItems)
    .innerJoin(userLibrary, eq(proposalItems.libraryItemId, userLibrary.id))
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .where(eq(proposalItems.proposalId, id))

  // Check existing review
  const [myReview] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.proposalId, id), eq(reviews.reviewerId, user.id)))

  // Map to interface types
  const proposer: UserRow = {
    id: proposerRow.id,
    username: proposerRow.username,
    avatar_url: proposerRow.avatarUrl,
    bio: proposerRow.bio,
    city: proposerRow.city,
    country: proposerRow.country,
    email_confirmed: proposerRow.emailConfirmed,
    plan: proposerRow.plan as 'free' | 'pro',
    plan_expires_at: proposerRow.planExpiresAt?.toISOString() ?? null,
    rating_avg: Number(proposerRow.ratingAvg),
    swaps_completed: proposerRow.swapsCompleted,
    is_suspended: proposerRow.isSuspended,
    created_at: proposerRow.createdAt.toISOString(),
    updated_at: proposerRow.updatedAt.toISOString(),
  }

  const receiver: UserRow = {
    id: receiverRow.id,
    username: receiverRow.username,
    avatar_url: receiverRow.avatarUrl,
    bio: receiverRow.bio,
    city: receiverRow.city,
    country: receiverRow.country,
    email_confirmed: receiverRow.emailConfirmed,
    plan: receiverRow.plan as 'free' | 'pro',
    plan_expires_at: receiverRow.planExpiresAt?.toISOString() ?? null,
    rating_avg: Number(receiverRow.ratingAvg),
    swaps_completed: receiverRow.swapsCompleted,
    is_suspended: receiverRow.isSuspended,
    created_at: receiverRow.createdAt.toISOString(),
    updated_at: receiverRow.updatedAt.toISOString(),
  }

  const requestedItem: LibraryItemWithGame = {
    id: requestedLibRow.user_library.id,
    user_id: requestedLibRow.user_library.userId,
    game_id: requestedLibRow.user_library.gameId,
    status: requestedLibRow.user_library.status as LibraryItemWithGame['status'],
    min_compensation: requestedLibRow.user_library.minCompensation
      ? Number(requestedLibRow.user_library.minCompensation)
      : null,
    condition: requestedLibRow.user_library.condition as LibraryItemWithGame['condition'],
    notes: requestedLibRow.user_library.notes,
    created_at: requestedLibRow.user_library.createdAt.toISOString(),
    updated_at: requestedLibRow.user_library.updatedAt.toISOString(),
    games: {
      id: requestedLibRow.games.id,
      title: requestedLibRow.games.title,
      cover_url: requestedLibRow.games.coverUrl,
      platforms: requestedLibRow.games.platforms ?? [],
      genres: requestedLibRow.games.genres ?? [],
      release_year: requestedLibRow.games.releaseYear,
      igdb_slug: requestedLibRow.games.igdbSlug,
    },
  }

  const mappedPiRows = piRows.map((row) => ({
    item: {
      id: row.user_library.id,
      user_id: row.user_library.userId,
      game_id: row.user_library.gameId,
      status: row.user_library.status as LibraryItemWithGame['status'],
      min_compensation: row.user_library.minCompensation ? Number(row.user_library.minCompensation) : null,
      condition: row.user_library.condition as LibraryItemWithGame['condition'],
      notes: row.user_library.notes,
      created_at: row.user_library.createdAt.toISOString(),
      updated_at: row.user_library.updatedAt.toISOString(),
      games: {
        id: row.games.id,
        title: row.games.title,
        cover_url: row.games.coverUrl,
        platforms: row.games.platforms ?? [],
        genres: row.games.genres ?? [],
        release_year: row.games.releaseYear,
        igdb_slug: row.games.igdbSlug,
      },
    },
    piId: row.proposal_items.id,
    offeredBy: row.proposal_items.offeredBy,
    compensationAmount: Number(row.proposal_items.compensationAmount),
  }))

  const p: ProposalRow & {
    proposer: UserRow
    receiver: UserRow
    requested_item: LibraryItemWithGame
    proposal_items: (ProposalItemRow & { library_item: LibraryItemWithGame })[]
  } = {
    id: proposalRow.id,
    proposer_id: proposalRow.proposerId,
    receiver_id: proposalRow.receiverId,
    requested_item_id: proposalRow.requestedItemId,
    status: proposalRow.status as ProposalRow['status'],
    message: proposalRow.message,
    expires_at: proposalRow.expiresAt.toISOString(),
    completed_at: proposalRow.completedAt?.toISOString() ?? null,
    created_at: proposalRow.createdAt.toISOString(),
    updated_at: proposalRow.updatedAt.toISOString(),
    proposer,
    receiver,
    requested_item: requestedItem,
    proposal_items: mappedPiRows.map((r) => ({
      id: r.piId,
      proposal_id: id,
      library_item_id: r.item.id,
      compensation_amount: r.compensationAmount,
      offered_by: r.offeredBy as 'proposer' | 'receiver',
      created_at: new Date().toISOString(),
      library_item: r.item,
    })),
  }

  const isProposer = user.id === p.proposer_id
  const isReceiver = user.id === p.receiver_id
  const otherUser = isProposer ? p.receiver : p.proposer

  const proposerItemsList = p.proposal_items.filter((pi) => pi.offered_by === 'proposer')
  const receiverItemsList = p.proposal_items.filter((pi) => pi.offered_by === 'receiver')

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-extrabold text-[#1a1a1a] tracking-tight">Swap proposal</h1>
            <p className="text-sm text-gray-500">{formatDate(p.created_at)}</p>
          </div>
          <Badge variant={statusVariant[p.status] ?? 'default'}>
            {formatProposalStatus(p.status)}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/profile/${p.proposer.username}`}>
            <Avatar src={p.proposer.avatar_url} alt={p.proposer.username} fallback={p.proposer.username} size="md" />
          </Link>
          <div className="text-sm text-gray-500">proposes to</div>
          <Link href={`/profile/${p.receiver.username}`}>
            <Avatar src={p.receiver.avatar_url} alt={p.receiver.username} fallback={p.receiver.username} size="md" />
          </Link>
          <div>
            <span className="text-sm font-medium">@{p.proposer.username}</span>
            <span className="text-sm text-gray-500"> → </span>
            <span className="text-sm font-medium">@{p.receiver.username}</span>
          </div>
        </div>
        {['pending', 'counter_proposed'].includes(p.status) && (
          <p className="text-xs text-gray-500 mt-3">
            Expires in {daysUntil(p.expires_at)} day{daysUntil(p.expires_at) !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Requested item */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          @{p.proposer.username} wants
        </h2>
        <GameItemCard item={p.requested_item} />
      </div>

      {/* Offered items */}
      {proposerItemsList.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            @{p.proposer.username} offers
          </h2>
          <div className="space-y-2">
            {proposerItemsList.map((pi) => (
              <GameItemCard key={pi.id} item={pi.library_item} compensation={pi.compensation_amount} />
            ))}
          </div>
        </div>
      )}

      {/* Receiver items (counter) */}
      {receiverItemsList.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            @{p.receiver.username} counter-offers
          </h2>
          <div className="space-y-2">
            {receiverItemsList.map((pi) => (
              <GameItemCard key={pi.id} item={pi.library_item} compensation={pi.compensation_amount} />
            ))}
          </div>
        </div>
      )}

      {/* Message */}
      {p.message && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Message</h2>
          <p className="text-sm text-gray-700 italic">&ldquo;{p.message}&rdquo;</p>
        </div>
      )}

      {/* Actions */}
      <ProposalActions
        proposal={p}
        isProposer={isProposer}
        isReceiver={isReceiver}
        currentUserId={user.id}
      />

      {/* Review form */}
      {p.status === 'completed' && !myReview && (
        <ReviewForm
          proposalId={id}
          revieweeId={otherUser.id}
          revieweeName={otherUser.username}
        />
      )}

      {/* Chat link */}
      {p.status === 'accepted' && (
        <Link href={`/inbox/${id}`}>
          <div className="bg-brand text-white rounded-2xl p-4 text-center hover:bg-brand-dark transition-colors">
            <p className="font-medium">Chat with @{otherUser.username} →</p>
          </div>
        </Link>
      )}
    </div>
  )
}

function GameItemCard({
  item,
  compensation,
}: {
  item: LibraryItemWithGame
  compensation?: number
}) {
  const game = item.games
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-7 flex-shrink-0 rounded overflow-hidden bg-gray-100">
        {game.cover_url ? (
          <Image src={game.cover_url} alt={game.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Gamepad2 className="h-4 w-4 text-gray-300" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{game.title}</p>
        <p className="text-xs text-gray-500">{formatCondition(item.condition)}</p>
      </div>
      {compensation != null && compensation > 0 && (
        <Badge variant="warning">+€{compensation.toFixed(2)}</Badge>
      )}
    </div>
  )
}
