import { db } from '@/lib/db'
import { users, proposals } from '@/lib/db/schema'
import { eq, inArray, gte, count } from 'drizzle-orm'

export const metadata = { title: 'Admin — Gamexchange' }

async function getKPIs() {
  const last7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const last30days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    [{ value: totalUsers }],
    [{ value: totalProposals }],
    [{ value: completedSwaps }],
    [{ value: activeProposals }],
    [{ value: active7d }],
    [{ value: active30d }],
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(proposals),
    db.select({ value: count() }).from(proposals).where(eq(proposals.status, 'completed')),
    db.select({ value: count() }).from(proposals).where(inArray(proposals.status, ['pending', 'counter_proposed', 'accepted'])),
    db.select({ value: count() }).from(users).where(gte(users.updatedAt, last7days)),
    db.select({ value: count() }).from(users).where(gte(users.updatedAt, last30days)),
  ])

  const conversionRate = totalProposals
    ? Math.round((completedSwaps / totalProposals) * 100)
    : 0

  return { totalUsers, totalProposals, completedSwaps, activeProposals, active7d, active30d, conversionRate }
}

function KPICard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-extrabold text-[#1a1a1a] mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default async function AdminOverviewPage() {
  const kpis = await getKPIs()
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight mb-6">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KPICard label="Total users" value={kpis.totalUsers} />
        <KPICard label="Active (7d)" value={kpis.active7d} />
        <KPICard label="Active (30d)" value={kpis.active30d} />
        <KPICard label="Total proposals" value={kpis.totalProposals} />
        <KPICard label="Active proposals" value={kpis.activeProposals} />
        <KPICard label="Swaps completed" value={kpis.completedSwaps} />
        <KPICard label="Conversion rate" value={`${kpis.conversionRate}%`} sub="proposals → completed" />
      </div>
    </div>
  )
}
