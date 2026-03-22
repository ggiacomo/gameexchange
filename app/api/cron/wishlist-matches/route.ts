import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userLibrary, userWishlist, users, games, notifications } from '@/lib/db/schema'
import { eq, ne, inArray, gte, and } from 'drizzle-orm'
import { sendWishlistMatchEmail } from '@/lib/email/templates'
import { createNotification } from '@/lib/notifications/create'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const newListings = await db
    .select()
    .from(userLibrary)
    .innerJoin(users, eq(userLibrary.userId, users.id))
    .innerJoin(games, eq(userLibrary.gameId, games.id))
    .where(
      and(
        inArray(userLibrary.status, ['available', 'with_compensation']),
        gte(userLibrary.updatedAt, oneWeekAgo)
      )
    )

  if (!newListings.length) return NextResponse.json({ notified: 0 })

  let notified = 0

  for (const listing of newListings) {
    const wanters = await db
      .select()
      .from(userWishlist)
      .innerJoin(users, eq(userWishlist.userId, users.id))
      .where(
        and(
          eq(userWishlist.gameId, listing.user_library.gameId),
          ne(userWishlist.userId, listing.user_library.userId)
        )
      )

    for (const wanter of wanters) {
      // Check if already notified this week
      const [existing] = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, wanter.user_wishlist.userId),
            eq(notifications.type, 'wishlist_match'),
            gte(notifications.createdAt, oneWeekAgo)
          )
        )
        .limit(1)

      if (existing) continue

      await createNotification(wanter.user_wishlist.userId, 'wishlist_match', {
        game_id: listing.user_library.gameId,
        gameName: listing.games.title,
        ownerUsername: listing.users.username,
      })

      await sendWishlistMatchEmail(
        wanter.users.id,
        listing.games.title,
        listing.users.username,
        `/profile/${listing.users.username}`
      )

      notified++
    }
  }

  return NextResponse.json({ notified })
}
