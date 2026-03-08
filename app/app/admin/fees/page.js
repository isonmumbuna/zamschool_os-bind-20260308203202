'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/appContext'
import { getFeePayments, updateFeePaymentStatus } from '@/lib/services/finance'
import PageHeader from '@/components/PageHeader'
import Table from '@/components/Table'
import { CheckCircle, XCircle, Clock, Search } from 'lucide-react'
import { formatDate, formatCurrency, STATUS_COLORS } from '@/lib/utils'

export default function FeesPage() {
  const { profile } = useApp()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const sid = profile?.school_id

  const load = useCallback(async () => {
    if (!sid) return
    setLoading(true)
    try { setPayments(await getFeePayments(sid, statusFilter ? { status: statusFilter } : {}) || []) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [sid, statusFilter])

  useEffect(() => { load() }, [load])

  const handleStatus = async (id, status) => {
    try { await updateFeePaymentStatus(id, status); load() } catch (err) { alert(err.message) }
  }

  const filtered = payments.filter(p => {
    if (!search) return true
    const name = `${p.students?.profiles?.first_name} ${p.students?.profiles?.last_name}`.toLowerCase()
    return name.includes(search.toLowerCase()) || (p.reference_number || '').toLowerCase().includes(search.toLowerCase())
  })

  const totals = {
    pending: payments.filter(p => p.status === 'pending').length,
    confirmed: payments.filter(p => p.status === 'confirmed').length,
    totalConfirmed: payments.filter(p => p.status === 'confirmed').reduce((s, p) => s + Number(p.amount), 0)
  }

  const columns = [
    { key: 'student', label: 'Student', render: r => <span className="font-medium">{r.students?.profiles?.first_name} {r.students?.profiles?.last_name}</span> },
    { key: 'amount', label: 'Amount', render: r => <span className="font-semibold">{formatCurrency(r.amount)}</span> },
    { key: 'term', label: 'Term', render: r => `${r.term} · ${r.academic_year}` },
    { key: 'payment_method', label: 'Method' },
    { key: 'reference_number', label: 'Reference', render: r => r.reference_number || '—' },
    { key: 'payment_date', label: 'Date', render: r => formatDate(r.payment_date) },
    { key: 'status', label: 'Status', render: r => <span className={`badge ${STATUS_COLORS[r.status]}`}>{r.status}</span> },
    { key: 'actions', label: 'Actions', render: r => r.status === 'pending' ? (
      <div className="flex gap-1">
        <button onClick={() => handleStatus(r.id, 'confirmed')} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Confirm"><CheckCircle className="w-4 h-4" /></button>
        <button onClick={() => handleStatus(r.id, 'rejected')} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Reject"><XCircle className="w-4 h-4" /></button>
      </div>
    ) : '—' }
  ]

  if (profile?.role !== 'admin') return <div className="p-6 text-gray-500">Access denied.</div>

  return (
    <div className="p-6">
      <PageHeader title="Fee Payments" subtitle="Review and confirm student payment submissions" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4"><p className="text-xs text-gray-500 mb-1">Pending</p><p className="text-2xl font-bold text-yellow-600">{totals.pending}</p></div>
        <div className="card p-4"><p className="text-xs text-gray-500 mb-1">Confirmed</p><p className="text-2xl font-bold text-green-600">{totals.confirmed}</p></div>
        <div className="card p-4"><p className="text-xs text-gray-500 mb-1">Total Confirmed</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.totalConfirmed)}</p></div>
      </div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input className="input pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="input w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">All Status</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="rejected">Rejected</option></select>
      </div>
      <div className="card"><Table columns={columns} data={filtered} loading={loading} emptyMessage="No payment records found." /></div>
    </div>
  )
}
