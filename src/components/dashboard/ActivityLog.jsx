import { MessageSquare, Check, Bell, Calendar, Image, Zap, Star } from 'lucide-react'
import { Card, CardHeader, LiveDot } from '../ui'
import { ACTIVITY_LOG } from '../../data/mockData'
import styles from './ActivityLog.module.css'

const ICONS = {
  message:  MessageSquare,
  check:    Check,
  bell:     Bell,
  calendar: Calendar,
  image:    Image,
  spark:    Zap,
  star:     Star,
}

export default function ActivityLog() {
  return (
    <Card>
      <CardHeader
        title="AI Activity"
        icon={Zap}
        action={
          <span className={styles.liveRow}>
            <LiveDot />
            <span className={styles.liveLabel}>Live</span>
          </span>
        }
      />
      <div className={styles.log}>
        {ACTIVITY_LOG.map((entry, i) => {
          const Icon = ICONS[entry.icon] || Zap
          return (
            <div key={entry.id} className={styles.line} style={{ animationDelay: `${i * 35}ms` }}>
              <div className={styles.iconWrap}>
                <Icon size={11} strokeWidth={2} />
              </div>
              <span className={styles.time}>{entry.time}</span>
              <span className={styles.msg}>
                {entry.text && <>{entry.text} </>}
                <span className={styles.highlight}>{entry.highlight}</span>
                {entry.suffix && <> {entry.suffix}</>}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
