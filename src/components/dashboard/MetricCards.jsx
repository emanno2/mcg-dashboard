import { TrendingUp, AlertTriangle } from 'lucide-react'
import styles from './MetricCards.module.css'
import { useContacts, useOpportunities, useAppointments } from '../../hooks/useGHL'

export default function MetricCards() {
  const { data: contacts }     = useContacts()
  const { data: opps }         = useOpportunities()
  const { data: appointments } = useAppointments()

  const totalLeads   = contacts?.length || 0
  const pendingApproval = opps?.filter(o =>
    (o.stageLabel || '').toLowerCase().includes('approv') ||
    (o.stage || '') === 'awaiting_approval'
  ).length || 0
  const booked = opps?.filter(o => o.stage === 'won').length || 0
  const pipelineValue = opps?.reduce((sum, o) => sum + (o.monetaryValue || 0), 0) || 0
  const thisWeekAppts = appointments?.length || 0

  const metrics = [
    {
      label: 'Total Contacts',
      value: totalLeads || '—',
      delta: 'from GoHighLevel',
      deltaPositive: true,
    },
    {
      label: 'Pending Approval',
      value: pendingApproval || '0',
      delta: pendingApproval > 0 ? 'Needs review' : 'All clear',
      deltaWarn: pendingApproval > 0,
      deltaPositive: pendingApproval === 0,
    },
    {
      label: 'Booked Jobs',
      value: booked || '0',
      delta: 'opportunities won',
      deltaPositive: true,
    },
    {
      label: 'Pipeline Value',
      value: pipelineValue > 0 ? `$${(pipelineValue/1000).toFixed(1)}k` : '—',
      delta: `${thisWeekAppts} appts this week`,
      deltaPositive: true,
    },
  ]

  return (
    <div className={styles.grid}>
      {metrics.map((m, i) => (
        <div key={i} className={styles.card} style={{ animationDelay: `${i * 60}ms` }}>
          <div className={styles.label}>{m.label}</div>
          <div className={styles.value}>{m.value}</div>
          <div className={styles.delta}>
            {m.deltaWarn ? (
              <><AlertTriangle size={11} /> <span className={styles.deltaWarn}>{m.delta}</span></>
            ) : (
              <><TrendingUp size={11} className={styles.up} /> <span className={styles.up}>{m.delta}</span></>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
