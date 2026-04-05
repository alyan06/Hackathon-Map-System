'use client'

import { useState } from 'react'

import type { Coordinates } from '@/types/car-travel'

export function useCurrentLocation() {
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  async function getCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not available in this browser.')
      return null
    }

    setIsLocating(true)
    setLocationError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      })

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      } satisfies Coordinates
    } catch {
      setLocationError(
        'We could not access your location. Please allow location access and try again.',
      )
      return null
    } finally {
      setIsLocating(false)
    }
  }

  function clearLocationError() {
    setLocationError(null)
  }

  return {
    clearLocationError,
    getCurrentLocation,
    isLocating,
    locationError,
  }
}
