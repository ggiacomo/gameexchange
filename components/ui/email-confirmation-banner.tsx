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
    <div className="bg-[#1a1a1a] border-b border-white/10">
      <div className="mx-auto max-w-[1280px] px-4 py-2.5 flex items-center gap-3">
        <MailCheck className="h-4 w-4 text-brand flex-shrink-0" />
        <p className="text-sm text-white/80 flex-1">
          Confirm your email to send and accept swap proposals.{' '}
          <button
            onClick={handleResend}
            disabled={sending}
            className="text-white underline font-semibold hover:no-underline disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Resend confirmation email'}
          </button>
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/40 hover:text-white/80"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
