import { NextResponse } from 'next/server'

import { fetchDrivingRouteEstimate } from '@/lib/car-travel/google-maps'
import type { TripLocationInput } from '@/types/car-travel'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      origin?: TripLocationInput
      destination?: TripLocationInput
    }

    if (!body.origin?.label || !body.destination?.label) {
      return NextResponse.json(
        { error: 'Origin and destination are required.' },
        { status: 400 },
      )
    }

    const referer = request.headers.get('referer') || 'http://localhost:3000'

    const estimate = await fetchDrivingRouteEstimate({
      origin: body.origin,
      destination: body.destination,
      referer,
    })

    return NextResponse.json(estimate)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Route calculation failed.',
      },
      { status: 500 },
    )
  }
}
