import { Gamepad2 } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
      <Link href="/" className="flex items-center gap-2 mb-8 text-brand font-bold text-2xl">
        <Gamepad2 className="h-7 w-7" />
        Gamexchange
      </Link>
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        {children}
      </div>
    </div>
  )
}
