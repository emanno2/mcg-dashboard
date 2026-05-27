import { useState } from 'react'
import {
  LayoutDashboard, Users, GitBranch, CheckSquare,
  Calendar, Image, Settings, ChevronRight, Zap
} from 'lucide-react'
import styles from './Sidebar.module.css'
import clsx from 'clsx'

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'leads',      label: 'Leads',       icon: Users,       badge: '14' },
  { id: 'pipeline',   label: 'Pipeline',    icon: GitBranch },
  { id: 'approvals',  label: 'Approvals',   icon: CheckSquare, badge: '4', badgeVariant: 'danger' },
  { id: 'schedule',   label: 'Schedule',    icon: Calendar },
  { id: 'photos',     label: 'Photos',      icon: Image },
  { id: 'settings',   label: 'Settings',    icon: Settings },
]

export default function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Zap size={16} strokeWidth={2.5} />
        </div>
        <div>
          <div className={styles.logoName}>MCG AI</div>
          <div className={styles.logoSub}>Booking System</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV.map(({ id, label, icon: Icon, badge, badgeVariant }) => (
          <button
            key={id}
            className={clsx(styles.navItem, activeTab === id && styles.navItemActive)}
            onClick={() => onTabChange(id)}
          >
            <Icon size={16} strokeWidth={1.8} />
            <span className={styles.navLabel}>{label}</span>
            {badge && (
              <span className={clsx(
                styles.navBadge,
                badgeVariant === 'danger' ? styles.navBadgeDanger : styles.navBadgeNeutral
              )}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.userRow}>
          <div className={styles.userAvatar}>TM</div>
          <div>
            <div className={styles.userName}>Tom Manno</div>
            <div className={styles.userRole}>Owner · MCG</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
