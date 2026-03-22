import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { notifications as notificationsTable } from '@/lib/db/schema'
import { eq, isNull, and } from 'drizzle-orm'
import Link from 'next/link'
import { Bell, ArrowLeftRight, MessageSquare, Star, Heart, CheckCircle } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils/format'
import type { NotificationRow, NotificationType } from '@/types/database'

export const metadata = { title: 'Notifiche — Gamexchange' }

const icons: Record<NotificationType, React.ReactNode> = {
  proposal_received: <ArrowLeftRight className="h-4 w-4 text-brand" />,
  proposal_accepted: <CheckCircle className="h-4 w-4 text-green-500" />,
  proposal_declined: <ArrowLeftRight className="h-4 w-4 text-red-500" />,
  counter_received: <ArrowLeftRight className="h-4 w-4 text-blue-500" />,
  message_received: <MessageSquare className="h-4 w-4 text-brand" />,
  swap_completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  review_received: <Star className="h-4 w-4 text-yellow-500" />,
  wishlist_match: <Heart className="h-4 w-4 text-red-400" />,
}

const labels: Record<NotificationType, string> = {
  proposal_received: 'Nuova proposta di scambio',
  proposal_accepted: 'Proposta accettata',
  proposal_declined: 'Proposta rifiutata',
  counter_received: 'Controproposta ricevuta',
  message_received: 'Nuovo messaggio',
  swap_completed: 'Scambio completato',
  review_received: 'Nuova recensione',
  wishlist_match: 'Match nella wishlist',
}

function getLink(n: NotificationRow): string {
  const p = n.payload as Record<string, string>
  switch (n.type) {
    case 'message_received': return `/inbox/${p.proposalId}`
    default: return p.proposalId ? `/proposals/${p.proposalId}` : '/browse'
  }
}

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, user.id))
    .orderBy(notificationsTable.createdAt)
    .limit(50)

  // Mark all as read
  await db
    .update(notificationsTable)
    .set({ readAt: new Date() })
    .where(and(eq(notificationsTable.userId, user.id), isNull(notificationsTable.readAt)))

  const notifs: NotificationRow[] = rows.map((r) => ({
    id: r.id,
    user_id: r.userId,
    type: r.type as NotificationType,
    payload: r.payload as Record<string, unknown>,
    read_at: r.readAt?.toISOString() ?? null,
    created_at: r.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight mb-6">Notifiche</h1>
      {notifs.length === 0 ? (
        <div className="py-20 text-center">
          <Bell className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#1a1a1a] mb-1">Tutto in ordine!</h3>
          <p className="text-sm text-gray-400">Nessuna notifica ancora.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <Link
              key={n.id}
              href={getLink(n)}
              className={`flex items-start gap-3 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 ${
                !n.read_at ? 'bg-brand/5' : 'bg-white'
              }`}
            >
              <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                {icons[n.type]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#1a1a1a]">{labels[n.type]}</p>
                {(n.payload as Record<string, string>).gameName && (
                  <p className="text-sm text-gray-500">{(n.payload as Record<string, string>).gameName}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">{formatRelativeDate(n.created_at)}</p>
              </div>
              {!n.read_at && <div className="h-2 w-2 rounded-full bg-brand mt-2 flex-shrink-0" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
