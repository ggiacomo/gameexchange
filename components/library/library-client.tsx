'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, MoreVertical, Pencil, Trash2, Gamepad2 } from 'lucide-react'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GameSearchAutocomplete } from '@/components/ui/game-search-autocomplete'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { addLibraryItem, updateLibraryItem, removeLibraryItem } from '@/app/(main)/library/actions'
import { formatCondition, formatLibraryStatus } from '@/lib/utils/format'
import type { LibraryItemWithGame, LibraryStatus, GameCondition, GameRow, UserPlan } from '@/types/database'
import { cn } from '@/lib/utils/cn'

const STATUS_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'available', label: 'Available for swap' },
  { value: 'with_compensation', label: 'Available + compensation' },
]

const CONDITION_OPTIONS = [
  { value: 'mint', label: 'Mint' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
]

const statusVariant: Record<LibraryStatus, 'default' | 'success' | 'warning'> = {
  private: 'default',
  available: 'success',
  with_compensation: 'warning',
}

interface LibraryClientProps {
  items: LibraryItemWithGame[]
  plan: string
}

export function LibraryClient({ items, plan }: LibraryClientProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editItem, setEditItem] = useState<LibraryItemWithGame | null>(null)

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add game
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 py-20 text-center">
          <Gamepad2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">Your library is empty</h3>
          <p className="text-sm text-gray-500 mb-4">Add games you own to start swapping</p>
          <Button onClick={() => setShowAddDialog(true)}>Add your first game</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item) => (
            <LibraryCard
              key={item.id}
              item={item}
              onEdit={() => setEditItem(item)}
            />
          ))}
        </div>
      )}

      <AddGameDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        existingIds={items.map((i) => i.game_id)}
        plan={plan as UserPlan}
        currentCount={items.length}
      />

      {editItem && (
        <EditGameDialog
          item={editItem}
          open={!!editItem}
          onClose={() => setEditItem(null)}
        />
      )}
    </>
  )
}

function LibraryCard({
  item,
  onEdit,
}: {
  item: LibraryItemWithGame
  onEdit: () => void
}) {
  const { toast } = useToast()
  const game = item.games

  const handleRemove = async () => {
    const { error } = await removeLibraryItem(item.id)
    if (error) toast({ title: error, variant: 'destructive' })
    else toast({ title: 'Game removed', variant: 'success' })
  }

  return (
    <div className="group relative rounded-xl overflow-hidden border border-gray-200 bg-white hover:border-brand hover:shadow-md transition-all">
      <div className="relative aspect-[3/4] bg-gray-100">
        {game.cover_url ? (
          <Image src={game.cover_url} alt={game.title} fill className="object-cover" sizes="20vw" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Gamepad2 className="h-8 w-8 text-gray-300" />
          </div>
        )}
        {/* Context menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Dropdown.Root>
            <Dropdown.Trigger asChild>
              <button className="h-7 w-7 rounded-lg bg-white/90 flex items-center justify-center shadow">
                <MoreVertical className="h-4 w-4 text-gray-700" />
              </button>
            </Dropdown.Trigger>
            <Dropdown.Portal>
              <Dropdown.Content className="z-50 min-w-[130px] rounded-xl border border-gray-200 bg-white shadow-lg p-1" align="end">
                <Dropdown.Item
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
                  onSelect={onEdit}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Dropdown.Item>
                <Dropdown.Item
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none"
                  onSelect={handleRemove}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </Dropdown.Item>
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2 mb-1.5">
          {game.title}
        </p>
        <Badge variant={statusVariant[item.status]} className="text-[10px]">
          {formatLibraryStatus(item.status)}
        </Badge>
      </div>
    </div>
  )
}

function AddGameDialog({
  open,
  onClose,
  existingIds,
  plan,
  currentCount,
}: {
  open: boolean
  onClose: () => void
  existingIds: number[]
  plan: UserPlan
  currentCount: number
}) {
  const { toast } = useToast()
  const [selectedGame, setSelectedGame] = useState<GameRow | null>(null)
  const [status, setStatus] = useState<LibraryStatus>('private')
  const [condition, setCondition] = useState<GameCondition>('good')
  const [notes, setNotes] = useState('')
  const [compensation, setCompensation] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!selectedGame) return
    setSaving(true)
    const { error } = await addLibraryItem({
      game_id: selectedGame.id,
      status,
      condition,
      notes: notes || null,
      min_compensation: status === 'with_compensation' ? parseFloat(compensation) : null,
    })
    setSaving(false)
    if (error) {
      toast({ title: error, variant: 'destructive' })
    } else {
      toast({ title: `${selectedGame.title} added!`, variant: 'success' })
      onClose()
      setSelectedGame(null)
      setStatus('private')
      setCondition('good')
      setNotes('')
      setCompensation('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add game to library</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!selectedGame ? (
            <GameSearchAutocomplete
              onSelect={setSelectedGame}
              placeholder="Search for a game..."
              excludeIds={existingIds}
            />
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="relative h-12 w-9 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                {selectedGame.cover_url && (
                  <Image src={selectedGame.cover_url} alt={selectedGame.title} fill className="object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedGame.title}</p>
                <p className="text-xs text-gray-500">{selectedGame.platforms?.slice(0, 2).join(' · ')}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGame(null)}
                className="text-sm text-brand hover:underline"
              >
                Change
              </button>
            </div>
          )}

          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(v) => setStatus(v as LibraryStatus)}
          />
          <Select
            label="Condition"
            options={CONDITION_OPTIONS}
            value={condition}
            onChange={(v) => setCondition(v as GameCondition)}
          />
          {status === 'with_compensation' && (
            <Input
              label="Minimum compensation (EUR)"
              type="number"
              min="0"
              step="0.50"
              placeholder="e.g. 5.00"
              value={compensation}
              onChange={(e) => setCompensation(e.target.value)}
            />
          )}
          <Textarea
            label="Notes (optional)"
            placeholder="Any details about the game condition..."
            maxLength={200}
            showCount
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!selectedGame} isLoading={saving}>
              Add to library
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditGameDialog({
  item,
  open,
  onClose,
}: {
  item: LibraryItemWithGame
  open: boolean
  onClose: () => void
}) {
  const { toast } = useToast()
  const [status, setStatus] = useState<LibraryStatus>(item.status)
  const [condition, setCondition] = useState<GameCondition>(item.condition)
  const [notes, setNotes] = useState(item.notes ?? '')
  const [compensation, setCompensation] = useState(String(item.min_compensation ?? ''))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const { error } = await updateLibraryItem(item.id, {
      status,
      condition,
      notes: notes || null,
      min_compensation: status === 'with_compensation' ? parseFloat(compensation) : null,
    })
    setSaving(false)
    if (error) {
      toast({ title: error, variant: 'destructive' })
    } else {
      toast({ title: 'Updated!', variant: 'success' })
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit — {item.games.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(v) => setStatus(v as LibraryStatus)}
          />
          <Select
            label="Condition"
            options={CONDITION_OPTIONS}
            value={condition}
            onChange={(v) => setCondition(v as GameCondition)}
          />
          {status === 'with_compensation' && (
            <Input
              label="Minimum compensation (EUR)"
              type="number"
              min="0"
              step="0.50"
              value={compensation}
              onChange={(e) => setCompensation(e.target.value)}
            />
          )}
          <Textarea
            label="Notes"
            maxLength={200}
            showCount
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} isLoading={saving}>Save changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
