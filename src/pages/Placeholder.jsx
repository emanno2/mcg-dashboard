import styles from './Placeholder.module.css'

export function ApprovalsPage(){ return <Placeholder title="Approvals" desc="Dedicated approval queue with photo viewer." /> }
export function SettingsPage() { return <Placeholder title="Settings" desc="Service area, pricing rules, AI configuration, integrations." /> }

function Placeholder({ title, desc }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.badge}>Coming soon</div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.desc}>{desc}</p>
    </div>
  )
}
