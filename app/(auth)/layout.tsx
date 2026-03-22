import { Gamepad2 } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-[#1a1a1a] p-10">
        <Link href="/" className="flex items-center gap-2.5 text-white font-extrabold text-xl tracking-tight">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-brand">
            <Gamepad2 className="h-5 w-5 text-white" />
          </div>
          Gamexchange
        </Link>
        <div>
          <p className="text-3xl font-extrabold text-white leading-snug mb-3">
            Swap physical games<br />with people nearby.
          </p>
          <p className="text-white/50 text-sm">
            Build your library, browse others, propose swaps — no money needed.
          </p>
        </div>
        <p className="text-white/25 text-xs">© 2025 Gamexchange</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 bg-[#f5f5f5]">
        <Link href="/" className="flex lg:hidden items-center gap-2 mb-8 font-extrabold text-xl tracking-tight text-[#1a1a1a]">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-brand">
            <Gamepad2 className="h-4 w-4 text-white" />
          </div>
          Gamexchange
        </Link>
        <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-sm p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
