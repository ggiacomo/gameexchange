import { RegisterForm } from '@/components/auth/register-form'

export const metadata = { title: 'Registrati — Gamexchange' }

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight mb-1">Unisciti a Gamexchange</h1>
      <p className="text-sm text-gray-500 mb-6">Inizia a scambiare giochi con persone vicino a te</p>
      <RegisterForm />
    </>
  )
}
