'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import Image from 'next/image'
import type { GameRow } from '@/types/database'

export function SearchAutocomplete() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<GameRow[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    if (q.length < 2) { setResults([]); setOpen(false); return }

    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(q)}`)
        const data = await res.json() as GameRow[]
        setResults(data)
        setOpen(data.length > 0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
  }, [q])

  const handleSelect = (game: GameRow) => {
    setOpen(false)
    setQ('')
    router.push(`/games/${game.igdb_slug ?? game.id}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setOpen(false)
    if (q.trim()) router.push(`/browse?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div ref={ref} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Cerca un gioco..."
            autoComplete="off"
            className="w-full h-10 rounded-full bg-white pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand shadow-sm"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </form>

      {open && results.length > 0 && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {results.slice(0, 6).map((game) => (
            <button
              key={game.id}
              onClick={() => handleSelect(game)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="relative h-10 w-7 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                {game.cover_url ? (
                  <Image src={game.cover_url} alt={game.title} fill className="object-cover" sizes="28px" />
                ) : (
                  <div className="h-full bg-gray-200" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a1a1a] truncate">{game.title}</p>
                {game.platforms && (
                  <p className="text-xs text-gray-400 truncate">{game.platforms.slice(0, 3).join(' · ')}</p>
                )}
              </div>
              {game.release_year && (
                <span className="text-xs text-gray-300 flex-shrink-0">{game.release_year}</span>
              )}
            </button>
          ))}
          {q.trim() && (
            <button
              onClick={() => { setOpen(false); router.push(`/browse?q=${encodeURIComponent(q.trim())}`) }}
              className="w-full flex items-center gap-2 px-4 py-3 border-t border-gray-100 hover:bg-gray-50 transition-colors text-left"
            >
              <Search className="h-4 w-4 text-brand" />
              <span className="text-sm text-brand font-semibold">Cerca &ldquo;{q}&rdquo; nel browse</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
