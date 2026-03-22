import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { eq, isNull } from 'drizzle-orm'
import type { NotificationType } from '@/types/database'

export async function createNotification(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>
): Promise<void> {
  await db.insert(notifications).values({ userId, type, payload })
}

export async function getUnreadCount(userId: string): Promise<number> {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))

  return rows.filter((r) => r.readAt === null).length
}
