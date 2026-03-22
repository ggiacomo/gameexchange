'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepWelcome } from './step-welcome'
import { StepConsoles } from './step-consoles'
import { StepGames } from './step-games'
import { StepWishlist } from './step-wishlist'
import { saveLibraryItems, saveWishlistItems } from '@/app/onboarding/actions'
import type { GameRow } from '@/types/database'

export function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedConsoles, setSelectedConsoles] = useState<string[]>([])
  const [libraryGames, setLibraryGames] = useState<GameRow[]>([])
  const [wishlistGames, setWishlistGames] = useState<GameRow[]>([])

  const steps = [
    { label: 'Welcome' },
    { label: 'Consoles' },
    { label: 'Games' },
    { label: 'Wishlist' },
  ]

  const handleComplete = async () => {
    await saveLibraryItems(libraryGames.map((g) => g.id))
    await saveWishlistItems(wishlistGames.map((g) => g.id))
    router.push('/?welcome=1')
  }

  return (
    <div>
      {/* Progress */}
      {step > 1 && (
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full transition-colors ${
                  i + 1 <= step ? 'bg-brand' : 'bg-gray-300'
                }`}
              />
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 ${i + 1 < step ? 'bg-brand' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <StepWelcome
          onNext={() => setStep(2)}
          onSkip={() => router.push('/')}
        />
      )}
      {step === 2 && (
        <StepConsoles
          selected={selectedConsoles}
          onSelect={setSelectedConsoles}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <StepGames
          games={libraryGames}
          onGamesChange={setLibraryGames}
          onNext={() => setStep(4)}
          onSkip={() => setStep(4)}
        />
      )}
      {step === 4 && (
        <StepWishlist
          games={wishlistGames}
          onGamesChange={setWishlistGames}
          onComplete={handleComplete}
          onSkip={handleComplete}
        />
      )}
    </div>
  )
}
