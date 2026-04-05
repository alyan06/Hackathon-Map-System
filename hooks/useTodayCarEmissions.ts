'use client'

import { useEffect, useState } from 'react'

import { getTotalCarEmissionsForToday } from '@/lib/car-travel/daily-score'
import {
  getStoredTripLogs,
  GREENSCORE_STORAGE_UPDATED_EVENT,
} from '@/lib/car-travel/storage'

export function useTodayCarEmissions() {
  const [todayEmissionsKgCO2, setTodayEmissionsKgCO2] = useState(0)

  useEffect(() => {
    function refreshTotal() {
      setTodayEmissionsKgCO2(
        getTotalCarEmissionsForToday(getStoredTripLogs()),
      )
    }

    refreshTotal()
    window.addEventListener(
      GREENSCORE_STORAGE_UPDATED_EVENT,
      refreshTotal as EventListener,
    )
    window.addEventListener('storage', refreshTotal)

    return () => {
      window.removeEventListener(
        GREENSCORE_STORAGE_UPDATED_EVENT,
        refreshTotal as EventListener,
      )
      window.removeEventListener('storage', refreshTotal)
    }
  }, [])

  return todayEmissionsKgCO2
}
