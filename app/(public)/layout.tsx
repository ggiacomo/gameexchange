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

      {/* Footer */}
      <footer className="bg-[#1a1a1a] mt-16">
        <div className="mx-auto max-w-[1280px] px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
                  <Gamepad2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-extrabold text-white tracking-tight">Gamexchange</span>
              </Link>
              <p className="text-sm text-white/40 leading-relaxed">
                La piattaforma italiana per scambiare videogiochi fisici tra appassionati.
              </p>
            </div>

            {/* Scopri */}
            <div>
              <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Scopri</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Sfoglia i giochi', href: '/browse' },
                  { label: 'Come funziona', href: '#' },
                  { label: 'Tutte le piattaforme', href: '/browse' },
                  { label: 'Giochi recenti', href: '/browse' },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-white/50 hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Account</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Registrati', href: '/register' },
                  { label: 'Accedi', href: '/login' },
                  { label: 'La mia libreria', href: '/library' },
                  { label: 'Le mie proposte', href: '/proposals' },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-white/50 hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Supporto */}
            <div>
              <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Supporto</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Centro assistenza', href: '#' },
                  { label: 'Segnala un problema', href: '#' },
                  { label: 'Privacy policy', href: '#' },
                  { label: 'Termini di servizio', href: '#' },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-white/50 hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/30">© 2025 Gamexchange. Tutti i diritti riservati.</p>
            <p className="text-xs text-white/20">Fatto con ❤️ in Italia</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
