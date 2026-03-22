import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { authUser } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, ArrowLeftRight, Star, BarChart2, Gamepad2 } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Panoramica', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Utenti', icon: Users },
  { href: '/admin/proposals', label: 'Proposte', icon: ArrowLeftRight },
  { href: '/admin/reviews', label: 'Recensioni', icon: Star },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [authRow] = await db.select({ email: authUser.email }).from(authUser).where(eq(authUser.id, user.id)).limit(1)
  const isAdmin = authRow?.email?.endsWith('@gamexchange.app')
  if (!isAdmin) redirect('/')

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex">
      <aside className="w-56 flex-shrink-0 bg-[#1a1a1a] min-h-screen">
        <div className="p-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-brand flex items-center justify-center">
              <Gamepad2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-extrabold text-white tracking-tight">Gamexchange</span>
          </Link>
          <p className="text-xs text-white/40 mt-0.5 pl-9">Pannello admin</p>
        </div>
        <nav className="p-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors mb-0.5">
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
