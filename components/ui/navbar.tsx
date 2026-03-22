'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Gamepad2,
  Library,
  Heart,
  ArrowLeftRight,
  Inbox,
  Bell,
  Settings,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react'
import * as RadixDropdown from '@radix-ui/react-dropdown-menu'
import { Avatar } from './avatar'
import { Badge } from './badge'
import { cn } from '@/lib/utils/cn'
import { authClient } from '@/lib/auth/client'
import type { UserRow } from '@/types/database'

const navLinks = [
  { href: '/browse', label: 'Browse' },
  { href: '/library', label: 'Library' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/proposals', label: 'Proposals' },
  { href: '/inbox', label: 'Inbox' },
]

interface NavbarProps {
  user: UserRow
  unreadNotifications: number
  unreadMessages: number
}

export function Navbar({ user, unreadNotifications, unreadMessages }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 bg-[#1a1a1a]">
      <div className="mx-auto max-w-[1280px] px-4">
        <div className="flex h-14 items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg text-white tracking-tight flex-shrink-0">
            <div className="flex items-center justify-center h-7 w-7 rounded bg-brand">
              <Gamepad2 className="h-4 w-4 text-white" />
            </div>
            Gamexchange
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative px-3.5 py-2 rounded text-sm font-medium transition-colors',
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-white/70 hover:text-white hover:bg-white/8'
                  )}
                >
                  {link.label}
                  {link.href === '/inbox' && unreadMessages > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-brand text-white text-[10px] flex items-center justify-center font-bold">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative flex h-8 w-8 items-center justify-center rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-brand text-white text-[9px] flex items-center justify-center font-bold">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>

            {/* Avatar dropdown */}
            <RadixDropdown.Root>
              <RadixDropdown.Trigger asChild>
                <button className="flex items-center gap-2 rounded px-2 py-1 hover:bg-white/10 transition-colors focus:outline-none">
                  <Avatar
                    src={user.avatar_url}
                    alt={user.username}
                    fallback={user.username}
                    size="sm"
                  />
                  <span className="hidden md:block text-sm font-medium text-white/90 max-w-[100px] truncate">
                    {user.username}
                  </span>
                </button>
              </RadixDropdown.Trigger>
              <RadixDropdown.Portal>
                <RadixDropdown.Content
                  className="z-50 min-w-[200px] rounded-xl bg-white shadow-xl border border-gray-100 p-1.5 mt-1"
                  align="end"
                  sideOffset={8}
                >
                  <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
                    <p className="text-sm font-semibold text-gray-900">@{user.username}</p>
                    {user.plan === 'pro' && (
                      <Badge variant="brand" className="mt-1">Pro</Badge>
                    )}
                  </div>
                  <RadixDropdown.Item asChild>
                    <Link
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
                    >
                      <User className="h-4 w-4 text-gray-400" /> Profile
                    </Link>
                  </RadixDropdown.Item>
                  <RadixDropdown.Item asChild>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
                    >
                      <Settings className="h-4 w-4 text-gray-400" /> Settings
                    </Link>
                  </RadixDropdown.Item>
                  <RadixDropdown.Separator className="my-1 h-px bg-gray-100" />
                  <RadixDropdown.Item
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none"
                    onSelect={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </RadixDropdown.Item>
                </RadixDropdown.Content>
              </RadixDropdown.Portal>
            </RadixDropdown.Root>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex h-8 w-8 items-center justify-center rounded text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-[#242424] border-t border-white/10 py-2 px-4">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'text-white bg-white/10' : 'text-white/70 hover:text-white'
                )}
              >
                {link.label}
                {link.href === '/inbox' && unreadMessages > 0 && (
                  <Badge variant="brand">{unreadMessages}</Badge>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
