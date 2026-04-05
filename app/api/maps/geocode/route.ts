import { NextResponse } from 'next/server'

import type { Coordinates } from '@/types/car-travel'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { coordinates: Coordinates }
    const { latitude, longitude } = body.coordinates

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Coordinates are required.' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) throw new Error('Missing API Key.')

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
    url.searchParams.set('latlng', `${latitude},${longitude}`)
    url.searchParams.set('key', apiKey)

    const response = await fetch(url.toString(), {
      // Pass referer just in case
      headers: {
        Referer: request.headers.get('referer') || 'http://localhost:3000'
      }
    })

    if (!response.ok) {
      throw new Error('Google Geocoding API request failed.')
    }

    const data = await response.json()
    
    if (data.status === 'REQUEST_DENIED') {
      throw new Error(`Google API Denied: ${data.error_message}`)
    }

    const address = data.results?.[0]?.formatted_address || 'Current location'

    return NextResponse.json({ address })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Geocoding failed.' },
      { status: 500 },
    )
  }
}
