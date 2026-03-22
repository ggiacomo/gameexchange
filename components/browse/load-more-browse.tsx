'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Gamepad2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FeedItem } from '@/components/feed/load-more-games'

interface LoadMoreBrowseProps {
  initialItems: FeedItem[]
  initialHasMore: boolean
  initialOffset: number
  filters: { q?: string; platform?: string; city?: string }
}

export function LoadMoreBrowse({ initialItems, initialHasMore, initialOffset, filters }: LoadMoreBrowseProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [offset, setOffset] = useState(initialOffset)
  const [loading, setLoading] = useState(false)

  const loadMore = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ offset: String(offset) })
      if (filters.q) params.set('q', filters.q)
      if (filters.platform) params.set('platform', filters.platform)
      if (filters.city) params.set('city', filters.city)

      const res = await fetch(`/api/browse/games?${params}`)
      if (!res.ok) return
      const data = await res.json()
      setItems((prev) => [...prev, ...data.items])
      setHasMore(data.hasMore)
      setOffset(data.nextOffset)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        {items.map((item) => (
          <BrowseCard key={item.id} item={item} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-4 mb-8">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            disabled={loading}
            className="min-w-[160px]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Caricamento...
              </span>
            ) : (
              'Carica altri'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

function BrowseCard({ item }: { item: FeedItem }) {
  const game = item.games
  const owner = item.users
  return (
    <Link href={`/games/${game.igdb_slug ?? game.id}`} className="group block rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200">
      <div className="relative aspect-[3/4] bg-gray-100">
        {game.cover_url ? (
          <Image src={game.cover_url} alt={game.title} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-300" sizes="(max-width: 640px) 50vw, 20vw" />
        ) : (
          <div className="flex h-full items-center justify-center"><Gamepad2 className="h-8 w-8 text-gray-300" /></div>
        )}
        {item.status === 'with_compensation' && item.min_compensation && (
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-bold bg-brand text-white px-2 py-0.5 rounded-full">+€{item.min_compensation.toFixed(0)}</span>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-bold text-[#1a1a1a] leading-tight line-clamp-2 mb-1">{game.title}</p>
        <p className="text-[11px] text-gray-400">@{owner.username} · {owner.city}</p>
      </div>
    </Link>
  )
}
