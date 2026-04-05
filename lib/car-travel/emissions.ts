import { DEFAULT_MPG_BY_FUEL, EMISSION_FACTORS } from '@/lib/car-travel/constants'
import type { CarProfile } from '@/types/car-travel'

export function getVehicleEfficiencyMpg(vehicle: CarProfile) {
  return vehicle.mpg && vehicle.mpg > 0 ? vehicle.mpg : DEFAULT_MPG_BY_FUEL[vehicle.fuelType]
}

export function calculateTripEmissionKgCO2(
  distanceMiles: number,
  vehicle: CarProfile,
) {
  const safeDistance = Math.max(distanceMiles, 0)
  const efficiencyMpg = getVehicleEfficiencyMpg(vehicle)

  if (vehicle.fuelType === 'electric') {
    const kwhUsed = safeDistance * EMISSION_FACTORS.electricKwhPerMile
    return roundToTwo(kwhUsed * EMISSION_FACTORS.electricGridKgPerKwh)
  }

  const gallonsUsed = safeDistance / efficiencyMpg

  if (vehicle.fuelType === 'diesel') {
    return roundToTwo(gallonsUsed * EMISSION_FACTORS.dieselKgPerGallon)
  }

  if (vehicle.fuelType === 'hybrid') {
    return roundToTwo(
      gallonsUsed *
        EMISSION_FACTORS.gasolineKgPerGallon *
        EMISSION_FACTORS.hybridAdjustment,
    )
  }

  return roundToTwo(gallonsUsed * EMISSION_FACTORS.gasolineKgPerGallon)
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100
}
