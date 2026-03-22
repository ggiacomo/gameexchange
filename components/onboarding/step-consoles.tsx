import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const CONSOLES = [
  { id: 'PS5', label: 'PlayStation 5', emoji: '🎮' },
  { id: 'PS4', label: 'PlayStation 4', emoji: '🎮' },
  { id: 'Xbox Series X/S', label: 'Xbox Series X/S', emoji: '🕹️' },
  { id: 'Xbox One', label: 'Xbox One', emoji: '🕹️' },
  { id: 'Nintendo Switch', label: 'Nintendo Switch', emoji: '🔴' },
  { id: 'PC', label: 'PC', emoji: '💻' },
  { id: 'Other', label: 'Other', emoji: '🎯' },
]

interface StepConsolesProps {
  selected: string[]
  onSelect: (consoles: string[]) => void
  onNext: () => void
}

export function StepConsoles({ selected, onSelect, onNext }: StepConsolesProps) {
  const toggle = (id: string) => {
    onSelect(
      selected.includes(id)
        ? selected.filter((c) => c !== id)
        : [...selected, id]
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Which consoles do you own?</h2>
      <p className="text-gray-500 mb-6">Select all that apply. We&apos;ll use this to show relevant games.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {CONSOLES.map((console_) => {
          const isSelected = selected.includes(console_.id)
          return (
            <button
              key={console_.id}
              type="button"
              onClick={() => toggle(console_.id)}
              className={cn(
                'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
                isSelected
                  ? 'border-brand bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-brand flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <span className="text-2xl">{console_.emoji}</span>
              <span className={cn('text-sm font-medium', isSelected ? 'text-brand' : 'text-gray-700')}>
                {console_.label}
              </span>
            </button>
          )
        })}
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={onNext}
        disabled={selected.length === 0}
      >
        Continue ({selected.length} selected)
      </Button>
    </div>
  )
}
