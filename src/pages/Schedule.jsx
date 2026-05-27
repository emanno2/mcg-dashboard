import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, X, Clock, MapPin,
  Phone, Users, Leaf, RefreshCw, Calendar, Check
} from 'lucide-react'
import { useAppointments, useCalendars, getWeekDays, createAppointment } from '../hooks/useGHL'
import { Avatar, Badge } from '../components/ui'
import styles from './Schedule.module.css'
import clsx from 'clsx'

// ─── JOB TYPE CONFIG ──────────────────────────────────────────────────────────
const JOB_TYPES = {
  estimate:  { label: 'Estimate',    color: '#EF9F27', bg: 'rgba(239,159,39,0.15)',  border: 'rgba(239,159,39,0.4)',  icon: '📋' },
  lawn:      { label: 'Lawn Mow',    color: '#4ecfa0', bg: 'rgba(78,207,160,0.15)',  border: 'rgba(78,207,160,0.35)', icon: '🌿' },
  mulch:     { label: 'Mulch/Beds',  color: '#f97316', bg: 'rgba(249,115,22,0.15)',  border: 'rgba(249,115,22,0.35)', icon: '🪨' },
  hardscape: { label: 'Hardscape',   color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.35)',icon: '🧱' },
  cleanup:   { label: 'Cleanup',     color: '#34d399', bg: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.35)', icon: '🍂' },
  install:   { label: 'Install',     color: '#1D9E75', bg: 'rgba(29,158,117,0.15)',  border: 'rgba(29,158,117,0.35)', icon: '🌱' },
  tree:      { label: 'Tree Work',   color: '#854d0e', bg: 'rgba(133,77,14,0.2)',    border: 'rgba(133,77,14,0.4)',   icon: '🌳' },
  job:       { label: 'Job',         color: '#378ADD', bg: 'rgba(55,138,221,0.15)',  border: 'rgba(55,138,221,0.35)', icon: '🔧' },
}

// ─── ADD EVENT MODAL ──────────────────────────────────────────────────────────
function AddEventModal({ onClose, onSave, defaultDate }) {
  const { data: calendars } = useCalendars()
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState(null)
  const [form, setForm] = useState({
    title:       '',
    type:        'job',
    date:        defaultDate || new Date().toISOString().split('T')[0],
    startTime:   '09:00',
    endTime:     '11:00',
    contactName: '',
    phone:       '',
    address:     '',
    crew:        'Owner',
    notes:       '',
    calendarId:  '',
  })

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSave() {
    if (!form.title) { setError('Job title is required'); return }
    setSaving(true)
    setError(null)
    try {
      const startIso = new Date(`${form.date}T${form.startTime}`).toISOString()
      const endIso   = new Date(`${form.date}T${form.endTime}`).toISOString()
      await createAppointment({
        title:      `${JOB_TYPES[form.type]?.icon || ''} ${form.title}`,
        startTime:  startIso,
        endTime:    endIso,
        calendarId: form.calendarId || undefined,
        notes:      [form.contactName, form.phone, form.address, form.notes].filter(Boolean).join(' | '),
      })
      setSaved(true)
      setTimeout(() => { onSave(); onClose() }, 800)
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <Leaf size={16} strokeWidth={2} />
            Add Landscaping Job
          </div>
          <button className={styles.modalClose} onClick={onClose}><X size={15} /></button>
        </div>

        <div className={styles.modalBody}>
          {/* Job type selector */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Job Type</label>
            <div className={styles.typeGrid}>
              {Object.entries(JOB_TYPES).map(([key, t]) => (
                <button
                  key={key}
                  className={clsx(styles.typeBtn, form.type === key && styles.typeBtnActive)}
                  style={form.type === key ? { borderColor: t.color, background: t.bg, color: t.color } : {}}
                  onClick={() => set('type', key)}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Job Title *</label>
            <input
              className={styles.formInput}
              placeholder={`e.g. Spring cleanup — 420 Elm St`}
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>

          {/* Date + times */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Date</label>
              <input type="date" className={styles.formInput} value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Start</label>
              <input type="time" className={styles.formInput} value={form.startTime} onChange={e => set('startTime', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>End</label>
              <input type="time" className={styles.formInput} value={form.endTime} onChange={e => set('endTime', e.target.value)} />
            </div>
          </div>

          {/* Customer info */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Customer Name</label>
              <input className={styles.formInput} placeholder="John Smith" value={form.contactName} onChange={e => set('contactName', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone</label>
              <input className={styles.formInput} placeholder="(978) 555-0100" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>

          {/* Address */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Job Address</label>
            <input className={styles.formInput} placeholder="420 Elm St, Burlington MA" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>

          {/* Crew + calendar */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Crew</label>
              <select className={styles.formInput} value={form.crew} onChange={e => set('crew', e.target.value)}>
                <option>Owner</option>
                <option>Crew A</option>
                <option>Crew B</option>
              </select>
            </div>
            {calendars?.length > 0 && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Calendar</label>
                <select className={styles.formInput} value={form.calendarId} onChange={e => set('calendarId', e.target.value)}>
                  <option value="">Default</option>
                  {calendars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Notes</label>
            <textarea className={styles.formTextarea} placeholder="Any special instructions..." value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>

          {error && <div className={styles.formError}>{error}</div>}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={clsx(styles.saveBtn, saved && styles.saveBtnSaved)}
            onClick={handleSave}
            disabled={saving}
          >
            {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving…' : <><Plus size={14} /> Add to GHL Calendar</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── EVENT DETAIL POPUP ───────────────────────────────────────────────────────
function EventDetail({ job, onClose }) {
  const t = JOB_TYPES[job.type] || JOB_TYPES.job
  return (
    <div className={styles.detailOverlay} onClick={onClose}>
      <div className={styles.detailCard} onClick={e => e.stopPropagation()}>
        <div className={styles.detailHeader} style={{ borderColor: t.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className={styles.detailTypeIcon} style={{ background: t.bg, color: t.color }}>
              {t.icon}
            </div>
            <div>
              <div className={styles.detailName}>{job.name}</div>
              <div className={styles.detailService}>{job.service}</div>
            </div>
          </div>
          <button className={styles.detailClose} onClick={onClose}><X size={15} /></button>
        </div>
        <div className={styles.detailBody}>
          <div className={styles.detailRow}><Clock size={12} /><span>{job.startTime} – {job.endTime}</span></div>
          {job.address && <div className={styles.detailRow}><MapPin size={12} /><span>{job.address}</span></div>}
          {job.phone   && <div className={styles.detailRow}><Phone size={12} /><span>{job.phone}</span></div>}
          <div className={styles.detailRow}>
            <Users size={12} />
            <span>{job.crew}</span>
            <Badge variant={job.type === 'estimate' ? 'warning' : 'success'}>{t.label}</Badge>
          </div>
          {job.notes && <div className={styles.detailRow} style={{ alignItems: 'flex-start' }}><span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Notes:</span><span style={{ fontSize: 12 }}>{job.notes}</span></div>}
        </div>
        <div className={styles.detailActions}>
          <button className={styles.detailBtn}>📱 Send reminder</button>
          <button className={styles.detailBtn}>📞 Call</button>
          <button className={styles.detailBtnDanger}>Cancel job</button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [selected,   setSelected]   = useState(null)
  const [addModal,   setAddModal]   = useState(false)
  const [addDate,    setAddDate]    = useState(null)

  const { data: appointments, loading, error, refresh, refreshing } = useAppointments(weekOffset)
  const weekDays = getWeekDays(weekOffset)
  const jobs     = appointments || []

  const jobsByDay = weekDays.reduce((acc, day) => {
    acc[day.date] = jobs.filter(j => j.date === day.date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
    return acc
  }, {})

  const totalJobs      = jobs.filter(j => j.type !== 'estimate').length
  const totalEstimates = jobs.filter(j => j.type === 'estimate').length

  const weekLabel = weekOffset === 0 ? 'This Week'
    : weekOffset === 1 ? 'Next Week'
    : weekOffset === -1 ? 'Last Week'
    : weekDays[0]?.full

  function openAddForDay(date) {
    setAddDate(date)
    setAddModal(true)
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Schedule</h1>
          <p className={styles.pageSubtitle}>
            {weekDays[0]?.full} – {weekDays[6]?.full} · Landscaping & Hardscaping Jobs
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.weekNav}>
            <button className={styles.navBtn} onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft size={14} /></button>
            <button className={clsx(styles.weekLabel, weekOffset !== 0 && styles.weekLabelClickable)} onClick={() => setWeekOffset(0)}>
              {weekLabel}
            </button>
            <button className={styles.navBtn} onClick={() => setWeekOffset(w => w + 1)}><ChevronRight size={14} /></button>
          </div>
          <button className={clsx(styles.refreshBtn, refreshing && styles.refreshBtnSpin)} onClick={refresh} disabled={refreshing}>
            <RefreshCw size={13} strokeWidth={2} />
          </button>
          <button className={styles.addBtn} onClick={() => { setAddDate(null); setAddModal(true) }}>
            <Plus size={14} strokeWidth={2} />
            Add Job
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className={styles.summaryRow}>
        {Object.entries(JOB_TYPES).map(([key, t]) => {
          const count = jobs.filter(j => j.type === key).length
          if (!count) return null
          return (
            <div key={key} className={styles.summaryPill} style={{ background: t.bg, borderColor: t.border, color: t.color }}>
              {t.icon} {t.label} · {count}
            </div>
          )
        })}
        {jobs.length === 0 && !loading && (
          <div className={styles.summaryPill} style={{ color: 'var(--text-muted)' }}>No jobs this week</div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className={styles.loadingRow}>
          <div className={styles.spinner} />
          Loading from GoHighLevel…
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className={styles.errorBox}>GHL Error: {error}</div>
      )}

      {/* Calendar grid */}
      {!loading && (
        <div className={styles.calGrid}>
          {weekDays.map(day => {
            const dayJobs = jobsByDay[day.date] || []
            return (
              <div key={day.date} className={clsx(styles.dayCol, day.today && styles.dayColToday)}>
                <div className={styles.dayHeader}>
                  <div className={styles.dayHeaderLeft}>
                    <span className={styles.dayLabel}>{day.label}</span>
                    <span className={clsx(styles.dayNum, day.today && styles.dayNumToday)}>{day.dayNum}</span>
                    {day.today && <span className={styles.todayBadge}>Today</span>}
                  </div>
                  <button className={styles.addDayBtn} onClick={() => openAddForDay(day.date)} title="Add job">
                    <Plus size={11} strokeWidth={2.5} />
                  </button>
                </div>

                <div className={styles.dayEvents}>
                  {dayJobs.length === 0 && (
                    <div className={styles.dayEmpty} onClick={() => openAddForDay(day.date)}>
                      <Plus size={12} strokeWidth={2} />
                      Open
                    </div>
                  )}
                  {dayJobs.map(job => {
                    const t = JOB_TYPES[job.type] || JOB_TYPES.job
                    return (
                      <button
                        key={job.id}
                        className={clsx(styles.eventCard, selected?.id === job.id && styles.eventCardActive)}
                        style={{ background: t.bg, borderColor: t.border }}
                        onClick={() => setSelected(selected?.id === job.id ? null : job)}
                      >
                        <div className={styles.eventType} style={{ color: t.color }}>
                          <span>{t.icon}</span>
                          <span>{job.startTime}</span>
                        </div>
                        <div className={styles.eventName}>{job.name}</div>
                        <div className={styles.eventService}>{job.service}</div>
                        {job.crew && job.crew !== 'Owner' && (
                          <div className={styles.eventCrew} style={{ color: t.color }}>
                            <Users size={9} strokeWidth={2} />{job.crew}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Event detail */}
      {selected && <EventDetail job={selected} onClose={() => setSelected(null)} />}

      {/* Add event modal */}
      {addModal && (
        <AddEventModal
          defaultDate={addDate}
          onClose={() => setAddModal(false)}
          onSave={() => { setAddModal(false); refresh() }}
        />
      )}
    </div>
  )
}
