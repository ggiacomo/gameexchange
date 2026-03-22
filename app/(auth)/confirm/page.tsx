import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { CheckCircle } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import Link from 'next/link'

export default async function ConfirmPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Sync emailConfirmed to our users table
  if (user.emailVerified) {
    await db
      .update(users)
      .set({ emailConfirmed: true })
      .where(eq(users.id, user.id))
  }

  return (
    <div className="text-center">
      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
      <h2 className="text-xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">Email confermata!</h2>
      <p className="text-gray-500 mb-6">Il tuo indirizzo email è stato verificato.</p>
      <Link href="/" className="text-brand hover:underline text-sm">
        Vai all&apos;app →
      </Link>
    </div>
  )
}
