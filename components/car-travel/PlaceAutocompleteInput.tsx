'use client'

import { useEffect, useRef, useState } from 'react'

import type {
  Coordinates,
  PlaceSuggestion,
  TripLocationInput,
} from '@/types/car-travel'

interface PlaceAutocompleteInputProps {
  error?: string | null
  helperText?: string
  label?: string
  locationBias?: Coordinates
  onSelectLocation: (location: TripLocationInput) => void
  onUseCurrentLocation?: () => void
  placeholder: string
  value: TripLocationInput
  className?: string
  hideLabel?: boolean
  originCoordinates?: Coordinates
}

export function PlaceAutocompleteInput({
  error,
  helperText,
  label,
  locationBias,
  onSelectLocation,
  onUseCurrentLocation,
  placeholder,
  value,
  className = '',
  hideLabel = false,
  originCoordinates,
}: PlaceAutocompleteInputProps) {
  const [query, setQuery] = useState(value.label)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [sessionToken] = useState(() => Math.random().toString(36).slice(2))
  
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value.label)
  }, [value.label])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const trimmedQuery = query.trim()

    if (trimmedQuery.length < 3) {
      setSuggestions([])
      return
    }

    if (value.coordinates && trimmedQuery === value.label.trim()) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true)
        const response = await fetch('/api/maps/autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: trimmedQuery,
            locationBias,
            origin: originCoordinates,
            sessionToken,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Autocomplete lookup failed.')
        }

        const data = (await response.json()) as { suggestions: PlaceSuggestion[] }
        setSuggestions(data.suggestions)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setSuggestions([])
        }
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [locationBias, query, sessionToken, value.coordinates, value.label])

  function handleInputChange(nextValue: string) {
    setQuery(nextValue)
    onSelectLocation({ label: nextValue })
  }

  function handleSuggestionSelect(suggestion: PlaceSuggestion) {
    setQuery(suggestion.description)
    setSuggestions([])
    setIsFocused(false)
    onSelectLocation({
      label: suggestion.description,
      placeId: suggestion.placeId,
    })
  }

  const showSuggestions = isFocused && (suggestions.length > 0 || (onUseCurrentLocation && query.trim().length === 0))

  return (
    <div className={`space-y-1 ${className}`} ref={containerRef}>
      {!hideLabel && label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          className="w-full bg-slate-100/80 rounded-xl px-4 py-3.5 text-[15px] text-slate-900 placeholder:text-slate-500 outline-none transition focus:bg-slate-200/60 font-medium"
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          value={query}
        />

        {showSuggestions ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            
            {onUseCurrentLocation && query.trim().length === 0 ? (
              <button
                className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-4 text-left transition hover:bg-slate-50"
                onClick={() => {
                  setIsFocused(false)
                  onUseCurrentLocation()
                }}
                type="button"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                </div>
                <span className="font-semibold text-slate-900 text-[15px]">Use current location</span>
              </button>
            ) : null}

            <div className="max-h-[300px] overflow-y-auto">
              {suggestions.map((suggestion) => (
                <button
                  className="flex w-full items-start gap-4 px-4 py-3 text-left transition hover:bg-slate-50 active:bg-slate-100"
                  key={suggestion.placeId}
                  onClick={(event) => {
                    event.preventDefault()
                    handleSuggestionSelect(suggestion)
                  }}
                  type="button"
                >
                  <div className="flex flex-col items-center justify-start shrink-0 w-10 pt-1 gap-1">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"></path></svg>
                    </div>
                    {suggestion.distanceMiles !== undefined ? (
                      <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                        {suggestion.distanceMiles} mi
                      </span>
                    ) : null}
                  </div>
                  <div className="border-b border-slate-100 pb-3 flex-1 pt-1 flex flex-col justify-center">
                    <span className="block font-semibold text-slate-900 text-[15px] leading-snug">
                      {suggestion.mainText}
                    </span>
                    {suggestion.secondaryText ? (
                      <span className="mt-0.5 block text-sm text-slate-500 leading-snug">
                        {suggestion.secondaryText}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {isSearching ? (
        <p className="text-xs text-slate-500 mt-2 px-1">Looking up places...</p>
      ) : null}

      {helperText && !showSuggestions && <p className="text-xs text-slate-500 mt-2 px-1">{helperText}</p>}
      {error && !showSuggestions ? <p className="text-xs text-rose-600 mt-2 px-1">{error}</p> : null}
    </div>
  )
}
