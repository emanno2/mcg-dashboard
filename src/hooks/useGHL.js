import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchOpportunities,
  fetchContacts,
  fetchAppointments,
  fetchRecentConversations,
  fetchPipelines,
  fetchCalendars,
  createAppointment,
} from '../lib/ghl'

export { createAppointment }

export function useAsync(fn, { deps = [], autoRefreshMs = null } = {}) {
  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshing,  setRefreshing]  = useState(false)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const run = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else          setLoading(true)
    setError(null)
    try {
      const result = await fnRef.current()
      setData(result)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { run(false) }, deps)

  useEffect(() => {
    if (!autoRefreshMs) return
    const id = setInterval(() => run(false), autoRefreshMs)
    return () => clearInterval(id)
  }, [autoRefreshMs, run])

  const refresh = useCallback(() => run(true), [run])
  return { data, loading, error, refreshing, lastUpdated, refresh }
}

// Week-aware appointments hook — re-fetches when weekOffset changes
export function useAppointments(weekOffset = 0) {
  const { start, end } = getWeekRange(weekOffset)
  return useAsync(
    () => fetchAppointments(start, end),
    { deps: [weekOffset], autoRefreshMs: 60000 }
  )
}

export function usePJOpportunities(opts = {}) {
  return useAsync(
    () => fetchOpportunities({ pipelineName: 'Sales Pipeline', limit: 100 }),
    { autoRefreshMs: 60000, ...opts }
  )
}

export function useOpportunities(opts = {}) {
  return useAsync(
    () => fetchOpportunities({ limit: 100 }),
    { autoRefreshMs: 60000, ...opts }
  )
}

export function useContacts(opts = {}) {
  return useAsync(() => fetchContacts(100), { autoRefreshMs: 60000, ...opts })
}

export function useConversations(opts = {}) {
  return useAsync(() => fetchRecentConversations(20), { autoRefreshMs: 60000, ...opts })
}

export function usePipelines(opts = {}) {
  return useAsync(() => fetchPipelines(), opts)
}

export function useCalendars(opts = {}) {
  return useAsync(() => fetchCalendars(), opts)
}

// ─── UTIL ─────────────────────────────────────────────────────────────────────
export function getWeekRange(offset = 0) {
  const now    = new Date()
  const dow    = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday, end: sunday }
}

export function getWeekDays(offset = 0) {
  const { start } = getWeekRange(offset)
  const dayNames  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const today     = new Date().toDateString()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return {
      date:    d.toISOString().split('T')[0],
      label:   dayNames[d.getDay()],
      full:    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      today:   d.toDateString() === today,
      dayNum:  d.getDate(),
    }
  })
}
