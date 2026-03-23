'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { authClient } from '@/lib/auth/client'
import { createProfile } from './register-actions'
import { useToast } from '@/components/ui/toast'

const schema = z.object({
  username: z
    .string()
    .min(3, 'Minimum 3 characters')
    .max(20, 'Maximum 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscore'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Minimum 8 characters'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
})

type FormData = z.infer<typeof schema>

const COUNTRIES = [
  { value: 'IT', label: 'Italy' },
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' },
  { value: 'ES', label: 'Spain' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'BE', label: 'Belgium' },
  { value: 'PT', label: 'Portugal' },
  { value: 'PL', label: 'Poland' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'DK', label: 'Denmark' },
  { value: 'FI', label: 'Finland' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'AT', label: 'Austria' },
  { value: 'IE', label: 'Ireland' },
]

export function RegisterForm() {
  const router = useRouter()
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const country = watch('country')

  const onSubmit = async (data: FormData) => {
    // Step 1: Create auth user
    const { error: authError } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.username,
      callbackURL: `${window.location.origin}/confirm`,
    })

    if (authError) {
      toast({ title: authError.message ?? 'Registration failed', variant: 'destructive' })
      return
    }

    // Step 2: Create profile
    const { error: profileError } = await createProfile({
      username: data.username,
      city: data.city,
      country: data.country,
    })

    if (profileError) {
      toast({ title: profileError, variant: 'destructive' })
      return
    }

    window.location.href = '/onboarding'
  }

  const handleGoogle = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/onboarding',
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleGoogle}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs text-gray-400">
          <span className="bg-white px-2">or</span>
        </div>
      </div>

      <Input
        label="Username"
        placeholder="coolswapper"
        error={errors.username?.message}
        {...register('username')}
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        error={errors.password?.message}
        {...register('password')}
      />
      <Input
        label="City"
        placeholder="Milan"
        error={errors.city?.message}
        {...register('city')}
      />
      <Select
        label="Country"
        options={COUNTRIES}
        value={country}
        onChange={(v) => setValue('country', v)}
        error={errors.country?.message}
        placeholder="Select your country"
      />

      <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
        Create account
      </Button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-brand font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
