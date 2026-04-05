import type { TripLog } from '@/types/car-travel'

export function getTotalCarEmissionsForDate(trips: TripLog[], date: Date) {
  const targetDate = date.toDateString()

  const total = trips.reduce((sum, trip) => {
    const tripDate = new Date(trip.createdAt)

    if (tripDate.toDateString() !== targetDate) {
      return sum
    }

    return sum + trip.emissionKgCO2
  }, 0)

  return roundToTwo(total)
}

export function getTotalCarEmissionsForToday(
  trips: TripLog[],
  now = new Date(),
) {
  return getTotalCarEmissionsForDate(trips, now)
}

export function addTripEmissionToDailyTotal(
  currentDailyTotalKgCO2: number,
  tripEmissionKgCO2: number,
) {
  return roundToTwo(currentDailyTotalKgCO2 + tripEmissionKgCO2)
}

export function buildDailyCarbonPatch(trip: Pick<TripLog, 'emissionKgCO2'>) {
  return {
    transportKgCO2: trip.emissionKgCO2,
    totalDeltaKgCO2: trip.emissionKgCO2,
  }
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100
}
