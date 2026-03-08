'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/appContext'
import { getAuditLogs } from '@/lib/services/audit'
import PageHeader from '@/components/PageHeader'
import Table from '@/components/Table'
import { Search } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function AuditPage() {
  const { profile } = useApp()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const sid = profile?.school_id

  const load = useCallback(async () => {
    if (!sid) return
    setLoading(true)
    try { setLogs(await getAuditLogs(sid, actionFilter ? { action: actionFilter } : {}) || []) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [sid, actionFilter])

  useEffect(() => { load() }, [load])

  const filtered = logs.filter(l => !search || JSON.stringify(l).toLowerCase().includes(search.toLowerCase()))

  const columns = [
    { key: 'created_at', label: 'Time', render: r => <span className="text-xs font-mono text-gray-500">{formatDateTime(r.created_at)}</span> },
    { key: 'action', label: 'Action', render: r => <span className="badge bg-brand-50 text-brand-700">{r.action}</span> },
    { key: 'resource_type', label: 'Resource', render: r => <span className="badge bg-gray-100 text-gray-700">{r.resource_type}</span> },
    { key: 'resource_id', label: 'Resource ID', render: r => <span className="text-xs font-mono text-gray-400">{r.resource_id?.slice(0, 8)}...</span> },
    { key: 'details', label: 'Details', render: r => <span className="text-xs text-gray-500 max-w-xs truncate block">{JSON.stringify(r.details)}</span> }
  ]

  if (profile?.role !== 'admin') return <div className="p-6 text-gray-500">Access denied.</div>

  return (
    <div className="p-6">
      <PageHeader title="Audit Logs" subtitle="Monitor all sensitive actions in your school" />
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input className="input pl-9" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="input w-44" value={actionFilter} onChange={e => setActionFilter(e.target.value)}><option value="">All Actions</option><option value="create">Create</option><option value="update">Update</option><option value="delete">Delete</option></select>
      </div>
      <div className="card"><Table columns={columns} data={filtered} loading={loading} emptyMessage="No audit logs found." /></div>
    </div>
  )
}
