import type { CarProfile, TripLog } from '@/types/car-travel'

const CAR_PROFILES_STORAGE_KEY = 'greenscore.carProfiles'
const TRIP_LOGS_STORAGE_KEY = 'greenscore.tripLogs'
export const GREENSCORE_STORAGE_UPDATED_EVENT = 'greenscore-storage-updated'

export function getStoredCarProfiles() {
  return readStorage<CarProfile[]>(CAR_PROFILES_STORAGE_KEY, [])
}

export function saveStoredCarProfiles(profiles: CarProfile[]) {
  writeStorage(CAR_PROFILES_STORAGE_KEY, profiles)
}

export function upsertCarProfile(
  profiles: CarProfile[],
  nextProfile: CarProfile,
) {
  const existingIndex = profiles.findIndex((profile) => profile.id === nextProfile.id)

  if (existingIndex === -1) {
    return [nextProfile, ...profiles]
  }

  return profiles.map((profile) =>
    profile.id === nextProfile.id ? nextProfile : profile,
  )
}

export function getStoredTripLogs() {
  return readStorage<TripLog[]>(TRIP_LOGS_STORAGE_KEY, [])
}

export function saveStoredTripLogs(trips: TripLog[]) {
  writeStorage(TRIP_LOGS_STORAGE_KEY, trips)
}

export function prependTripLog(trips: TripLog[], nextTrip: TripLog) {
  return [nextTrip, ...trips]
}

export function createClientId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }

  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`
}

function readStorage<T>(key: string, fallback: T) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const rawValue = window.localStorage.getItem(key)

    if (!rawValue) {
      return fallback
    }

    return JSON.parse(rawValue) as T
  } catch {
    return fallback
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(
    new CustomEvent(GREENSCORE_STORAGE_UPDATED_EVENT, {
      detail: key,
    }),
  )
}
