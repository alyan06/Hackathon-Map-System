'use client'

import { useEffect, useState } from 'react'

import { DEFAULT_MPG_BY_FUEL } from '@/lib/car-travel/constants'
import { createClientId } from '@/lib/car-travel/storage'
import type { CarProfile, FuelType } from '@/types/car-travel'

interface CarProfileFormProps {
  initialProfile?: CarProfile | null
  onCancelEdit?: () => void
  onSave: (profile: CarProfile) => void
}

export function CarProfileForm({
  initialProfile,
  onCancelEdit,
  onSave,
}: CarProfileFormProps) {
  const [nickname, setNickname] = useState(initialProfile?.nickname ?? '')
  const [make, setMake] = useState(initialProfile?.make ?? '')
  const [model, setModel] = useState(initialProfile?.model ?? '')
  const [year, setYear] = useState(initialProfile?.year?.toString() ?? '')
  const [fuelType, setFuelType] = useState<FuelType>(
    initialProfile?.fuelType ?? 'gasoline',
  )
  const [mpg, setMpg] = useState(
    initialProfile?.mpg ? initialProfile.mpg.toString() : '',
  )

  useEffect(() => {
    setNickname(initialProfile?.nickname ?? '')
    setMake(initialProfile?.make ?? '')
    setModel(initialProfile?.model ?? '')
    setYear(initialProfile?.year?.toString() ?? '')
    setFuelType(initialProfile?.fuelType ?? 'gasoline')
    setMpg(initialProfile?.mpg ? initialProfile.mpg.toString() : '')
  }, [initialProfile])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedYear = Number.parseInt(year, 10)
    const parsedMpg = Number.parseFloat(mpg)

    if (!make.trim() || !model.trim() || !Number.isFinite(parsedYear)) {
      return
    }

    onSave({
      id: initialProfile?.id ?? createClientId('car'),
      nickname: nickname.trim() || undefined,
      make: make.trim(),
      model: model.trim(),
      year: parsedYear,
      fuelType,
      mpg: Number.isFinite(parsedMpg) ? parsedMpg : undefined,
    })

    if (!initialProfile) {
      setNickname('')
      setMake('')
      setModel('')
      setYear('')
      setFuelType('gasoline')
      setMpg('')
    }
  }

  const defaultEfficiency = DEFAULT_MPG_BY_FUEL[fuelType]

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
            Car Setup
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {initialProfile ? 'Edit vehicle' : 'Add your vehicle'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Save the car once, then reuse it for every trip log.
          </p>
        </div>
        {initialProfile && onCancelEdit ? (
          <button
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            onClick={onCancelEdit}
            type="button"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Vehicle nickname
          </span>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            onChange={(event) => setNickname(event.target.value)}
            placeholder="My daily driver"
            value={nickname}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Make</span>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            onChange={(event) => setMake(event.target.value)}
            placeholder="Toyota"
            required
            value={make}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Model</span>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            onChange={(event) => setModel(event.target.value)}
            placeholder="Camry"
            required
            value={model}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Year</span>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            max={new Date().getFullYear() + 1}
            min={1990}
            onChange={(event) => setYear(event.target.value)}
            placeholder="2021"
            required
            type="number"
            value={year}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Fuel type</span>
          <select
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            onChange={(event) => setFuelType(event.target.value as FuelType)}
            value={fuelType}
          >
            <option value="gasoline">Gasoline</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
          </select>
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            MPG / efficiency
          </span>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            min={1}
            onChange={(event) => setMpg(event.target.value)}
            placeholder={`${defaultEfficiency}`}
            step="0.1"
            type="number"
            value={mpg}
          />
          <p className="text-xs text-slate-500">
            Leave blank to use the default {defaultEfficiency} MPG for {fuelType}.
          </p>
        </label>

        <div className="md:col-span-2">
          <button
            className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            type="submit"
          >
            {initialProfile ? 'Update vehicle' : 'Save vehicle'}
          </button>
        </div>
      </form>
    </section>
  )
}
