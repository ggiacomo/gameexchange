import { X } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { GameSearchAutocomplete } from '@/components/ui/game-search-autocomplete'
import type { GameRow } from '@/types/database'

interface StepGamesProps {
  games: GameRow[]
  onGamesChange: (games: GameRow[]) => void
  onNext: () => void
  onSkip: () => void
}

export function StepGames({ games, onGamesChange, onNext, onSkip }: StepGamesProps) {
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
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Add games to your library</h2>
      <p className="text-gray-500 mb-6">
        Add games you own and might want to swap. You can always add more later.
      </p>

      <GameSearchAutocomplete
        onSelect={addGame}
        placeholder="Search for a game..."
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

      {games.length > 0 && games.length < 3 && (
        <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4">
          💡 Adding at least 3 games increases your chances of finding a swap
        </p>
      )}

      <div className="flex gap-3">
        <Button size="lg" className="flex-1" onClick={onNext}>
          {games.length === 0 ? 'Skip' : `Continue (${games.length} games)`}
        </Button>
        {games.length > 0 && (
          <Button size="lg" variant="outline" onClick={onSkip}>
            Skip
          </Button>
        )}
      </div>
    </div>
  )
}
