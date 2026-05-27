import { MapPin, Clock } from 'lucide-react'
import { Card, CardHeader, Badge, Avatar, GhostButton } from '../ui'
import { LEADS } from '../../data/mockData'
import styles from './LeadList.module.css'
import { Users } from 'lucide-react'

export default function LeadList() {
  return (
    <Card>
      <CardHeader
        title="Active Leads"
        icon={Users}
        action={<GhostButton>View all</GhostButton>}
      />
      <div className={styles.list}>
        {LEADS.map((lead, i) => (
          <div
            key={lead.id}
            className={styles.item}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <Avatar initials={lead.initials} color={lead.avatarColor} size="md" />
            <div className={styles.info}>
              <div className={styles.name}>{lead.name}</div>
              <div className={styles.meta}>
                <MapPin size={10} strokeWidth={2} />
                {lead.service} · {lead.address}
              </div>
            </div>
            <div className={styles.right}>
              <Badge variant={lead.stageVariant}>{lead.stageLabel}</Badge>
              <div className={styles.time}>
                <Clock size={10} strokeWidth={2} />
                {lead.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
