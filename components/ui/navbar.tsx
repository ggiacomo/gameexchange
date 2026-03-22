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
  { href: '/browse', label: 'Browse', icon: Gamepad2 },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/proposals', label: 'Proposals', icon: ArrowLeftRight },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
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
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-[1280px] px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-brand">
            <Gamepad2 className="h-6 w-6" />
            Gamexchange
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
                    isActive
                      ? 'text-brand bg-green-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                  {link.href === '/inbox' && unreadMessages > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-brand text-white text-[10px] flex items-center justify-center">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-brand text-white text-[10px] flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>

            {/* Avatar dropdown */}
            <RadixDropdown.Root>
              <RadixDropdown.Trigger asChild>
                <button className="focus:outline-none">
                  <Avatar
                    src={user.avatar_url}
                    alt={user.username}
                    fallback={user.username}
                    size="sm"
                  />
                </button>
              </RadixDropdown.Trigger>
              <RadixDropdown.Portal>
                <RadixDropdown.Content
                  className="z-50 min-w-[180px] rounded-xl border border-gray-200 bg-white shadow-lg p-1"
                  align="end"
                  sideOffset={8}
                >
                  <div className="px-3 py-2 border-b border-gray-100 mb-1">
                    <p className="text-sm font-medium text-gray-900">{user.username}</p>
                    {user.plan === 'pro' && (
                      <Badge variant="brand" className="mt-0.5">Pro</Badge>
                    )}
                  </div>
                  <RadixDropdown.Item asChild>
                    <Link
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
                    >
                      <User className="h-4 w-4" /> Profile
                    </Link>
                  </RadixDropdown.Item>
                  <RadixDropdown.Item asChild>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                  </RadixDropdown.Item>
                  <RadixDropdown.Separator className="my-1 h-px bg-gray-100" />
                  <RadixDropdown.Item
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none"
                    onSelect={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </RadixDropdown.Item>
                </RadixDropdown.Content>
              </RadixDropdown.Portal>
            </RadixDropdown.Root>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white py-2 px-4">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'text-brand bg-green-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
                {link.href === '/inbox' && unreadMessages > 0 && (
                  <Badge variant="brand" className="ml-auto">{unreadMessages}</Badge>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
