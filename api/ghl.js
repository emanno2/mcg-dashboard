// Vercel serverless proxy for GoHighLevel API
// Runs server-side — no CORS, key is safe, full logging

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── Read env vars ──────────────────────────────────────────────────────────
  const API_KEY     = process.env.VITE_GHL_API_KEY
  const LOCATION_ID = process.env.VITE_GHL_LOCATION_ID

  console.log('[GHL] Request received:', req.url)
  console.log('[GHL] API_KEY present:', !!API_KEY, API_KEY ? `(starts: ${API_KEY.slice(0,8)}...)` : 'MISSING')
  console.log('[GHL] LOCATION_ID:', LOCATION_ID || 'MISSING')

  if (!API_KEY) {
    console.error('[GHL] ERROR: VITE_GHL_API_KEY not set in Vercel environment')
    return res.status(500).json({ error: 'GHL API key not configured on server' })
  }

  if (!LOCATION_ID) {
    console.error('[GHL] ERROR: VITE_GHL_LOCATION_ID not set in Vercel environment')
    return res.status(500).json({ error: 'GHL Location ID not configured on server' })
  }

  // ── Parse endpoint from query ──────────────────────────────────────────────
  // e.g. /api/ghl?endpoint=pipelines → calls GHL pipelines
  const { endpoint } = req.query

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint param', validEndpoints: ['pipelines', 'opportunities', 'contacts', 'appointments', 'calendars'] })
  }

  console.log('[GHL] Endpoint:', endpoint)

  try {
    let ghlUrl, ghlHeaders

    const v2Headers = {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      Version: '2021-07-28',
    }
    const v1Headers = {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    }

    // ── Route to correct GHL endpoint ─────────────────────────────────────
    if (endpoint === 'pipelines') {
      ghlUrl     = `https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${LOCATION_ID}`
      ghlHeaders = v2Headers

    } else if (endpoint === 'opportunities') {
      const { pipeline_id, limit = '100', status } = req.query
      const params = new URLSearchParams({ location_id: LOCATION_ID, limit })
      if (pipeline_id) params.set('pipeline_id', pipeline_id)
      if (status)      params.set('status', status)
      ghlUrl     = `https://services.leadconnectorhq.com/opportunities/search?${params}`
      ghlHeaders = v2Headers

    } else if (endpoint === 'contacts') {
      const { limit = '100' } = req.query
      ghlUrl     = `https://rest.gohighlevel.com/v1/contacts/?locationId=${LOCATION_ID}&limit=${limit}`
      ghlHeaders = v1Headers

    } else if (endpoint === 'appointments') {
      const { startDate, endDate } = req.query
      const params = new URLSearchParams({ locationId: LOCATION_ID })
      if (startDate) params.set('startDate', startDate)
      if (endDate)   params.set('endDate', endDate)
      ghlUrl     = `https://rest.gohighlevel.com/v1/appointments/?${params}`
      ghlHeaders = v1Headers

    } else if (endpoint === 'calendars') {
      ghlUrl     = `https://services.leadconnectorhq.com/calendars/?locationId=${LOCATION_ID}`
      ghlHeaders = v2Headers

    } else {
      return res.status(400).json({ error: `Unknown endpoint: ${endpoint}` })
    }

    console.log('[GHL] Calling:', ghlUrl)

    const ghlRes = await fetch(ghlUrl, { headers: ghlHeaders })
    const text   = await ghlRes.text()

    console.log('[GHL] Response status:', ghlRes.status)
    console.log('[GHL] Response preview:', text.slice(0, 200))

    let data
    try {
      data = JSON.parse(text)
    } catch {
      console.error('[GHL] Failed to parse JSON response:', text.slice(0, 300))
      return res.status(502).json({ error: 'GHL returned non-JSON', raw: text.slice(0, 300) })
    }

    if (!ghlRes.ok) {
      console.error('[GHL] GHL error response:', data)
      return res.status(ghlRes.status).json({ error: 'GHL API error', details: data })
    }

    return res.status(200).json(data)

  } catch (e) {
    console.error('[GHL] Fetch error:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
