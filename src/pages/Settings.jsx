import { useState } from 'react'
import {
  Building2, Wrench, MapPin, Calendar, Bell,
  Save, Check, ChevronRight, Plus, X, Clock
} from 'lucide-react'
import styles from './Settings.module.css'
import clsx from 'clsx'

// ─── MOCK SAVED STATE (replace with localStorage or GHL custom values later) ──
const DEFAULTS = {
  business: {
    name: 'P&J Landscaping',
    phone: '',
    email: '',
    website: '',
    address: '',
    radius: '25',
  },
  services: {
    'Mulch Installation':  true,
    'Spring Cleanup':      true,
    'Lawn Maintenance':    true,
    'Hardscaping':         true,
    'Sod Installation':    true,
    'Drainage':            false,
    'Walkways / Pavers':   true,
    'Retaining Walls':     false,
    'Tree Removal':        false,
    'Irrigation':          false,
    'Pressure Washing':    false,
    'Landscape Design':    false,
  },
  areas: ['Plymouth', 'Kingston', 'Duxbury', 'Hanover', 'Marshfield'],
  availability: {
    days: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false, Sun: false },
    startTime: '10:00',
    endTime:   '16:00',
    buffer:    '30',
    maxPerDay: '4',
  },
  notifications: {
    newLead:          true,
    photosUploaded:   true,
    awaitingApproval: true,
    jobBooked:        true,
    noResponse24h:    true,
    sms:              true,
    email:            true,
  },
}

// ─── SECTION NAV ─────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'business',     label: 'Business Info',        icon: Building2 },
  { id: 'services',     label: 'Services Offered',     icon: Wrench    },
  { id: 'areas',        label: 'Service Areas',        icon: MapPin    },
  { id: 'availability', label: 'Estimate Availability',icon: Calendar  },
  { id: 'notifications',label: 'Notifications',        icon: Bell      },
]

// ─── SAVE BUTTON ─────────────────────────────────────────────────────────────
function SaveBar({ onSave, saved }) {
  return (
    <div className={styles.saveBar}>
      <span className={styles.saveHint}>Changes are saved locally and will power your AI system.</span>
      <button className={clsx(styles.saveBtn, saved && styles.saveBtnDone)} onClick={onSave}>
        {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save Changes</>}
      </button>
    </div>
  )
}

// ─── SECTION: BUSINESS INFO ───────────────────────────────────────────────────
function BusinessInfo({ data, onChange }) {
  const fields = [
    { key: 'name',    label: 'Business Name',   placeholder: 'P&J Landscaping',         type: 'text'  },
    { key: 'phone',   label: 'Phone Number',    placeholder: '(617) 555-0100',           type: 'tel'   },
    { key: 'email',   label: 'Email',           placeholder: 'hello@pjlandscaping.com',  type: 'email' },
    { key: 'website', label: 'Website',         placeholder: 'www.pjlandscaping.com',    type: 'text'  },
    { key: 'address', label: 'Business Address',placeholder: '420 Main St, Plymouth MA', type: 'text'  },
  ]
  return (
    <div className={styles.sectionBody}>
      <div className={styles.sectionDesc}>
        This info is used by the AI to introduce your business, qualify leads, and sign off on messages.
      </div>
      <div className={styles.fieldGrid}>
        {fields.map(f => (
          <div key={f.key} className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{f.label}</label>
            <input
              type={f.type}
              className={styles.fieldInput}
              placeholder={f.placeholder}
              value={data[f.key] || ''}
              onChange={e => onChange(f.key, e.target.value)}
            />
          </div>
        ))}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Service Radius (miles)</label>
          <div className={styles.radiusRow}>
            <input
              type="range"
              min="5"
              max="75"
              step="5"
              className={styles.rangeInput}
              value={data.radius || 25}
              onChange={e => onChange('radius', e.target.value)}
            />
            <span className={styles.radiusVal}>{data.radius || 25} mi</span>
          </div>
          <div className={styles.fieldHint}>Leads outside this radius will be flagged for review.</div>
        </div>
      </div>
    </div>
  )
}

// ─── SECTION: SERVICES OFFERED ────────────────────────────────────────────────
function ServicesOffered({ data, onChange }) {
  return (
    <div className={styles.sectionBody}>
      <div className={styles.sectionDesc}>
        The AI uses this list to qualify leads. If someone requests a service you don't offer, it flags the lead instead of booking.
      </div>
      <div className={styles.toggleGrid}>
        {Object.entries(data).map(([service, enabled]) => (
          <button
            key={service}
            className={clsx(styles.toggleCard, enabled && styles.toggleCardOn)}
            onClick={() => onChange(service, !enabled)}
          >
            <div className={clsx(styles.toggleCheck, enabled && styles.toggleCheckOn)}>
              {enabled && <Check size={11} strokeWidth={3} />}
            </div>
            <span className={styles.toggleLabel}>{service}</span>
          </button>
        ))}
      </div>
      <div className={styles.fieldHint} style={{ marginTop: 12 }}>
        {Object.values(data).filter(Boolean).length} of {Object.keys(data).length} services active
      </div>
    </div>
  )
}

// ─── SECTION: SERVICE AREAS ───────────────────────────────────────────────────
function ServiceAreas({ data, onChange }) {
  const [newArea, setNewArea] = useState('')

  function addArea() {
    const trimmed = newArea.trim()
    if (!trimmed || data.includes(trimmed)) return
    onChange([...data, trimmed])
    setNewArea('')
  }

  function removeArea(area) {
    onChange(data.filter(a => a !== area))
  }

  return (
    <div className={styles.sectionBody}>
      <div className={styles.sectionDesc}>
        Leads from outside these towns will be flagged. The AI checks the customer's address against this list before booking.
      </div>

      <div className={styles.areaGrid}>
        {data.map(area => (
          <div key={area} className={styles.areaChip}>
            <MapPin size={11} strokeWidth={2} />
            <span>{area}</span>
            <button className={styles.areaRemove} onClick={() => removeArea(area)}>
              <X size={11} strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>

      <div className={styles.areaAddRow}>
        <input
          className={styles.fieldInput}
          placeholder="Add town or city..."
          value={newArea}
          onChange={e => setNewArea(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addArea()}
          style={{ flex: 1 }}
        />
        <button className={styles.areaAddBtn} onClick={addArea}>
          <Plus size={14} strokeWidth={2.5} /> Add
        </button>
      </div>

      <div className={styles.infoBox}>
        <MapPin size={13} strokeWidth={2} />
        <span>You also set a <strong>{25} mile radius</strong> in Business Info — leads outside both will be flagged automatically.</span>
      </div>
    </div>
  )
}

// ─── SECTION: ESTIMATE AVAILABILITY ──────────────────────────────────────────
function EstimateAvailability({ data, onChange }) {
  const DAY_KEYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

  return (
    <div className={styles.sectionBody}>
      <div className={styles.sectionDesc}>
        This controls when the AI is allowed to offer estimate time slots. Customers will only be shown times within these windows.
      </div>

      {/* Days */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Available Days</label>
        <div className={styles.dayRow}>
          {DAY_KEYS.map(day => (
            <button
              key={day}
              className={clsx(styles.dayBtn, data.days[day] && styles.dayBtnOn)}
              onClick={() => onChange('days', { ...data.days, [day]: !data.days[day] })}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Hours */}
      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Start Time</label>
          <input
            type="time"
            className={styles.fieldInput}
            value={data.startTime}
            onChange={e => onChange('startTime', e.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>End Time</label>
          <input
            type="time"
            className={styles.fieldInput}
            value={data.endTime}
            onChange={e => onChange('endTime', e.target.value)}
          />
        </div>
      </div>

      {/* Buffer + max */}
      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Travel Buffer</label>
          <select
            className={styles.fieldInput}
            value={data.buffer}
            onChange={e => onChange('buffer', e.target.value)}
          >
            {['15','30','45','60'].map(v => (
              <option key={v} value={v}>{v} min</option>
            ))}
          </select>
          <div className={styles.fieldHint}>Time added between estimates for travel.</div>
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Max Estimates / Day</label>
          <select
            className={styles.fieldInput}
            value={data.maxPerDay}
            onChange={e => onChange('maxPerDay', e.target.value)}
          >
            {['1','2','3','4','5','6'].map(v => (
              <option key={v} value={v}>{v} estimate{v !== '1' ? 's' : ''}</option>
            ))}
          </select>
          <div className={styles.fieldHint}>AI won't book beyond this limit.</div>
        </div>
      </div>

      {/* Preview */}
      <div className={styles.infoBox}>
        <Clock size={13} strokeWidth={2} />
        <span>
          AI will offer slots <strong>
            {DAY_KEYS.filter(d => data.days[d]).join(', ') || 'no days selected'}
          </strong> between <strong>{data.startTime}</strong> – <strong>{data.endTime}</strong>, up to <strong>{data.maxPerDay}/day</strong> with <strong>{data.buffer} min</strong> buffer.
        </span>
      </div>
    </div>
  )
}

// ─── SECTION: NOTIFICATIONS ───────────────────────────────────────────────────
function NotificationSettings({ data, onChange }) {
  const TRIGGERS = [
    { key: 'newLead',          label: 'New lead comes in',           desc: 'Whenever a new contact enters the pipeline' },
    { key: 'photosUploaded',   label: 'Customer uploads photos',     desc: 'When AI collects photos via SMS' },
    { key: 'awaitingApproval', label: 'Estimate awaiting approval',  desc: 'When a quote request is ready for your review' },
    { key: 'jobBooked',        label: 'Job gets booked',             desc: 'When a customer confirms an estimate time' },
    { key: 'noResponse24h',    label: 'No response after 24 hours',  desc: 'Lead has gone quiet — may need manual follow-up' },
  ]

  return (
    <div className={styles.sectionBody}>
      <div className={styles.sectionDesc}>
        Control when and how you get notified. These alerts keep you in the loop without needing to check the dashboard constantly.
      </div>

      {/* Channels */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Notification Channels</label>
        <div className={styles.channelRow}>
          {[
            { key: 'sms',   label: '📱 SMS',   desc: 'Text to your phone' },
            { key: 'email', label: '📧 Email',  desc: 'To your business email' },
          ].map(c => (
            <button
              key={c.key}
              className={clsx(styles.channelCard, data[c.key] && styles.channelCardOn)}
              onClick={() => onChange(c.key, !data[c.key])}
            >
              <div className={clsx(styles.toggleCheck, data[c.key] && styles.toggleCheckOn)}>
                {data[c.key] && <Check size={11} strokeWidth={3} />}
              </div>
              <div>
                <div className={styles.channelLabel}>{c.label}</div>
                <div className={styles.channelDesc}>{c.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Trigger list */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Notify Me When</label>
        <div className={styles.triggerList}>
          {TRIGGERS.map(t => (
            <div key={t.key} className={styles.triggerRow}>
              <div className={styles.triggerInfo}>
                <div className={styles.triggerLabel}>{t.label}</div>
                <div className={styles.triggerDesc}>{t.desc}</div>
              </div>
              <button
                className={clsx(styles.toggle, data[t.key] && styles.toggleOn)}
                onClick={() => onChange(t.key, !data[t.key])}
                aria-label={`Toggle ${t.label}`}
              >
                <div className={clsx(styles.toggleThumb, data[t.key] && styles.toggleThumbOn)} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN SETTINGS PAGE ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const [active, setActive]   = useState('business')
  const [saved,  setSaved]    = useState(false)
  const [config, setConfig]   = useState(() => {
    try {
      const stored = localStorage.getItem('mcg_settings')
      return stored ? JSON.parse(stored) : DEFAULTS
    } catch { return DEFAULTS }
  })

  function updateSection(section, key, value) {
    setConfig(prev => ({
      ...prev,
      [section]: typeof key === 'string'
        ? { ...prev[section], [key]: value }
        : key, // direct replace (for arrays like areas)
    }))
    setSaved(false)
  }

  function saveAll() {
    try { localStorage.setItem('mcg_settings', JSON.stringify(config)) } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const section = SECTIONS.find(s => s.id === active)

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>Configure your AI booking system — business info, services, areas, and alerts</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Sidebar nav */}
        <aside className={styles.nav}>
          {SECTIONS.map(s => {
            const Icon = s.icon
            return (
              <button
                key={s.id}
                className={clsx(styles.navItem, active === s.id && styles.navItemActive)}
                onClick={() => setActive(s.id)}
              >
                <Icon size={15} strokeWidth={1.8} />
                <span>{s.label}</span>
                <ChevronRight size={13} strokeWidth={2} className={styles.navChevron} />
              </button>
            )
          })}
        </aside>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              {section && <section.icon size={16} strokeWidth={1.8} />}
              {section?.label}
            </div>
          </div>

          {active === 'business' && (
            <BusinessInfo
              data={config.business}
              onChange={(k, v) => updateSection('business', k, v)}
            />
          )}
          {active === 'services' && (
            <ServicesOffered
              data={config.services}
              onChange={(k, v) => updateSection('services', k, v)}
            />
          )}
          {active === 'areas' && (
            <ServiceAreas
              data={config.areas}
              onChange={v => updateSection('areas', v, null)}
            />
          )}
          {active === 'availability' && (
            <EstimateAvailability
              data={config.availability}
              onChange={(k, v) => updateSection('availability', k, v)}
            />
          )}
          {active === 'notifications' && (
            <NotificationSettings
              data={config.notifications}
              onChange={(k, v) => updateSection('notifications', k, v)}
            />
          )}

          <SaveBar onSave={saveAll} saved={saved} />
        </div>
      </div>
    </div>
  )
}
