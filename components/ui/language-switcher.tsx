'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'

const LANGS = [
  { code: 'it', label: 'ITA' },
  { code: 'en', label: 'EN' },
]

export function LanguageSwitcher() {
  const [current, setCurrent] = useState('it')
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:block">{LANGS.find((l) => l.code === current)?.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[90px]">
          {LANGS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { setCurrent(lang.code); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${current === lang.code ? 'bg-gray-50 text-[#1a1a1a]' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
