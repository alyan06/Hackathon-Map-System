import {
  formatDistanceMiles,
  formatDurationMinutes,
  formatEmissionKg,
  formatVehicleName,
} from '@/lib/car-travel/formatters'
import type { CarProfile } from '@/types/car-travel'

interface EmissionResultProps {
  distanceMiles: number
  durationMinutes: number
  emissionKgCO2: number
  vehicle: CarProfile
}

export function EmissionResult({
  distanceMiles,
  durationMinutes,
  emissionKgCO2,
  vehicle,
}: EmissionResultProps) {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-700">
            Estimated Impact
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">
            {formatEmissionKg(emissionKgCO2)}
          </h3>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
          {vehicle.fuelType}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Distance" value={formatDistanceMiles(distanceMiles)} />
        <Stat label="Duration" value={formatDurationMinutes(durationMinutes)} />
        <Stat label="Vehicle" value={formatVehicleName(vehicle)} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  )
}
