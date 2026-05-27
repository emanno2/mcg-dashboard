import clsx from 'clsx'
import styles from './ui.module.css'

export function Badge({ variant = 'neutral', children, size = 'sm' }) {
  return (
    <span className={clsx(styles.badge, styles[`badge--${variant}`], styles[`badge--${size}`])}>
      {children}
    </span>
  )
}

export function Card({ children, className, padding = 'md' }) {
  return (
    <div className={clsx(styles.card, styles[`card--${padding}`], className)}>
      {children}
    </div>
  )
}

export function CardHeader({ title, icon: Icon, action }) {
  return (
    <div className={styles.cardHeader}>
      <span className={styles.cardTitle}>
        {Icon && <Icon size={15} strokeWidth={2} />}
        {title}
      </span>
      {action && <div className={styles.cardAction}>{action}</div>}
    </div>
  )
}

export function GhostButton({ children, onClick, size = 'sm' }) {
  return (
    <button
      className={clsx(styles.ghostBtn, styles[`ghostBtn--${size}`])}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function Avatar({ initials, color, size = 'md' }) {
  return (
    <div
      className={clsx(styles.avatar, styles[`avatar--${size}`])}
      style={{ background: color + '22', color }}
    >
      {initials}
    </div>
  )
}

export function LiveDot() {
  return <span className={styles.liveDot} aria-label="live" />
}
