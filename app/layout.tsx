import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400', '500', '600', '700', '800'] })

export const metadata: Metadata = {
  title: 'Gamexchange — Scambia i tuoi videogiochi',
  description: 'Trova persone vicino a te con cui scambiare videogiochi fisici per console.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f5f5f5]">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
