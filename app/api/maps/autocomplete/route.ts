import { NextResponse } from 'next/server'

import { fetchPlaceSuggestions } from '@/lib/car-travel/google-maps'
import type { Coordinates } from '@/types/car-travel'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      input?: string
      locationBias?: Coordinates
      origin?: Coordinates
      sessionToken?: string
    }

    const input = body.input?.trim()

    if (!input || input.length < 3) {
      return NextResponse.json({ suggestions: [] })
    }

    const referer = request.headers.get('referer') || 'http://localhost:3000'

    const suggestions = await fetchPlaceSuggestions({
      input,
      locationBias: body.locationBias,
      origin: body.origin,
      sessionToken: body.sessionToken,
      referer,
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Autocomplete lookup failed.',
      },
      { status: 500 },
    )
  }
}
