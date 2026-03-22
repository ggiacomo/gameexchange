'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

const schema = z.object({ email: z.string().email('Indirizzo email non valido') })
type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [sent, setSent] = useState(false)
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/auth/forget-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, redirectTo: '/reset-password/update' }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast({ title: json.message ?? 'Invio email fallito', variant: 'destructive' })
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">Controlla la tua email</h2>
        <p className="text-gray-500 mb-6">Abbiamo inviato un link per reimpostare la password.</p>
        <Link href="/login" className="text-brand text-sm hover:underline">
          Torna all&apos;accesso
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight mb-1">Reimposta password</h1>
      <p className="text-sm text-gray-500 mb-6">
        Inserisci la tua email e ti invieremo un link per reimpostare la password.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
          Invia link di reset
        </Button>
        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="text-brand hover:underline">
            Torna all&apos;accesso
          </Link>
        </p>
      </form>
    </>
  )
}
