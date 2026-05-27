import { useState } from 'react'
import { Search, Filter, Phone, MapPin, Image, RefreshCw, ChevronRight } from 'lucide-react'
import { Badge, Avatar } from '../components/ui'
import { LoadingState, ErrorState } from '../components/LoadingState'
import { usePJOpportunities } from '../hooks/useGHL'
import styles from './Leads.module.css'
import clsx from 'clsx'

const SOURCE_FILTERS = ['All', 'Meta Ad', 'Google Ad', 'Website', 'Direct']
const STAGE_FILTERS  = ['All', 'New', 'In Progress', 'Booked']

function stageGroup(stage) {
  if (stage === 'new_lead') return 'New'
  if (stage === 'won')      return 'Booked'
  return 'In Progress'
}

export default function LeadsPage() {
  const { data: leads, loading, error } = usePJOpportunities()
  const [search, setSearch]       = useState('')
  const [sourceFilter, setSource] = useState('All')
  const [stageFilter, setStage]   = useState('All')
  const [selected, setSelected]   = useState(null)

  if (loading) return <LoadingState message="Loading contacts from GoHighLevel..." />
  if (error)   return <ErrorState error={error} />

  const allLeads = leads || []

  const filtered = allLeads.filter(l => {
    const matchSearch = !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.service.toLowerCase().includes(search.toLowerCase()) ||
      l.address.toLowerCase().includes(search.toLowerCase())
    const matchSource = sourceFilter === 'All' || l.source === sourceFilter
    const matchStage  = stageFilter === 'All'  || stageGroup(l.stage) === stageFilter
    return matchSearch && matchSource && matchStage
  })

  const newToday = allLeads.filter(l => {
    if (!l.dateAdded) return false
    const d = new Date(l.dateAdded)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Leads</h1>
          <p className={styles.pageSubtitle}>All inbound contacts from GoHighLevel — newest first</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.totalLabel}>
            {allLeads.length} total · {newToday} new today
          </span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} strokeWidth={2} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by name, service, or address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}><Filter size={11} /> Source</span>
            {SOURCE_FILTERS.map(f => (
              <button key={f} className={clsx(styles.filterBtn, sourceFilter === f && styles.filterBtnActive)} onClick={() => setSource(f)}>{f}</button>
            ))}
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status</span>
            {STAGE_FILTERS.map(f => (
              <button key={f} className={clsx(styles.filterBtn, stageFilter === f && styles.filterBtnActive)} onClick={() => setStage(f)}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <span className={styles.thName}>Customer</span>
          <span className={styles.thService}>Service / Tags</span>
          <span className={styles.thSource}>Source</span>
          <span className={styles.thDate}>Date In</span>
          <span className={styles.thEstimate}>Estimate</span>
          <span className={styles.thStatus}>Status</span>
          <span className={styles.thChevron} />
        </div>

        <div className={styles.tableBody}>
          {filtered.length === 0 && (
            <div className={styles.empty}>No leads match your filters</div>
          )}
          {filtered.map((lead, i) => (
            <button
              key={lead.id}
              className={clsx(styles.tableRow, selected?.id === lead.id && styles.tableRowActive)}
              onClick={() => setSelected(selected?.id === lead.id ? null : lead)}
              style={{ animationDelay: `${Math.min(i, 20) * 30}ms` }}
            >
              <span className={styles.tdName}>
                <Avatar initials={lead.initials} color={lead.avatarColor} size="sm" />
                <div>
                  <div className={styles.leadName}>{lead.name}</div>
                  <div className={styles.leadAddr}>
                    <MapPin size={9} strokeWidth={2} />
                    {lead.address || lead.city || '—'}
                  </div>
                </div>
              </span>
              <span className={styles.tdService}>{lead.service}</span>
              <span className={styles.tdSource}>
                <span className={clsx(
                  styles.sourcePill,
                  lead.source?.includes('Meta')   && styles.sourceMeta,
                  lead.source?.includes('Google') && styles.sourceGoogle,
                  lead.source === 'Website'        && styles.sourceWeb,
                )}>
                  {lead.source || 'Direct'}
                </span>
              </span>
              <span className={styles.tdDate}>
                <div className={styles.dateMain}>{lead.dateIn}</div>
                <div className={styles.dateTime}>{lead.timeIn}</div>
              </span>
              <span className={styles.tdEstimate}>{lead.estimateRange}</span>
              <span className={styles.tdStatus}>
                <Badge variant={lead.stageVariant}>{lead.stageLabel}</Badge>
              </span>
              <span className={styles.tdChevron}><ChevronRight size={14} strokeWidth={2} /></span>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className={styles.detailPanel}>
          <div className={styles.detailGrid}>
            <div className={styles.detailBlock}>
              <div className={styles.detailLabel}>Phone</div>
              <div className={styles.detailValue}><Phone size={12} /> {selected.phone || '—'}</div>
            </div>
            <div className={styles.detailBlock}>
              <div className={styles.detailLabel}>Email</div>
              <div className={styles.detailValue}>{selected.email || '—'}</div>
            </div>
            <div className={styles.detailBlock}>
              <div className={styles.detailLabel}>Address</div>
              <div className={styles.detailValue}>{selected.address || '—'}</div>
            </div>
            <div className={styles.detailBlock}>
              <div className={styles.detailLabel}>Tags</div>
              <div className={styles.detailValue}>{selected.tags?.join(', ') || '—'}</div>
            </div>
          </div>
          {selected.notes && (
            <div className={styles.detailNotes}>{selected.notes}</div>
          )}
          <div className={styles.detailActions}>
            <button className={styles.detailBtn}>Send SMS</button>
            <button className={styles.detailBtn}>Call</button>
            <button className={styles.detailBtn}>Schedule estimate</button>
            <button className={styles.detailBtnPrimary}>View in GHL →</button>
          </div>
        </div>
      )}
    </div>
  )
}
