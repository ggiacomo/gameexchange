import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { Gamepad2 } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Get started — Gamexchange' }

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1280px] px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-brand">
            <Gamepad2 className="h-6 w-6" />
            Gamexchange
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-12">
        <OnboardingFlow />
      </main>
    </div>
  )
}
