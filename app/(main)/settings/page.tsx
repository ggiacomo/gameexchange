import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { users, authUser } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { SettingsClient } from '@/components/settings/settings-client'
import type { UserRow } from '@/types/database'

export const metadata = { title: 'Settings — Gamexchange' }

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id)).limit(1)
  if (!profile) redirect('/login')

  const [authUserRow] = await db.select({ email: authUser.email }).from(authUser).where(eq(authUser.id, user.id)).limit(1)

  const profileRow: UserRow = {
    id: profile.id, username: profile.username, avatar_url: profile.avatarUrl, bio: profile.bio,
    city: profile.city, country: profile.country, email_confirmed: profile.emailConfirmed,
    plan: profile.plan as 'free' | 'pro', plan_expires_at: profile.planExpiresAt?.toISOString() ?? null,
    rating_avg: Number(profile.ratingAvg), swaps_completed: profile.swapsCompleted,
    is_suspended: profile.isSuspended, created_at: profile.createdAt.toISOString(), updated_at: profile.updatedAt.toISOString(),
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <SettingsClient profile={profileRow} userEmail={authUserRow?.email ?? user.email ?? ''} />
    </div>
  )
}
