'use client'

interface CitySelectProps {
  cities: string[]
  currentCity?: string
  currentPlatform?: string
  currentQ?: string
}

export function CitySelect({ cities, currentCity, currentPlatform, currentQ }: CitySelectProps) {
  if (cities.length === 0) return null

  return (
    <form method="GET" action="/browse">
      {currentPlatform && <input type="hidden" name="platform" value={currentPlatform} />}
      {currentQ && <input type="hidden" name="q" value={currentQ} />}
      <select
        name="city"
        defaultValue={currentCity ?? ''}
        onChange={(e) => (e.target.form as HTMLFormElement).submit()}
        className="h-9 px-3 pr-8 rounded-full text-sm font-semibold bg-white shadow-sm border-none focus:outline-none focus:ring-2 focus:ring-brand appearance-none cursor-pointer text-gray-600"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
      >
        <option value="">📍 Tutte le città</option>
        {cities.map((city) => (
          <option key={city} value={city}>{city}</option>
        ))}
      </select>
    </form>
  )
}
