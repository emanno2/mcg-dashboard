const LOCATION_ID = import.meta.env.VITE_GHL_LOCATION_ID
const API_KEY     = import.meta.env.VITE_GHL_API_KEY

async function request(path, version = 'v2') {
  const base    = version === 'v2' ? '/ghl-v2' : '/ghl-v1'
  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    ...(version === 'v2' ? { Version: '2021-07-28' } : {}),
  }
  const res = await fetch(`${base}${path}`, { headers })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GHL ${res.status}: ${body}`)
  }
  return res.json()
}

// ─── PIPELINES ────────────────────────────────────────────────────────────────
export async function fetchPipelines() {
  const data = await request(`/opportunities/pipelines?locationId=${LOCATION_ID}`)
  return data.pipelines || []
}

// ─── OPPORTUNITIES ────────────────────────────────────────────────────────────
export async function fetchOpportunities({ pipelineName = null, limit = 100 } = {}) {
  const safeLimit = Math.min(limit, 100)
  let pipelineId = null

  if (pipelineName) {
    try {
      const pipelines = await fetchPipelines()
      const match = pipelines.find(p =>
        p.name?.toLowerCase().includes(pipelineName.toLowerCase())
      )
      if (match) pipelineId = match.id
      console.log('Pipelines found:', pipelines.map(p => p.name))
      console.log('Matched pipeline:', match?.name, match?.id)
    } catch (e) {
      console.warn('Could not fetch pipelines:', e.message)
    }
  }

  const params = new URLSearchParams({
    location_id: LOCATION_ID,
    limit: String(safeLimit),
    ...(pipelineId ? { pipeline_id: pipelineId } : {}),
  })

  const data = await request(`/opportunities/search?${params}`)
  return (data.opportunities || []).map(normalizeOpportunity)
}

// ─── CONTACTS ─────────────────────────────────────────────────────────────────
export async function fetchContacts(limit = 100) {
  const data = await request(`/contacts/?locationId=${LOCATION_ID}&limit=${limit}`, 'v1')
  return (data.contacts || []).map(normalizeContact)
}

// ─── CALENDARS ────────────────────────────────────────────────────────────────
export async function fetchCalendars() {
  try {
    const data = await request(`/calendars/?locationId=${LOCATION_ID}`)
    return data.calendars || []
  } catch (e) {
    console.warn('Calendars unavailable:', e.message)
    return []
  }
}

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────
export async function fetchAppointments(startDate, endDate) {
  try {
    const params = new URLSearchParams({
      locationId: LOCATION_ID,
      startDate:  startDate.toISOString(),
      endDate:    endDate.toISOString(),
    })
    const data = await request(`/appointments/?${params}`, 'v1')
    return (data.appointments || []).map(normalizeAppointment)
  } catch (e) {
    console.warn('Appointments v1 failed, trying v2:', e.message)
    try {
      const params = new URLSearchParams({
        locationId: LOCATION_ID,
        startTime:  String(startDate.getTime()),
        endTime:    String(endDate.getTime()),
      })
      const data = await request(`/calendars/events?${params}`)
      return (data.events || []).map(normalizeCalendarEvent)
    } catch (e2) {
      console.warn('Appointments v2 also failed:', e2.message)
      return []
    }
  }
}

// ─── CREATE APPOINTMENT ───────────────────────────────────────────────────────
export async function createAppointment(appt) {
  // appt: { title, startTime (ISO), endTime (ISO), contactName, phone, address, notes, calendarId? }
  const body = {
    locationId:  LOCATION_ID,
    title:       appt.title,
    startTime:   appt.startTime,
    endTime:     appt.endTime,
    appointmentStatus: 'confirmed',
    ...(appt.calendarId ? { calendarId: appt.calendarId } : {}),
    ...(appt.contactId  ? { contactId:  appt.contactId  } : {}),
  }
  const res = await request(`/appointments/`, 'v1')
  // POST not GET — do it directly
  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  }
  const postRes = await fetch('/ghl-v1/appointments/', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!postRes.ok) {
    const text = await postRes.text()
    throw new Error(`GHL ${postRes.status}: ${text}`)
  }
  return postRes.json()
}

// ─── CONVERSATIONS ────────────────────────────────────────────────────────────
export async function fetchRecentConversations(limit = 20) {
  try {
    const data = await request(`/conversations/search?locationId=${LOCATION_ID}&limit=${limit}`, 'v1')
    return (data.conversations || []).map(c => ({
      id:          c.id,
      name:        c.contactName || 'Unknown',
      lastMessage: c.lastMessageBody || '',
      time:        c.lastMessageDate ? formatTimeAgo(c.lastMessageDate) : '—',
      unread:      c.unreadCount || 0,
    }))
  } catch (e) {
    console.warn('Conversations unavailable:', e.message)
    return []
  }
}

// ─── NORMALIZERS ──────────────────────────────────────────────────────────────
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
    startIso:  start.toISOString(),
    endIso:    end.toISOString(),
    service:   a.title || 'Appointment',
    address:   a.contact?.address1 || a.location || '',
    phone:     a.contact?.phone || '',
    contactId: a.contact?.id || a.contactId || '',
    crew:      a.assignedUser || 'Owner',
    type:      classifyJobType(a.title || ''),
    calendarId: a.calendarId || '',
    status:    a.appointmentStatus || 'confirmed',
    notes:     a.notes || '',
    raw:       a,
  }
}

function normalizeCalendarEvent(e) {
  const start = new Date(e.startTime)
  const end   = new Date(e.endTime || e.startTime)
  return {
    id: e.id, initials: '??', avatarColor: pickColor(e.id),
    name:      e.title || 'Event',
    date:      start.toISOString().split('T')[0],
    startTime: formatTime12(start),
    endTime:   formatTime12(end),
    startIso:  start.toISOString(),
    endIso:    end.toISOString(),
    service:   e.title || 'Appointment',
    address:   e.location || '',
    phone:     '', contactId: '',
    crew:      'Owner',
    type:      classifyJobType(e.title || ''),
    calendarId: e.calendarId || '',
    status:    e.status || 'confirmed',
    notes:     e.notes || '',
    raw:       e,
  }
}

function classifyJobType(title) {
  const t = title.toLowerCase()
  if (t.includes('estimate') || t.includes('quote') || t.includes('consult')) return 'estimate'
  if (t.includes('mow') || t.includes('lawn') || t.includes('cut'))           return 'lawn'
  if (t.includes('mulch') || t.includes('bed') || t.includes('edge'))         return 'mulch'
  if (t.includes('patio') || t.includes('paver') || t.includes('wall') || t.includes('stone')) return 'hardscape'
  if (t.includes('cleanup') || t.includes('clean') || t.includes('leaf'))     return 'cleanup'
  if (t.includes('plant') || t.includes('install') || t.includes('sod'))      return 'install'
  if (t.includes('tree') || t.includes('trim') || t.includes('prune'))        return 'tree'
  return 'job'
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
const COLORS = ['#1D9E75','#378ADD','#EF9F27','#7F77DD','#E24B4A','#4ecfa0','#e879f9','#34d399','#f97316','#22d3ee']

function pickColor(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0
  return COLORS[Math.abs(h) % COLORS.length]
}

function slugify(str = '') {
  return str.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

function deriveVariant(stageName = '', status = '') {
  const s = (stageName + status).toLowerCase()
  if (s.includes('won') || s.includes('book'))      return 'success'
  if (s.includes('lost'))                            return 'danger'
  if (s.includes('approv') || s.includes('review')) return 'danger'
  if (s.includes('sent') || s.includes('estimate')) return 'warning'
  if (s.includes('qualif') || s.includes('ready'))  return 'info'
  return 'neutral'
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
function formatTime12(d) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
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
