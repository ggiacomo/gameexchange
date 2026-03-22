'use client'

import { useState } from 'react'
import { MailCheck, X } from 'lucide-react'
import { authClient } from '@/lib/auth/client'
import { useToast } from './toast'

export function EmailConfirmationBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  if (dismissed) return null

  const handleResend = async () => {
    setSending(true)
    try {
      const session = await authClient.getSession()
      const email = session.data?.user?.email
      if (email) {
        await authClient.sendVerificationEmail({ email, callbackURL: '/confirm' })
        toast({ title: 'Confirmation email sent!', variant: 'success' })
      }
    } catch {
      toast({ title: 'Failed to resend', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="mx-auto max-w-[1280px] px-4 py-2.5 flex items-center gap-3">
        <MailCheck className="h-4 w-4 text-yellow-600 flex-shrink-0" />
        <p className="text-sm text-yellow-800 flex-1">
          Please confirm your email address to send and accept swap proposals.{' '}
          <button
            onClick={handleResend}
            disabled={sending}
            className="underline font-medium hover:no-underline disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Resend confirmation email'}
          </button>
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="text-yellow-600 hover:text-yellow-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
