import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = { title: 'Accedi — Gamexchange' }

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect('/')

  return (
    <>
      <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight mb-1">Bentornato</h1>
      <p className="text-sm text-gray-500 mb-6">Accedi al tuo account</p>
      <LoginForm />
    </>
  )
}
