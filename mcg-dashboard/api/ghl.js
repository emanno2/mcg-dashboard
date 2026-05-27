// Vercel serverless function — proxies GHL API calls to avoid CORS
export default async function handler(req, res) {
  // Allow all origins for your dashboard
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Version')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { path, ...queryParams } = req.query
  if (!path) return res.status(400).json({ error: 'Missing path' })

  const API_KEY = process.env.VITE_GHL_API_KEY

  // Build target URL
  const isV2 = path.startsWith('v2/')
  const cleanPath = path.replace(/^v[12]\//, '')
  const baseUrl = isV2
    ? 'https://services.leadconnectorhq.com'
    : 'https://rest.gohighlevel.com/v1'

  const qs = new URLSearchParams(queryParams).toString()
  const targetUrl = `${baseUrl}/${cleanPath}${qs ? '?' + qs : ''}`

  try {
    const ghlRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        ...(isV2 ? { Version: '2021-07-28' } : {}),
      },
      ...(req.method !== 'GET' ? { body: JSON.stringify(req.body) } : {}),
    })

    const data = await ghlRes.json()
    return res.status(ghlRes.status).json(data)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
