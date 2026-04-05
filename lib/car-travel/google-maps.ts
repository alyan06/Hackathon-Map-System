import type {
  Coordinates,
  PlaceSuggestion,
  RouteEstimate,
  TripLocationInput,
} from '@/types/car-travel'

const GOOGLE_PLACES_AUTOCOMPLETE_URL =
  'https://places.googleapis.com/v1/places:autocomplete'
const GOOGLE_ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'

export async function fetchPlaceSuggestions(params: {
  input: string
  sessionToken?: string
  locationBias?: Coordinates
  origin?: Coordinates
  referer?: string
}) {
  const apiKey = getGoogleMapsApiKey()

  const response = await fetch(GOOGLE_PLACES_AUTOCOMPLETE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text,suggestions.placePrediction.distanceMeters',
      ...(params.referer ? { Referer: params.referer } : {}),
    },
    body: JSON.stringify({
      input: params.input,
      sessionToken: params.sessionToken,
      regionCode: 'us',
      includedRegionCodes: ['us'],
      ...(params.locationBias
        ? {
            locationBias: {
              circle: {
                center: params.locationBias,
                radius: 50000,
              },
            },
          }
        : {}),
      ...(params.origin
        ? {
            origin: params.origin,
          }
        : {}),
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Google Places autocomplete request failed.')
  }

  const data = (await response.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string
        text?: { text?: string }
        structuredFormat?: {
          mainText?: { text?: string }
          secondaryText?: { text?: string }
        }
        distanceMeters?: number
      }
    }>
  }

  return (
    data.suggestions
      ?.map((suggestion) => suggestion.placePrediction)
      .filter(
        (
          prediction,
        ): prediction is NonNullable<typeof prediction> & {
          placeId: string
          text: { text: string }
          structuredFormat?: {
            mainText?: { text?: string }
            secondaryText?: { text?: string }
          }
          distanceMeters?: number
        } => Boolean(prediction?.placeId && prediction.text?.text),
      )
      .map<PlaceSuggestion>((prediction) => ({
        placeId: prediction.placeId,
        description: prediction.text.text,
        mainText:
          prediction.structuredFormat?.mainText?.text ?? prediction.text.text,
        secondaryText: prediction.structuredFormat?.secondaryText?.text,
        ...(prediction.distanceMeters !== undefined
          ? { distanceMiles: roundToOne(prediction.distanceMeters * 0.000621371) }
          : {}),
      })) ?? []
  )
}

export async function fetchDrivingRouteEstimate(params: {
  origin: TripLocationInput
  destination: TripLocationInput
  referer?: string
}) {
  const apiKey = getGoogleMapsApiKey()

  const response = await fetch(GOOGLE_ROUTES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
      ...(params.referer ? { Referer: params.referer } : {}),
    },
    body: JSON.stringify({
      origin: buildWaypoint(params.origin),
      destination: buildWaypoint(params.destination),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      units: 'IMPERIAL',
      regionCode: 'us',
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Google route calculation failed.')
  }

  const data = (await response.json()) as {
    routes?: Array<{
      distanceMeters?: number
      duration?: string
    }>
  }

  const route = data.routes?.[0]

  if (!route?.distanceMeters || !route.duration) {
    throw new Error('No drivable route was returned for this trip.')
  }

  return {
    distanceMiles: roundToOne(route.distanceMeters * 0.000621371),
    durationMinutes: roundToOne(parseDurationToMinutes(route.duration)),
  } satisfies RouteEstimate
}

function buildWaypoint(location: TripLocationInput) {
  if (location.coordinates) {
    return {
      location: {
        latLng: {
          latitude: location.coordinates.latitude,
          longitude: location.coordinates.longitude,
        },
      },
    }
  }

  if (location.placeId) {
    return { placeId: location.placeId }
  }

  return { address: location.label }
}

function parseDurationToMinutes(duration: string) {
  const seconds = Number.parseFloat(duration.replace('s', ''))
  return seconds / 60
}

function roundToOne(value: number) {
  return Math.round(value * 10) / 10
}

function getGoogleMapsApiKey() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error('Missing GOOGLE_MAPS_API_KEY in your environment.')
  }

  return apiKey
}
