import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { users, messages, proposals, notifications } from '@/lib/db/schema'
import { eq, or, and, isNull, inArray, ne } from 'drizzle-orm'
import { Navbar } from '@/components/ui/navbar'
import { EmailConfirmationBanner } from '@/components/ui/email-confirmation-banner'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  if (!profile || !profile.city) {
    redirect('/onboarding')
  }

  // Count unread notifications
  const unreadNotifsRows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)))

  const unreadNotifications = unreadNotifsRows.length

  // Count unread messages in accepted proposals
  const acceptedProposals = await db
    .select({ id: proposals.id })
    .from(proposals)
    .where(
      and(
        or(eq(proposals.proposerId, user.id), eq(proposals.receiverId, user.id)),
        eq(proposals.status, 'accepted')
      )
    )

  const proposalIds = acceptedProposals.map((p) => p.id)

  let unreadMessages = 0
  if (proposalIds.length > 0) {
    const unreadRows = await db
      .select({ id: messages.id })
      .from(messages)
      .where(
        and(
          inArray(messages.proposalId, proposalIds),
          ne(messages.senderId, user.id),
          isNull(messages.readAt)
        )
      )
    unreadMessages = unreadRows.length
  }

  const profileRow = {
    id: profile.id,
    username: profile.username,
    avatar_url: profile.avatarUrl,
    bio: profile.bio,
    city: profile.city,
    country: profile.country,
    email_confirmed: profile.emailConfirmed,
    plan: profile.plan as 'free' | 'pro',
    plan_expires_at: profile.planExpiresAt?.toISOString() ?? null,
    rating_avg: Number(profile.ratingAvg),
    swaps_completed: profile.swapsCompleted,
    is_suspended: profile.isSuspended,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString(),
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Navbar
        user={profileRow}
        unreadNotifications={unreadNotifications}
        unreadMessages={unreadMessages}
      />
      {!profile.emailConfirmed && <EmailConfirmationBanner />}
      <main className="mx-auto max-w-[1280px] px-4 py-8">{children}</main>
    </div>
  )
}
