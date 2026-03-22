'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepWelcome } from './step-welcome'
import { StepProfile } from './step-profile'
import { StepConsoles } from './step-consoles'
import { StepGames } from './step-games'
import { StepWishlist } from './step-wishlist'
import { saveLibraryItems, saveWishlistItems } from '@/app/onboarding/actions'
import type { GameRow } from '@/types/database'

interface OnboardingFlowProps {
  hasProfile: boolean
}

export function OnboardingFlow({ hasProfile }: OnboardingFlowProps) {
  const router = useRouter()
  // Steps: 1=Welcome, 2=Profile(OAuth only), 3=Consoles, 4=Games, 5=Wishlist
  // When hasProfile is true, step 2 is skipped
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [selectedConsoles, setSelectedConsoles] = useState<string[]>([])
  const [libraryGames, setLibraryGames] = useState<GameRow[]>([])
  const [wishlistGames, setWishlistGames] = useState<GameRow[]>([])

  const progressSteps = hasProfile
    ? ['Benvenuto', 'Console', 'Giochi', 'Wishlist']
    : ['Benvenuto', 'Profilo', 'Console', 'Giochi', 'Wishlist']

  // Map logical step to progress index
  const progressIndex = hasProfile ? step - 1 : step - 1

  const goToConsoles = () => setStep(3)
  const goToGames = () => setStep(4)
  const goToWishlist = () => setStep(5)

  const handleComplete = async () => {
    await saveLibraryItems(libraryGames.map((g) => g.id))
    await saveWishlistItems(wishlistGames.map((g) => g.id))
    router.push('/feed?welcome=1')
  }

  const handleSkipAll = () => {
    router.push('/feed')
  }

  return (
    <div>
      {/* Progress */}
      {step > 1 && (
        <div className="flex items-center gap-2 mb-8">
          {progressSteps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full transition-colors ${
                  i + 1 <= progressIndex ? 'bg-brand' : 'bg-gray-300'
                }`}
              />
              {i < progressSteps.length - 1 && (
                <div className={`h-px flex-1 ${i + 1 < progressIndex ? 'bg-brand' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <StepWelcome
          onNext={() => (hasProfile ? setStep(3) : setStep(2))}
          onSkip={handleSkipAll}
          canSkip={hasProfile}
        />
      )}
      {step === 2 && !hasProfile && (
        <StepProfile onNext={goToConsoles} />
      )}
      {step === 3 && (
        <StepConsoles
          selected={selectedConsoles}
          onSelect={setSelectedConsoles}
          onNext={goToGames}
        />
      )}
      {step === 4 && (
        <StepGames
          games={libraryGames}
          onGamesChange={setLibraryGames}
          onNext={goToWishlist}
          onSkip={goToWishlist}
        />
      )}
      {step === 5 && (
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
