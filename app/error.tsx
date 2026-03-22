'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-extrabold text-[#1a1a1a] tracking-tight mb-2">Qualcosa è andato storto</h2>
        <p className="text-gray-500 text-sm mb-6">
          Si è verificato un errore imprevisto. Riprova.
        </p>
        <Button onClick={reset}>Riprova</Button>
      </div>
    </div>
  )
}
