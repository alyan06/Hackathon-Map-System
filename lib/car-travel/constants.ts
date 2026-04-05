import type { FuelType } from '@/types/car-travel'

export const DEFAULT_MPG_BY_FUEL: Record<FuelType, number> = {
  gasoline: 25,
  diesel: 30,
  hybrid: 50,
  electric: 110,
}

export const EMISSION_FACTORS = {
  gasolineKgPerGallon: 8.887,
  dieselKgPerGallon: 10.18,
  hybridAdjustment: 0.7,
  electricKwhPerMile: 0.3,
  electricGridKgPerKwh: 0.4,
} as const
