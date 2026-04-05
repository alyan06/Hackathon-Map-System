import { getTotalCarEmissionsForToday } from '@/lib/car-travel/daily-score'
import {
  formatDistanceMiles,
  formatEmissionKg,
  formatTripRoute,
  formatTripTimestamp,
  formatVehicleName,
} from '@/lib/car-travel/formatters'
import type { CarProfile, TripLog } from '@/types/car-travel'

interface TripSummaryCardProps {
  trips: TripLog[]
  vehicles: CarProfile[]
}

export function TripSummaryCard({
  trips,
  vehicles,
}: TripSummaryCardProps) {
  const todayEmissions = getTotalCarEmissionsForToday(trips)
  const recentTrips = trips.slice(0, 4)

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
          Today
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          {formatEmissionKg(todayEmissions)}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Total car emissions logged for today. This is the number to plug into
          your dashboard's daily transport total.
        </p>
      </div>

      <div className="space-y-3">
        {recentTrips.length ? (
          recentTrips.map((trip) => {
            const vehicle = vehicles.find((entry) => entry.id === trip.vehicleId)

            return (
              <article
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                key={trip.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatTripRoute(trip.origin, trip.destination)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {vehicle ? formatVehicleName(vehicle) : 'Vehicle removed'}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-700">
                    {formatEmissionKg(trip.emissionKgCO2)}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>{formatDistanceMiles(trip.distanceMiles)}</span>
                  <span>{Math.round(trip.durationMinutes)} min</span>
                  <span>{formatTripTimestamp(trip.createdAt)}</span>
                </div>
              </article>
            )
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
            No saved trips yet. Calculate and save your first route to start
            tracking transport emissions.
          </div>
        )}
      </div>
    </section>
  )
}
