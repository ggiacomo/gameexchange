import { Gamepad2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StepWelcomeProps {
  onNext: () => void
  onSkip: () => void
  canSkip?: boolean
}

export function StepWelcome({ onNext, onSkip, canSkip = true }: StepWelcomeProps) {
  return (
    <div className="text-center py-8">
      <div className="flex justify-center mb-6">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <Gamepad2 className="h-10 w-10 text-brand" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        Benvenuto su Gamexchange!
      </h1>
      <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
        Scambia i tuoi giochi fisici per console con persone nella tua città. Configuriamo il tuo profilo in pochi passi.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button size="lg" onClick={onNext} className="gap-2">
          Inizia <ArrowRight className="h-4 w-4" />
        </Button>
        {canSkip && (
          <Button variant="ghost" size="lg" onClick={onSkip}>
            Salta per ora
          </Button>
        )}
      </div>
    </div>
  )
}
