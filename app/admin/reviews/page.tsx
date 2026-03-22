import { eq, desc } from 'drizzle-orm'
import { AdminReviewsClient } from '@/components/admin/admin-reviews-client'
import { db } from '@/lib/db'
import { reviews, users } from '@/lib/db/schema'
import type { ReviewRow, UserRow } from '@/types/database'

export const metadata = { title: 'Reviews — Admin' }

export default async function AdminReviewsPage() {
  const reviewer = db.select().from(users).as('reviewer')
  const reviewee = db.select().from(users).as('reviewee')

  const rows = await db
    .select()
    .from(reviews)
    .innerJoin(reviewer, eq(reviews.reviewerId, reviewer.id))
    .innerJoin(reviewee, eq(reviews.revieweeId, reviewee.id))
    .orderBy(desc(reviews.createdAt))
    .limit(100)

  const mapped = rows.map((row) => ({
    id: row.reviews.id,
    proposal_id: row.reviews.proposalId,
    reviewer_id: row.reviews.reviewerId,
    reviewee_id: row.reviews.revieweeId,
    rating: row.reviews.rating,
    comment: row.reviews.comment,
    created_at: row.reviews.createdAt.toISOString(),
    reviewer: {
      id: row.reviewer.id,
      username: row.reviewer.username,
      avatar_url: row.reviewer.avatarUrl,
      bio: row.reviewer.bio,
      city: row.reviewer.city,
      country: row.reviewer.country,
      email_confirmed: row.reviewer.emailConfirmed,
      plan: row.reviewer.plan as 'free' | 'pro',
      plan_expires_at: row.reviewer.planExpiresAt?.toISOString() ?? null,
      rating_avg: Number(row.reviewer.ratingAvg),
      swaps_completed: row.reviewer.swapsCompleted,
      is_suspended: row.reviewer.isSuspended,
      created_at: row.reviewer.createdAt.toISOString(),
      updated_at: row.reviewer.updatedAt.toISOString(),
    } as UserRow,
    reviewee: {
      id: row.reviewee.id,
      username: row.reviewee.username,
      avatar_url: row.reviewee.avatarUrl,
      bio: row.reviewee.bio,
      city: row.reviewee.city,
      country: row.reviewee.country,
      email_confirmed: row.reviewee.emailConfirmed,
      plan: row.reviewee.plan as 'free' | 'pro',
      plan_expires_at: row.reviewee.planExpiresAt?.toISOString() ?? null,
      rating_avg: Number(row.reviewee.ratingAvg),
      swaps_completed: row.reviewee.swapsCompleted,
      is_suspended: row.reviewee.isSuspended,
      created_at: row.reviewee.createdAt.toISOString(),
      updated_at: row.reviewee.updatedAt.toISOString(),
    } as UserRow,
  }))

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight mb-6">Recensioni</h1>
      <AdminReviewsClient reviews={mapped as (ReviewRow & { reviewer: UserRow; reviewee: UserRow })[]} />
    </div>
  )
}
