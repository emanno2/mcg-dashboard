import { Calendar } from 'lucide-react'
import { Card, CardHeader, Badge, GhostButton } from '../ui'
import { SCHEDULE } from '../../data/mockData'
import styles from './ScheduleWidget.module.css'

export default function ScheduleWidget() {
  return (
    <Card>
      <CardHeader
        title="Upcoming Estimates"
        icon={Calendar}
        action={<GhostButton>Calendar</GhostButton>}
      />
      <div className={styles.list}>
        {SCHEDULE.map((item, i) => (
          <div key={item.id} className={styles.item} style={{ animationDelay: `${i * 40}ms` }}>
            <div className={styles.dayCol}>
              <span
                className={styles.day}
                style={item.day === 'Today' ? { color: 'var(--info-text)', fontWeight: 600 } : {}}
              >
                {item.day}
              </span>
              <span className={styles.time}>{item.time}</span>
            </div>
            <div className={styles.info}>
              <div className={styles.name}>{item.name}</div>
              <div className={styles.service}>{item.service}</div>
            </div>
            <Badge variant={item.variant}>{item.time}</Badge>
          </div>
        ))}
        <div className={styles.openSlots}>
          <span className={styles.openLabel}>3 open slots remaining this week</span>
        </div>
      </div>
    </Card>
  )
}
