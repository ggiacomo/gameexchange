'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { submitReview } from '@/app/(main)/proposals/actions'
import { useRouter } from 'next/navigation'

interface ReviewFormProps {
  proposalId: string
  revieweeId: string
  revieweeName: string
}

export function ReviewForm({ proposalId, revieweeId, revieweeName }: ReviewFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <p className="text-green-700 font-medium">Review submitted! Thank you 🎮</p>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: 'Please select a rating', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    const { error } = await submitReview(proposalId, revieweeId, rating, comment)
    setSubmitting(false)
    if (error) {
      toast({ title: error, variant: 'destructive' })
      return
    }
    setSubmitted(true)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Leave a review for @{revieweeName}
      </h2>
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i + 1)}
            onMouseEnter={() => setHovered(i + 1)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                i < (hovered || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      <Textarea
        placeholder="Tell others about your experience..."
        maxLength={200}
        showCount
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mb-4"
      />
      <Button onClick={handleSubmit} isLoading={submitting} disabled={rating === 0}>
        Submit review
      </Button>
    </div>
  )
}
