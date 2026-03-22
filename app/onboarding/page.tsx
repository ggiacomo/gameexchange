import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { Gamepad2 } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const metadata = { title: 'Inizia — Gamexchange' }

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [profile] = await db
    .select({ id: users.id, city: users.city })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  const hasProfile = !!(profile && profile.city)

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1a1a1a]">
        <div className="mx-auto max-w-[1280px] px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
              <Gamepad2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">Gamexchange</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-12">
        <OnboardingFlow hasProfile={hasProfile} />
      </main>
    </div>
  )
}
