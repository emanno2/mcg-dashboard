import styles from './LoadingState.module.css'

export function LoadingState({ message = 'Loading from GoHighLevel...' }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.spinner} />
      <span className={styles.msg}>{message}</span>
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className={styles.errorWrap}>
      <div className={styles.errorIcon}>!</div>
      <div className={styles.errorTitle}>Failed to load from GoHighLevel</div>
      <div className={styles.errorMsg}>{error}</div>
      {onRetry && (
        <button className={styles.retryBtn} onClick={onRetry}>Try again</button>
      )}
    </div>
  )
}

export function EmptyState({ title = 'No data yet', desc = '' }) {
  return (
    <div className={styles.emptyWrap}>
      <div className={styles.emptyTitle}>{title}</div>
      {desc && <div className={styles.emptyDesc}>{desc}</div>}
    </div>
  )
}
