import { eq, count } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, proposals } from '@/lib/db/schema'

export const metadata = { title: 'Analytics — Admin' }

export default async function AdminAnalyticsPage() {
  // Top cities
  const cityRows = await db.select({ city: users.city }).from(users)
  const cityCounts: Record<string, number> = {}
  cityRows.forEach((u) => {
    cityCounts[u.city] = (cityCounts[u.city] ?? 0) + 1
  })
  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // Proposal funnel
  const STATUSES = ['pending', 'counter_proposed', 'accepted', 'declined', 'expired', 'cancelled', 'completed']
  const funnelData = await Promise.all(
    STATUSES.map(async (s) => {
      const [row] = await db
        .select({ count: count() })
        .from(proposals)
        .where(eq(proposals.status, s))
      return { status: s, count: row?.count ?? 0 }
    })
  )
  const total = funnelData.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight">Analytics</h1>

      {/* Proposal funnel */}
      <div>
        <h2 className="text-lg font-extrabold text-[#1a1a1a] tracking-tight mb-4">Proposal funnel</h2>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Count</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {funnelData.map((d) => (
                <tr key={d.status}>
                  <td className="px-4 py-3 capitalize">{d.status.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-right font-medium">{d.count}</td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {total > 0 ? Math.round((d.count / total) * 100) : 0}%
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">{total}</td>
                <td className="px-4 py-3 text-right">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Top cities */}
      <div>
        <h2 className="text-lg font-extrabold text-[#1a1a1a] tracking-tight mb-4">Top cities</h2>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">City</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topCities.map(([city, cityCount], i) => (
                <tr key={city}>
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{city}</td>
                  <td className="px-4 py-3 text-right">{cityCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
