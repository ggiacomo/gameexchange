'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils/format'
import type { UserRow } from '@/types/database'
import { Search } from 'lucide-react'

interface AdminUsersClientProps {
  users: UserRow[]
  total: number
  page: number
  pageSize: number
}

export function AdminUsersClient({ users, total, page, pageSize }: AdminUsersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value
    router.push(`/admin/users?q=${q}`)
  }

  const handleSuspend = async (userId: string, suspend: boolean) => {
    setLoading(userId)
    const res = await fetch('/api/admin/users/suspend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, suspend }),
    })
    const json = await res.json()
    setLoading(null)
    if (json.error) toast({ title: json.error, variant: 'destructive' })
    else {
      toast({ title: suspend ? 'User suspended' : 'User unsuspended', variant: 'success' })
      router.refresh()
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            name="q"
            defaultValue={searchParams.get('q') ?? ''}
            placeholder="Search by username or email..."
            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <Button type="submit" size="md">Search</Button>
      </form>

      <p className="text-sm text-gray-500 mb-4">{total} users total</p>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">City</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={u.avatar_url} alt={u.username} fallback={u.username} size="sm" />
                    <div>
                      <p className="font-medium text-gray-900">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.city}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.plan === 'pro' ? 'brand' : 'default'}>
                    {u.plan}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  {u.is_suspended ? (
                    <Badge variant="destructive">Suspended</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant={u.is_suspended ? 'outline' : 'destructive'}
                    onClick={() => handleSuspend(u.id, !u.is_suspended)}
                    isLoading={loading === u.id}
                  >
                    {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {page > 1 && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/admin/users?page=${page - 1}`)}>
              Previous
            </Button>
          )}
          <span className="flex items-center text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/admin/users?page=${page + 1}`)}>
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
