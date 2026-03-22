'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Skeleton } from './skeleton'
import type { GameRow } from '@/types/database'

interface GameSearchAutocompleteProps {
  onSelect: (game: GameRow) => void
  placeholder?: string
  excludeIds?: number[]
  className?: string
}

export function GameSearchAutocomplete({
  onSelect,
  placeholder = 'Search games...',
  excludeIds = [],
  className,
}: GameSearchAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GameRow[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([])
        setOpen(false)
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(q)}`)
        const data: GameRow[] = await res.json()
        setResults(data.filter((g) => !excludeIds.includes(g.id)))
        setOpen(true)
        setHighlighted(0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    },
    [excludeIds]
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (game: GameRow) => {
    onSelect(game)
    setQuery('')
    setOpen(false)
    setResults([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[highlighted]) handleSelect(results[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={cn(
            'h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-9 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent'
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-72 overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-7 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No games found for &quot;{query}&quot;
            </div>
          ) : (
            <ul>
              {results.map((game, idx) => (
                <li key={game.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(game)}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors',
                      idx === highlighted && 'bg-gray-50'
                    )}
                  >
                    <div className="relative h-10 w-7 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                      {game.cover_url ? (
                        <Image
                          src={game.cover_url}
                          alt={game.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-400">?</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {game.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {game.platforms?.slice(0, 3).join(' · ')}
                        {game.release_year ? ` · ${game.release_year}` : ''}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
