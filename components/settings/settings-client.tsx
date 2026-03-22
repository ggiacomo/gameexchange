'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'
import { CheckCircle, Mail } from 'lucide-react'
import { authClient } from '@/lib/auth/client'
import { db } from '@/lib/db'
import type { UserRow } from '@/types/database'

const schema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  bio: z.string().max(160).optional(),
  city: z.string().min(1),
  country: z.string().min(1),
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
]

interface SettingsClientProps {
  profile: UserRow
  userEmail: string
}

export function SettingsClient({ profile, userEmail }: SettingsClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [resending, setResending] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: profile.username,
      bio: profile.bio ?? '',
      city: profile.city,
      country: profile.country,
    },
  })

  const country = watch('country')
  const bio = watch('bio')

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, avatar_url: avatarUrl }),
    })
    const json = await res.json()
    if (json.error) {
      toast({ title: json.error, variant: 'destructive' })
    } else {
      toast({ title: 'Profile updated!', variant: 'success' })
      router.refresh()
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (json.url) {
        setAvatarUrl(json.url)
        toast({ title: 'Avatar updated!', variant: 'success' })
      } else {
        toast({ title: 'Upload failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleResendConfirmation = async () => {
    setResending(true)
    const { error } = await authClient.sendVerificationEmail({
      email: userEmail,
      callbackURL: '/confirm',
    })
    setResending(false)
    if (error) toast({ title: error.message ?? 'Failed', variant: 'destructive' })
    else toast({ title: 'Confirmation email sent!', variant: 'success' })
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Profile photo</h2>
        <div className="flex items-center gap-4">
          <Avatar src={avatarUrl} alt={profile.username} fallback={profile.username} size="xl" />
          <div>
            <label className="cursor-pointer">
              <span className="inline-flex items-center justify-center h-8 px-3 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50">
                {uploading ? 'Uploading...' : 'Change photo'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 2MB</p>
          </div>
        </div>
      </div>

      {/* Profile info */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Profile info</h2>
        <Input label="Username" error={errors.username?.message} {...register('username')} />
        <Textarea
          label="Bio"
          maxLength={160}
          showCount
          rows={3}
          placeholder="Tell people a bit about yourself..."
          value={bio}
          error={errors.bio?.message}
          {...register('bio')}
        />
        <Input label="City" error={errors.city?.message} {...register('city')} />
        <Select
          label="Country"
          options={COUNTRIES}
          value={country}
          onChange={(v) => setValue('country', v)}
          error={errors.country?.message}
        />
        <Button type="submit" isLoading={isSubmitting}>Save changes</Button>
      </form>

      {/* Email & confirmation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Email</h2>
        <div className="flex items-center gap-3 mb-3">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">{userEmail}</span>
          {profile.email_confirmed ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">Confirmed</span>
            </div>
          ) : (
            <Badge variant="warning">Not confirmed</Badge>
          )}
        </div>
        {!profile.email_confirmed && (
          <Button variant="outline" size="sm" onClick={handleResendConfirmation} isLoading={resending}>
            Resend confirmation email
          </Button>
        )}
      </div>

      {/* Plan */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Plan</h2>
            <p className="text-sm text-gray-500 mt-1">
              {profile.plan === 'pro'
                ? 'Pro — Unlimited library, wishlist, and proposals'
                : 'Free — 50 games, 10 wishlist, 3 proposals per game'}
            </p>
          </div>
          {profile.plan === 'free' ? (
            <Badge variant="default">Free</Badge>
          ) : (
            <Badge variant="brand">Pro</Badge>
          )}
        </div>
      </div>
    </div>
  )
}
