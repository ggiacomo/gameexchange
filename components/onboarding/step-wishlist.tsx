import { X } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { GameSearchAutocomplete } from '@/components/ui/game-search-autocomplete'
import type { GameRow } from '@/types/database'

interface StepWishlistProps {
  games: GameRow[]
  onGamesChange: (games: GameRow[]) => void
  onComplete: () => void
  onSkip: () => void
}

export function StepWishlist({ games, onGamesChange, onComplete, onSkip }: StepWishlistProps) {
  const addGame = (game: GameRow) => {
    if (!games.find((g) => g.id === game.id)) {
      onGamesChange([...games, game])
    }
  }

  const removeGame = (id: number) => {
    onGamesChange(games.filter((g) => g.id !== id))
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Quali giochi stai cercando?</h2>
      <p className="text-gray-500 mb-6">
        Aggiungi giochi alla tua wishlist e ti avviseremo quando qualcuno vicino a te li ha disponibili.
      </p>

      <GameSearchAutocomplete
        onSelect={addGame}
        placeholder="Cerca un gioco che vuoi..."
        excludeIds={games.map((g) => g.id)}
        className="mb-4"
      />

      {games.length > 0 && (
        <div className="space-y-2 mb-6">
          {games.map((game) => (
            <div
              key={game.id}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200"
            >
              <div className="relative h-10 w-7 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                {game.cover_url ? (
                  <Image src={game.cover_url} alt={game.title} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">?</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{game.title}</p>
                <p className="text-xs text-gray-500 truncate">
                  {game.platforms?.slice(0, 2).join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeGame(game.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button size="lg" className="flex-1" onClick={onComplete}>
          {games.length === 0 ? 'Salta per ora' : `Termina (${games.length} giochi)`}
        </Button>
        {games.length > 0 && (
          <Button size="lg" variant="outline" onClick={onSkip}>
            Salta
          </Button>
        )}
      </div>
    </div>
  )
}
