import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata = { title: 'Create account — Gamexchange' }

export default async function RegisterPage() {
  const user = await getCurrentUser()
  if (user) redirect('/')

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Join Gamexchange</h1>
      <p className="text-sm text-gray-500 mb-6">Start swapping games with people nearby</p>
      <RegisterForm />
    </>
  )
}
