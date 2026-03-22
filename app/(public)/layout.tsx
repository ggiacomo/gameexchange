import Link from 'next/link'
import { Gamepad2 } from 'lucide-react'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1a1a1a] sticky top-0 z-50">
        <div className="mx-auto max-w-[1280px] px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
              <Gamepad2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">Gamexchange</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="h-9 px-4 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors flex items-center">
              Join free
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1280px] px-4 py-8">{children}</main>
    </div>
  )
}
