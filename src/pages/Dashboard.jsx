import { RefreshCw, MapPin, Phone, Clock, TrendingUp, AlertTriangle, Zap, Calendar } from 'lucide-react'
import { usePJOpportunities, useAppointments } from '../hooks/useGHL'
import { Avatar, Badge } from '../components/ui'
import styles from './Dashboard.module.css'
import clsx from 'clsx'

// ─── METRIC CARD ─────────────────────────────────────────────────────────────
function MetricCard({ label, value, delta, warn, color, i }) {
  return (
    <div className={styles.metricCard} style={{ animationDelay: `${i * 60}ms` }}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>{value ?? '—'}</div>
      {delta && (
        <div className={styles.metricDelta}>
          {warn
            ? <><AlertTriangle size={11} /><span style={{ color: 'var(--warning-text)' }}>{delta}</span></>
            : <><TrendingUp size={11} style={{ color: 'var(--success-text)' }} /><span style={{ color: 'var(--success-text)' }}>{delta}</span></>
          }
        </div>
      )}
    </div>
  )
}

// ─── LEAD CARD ────────────────────────────────────────────────────────────────
function LeadCard({ lead }) {
  return (
    <div className={styles.leadCard}>
      <div className={styles.leadTop}>
        <Avatar initials={lead.initials} color={lead.avatarColor} size="md" />
        <div className={styles.leadInfo}>
          <div className={styles.leadName}>{lead.name}</div>
          <div className={styles.leadService}>{lead.service}</div>
        </div>
        <Badge variant={lead.stageVariant}>{lead.stageLabel}</Badge>
      </div>
      <div className={styles.leadMeta}>
        {lead.address && (
          <span className={styles.leadMetaItem}>
            <MapPin size={10} strokeWidth={2} />{lead.address}
          </span>
        )}
        {lead.phone && (
          <span className={styles.leadMetaItem}>
            <Phone size={10} strokeWidth={2} />{lead.phone}
          </span>
        )}
        <span className={styles.leadMetaItem}>
          <Clock size={10} strokeWidth={2} />{lead.dateIn} · {lead.timeIn}
        </span>
      </div>
      {lead.estimateRange !== 'TBD' && (
        <div className={styles.leadValue}>{lead.estimateRange}</div>
      )}
    </div>
  )
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const {
    data: opps,
    loading: oppsLoading,
    error: oppsError,
    refreshing,
    lastUpdated,
    refresh,
  } = usePJOpportunities()

  const { data: appointments } = useAppointments()

  // Filter to New Lead stage — matches GHL stage name "Lead"
  const newLeads = (opps || []).filter(o => {
    const s = (o.stageLabel || o.stage || '').toLowerCase()
    return s.includes('lead') || s.includes('new') || o.status === 'open'
  })

  const allOpps    = opps || []
  const wonOpps    = allOpps.filter(o => o.status === 'won' || (o.stageLabel || '').toLowerCase().includes('won') || (o.stageLabel || '').toLowerCase().includes('book'))
  const pipelineVal = allOpps.reduce((sum, o) => sum + (o.monetaryValue || 0), 0)
  const thisWeek   = (appointments || []).length

  const metrics = [
    { label: 'New Leads',        value: newLeads.length,  delta: 'in P&J pipeline' },
    { label: 'Total Opps',       value: allOpps.length,   delta: 'all stages' },
    { label: 'Booked / Won',     value: wonOpps.length,   delta: 'opportunities won' },
    { label: 'Pipeline Value',   value: pipelineVal > 0 ? `$${(pipelineVal/1000).toFixed(1)}k` : '—', delta: `${thisWeek} appts this week` },
  ]

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>P&J Pipeline · AI Booking System</p>
        </div>
        <div className={styles.headerRight}>
          {lastUpdated && (
            <span className={styles.lastUpdated}>
              Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          <button
            className={clsx(styles.refreshBtn, refreshing && styles.refreshBtnSpinning)}
            onClick={refresh}
            disabled={refreshing}
            title="Refresh from GoHighLevel"
          >
            <RefreshCw size={14} strokeWidth={2} className={refreshing ? styles.spin : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            Auto-refresh 60s
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className={styles.metricsGrid}>
        {metrics.map((m, i) => <MetricCard key={i} {...m} i={i} />)}
      </div>

      {/* New Leads from P&J */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <Zap size={14} strokeWidth={2} />
          New Leads — P&J Pipeline
          <span className={styles.sectionCount}>{newLeads.length}</span>
        </div>
        <span className={styles.sectionHint}>Showing opportunities in "New Lead" stage</span>
      </div>

      {oppsLoading && !refreshing && (
        <div className={styles.loadingRow}>
          <div className={styles.spinner} />
          <span>Loading from GoHighLevel…</span>
        </div>
      )}

      {oppsError && (
        <div className={styles.errorBox}>
          <strong>GHL Error:</strong> {oppsError}
        </div>
      )}

      {!oppsLoading && !oppsError && newLeads.length === 0 && (
        <div className={styles.emptyState}>
          No opportunities in the New Lead stage right now.
        </div>
      )}

      {newLeads.length > 0 && (
        <div className={styles.leadsGrid}>
          {newLeads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
        </div>
      )}

      {/* All pipeline summary */}
      {allOpps.length > 0 && (
        <>
          <div className={styles.sectionHeader} style={{ marginTop: '1.5rem' }}>
            <div className={styles.sectionTitle}>
              <Calendar size={14} strokeWidth={2} />
              All Pipeline Stages
              <span className={styles.sectionCount}>{allOpps.length}</span>
            </div>
          </div>
          <div className={styles.stageBreakdown}>
            {Object.entries(
              allOpps.reduce((acc, o) => {
                const key = o.stageLabel || 'Unknown'
                acc[key] = (acc[key] || 0) + 1
                return acc
              }, {})
            ).map(([stage, count]) => (
              <div key={stage} className={styles.stagePill}>
                <span className={styles.stagePillLabel}>{stage}</span>
                <span className={styles.stagePillCount}>{count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
