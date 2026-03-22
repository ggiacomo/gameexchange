import { ilike, or, desc } from 'drizzle-orm'
import { AdminUsersClient } from '@/components/admin/admin-users-client'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import type { UserRow } from '@/types/database'

export const metadata = { title: 'Users — Admin' }

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1')
  const pageSize = 20
  const offset = (page - 1) * pageSize

  const rows = await db
    .select()
    .from(users)
    .where(
      params.q
        ? or(ilike(users.username, `%${params.q}%`), ilike(users.city, `%${params.q}%`))
        : undefined
    )
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(offset)

  const mappedUsers: UserRow[] = rows.map((u) => ({
    id: u.id,
    username: u.username,
    avatar_url: u.avatarUrl,
    bio: u.bio,
    city: u.city,
    country: u.country,
    email_confirmed: u.emailConfirmed,
    plan: u.plan as 'free' | 'pro',
    plan_expires_at: u.planExpiresAt?.toISOString() ?? null,
    rating_avg: Number(u.ratingAvg),
    swaps_completed: u.swapsCompleted,
    is_suspended: u.isSuspended,
    created_at: u.createdAt.toISOString(),
    updated_at: u.updatedAt.toISOString(),
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>
      <AdminUsersClient
        users={mappedUsers}
        total={mappedUsers.length}
        page={page}
        pageSize={pageSize}
      />
    </div>
  )
}
