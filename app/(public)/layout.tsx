'use client'

import Link from 'next/link'
import { Gamepad2, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [q, setQ] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) router.push(`/browse?q=${encodeURIComponent(q.trim())}`)
    else router.push('/browse')
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1a1a1a] sticky top-0 z-50 shadow-md">
        <div className="mx-auto max-w-[1280px] px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
              <Gamepad2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight hidden sm:block">Gamexchange</span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cerca un gioco..."
                className="w-full h-10 rounded-full bg-white pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand shadow-sm"
              />
            </div>
          </form>

          {/* Auth buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/login" className="text-sm font-semibold text-white/70 hover:text-white transition-colors hidden sm:block">
              Accedi
            </Link>
            <Link href="/register" className="h-9 px-4 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors flex items-center whitespace-nowrap">
              Iscriviti
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
