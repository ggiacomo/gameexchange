'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils/format'
import type { ReviewRow, UserRow } from '@/types/database'

type ReviewWithUsers = ReviewRow & { reviewer: UserRow; reviewee: UserRow }

interface AdminReviewsClientProps {
  reviews: ReviewWithUsers[]
}

export function AdminReviewsClient({ reviews: initialReviews }: AdminReviewsClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [reviews, setReviews] = useState(initialReviews)

  const handleDelete = async (id: string) => {
    setLoading(id)
    const res = await fetch('/api/admin/reviews/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const json = await res.json()
    setLoading(null)
    if (json.error) {
      toast({ title: json.error, variant: 'destructive' })
      return
    }
    setReviews((prev) => prev.filter((r) => r.id !== id))
    toast({ title: 'Review removed', variant: 'success' })
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">@{r.reviewer?.username}</span>
                <span className="text-gray-400">→</span>
                <span className="text-sm font-medium">@{r.reviewee?.username}</span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              <p className="text-xs text-gray-400 mt-1">{formatDate(r.created_at)}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(r.id)}
              isLoading={loading === r.id}
              className="text-red-500 hover:bg-red-50 flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
