import Link from 'next/link'
import { eq, desc } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatProposalStatus } from '@/lib/utils/format'
import { db } from '@/lib/db'
import { proposals, users } from '@/lib/db/schema'
import type { ProposalRow, UserRow } from '@/types/database'

export const metadata = { title: 'Proposals — Admin' }

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
  pending: 'warning',
  counter_proposed: 'info',
  accepted: 'success',
  declined: 'destructive',
  expired: 'default',
  cancelled: 'default',
  completed: 'success',
}

export default async function AdminProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1')
  const pageSize = 30
  const offset = (page - 1) * pageSize

  const proposer = db.select().from(users).as('proposer')
  const receiver = db.select().from(users).as('receiver')

  const rows = await db
    .select()
    .from(proposals)
    .innerJoin(proposer, eq(proposals.proposerId, proposer.id))
    .innerJoin(receiver, eq(proposals.receiverId, receiver.id))
    .where(params.status ? eq(proposals.status, params.status) : undefined)
    .orderBy(desc(proposals.createdAt))
    .limit(pageSize)
    .offset(offset)

  const STATUSES = ['pending', 'counter_proposed', 'accepted', 'declined', 'expired', 'cancelled', 'completed']

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Proposals</h1>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/admin/proposals"
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${!params.status ? 'bg-brand text-white border-brand' : 'border-gray-300 hover:border-brand text-gray-600'}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/proposals?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${params.status === s ? 'bg-brand text-white border-brand' : 'border-gray-300 hover:border-brand text-gray-600'}`}
          >
            {formatProposalStatus(s as ProposalRow['status'])}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Proposer</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Receiver</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Created</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.proposals.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">@{row.proposer.username}</td>
                <td className="px-4 py-3 text-gray-900">@{row.receiver.username}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[row.proposals.status] ?? 'default'}>
                    {formatProposalStatus(row.proposals.status as ProposalRow['status'])}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(row.proposals.createdAt.toISOString())}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/proposals/${row.proposals.id}`} className="text-brand hover:underline text-xs">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
