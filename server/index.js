// server/index.js
// Standalone Express server exposing the Google Maps proxy API.
// Can be integrated with any app (Next.js, React, mobile, etc.) by
// pointing fetch calls at http://localhost:3001/api/maps/...

require('dotenv').config({ path: '../.env.local' })

const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.API_PORT || 3001

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors()) // Allow requests from the Next.js frontend (port 3000)
app.use(express.json())

// ── Constants ──────────────────────────────────────────────────────────────
const GOOGLE_PLACES_URL = 'https://places.googleapis.com/v1/places:autocomplete'
const GOOGLE_ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'
const GOOGLE_GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json'

// ── Helpers ────────────────────────────────────────────────────────────────
function getApiKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) throw new Error('Missing GOOGLE_MAPS_API_KEY environment variable.')
  return key
}

function roundToOne(value) {
  return Math.round(value * 10) / 10
}

function parseDurationToMinutes(duration) {
  return Number.parseFloat(duration.replace('s', '')) / 60
}

function buildWaypoint(location) {
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
  if (location.placeId) return { placeId: location.placeId }
  return { address: location.label }
}

// ── Route: POST /api/maps/autocomplete ────────────────────────────────────
app.post('/api/maps/autocomplete', async (req, res) => {
  try {
    const { input, locationBias, origin, sessionToken } = req.body
    const trimmed = (input || '').trim()

    if (!trimmed || trimmed.length < 3) {
      return res.json({ suggestions: [] })
    }

    const apiKey = getApiKey()
    const referer = req.headers.referer || req.headers.origin || 'http://localhost:3000'

    const payload = {
      input: trimmed,
      sessionToken,
      regionCode: 'us',
      includedRegionCodes: ['us'],
    }

    if (locationBias) {
      payload.locationBias = { circle: { center: locationBias, radius: 50000 } }
    }
    if (origin) {
      payload.origin = origin
    }

    const response = await fetch(GOOGLE_PLACES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'suggestions.placePrediction.placeId',
          'suggestions.placePrediction.text.text',
          'suggestions.placePrediction.structuredFormat.mainText.text',
          'suggestions.placePrediction.structuredFormat.secondaryText.text',
          'suggestions.placePrediction.distanceMeters',
        ].join(','),
        Referer: referer,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) throw new Error('Google Places autocomplete request failed.')

    const data = await response.json()

    const suggestions = (data.suggestions || [])
      .map((s) => s.placePrediction)
      .filter((p) => p?.placeId && p.text?.text)
      .map((p) => ({
        placeId: p.placeId,
        description: p.text.text,
        mainText: p.structuredFormat?.mainText?.text ?? p.text.text,
        secondaryText: p.structuredFormat?.secondaryText?.text,
        ...(p.distanceMeters !== undefined
          ? { distanceMiles: roundToOne(p.distanceMeters * 0.000621371) }
          : {}),
      }))

    return res.json({ suggestions })
  } catch (err) {
    console.error('[autocomplete]', err.message)
    return res.status(500).json({ error: err.message || 'Autocomplete lookup failed.' })
  }
})

// ── Route: POST /api/maps/route ───────────────────────────────────────────
app.post('/api/maps/route', async (req, res) => {
  try {
    const { origin, destination } = req.body

    if (!origin?.label || !destination?.label) {
      return res.status(400).json({ error: 'Origin and destination are required.' })
    }

    const apiKey = getApiKey()
    const referer = req.headers.referer || req.headers.origin || 'http://localhost:3000'

    const response = await fetch(GOOGLE_ROUTES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
        Referer: referer,
      },
      body: JSON.stringify({
        origin: buildWaypoint(origin),
        destination: buildWaypoint(destination),
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        units: 'IMPERIAL',
        regionCode: 'us',
      }),
    })

    if (!response.ok) throw new Error('Google route calculation failed.')

    const data = await response.json()
    const route = data.routes?.[0]

    if (!route?.distanceMeters || !route.duration) {
      throw new Error('No drivable route was returned for this trip.')
    }

    return res.json({
      distanceMiles: roundToOne(route.distanceMeters * 0.000621371),
      durationMinutes: roundToOne(parseDurationToMinutes(route.duration)),
    })
  } catch (err) {
    console.error('[route]', err.message)
    return res.status(500).json({ error: err.message || 'Route calculation failed.' })
  }
})

// ── Route: POST /api/maps/geocode ─────────────────────────────────────────
app.post('/api/maps/geocode', async (req, res) => {
  try {
    const { coordinates } = req.body
    const { latitude, longitude } = coordinates || {}

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Coordinates are required.' })
    }

    const apiKey = getApiKey()
    const referer = req.headers.referer || req.headers.origin || 'http://localhost:3000'

    const url = new URL(GOOGLE_GEOCODE_URL)
    url.searchParams.set('latlng', `${latitude},${longitude}`)
    url.searchParams.set('key', apiKey)

    const response = await fetch(url.toString(), {
      headers: { Referer: referer },
    })

    if (!response.ok) throw new Error('Google Geocoding API request failed.')

    const data = await response.json()

    if (data.status === 'REQUEST_DENIED') {
      throw new Error(`Google API Denied: ${data.error_message}`)
    }

    const address = data.results?.[0]?.formatted_address || 'Current location'
    return res.json({ address })
  } catch (err) {
    console.error('[geocode]', err.message)
    return res.status(500).json({ error: err.message || 'Geocoding failed.' })
  }
})

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', port: PORT }))

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🟢  GreenScore Maps API server running at http://localhost:${PORT}`)
  console.log(`    Endpoints:`)
  console.log(`    POST http://localhost:${PORT}/api/maps/autocomplete`)
  console.log(`    POST http://localhost:${PORT}/api/maps/route`)
  console.log(`    POST http://localhost:${PORT}/api/maps/geocode`)
  console.log(`    GET  http://localhost:${PORT}/health\n`)
})
