import { useState } from 'react'
import { Image, Phone, MapPin, DollarSign, X, MessageSquare, Calendar, User } from 'lucide-react'
import { KANBAN_STAGES } from '../data/mockData'
import { Badge, Avatar } from '../components/ui'
import { LoadingState, ErrorState } from '../components/LoadingState'
import { usePJOpportunities } from '../hooks/useGHL'
import styles from './Pipeline.module.css'
import clsx from 'clsx'

function stageVariant(stageId) {
  if (stageId === 'won')                return 'success'
  if (stageId === 'lost')               return 'danger'
  if (stageId === 'awaiting_approval')  return 'danger'
  if (['quote_ready','qualified'].includes(stageId)) return 'info'
  if (['estimate_sent','estimate_scheduled'].includes(stageId)) return 'warning'
  return 'neutral'
}

export default function PipelinePage() {
  const { data: opps, loading, error, refreshing, refresh, lastUpdated } = usePJOpportunities()
  const [leads, setLeads]   = useState(null)
  const [selected, setSelected] = useState(null)

  if (loading) return <LoadingState message="Loading pipeline from GoHighLevel..." />
  if (error)   return <ErrorState error={error} />

  // Use GHL opps, fall back to empty
  const allLeads = leads || opps || []

  // Group by stage — map GHL pipeline stage names to our stage IDs
  const byStage = KANBAN_STAGES.reduce((acc, s) => {
    acc[s.id] = allLeads.filter(l => {
      const sl = (l.stageLabel || '').toLowerCase()
      const si = (l.stage || '').toLowerCase()
      if (s.id === 'won')  return si === 'won'  || sl.includes('won')  || sl.includes('booked')
      if (s.id === 'new_lead') return si === 'new_lead' || sl.includes('new') || (!si || si === 'open')
      return si === s.id || sl.includes(s.label.toLowerCase())
    })
    return acc
  }, {})

  const totalValue = allLeads.reduce((sum, l) => sum + (l.monetaryValue || 0), 0)

  function moveStage(leadId, newStageId) {
    const stage = KANBAN_STAGES.find(s => s.id === newStageId)
    const updated = allLeads.map(l =>
      l.id === leadId
        ? { ...l, stage: newStageId, stageLabel: stage.label, stageVariant: stageVariant(newStageId) }
        : l
    )
    setLeads(updated)
    if (selected?.id === leadId) {
      setSelected(prev => ({ ...prev, stage: newStageId, stageLabel: stage.label }))
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Pipeline</h1>
          <p className={styles.pageSubtitle}>Live from GoHighLevel · {allLeads.length} opportunities</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statPill}><User size={12} />{allLeads.length} total</div>
          {totalValue > 0 && (
            <div className={styles.statPill}><DollarSign size={12} />${(totalValue/1000).toFixed(0)}k pipeline</div>
          )}
          <div className={clsx(styles.statPill, styles.statPillSuccess)}>
            {allLeads.filter(l => l.stage === 'won').length} booked
          </div>
        </div>
      </div>

      <div className={styles.board}>
        {KANBAN_STAGES.map(stage => {
          const cards = byStage[stage.id] || []
          return (
            <div key={stage.id} className={styles.column}>
              <div className={styles.colHeader}>
                <div className={styles.colDot} style={{ background: stage.color }} />
                <span className={styles.colLabel}>{stage.label}</span>
                <span className={styles.colCount}>{cards.length}</span>
              </div>
              <div className={styles.colCards}>
                {cards.map(lead => (
                  <button
                    key={lead.id}
                    className={clsx(styles.card, selected?.id === lead.id && styles.cardActive)}
                    onClick={() => setSelected(lead)}
                  >
                    <div className={styles.cardTop}>
                      <Avatar initials={lead.initials} color={lead.avatarColor} size="sm" />
                      <div className={styles.cardInfo}>
                        <div className={styles.cardName}>{lead.name}</div>
                        <div className={styles.cardService}>{lead.service}</div>
                      </div>
                    </div>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardAddr}>
                        <MapPin size={9} strokeWidth={2} />
                        {lead.city || lead.address?.split(',')[1]?.trim() || '—'}
                      </span>
                      <span className={styles.cardSource}>{lead.source || 'Direct'}</span>
                    </div>
                    <div className={styles.cardBottom}>
                      <span className={styles.cardValue}>{lead.estimateRange}</span>
                      {lead.photoCount > 0 && (
                        <span className={styles.cardPhotos}><Image size={9} strokeWidth={2} />{lead.photoCount}</span>
                      )}
                    </div>
                  </button>
                ))}
                {cards.length === 0 && <div className={styles.colEmpty}>No leads</div>}
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <div className={styles.drawer}>
          <div className={styles.drawerHeader}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Avatar initials={selected.initials} color={selected.avatarColor} size="lg" />
              <div>
                <div className={styles.drawerName}>{selected.name}</div>
                <div className={styles.drawerService}>{selected.service}</div>
              </div>
            </div>
            <button className={styles.drawerClose} onClick={() => setSelected(null)}>
              <X size={16} strokeWidth={2} />
            </button>
          </div>
          <div className={styles.drawerBody}>
            <div className={styles.drawerSection}>
              {selected.address && <div className={styles.drawerRow}><MapPin size={13} /><span>{selected.address}</span></div>}
              {selected.phone   && <div className={styles.drawerRow}><Phone size={13} /><span>{selected.phone}</span></div>}
              {selected.dateIn  && <div className={styles.drawerRow}><Calendar size={13} /><span>In: {selected.dateIn}</span></div>}
              <div className={styles.drawerRow}><DollarSign size={13} /><span>{selected.estimateRange}</span></div>
            </div>
            {selected.notes && (
              <div className={styles.drawerNotes}>
                <div className={styles.drawerNotesLabel}>Notes</div>
                <div className={styles.drawerNotesText}>{selected.notes}</div>
              </div>
            )}
            <div className={styles.drawerSection}>
              <div className={styles.drawerSectionLabel}>Current stage</div>
              <Badge variant={selected.stageVariant || 'neutral'}>{selected.stageLabel}</Badge>
            </div>
            <div className={styles.drawerSection}>
              <div className={styles.drawerSectionLabel}>Move to stage</div>
              <div className={styles.stageButtons}>
                {KANBAN_STAGES.map(s => (
                  <button
                    key={s.id}
                    className={clsx(styles.stageBtn, selected.stage === s.id && styles.stageBtnActive)}
                    style={selected.stage === s.id ? { borderColor: s.color, color: s.color } : {}}
                    onClick={() => moveStage(selected.id, s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.drawerActions}>
              <button className={styles.actionBtn}><MessageSquare size={13} /> SMS</button>
              <button className={styles.actionBtn}><Phone size={13} /> Call</button>
              <button className={styles.actionBtn}><Calendar size={13} /> Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
