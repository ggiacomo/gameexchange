import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { authUser } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, ArrowLeftRight, Star, BarChart2, Gamepad2 } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/proposals', label: 'Proposals', icon: ArrowLeftRight },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [authRow] = await db.select({ email: authUser.email }).from(authUser).where(eq(authUser.id, user.id)).limit(1)
  const isAdmin = authRow?.email?.endsWith('@gamexchange.app')
  if (!isAdmin) redirect('/')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 min-h-screen">
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2 text-brand font-bold">
            <Gamepad2 className="h-5 w-5" />
            Gamexchange
          </Link>
          <p className="text-xs text-gray-500 mt-0.5">Admin panel</p>
        </div>
        <nav className="p-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors mb-0.5">
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
