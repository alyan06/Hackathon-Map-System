'use client'

import { useEffect, useState } from 'react'

import { EmissionResult } from '@/components/car-travel/EmissionResult'
import { PlaceAutocompleteInput } from '@/components/car-travel/PlaceAutocompleteInput'
import { useCurrentLocation } from '@/hooks/useCurrentLocation'
import { calculateTripEmissionKgCO2 } from '@/lib/car-travel/emissions'
import { formatVehicleName } from '@/lib/car-travel/formatters'
import { createClientId } from '@/lib/car-travel/storage'
import type {
  CarProfile,
  RouteEstimate,
  TripLocationInput,
  TripLog,
} from '@/types/car-travel'

interface TripLoggerFormProps {
  onSaveTrip: (trip: TripLog) => void
  vehicles: CarProfile[]
}

export function TripLoggerForm({
  onSaveTrip,
  vehicles,
}: TripLoggerFormProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id ?? '')
  const [origin, setOrigin] = useState<TripLocationInput>({ label: '' })
  const [destination, setDestination] = useState<TripLocationInput>({ label: '' })
  const [notes, setNotes] = useState('')
  const [routeEstimate, setRouteEstimate] = useState<RouteEstimate | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { clearLocationError, getCurrentLocation, isLocating, locationError } =
    useCurrentLocation()

  useEffect(() => {
    if (!selectedVehicleId && vehicles[0]) {
      setSelectedVehicleId(vehicles[0].id)
    }
  }, [selectedVehicleId, vehicles])

  useEffect(() => {
    setRouteEstimate(null)
    setRouteError(null)
  }, [destination, origin, selectedVehicleId])

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId)
  const emissionKgCO2 =
    routeEstimate && selectedVehicle
      ? calculateTripEmissionKgCO2(routeEstimate.distanceMiles, selectedVehicle)
      : null

  async function handleUseCurrentLocation() {
    clearLocationError()
    const coordinates = await getCurrentLocation()

    if (!coordinates) {
      return
    }

    setOrigin({
      label: 'Locating exact address...',
      coordinates,
    })

    try {
      const response = await fetch('/api/maps/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates }),
      })

      if (response.ok) {
        const data = (await response.json()) as { address: string }
        setOrigin({
          label: data.address,
          coordinates,
        })
      } else {
        setOrigin({ label: 'Current location', coordinates })
      }
    } catch {
      setOrigin({ label: 'Current location', coordinates })
    }
  }

  async function handleCalculateTrip() {
    if (!selectedVehicle) {
      setRouteError('Add a vehicle before calculating a trip.')
      return
    }

    if (!origin.label.trim() || !destination.label.trim()) {
      setRouteError('Enter both an origin and destination first.')
      return
    }

    setIsCalculating(true)
    setRouteError(null)

    try {
      const response = await fetch('/api/maps/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin,
          destination,
        }),
      })

      const data = (await response.json()) as RouteEstimate & { error?: string }

      if (!response.ok) {
        throw new Error(data.error ?? 'Trip calculation failed.')
      }

      setRouteEstimate({
        distanceMiles: data.distanceMiles,
        durationMinutes: data.durationMinutes,
      })
    } catch (error) {
      setRouteEstimate(null)
      setRouteError(
        error instanceof Error ? error.message : 'Trip calculation failed.',
      )
    } finally {
      setIsCalculating(false)
    }
  }

  async function handleSaveTrip() {
    if (!selectedVehicle || !routeEstimate || emissionKgCO2 === null) {
      return
    }

    setIsSaving(true)

    try {
      onSaveTrip({
        id: createClientId('trip'),
        origin: origin.label,
        destination: destination.label,
        distanceMiles: routeEstimate.distanceMiles,
        durationMinutes: routeEstimate.durationMinutes,
        vehicleId: selectedVehicle.id,
        emissionKgCO2,
        createdAt: new Date().toISOString(),
        notes: notes.trim() || undefined,
      })

      setOrigin({ label: '' })
      setDestination({ label: '' })
      setNotes('')
      setRouteEstimate(null)
      setRouteError(null)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
          Trip Logger
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          Log a car trip
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Manual trip entry is the most realistic browser MVP. We calculate the
          route, show the carbon estimate, then save it for the day.
        </p>
      </div>

      <div className="grid gap-4">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Vehicle</span>
          <select
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            disabled={!vehicles.length}
            onChange={(event) => setSelectedVehicleId(event.target.value)}
            value={selectedVehicleId}
          >
            {!vehicles.length ? (
              <option value="">Add a vehicle first</option>
            ) : null}
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {formatVehicleName(vehicle)}
              </option>
            ))}
          </select>
        </label>

        <div className="relative flex w-full">
          <div className="flex w-10 flex-col items-center pb-6 pt-5">
            <div className="h-[7px] w-[7px] rounded-full bg-slate-400" />
            <div className="my-[6px] w-[1.5px] flex-1 bg-slate-200" />
            <div className="h-[7px] w-[7px] bg-slate-900" />
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <PlaceAutocompleteInput
                error={locationError}
                hideLabel
                label="Origin"
                onSelectLocation={setOrigin}
                onUseCurrentLocation={handleUseCurrentLocation}
                placeholder="Where from?"
                value={origin}
              />
              {isLocating ? (
                <p className="mt-2 px-1 text-xs text-slate-500">Finding your current location...</p>
              ) : null}
            </div>

            <PlaceAutocompleteInput
              hideLabel
              label="Destination"
              locationBias={origin.coordinates}
              onSelectLocation={setDestination}
              originCoordinates={origin.coordinates}
              placeholder="Where to?"
              value={destination}
            />
          </div>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Notes</span>
          <textarea
            className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional: commute, grocery run, team meetup..."
            value={notes}
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isCalculating || !vehicles.length}
            onClick={handleCalculateTrip}
            type="button"
          >
            {isCalculating ? 'Calculating route...' : 'Calculate trip'}
          </button>

          {routeEstimate && emissionKgCO2 !== null ? (
            <button
              className="inline-flex rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
              disabled={isSaving}
              onClick={handleSaveTrip}
              type="button"
            >
              {isSaving ? 'Saving trip...' : 'Save trip'}
            </button>
          ) : null}
        </div>

        {routeError ? <p className="text-sm text-rose-600">{routeError}</p> : null}

        {routeEstimate && selectedVehicle && emissionKgCO2 !== null ? (
          <EmissionResult
            distanceMiles={routeEstimate.distanceMiles}
            durationMinutes={routeEstimate.durationMinutes}
            emissionKgCO2={emissionKgCO2}
            vehicle={selectedVehicle}
          />
        ) : null}
      </div>
    </section>
  )
}
