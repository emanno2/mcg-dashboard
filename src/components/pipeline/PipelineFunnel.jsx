import { Card, CardHeader, GhostButton } from '../ui'
import { PIPELINE_STAGES } from '../../data/mockData'
import { GitBranch } from 'lucide-react'
import styles from './PipelineFunnel.module.css'

const MAX = Math.max(...PIPELINE_STAGES.map(s => s.count))

export default function PipelineFunnel() {
  return (
    <Card>
      <CardHeader
        title="Pipeline"
        icon={GitBranch}
        action={<GhostButton>Details</GhostButton>}
      />
      <div className={styles.stages}>
        {PIPELINE_STAGES.map((stage, i) => (
          <div
            key={stage.id}
            className={styles.row}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className={styles.dot} style={{ background: stage.color }} />
            <span className={styles.label}>{stage.label}</span>
            <div className={styles.barTrack}>
              <div
                className={styles.bar}
                style={{
                  width: `${(stage.count / MAX) * 100}%`,
                  background: stage.color,
                  opacity: 0.7,
                }}
              />
            </div>
            <span
              className={styles.count}
              style={{ color: stage.id === 'won' ? 'var(--success-text)' : 'var(--text-secondary)' }}
            >
              {stage.count}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
