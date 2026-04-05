'use client'

import { useEffect, useState } from 'react'

import { CarProfileForm } from '@/components/car-travel/CarProfileForm'
import { TripLoggerForm } from '@/components/car-travel/TripLoggerForm'
import { TripSummaryCard } from '@/components/car-travel/TripSummaryCard'
import {
  buildDailyCarbonPatch,
  getTotalCarEmissionsForToday,
} from '@/lib/car-travel/daily-score'
import { formatVehicleName } from '@/lib/car-travel/formatters'
import {
  getStoredCarProfiles,
  getStoredTripLogs,
  prependTripLog,
  saveStoredCarProfiles,
  saveStoredTripLogs,
  upsertCarProfile,
} from '@/lib/car-travel/storage'
import { useTodayCarEmissions } from '@/hooks/useTodayCarEmissions'
import type { CarProfile, TripLog } from '@/types/car-travel'

export function CarTravelTracker() {
  const [vehicles, setVehicles] = useState<CarProfile[]>([])
  const [trips, setTrips] = useState<TripLog[]>([])
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null)
  const todayEmissionsFromHook = useTodayCarEmissions()

  useEffect(() => {
    setVehicles(getStoredCarProfiles())
    setTrips(getStoredTripLogs())
  }, [])

  const editingVehicle =
    vehicles.find((vehicle) => vehicle.id === editingVehicleId) ?? null
  const todayEmissions = getTotalCarEmissionsForToday(trips)
  const dashboardPatch =
    trips[0]
      ? buildDailyCarbonPatch(trips[0])
      : { transportKgCO2: 0, totalDeltaKgCO2: 0 }

  function handleSaveVehicle(profile: CarProfile) {
    const nextVehicles = upsertCarProfile(vehicles, profile)
    setVehicles(nextVehicles)
    saveStoredCarProfiles(nextVehicles)
    setEditingVehicleId(null)
  }

  function handleSaveTrip(trip: TripLog) {
    const nextTrips = prependTripLog(trips, trip)
    setTrips(nextTrips)
    saveStoredTripLogs(nextTrips)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,_#f8fffb_0%,_#eef7f3_40%,_#f8fafc_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl">
          <div className="grid gap-6 px-6 py-8 md:grid-cols-[1.2fr,0.8fr] md:px-8">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-emerald-300">
                GreenScore Transport
              </p>
              <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight">
                Car travel carbon tracking for a hackathon-ready MVP
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                Add a car once, log each trip manually, calculate the driving
                distance from Google Maps, and turn it into a saved CO2 estimate
                you can plug into the daily score.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Quick Stats
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <StatTile label="Vehicles saved" value={String(vehicles.length)} />
                <StatTile label="Trips logged" value={String(trips.length)} />
                <StatTile label="Today total" value={`${todayEmissions.toFixed(2)} kg`} />
                <StatTile
                  label="Live helper"
                  value={`${todayEmissionsFromHook.toFixed(2)} kg`}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <CarProfileForm
              initialProfile={editingVehicle}
              onCancelEdit={() => setEditingVehicleId(null)}
              onSave={handleSaveVehicle}
            />
            <TripLoggerForm onSaveTrip={handleSaveTrip} vehicles={vehicles} />
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
                  Saved Cars
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Reuse vehicle profiles
                </h2>
              </div>

              <div className="space-y-3">
                {vehicles.length ? (
                  vehicles.map((vehicle) => (
                    <article
                      className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                      key={vehicle.id}
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatVehicleName(vehicle)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {vehicle.mpg ? `${vehicle.mpg} MPG` : 'Using default efficiency'} |{' '}
                          {vehicle.fuelType}
                        </p>
                      </div>
                      <button
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        onClick={() => setEditingVehicleId(vehicle.id)}
                        type="button"
                      >
                        Edit
                      </button>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                    Add a vehicle profile to unlock trip calculations.
                  </div>
                )}
              </div>
            </section>

            <TripSummaryCard trips={trips} vehicles={vehicles} />

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
                Dashboard Hook
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Daily carbon total integration
              </h2>
              <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">
                <p>Use today's stored transport total or apply the newest trip as a delta:</p>
                <pre className="mt-3 overflow-x-auto text-xs text-emerald-300">
{`const todayCarKg = getTotalCarEmissionsForToday(trips)
const nextDailyTotal = addTripEmissionToDailyTotal(currentDailyTotalKgCO2, trip.emissionKgCO2)
const patch = buildDailyCarbonPatch(trip)`}
                </pre>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Current patch preview: transport {dashboardPatch.transportKgCO2.toFixed(2)} kg,
                total delta {dashboardPatch.totalDeltaKgCO2.toFixed(2)} kg.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  )
}
