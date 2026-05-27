import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import PhotosPage from './pages/Photos'
import LeadsPage from './pages/Leads'
import PipelinePage from './pages/Pipeline'
import SchedulePage from './pages/Schedule'
import SettingsPage from './pages/Settings'
import ApprovalsPage from './pages/Approvals'
import styles from './App.module.css'

const PAGES = {
  dashboard:  Dashboard,
  leads:      LeadsPage,
  pipeline:   PipelinePage,
  approvals:  ApprovalsPage,
  schedule:   SchedulePage,
  photos:     PhotosPage,
  settings:   SettingsPage,
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const Page = PAGES[activeTab] || Dashboard

  return (
    <div className={styles.layout}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className={styles.main}>
        <Page key={activeTab} />
      </main>
    </div>
  )
}
