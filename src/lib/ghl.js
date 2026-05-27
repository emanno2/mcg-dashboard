// GHL API client
// In production: all calls go through /api/ghl (Vercel serverless, no CORS)
// In dev: calls go through Vite proxy defined in vite.config.js

const IS_PROD = import.meta.env.PROD

// ── Core fetch ────────────────────────────────────────────────────────────────
// In prod, everything routes through /api/ghl?endpoint=X&param=Y
// In dev, uses direct GHL URLs via Vite proxy
async function ghlFetch(endpoint, params = {}) {
  let url, headers

  if (IS_PROD) {
    // Server-side proxy — no CORS, key stays on server
    const qs = new URLSearchParams({ endpoint, ...params })
    url     = `/api/ghl?${qs}`
    headers = { 'Content-Type': 'application/json' }
  } else {
    // Dev: use Vite proxy + env vars from .env
    const API_KEY     = import.meta.env.VITE_GHL_API_KEY
    const LOCATION_ID = import.meta.env.VITE_GHL_LOCATION_ID

    const routes = {
      pipelines:    { base: '/ghl-v2', path: `/opportunities/pipelines?locationId=${LOCATION_ID}`, v: 2 },
      opportunities:{ base: '/ghl-v2', path: `/opportunities/search`, v: 2 },
      contacts:     { base: '/ghl-v1', path: `/contacts/?locationId=${LOCATION_ID}&limit=${params.limit||100}`, v: 1 },
      appointments: { base: '/ghl-v1', path: `/appointments/`, v: 1 },
      calendars:    { base: '/ghl-v2', path: `/calendars/?locationId=${LOCATION_ID}`, v: 2 },
    }

    const route = routes[endpoint]
    if (!route) throw new Error(`Unknown endpoint: ${endpoint}`)

    if (endpoint === 'opportunities') {
      const qs = new URLSearchParams({ location_id: LOCATION_ID, limit: params.limit || 100 })
      if (params.pipeline_id) qs.set('pipeline_id', params.pipeline_id)
      url = `${route.base}${route.path}?${qs}`
    } else if (endpoint === 'appointments') {
      const qs = new URLSearchParams({ locationId: LOCATION_ID })
      if (params.startDate) qs.set('startDate', params.startDate)
      if (params.endDate)   qs.set('endDate',   params.endDate)
      url = `${route.base}${route.path}?${qs}`
    } else {
      url = `${route.base}${route.path}`
    }

    headers = {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...(route.v === 2 ? { Version: '2021-07-28' } : {}),
    }
  }

  console.log(`[GHL] ${IS_PROD ? 'PROD' : 'DEV'} → ${endpoint}`, IS_PROD ? '' : url)

  const res = await fetch(url, { headers })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[GHL] Error ${res.status} on ${endpoint}:`, body)
    throw new Error(`GHL ${res.status}: ${body}`)
  }

  return res.json()
}

// ── PIPELINES ─────────────────────────────────────────────────────────────────
export async function fetchPipelines() {
  const data = await ghlFetch('pipelines')
  console.log('[GHL] Pipelines:', (data.pipelines || []).map(p => p.name))
  return data.pipelines || []
}

// ── OPPORTUNITIES ─────────────────────────────────────────────────────────────
export async function fetchOpportunities({ pipelineName = null, limit = 100 } = {}) {
  let pipelineId = null

  if (pipelineName) {
    try {
      const pipelines = await fetchPipelines()
      const match = pipelines.find(p =>
        p.name?.toLowerCase().includes(pipelineName.toLowerCase())
      )
      console.log('[GHL] Pipeline match for', pipelineName, '→', match?.name, match?.id)
      if (match) pipelineId = match.id
    } catch (e) {
      console.warn('[GHL] Pipeline fetch failed:', e.message)
    }
  }

  const data = await ghlFetch('opportunities', {
    limit: String(Math.min(limit, 100)),
    ...(pipelineId ? { pipeline_id: pipelineId } : {}),
  })

  console.log('[GHL] Opportunities count:', (data.opportunities || []).length)
  return (data.opportunities || []).map(normalizeOpportunity)
}

// ── CONTACTS ──────────────────────────────────────────────────────────────────
export async function fetchContacts(limit = 100) {
  const data = await ghlFetch('contacts', { limit: String(limit) })
  console.log('[GHL] Contacts count:', (data.contacts || []).length)
  return (data.contacts || []).map(normalizeContact)
}

// ── CALENDARS ─────────────────────────────────────────────────────────────────
export async function fetchCalendars() {
  try {
    const data = await ghlFetch('calendars')
    return data.calendars || []
  } catch (e) {
    console.warn('[GHL] Calendars unavailable:', e.message)
    return []
  }
}

// ── APPOINTMENTS ──────────────────────────────────────────────────────────────
export async function fetchAppointments(startDate, endDate) {
  try {
    const data = await ghlFetch('appointments', {
      startDate: startDate.toISOString(),
      endDate:   endDate.toISOString(),
    })
    return (data.appointments || []).map(normalizeAppointment)
  } catch (e) {
    console.warn('[GHL] Appointments failed:', e.message)
    return []
  }
}

// ── CREATE APPOINTMENT ────────────────────────────────────────────────────────
export async function createAppointment(appt) {
  const LOCATION_ID = import.meta.env.VITE_GHL_LOCATION_ID
  const API_KEY     = import.meta.env.VITE_GHL_API_KEY

  const body = {
    locationId:        LOCATION_ID,
    title:             appt.title,
    startTime:         appt.startTime,
    endTime:           appt.endTime,
    appointmentStatus: 'confirmed',
    ...(appt.calendarId ? { calendarId: appt.calendarId } : {}),
    ...(appt.contactId  ? { contactId:  appt.contactId  } : {}),
  }

  const url = IS_PROD
    ? '/api/ghl-create-appointment'
    : '/ghl-v1/appointments/'

  const headers = IS_PROD
    ? { 'Content-Type': 'application/json' }
    : { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GHL ${res.status}: ${text}`)
  }
  return res.json()
}

// ── CONVERSATIONS ─────────────────────────────────────────────────────────────
export async function fetchRecentConversations(limit = 20) {
  try {
    const LOCATION_ID = import.meta.env.VITE_GHL_LOCATION_ID
    const API_KEY     = import.meta.env.VITE_GHL_API_KEY
    const url = IS_PROD
      ? `/api/ghl?endpoint=conversations&limit=${limit}`
      : `/ghl-v1/conversations/search?locationId=${LOCATION_ID}&limit=${limit}`
    const headers = IS_PROD
      ? {}
      : { Authorization: `Bearer ${API_KEY}` }
    const res  = await fetch(url, { headers })
    const data = await res.json()
    return (data.conversations || []).map(c => ({
      id:          c.id,
      name:        c.contactName || 'Unknown',
      lastMessage: c.lastMessageBody || '',
      time:        c.lastMessageDate ? formatTimeAgo(c.lastMessageDate) : '—',
      unread:      c.unreadCount || 0,
    }))
  } catch (e) {
    console.warn('[GHL] Conversations unavailable:', e.message)
    return []
  }
}

// ── NORMALIZERS ───────────────────────────────────────────────────────────────
function normalizeOpportunity(o) {
  const contactName = o.contact?.name
    || [o.contact?.firstName, o.contact?.lastName].filter(Boolean).join(' ')
    || o.contactName || o.name || 'Unknown'
  const initials    = contactName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const avatarColor = pickColor(o.id || contactName)
  const stageName   = o.pipelineStage?.name || o.status || 'New Lead'

  return {
    id:            o.id,
    contactId:     o.contact?.id || '',
    initials,
    avatarColor,
    name:          contactName,
    service:       o.name || 'General inquiry',
    address:       [o.contact?.address1, o.contact?.city, o.contact?.state].filter(Boolean).join(', ') || '',
    city:          o.contact?.city  || '',
    phone:         o.contact?.phone || '',
    email:         o.contact?.email || '',
    source:        o.source || 'Direct',
    dateIn:        o.createdAt ? formatDate(o.createdAt) : '—',
    timeIn:        o.createdAt ? formatTime(o.createdAt) : '—',
    dateAdded:     o.createdAt || null,
    stage:         slugify(stageName),
    stageLabel:    stageName,
    stageVariant:  deriveVariant(stageName, o.status),
    pipelineId:    o.pipelineId || '',
    estimateRange: o.monetaryValue ? `$${Number(o.monetaryValue).toLocaleString()}` : 'TBD',
    monetaryValue: o.monetaryValue || 0,
    photoCount:    0,
    notes:         o.notes || '',
    status:        o.status || 'open',
    raw:           o,
  }
}

function normalizeContact(c) {
  const name        = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || 'Unknown'
  const initials    = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const avatarColor = pickColor(c.id || name)
  return {
    id: c.id, initials, avatarColor, name,
    email: c.email || '', phone: c.phone || '',
    address: [c.address1, c.city, c.state].filter(Boolean).join(', ') || '',
    city: c.city || '', source: c.source || 'Direct',
    tags: c.tags || [], service: c.tags?.[0] || 'General inquiry',
    dateIn: c.dateAdded ? formatDate(c.dateAdded) : '—',
    timeIn: c.dateAdded ? formatTime(c.dateAdded) : '—',
    dateAdded: c.dateAdded || null,
    stage: 'new_lead', stageLabel: 'New Lead', stageVariant: 'neutral',
    estimateRange: 'TBD', photoCount: 0, notes: '', raw: c,
  }
}

function normalizeAppointment(a) {
  const name        = [a.contact?.firstName, a.contact?.lastName].filter(Boolean).join(' ') || a.title || 'Appointment'
  const initials    = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const avatarColor = pickColor(a.id || name)
  const start       = new Date(a.startTime)
  const end         = new Date(a.endTime || a.startTime)
  return {
    id: a.id, initials, avatarColor, name,
    date:      start.toISOString().split('T')[0],
    startTime: formatTime12(start),
    endTime:   formatTime12(end),
    service:   a.title || 'Appointment',
    address:   a.contact?.address1 || '',
    phone:     a.contact?.phone || '',
    crew:      'Owner',
    type:      classifyJobType(a.title || ''),
    status:    a.appointmentStatus || 'confirmed',
    notes:     a.notes || '',
    raw:       a,
  }
}

function classifyJobType(title) {
  const t = title.toLowerCase()
  if (t.includes('estimate') || t.includes('quote'))  return 'estimate'
  if (t.includes('mow') || t.includes('lawn'))        return 'lawn'
  if (t.includes('mulch') || t.includes('bed'))       return 'mulch'
  if (t.includes('patio') || t.includes('paver') || t.includes('wall')) return 'hardscape'
  if (t.includes('cleanup') || t.includes('clean'))   return 'cleanup'
  if (t.includes('plant') || t.includes('sod'))       return 'install'
  if (t.includes('tree') || t.includes('trim'))       return 'tree'
  return 'job'
}

// ── UTILS ─────────────────────────────────────────────────────────────────────
const COLORS = ['#1D9E75','#378ADD','#EF9F27','#7F77DD','#E24B4A','#4ecfa0','#e879f9','#34d399','#f97316','#22d3ee']

function pickColor(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0
  return COLORS[Math.abs(h) % COLORS.length]
}

function slugify(s = '') { return s.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'') }

function deriveVariant(stageName = '', status = '') {
  const s = (stageName + status).toLowerCase()
  if (s.includes('won') || s.includes('book') || s.includes('complete')) return 'success'
  if (s.includes('lost') || s.includes('cancel'))   return 'danger'
  if (s.includes('approv') || s.includes('review')) return 'danger'
  if (s.includes('sent') || s.includes('estimate') || s.includes('quote')) return 'warning'
  if (s.includes('qualif') || s.includes('ready'))  return 'info'
  return 'neutral'
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })
}
function formatTime12(d) {
  return d.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })
}
function formatTimeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
