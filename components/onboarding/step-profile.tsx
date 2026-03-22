'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { saveProfile } from '@/app/onboarding/actions'
import { useToast } from '@/components/ui/toast'

const schema = z.object({
  username: z
    .string()
    .min(3, 'Minimo 3 caratteri')
    .max(20, 'Massimo 20 caratteri')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo lettere, numeri e underscore'),
  city: z.string().min(1, 'La città è obbligatoria'),
  country: z.string().min(1, 'Il paese è obbligatorio'),
})

type FormData = z.infer<typeof schema>

const COUNTRIES = [
  { value: 'IT', label: 'Italia' },
  { value: 'FR', label: 'Francia' },
  { value: 'DE', label: 'Germania' },
  { value: 'ES', label: 'Spagna' },
  { value: 'GB', label: 'Regno Unito' },
  { value: 'US', label: 'Stati Uniti' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'NL', label: 'Paesi Bassi' },
  { value: 'BE', label: 'Belgio' },
  { value: 'PT', label: 'Portogallo' },
  { value: 'PL', label: 'Polonia' },
  { value: 'SE', label: 'Svezia' },
  { value: 'NO', label: 'Norvegia' },
  { value: 'DK', label: 'Danimarca' },
  { value: 'FI', label: 'Finlandia' },
  { value: 'CH', label: 'Svizzera' },
  { value: 'AT', label: 'Austria' },
  { value: 'IE', label: 'Irlanda' },
]

interface StepProfileProps {
  onNext: () => void
}

export function StepProfile({ onNext }: StepProfileProps) {
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const country = watch('country')

  const onSubmit = async (data: FormData) => {
    const { error } = await saveProfile(data)
    if (error) {
      toast({ title: error, variant: 'destructive' })
      return
    }
    onNext()
  }

  return (
    <div className="py-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Crea il tuo profilo</h2>
      <p className="text-gray-500 mb-6">Scegli un username e dicci dove sei.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Username"
          placeholder="coolswapper"
          error={errors.username?.message}
          {...register('username')}
        />
        <Input
          label="Città"
          placeholder="Milano"
          error={errors.city?.message}
          {...register('city')}
        />
        <Select
          label="Paese"
          options={COUNTRIES}
          value={country}
          onChange={(v) => setValue('country', v)}
          error={errors.country?.message}
          placeholder="Seleziona il tuo paese"
        />
        <Button type="submit" size="lg" className="w-full gap-2" isLoading={isSubmitting}>
          Continua <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
