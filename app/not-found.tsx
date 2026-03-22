import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Gamepad2 } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm px-4">
        <Gamepad2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-4xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">404</h2>
        <p className="text-gray-500 mb-6">Pagina non trovata. Questa pagina non esiste.</p>
        <Link href="/">
          <Button>Torna alla home</Button>
        </Link>
      </div>
    </div>
  )
}
