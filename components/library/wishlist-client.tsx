'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, X, Heart, Gamepad2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GameSearchAutocomplete } from '@/components/ui/game-search-autocomplete'
import { useToast } from '@/components/ui/toast'
import { addWishlistItem, removeWishlistItem } from '@/app/(main)/wishlist/actions'
import type { WishlistItemWithGame, GameRow, UserPlan } from '@/types/database'
import Link from 'next/link'

interface WishlistClientProps {
  items: WishlistItemWithGame[]
  plan: string
}

export function WishlistClient({ items, plan }: WishlistClientProps) {
  const [showAdd, setShowAdd] = useState(false)
  const { toast } = useToast()

  const handleRemove = async (id: string, title: string) => {
    const { error } = await removeWishlistItem(id)
    if (error) toast({ title: error, variant: 'destructive' })
    else toast({ title: `${title} removed from wishlist`, variant: 'success' })
  }

  const handleAdd = async (game: GameRow) => {
    const { error } = await addWishlistItem(game.id)
    if (error) toast({ title: error, variant: 'destructive' })
    else {
      toast({ title: `${game.title} added to wishlist!`, variant: 'success' })
      setShowAdd(false)
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add to wishlist
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 py-20 text-center">
          <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">Your wishlist is empty</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add games you want and get notified when they become available
          </p>
          <Button onClick={() => setShowAdd(true)}>Add a game</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => {
            const game = item.games
            return (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden border border-gray-200 bg-white hover:border-brand hover:shadow-md transition-all"
              >
                <div className="relative aspect-[3/4] bg-gray-100">
                  {game.cover_url ? (
                    <Image src={game.cover_url} alt={game.title} fill className="object-cover" sizes="20vw" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Gamepad2 className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  <button
                    onClick={() => handleRemove(item.id, game.title)}
                    className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-white/90 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  >
                    <X className="h-4 w-4 text-gray-600 hover:text-red-600" />
                  </button>
                </div>
                <div className="p-2.5">
                  <Link href={`/games/${game.igdb_slug ?? game.id}`}>
                    <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2 hover:text-brand">
                      {game.title}
                    </p>
                  </Link>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {game.platforms?.slice(0, 2).join(' · ')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to wishlist</DialogTitle>
          </DialogHeader>
          <GameSearchAutocomplete
            onSelect={handleAdd}
            placeholder="Search for a game you want..."
            excludeIds={items.map((i) => i.game_id)}
          />
          <p className="text-xs text-gray-500 mt-2">
            We&apos;ll notify you when someone nearby lists this game for swap.
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}
