export type FuelType = 'gasoline' | 'diesel' | 'hybrid' | 'electric'

export interface CarProfile {
  id: string
  nickname?: string
  make: string
  model: string
  year: number
  fuelType: FuelType
  mpg?: number
}

export interface TripLog {
  id: string
  origin: string
  destination: string
  distanceMiles: number
  durationMinutes: number
  vehicleId: string
  emissionKgCO2: number
  createdAt: string
  notes?: string
}

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface TripLocationInput {
  label: string
  placeId?: string
  coordinates?: Coordinates
}

export interface PlaceSuggestion {
  placeId: string
  description: string
  mainText: string
  secondaryText?: string
  distanceMiles?: number
}

export interface RouteEstimate {
  distanceMiles: number
  durationMinutes: number
}
