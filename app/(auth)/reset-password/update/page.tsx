'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth/client'
import { useToast } from '@/components/ui/toast'

const schema = z
  .object({
    password: z.string().min(8, 'Minimo 8 caratteri'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Le password non coincidono',
    path: ['confirm'],
  })

type FormData = z.infer<typeof schema>

function UpdatePasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    const token = searchParams.get('token')
    if (!token) {
      toast({ title: 'Link di reset non valido', variant: 'destructive' })
      return
    }
    const { error } = await authClient.resetPassword({ newPassword: data.password, token })
    if (error) {
      toast({ title: error.message ?? 'Aggiornamento password fallito', variant: 'destructive' })
      return
    }
    toast({ title: 'Password aggiornata!', variant: 'success' })
    router.push('/login')
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight mb-1">Nuova password</h1>
      <p className="text-sm text-gray-500 mb-6">Scegli una password sicura per il tuo account.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nuova password"
          type="password"
          placeholder="Almeno 8 caratteri"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Conferma password"
          type="password"
          placeholder="Ripeti la password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
          Aggiorna password
        </Button>
      </form>
    </>
  )
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full mx-auto" />}>
      <UpdatePasswordForm />
    </Suspense>
  )
}
