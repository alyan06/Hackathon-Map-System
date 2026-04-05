import type { CarProfile } from '@/types/car-travel'

export function formatVehicleName(vehicle: CarProfile) {
  if (vehicle.nickname?.trim()) {
    return `${vehicle.nickname} (${vehicle.year} ${vehicle.make} ${vehicle.model})`
  }

  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`
}

export function formatDistanceMiles(distanceMiles: number) {
  return `${distanceMiles.toFixed(1)} mi`
}

export function formatDurationMinutes(durationMinutes: number) {
  if (durationMinutes < 60) {
    return `${Math.round(durationMinutes)} min`
  }

  const hours = Math.floor(durationMinutes / 60)
  const minutes = Math.round(durationMinutes % 60)

  if (!minutes) {
    return `${hours} hr`
  }

  return `${hours} hr ${minutes} min`
}

export function formatEmissionKg(emissionKgCO2: number) {
  return `${emissionKgCO2.toFixed(2)} kg CO2`
}

export function formatTripTimestamp(isoDate: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoDate))
}

export function formatTripRoute(origin: string, destination: string) {
  // Strip zip codes and country (since trips are domestic) to guarantee they are never logged
  const cleanOrigin = origin
    .replace(/\s\d{5}(?:-\d{4})?\b/g, '')
    .replace(/,\s*(USA|United States)\b/ig, '')

  const cleanDest = destination
    .replace(/\s\d{5}(?:-\d{4})?\b/g, '')
    .replace(/,\s*(USA|United States)\b/ig, '')

  const originParts = cleanOrigin.split(',').map((s) => s.trim())
  const destParts = cleanDest.split(',').map((s) => s.trim())

  let commonSuffixCount = 0
  for (let i = 1; i <= Math.min(originParts.length, destParts.length); i++) {
    if (originParts[originParts.length - i] === destParts[destParts.length - i]) {
      commonSuffixCount++
    } else {
      break
    }
  }

  let shortenedOrigin = originParts
  let shortenedDest = destParts

  if (commonSuffixCount > 0) {
    // Keep at least one element so we don't return an empty string
    const stripOriginCount = Math.min(commonSuffixCount, originParts.length - 1)
    const stripDestCount = Math.min(commonSuffixCount, destParts.length - 1)
    
    if (stripOriginCount > 0) {
      shortenedOrigin = originParts.slice(0, originParts.length - stripOriginCount)
    }
    if (stripDestCount > 0) {
      shortenedDest = destParts.slice(0, destParts.length - stripDestCount)
    }
  }

  return `${shortenedOrigin.join(', ')} --> ${shortenedDest.join(', ')}`
}
