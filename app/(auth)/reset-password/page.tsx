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

const schema = z.object({ email: z.string().email('Invalid email address') })
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
      toast({ title: json.message ?? 'Failed to send reset email', variant: 'destructive' })
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">Check your inbox</h2>
        <p className="text-gray-500 mb-6">We sent a password reset link to your email.</p>
        <Link href="/login" className="text-brand text-sm hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight mb-1">Reset password</h1>
      <p className="text-sm text-gray-500 mb-6">
        Enter your email and we&apos;ll send you a reset link.
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
          Send reset link
        </Button>
        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="text-brand hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </>
  )
}
