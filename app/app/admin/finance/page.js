'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/appContext'
import { getFinances, createFinanceEntry, deleteFinanceEntry } from '@/lib/services/finance'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import Table from '@/components/Table'
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2, AlertCircle } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function FinancePage() {
  const { profile } = useApp()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [form, setForm] = useState({ transaction_type: 'income', category: '', amount: '', description: '', transaction_date: new Date().toISOString().split('T')[0] })
  const sid = profile?.school_id

  const load = useCallback(async () => {
    if (!sid) return
    setLoading(true)
    try { setEntries(await getFinances(sid, typeFilter ? { type: typeFilter } : {}) || []) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [sid, typeFilter])

  useEffect(() => { load() }, [load])

  const totalIncome = entries.filter(e => e.transaction_type === 'income').reduce((s, e) => s + Number(e.amount), 0)
  const totalExpense = entries.filter(e => e.transaction_type === 'expense').reduce((s, e) => s + Number(e.amount), 0)
  const net = totalIncome - totalExpense
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await createFinanceEntry({ ...form, school_id: sid, amount: parseFloat(form.amount), recorded_by: profile.id })
      setModalOpen(false); load()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return
    try { await deleteFinanceEntry(id); load() } catch (err) { alert(err.message) }
  }

  const columns = [
    { key: 'type', label: 'Type', render: r => <span className={`badge ${r.transaction_type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.transaction_type}</span> },
    { key: 'category', label: 'Category', render: r => r.category || '—' },
    { key: 'description', label: 'Description', render: r => r.description || '—' },
    { key: 'amount', label: 'Amount', render: r => <span className={`font-semibold ${r.transaction_type === 'income' ? 'text-green-700' : 'text-red-700'}`}>{r.transaction_type === 'expense' ? '-' : '+'}{formatCurrency(r.amount)}</span> },
    { key: 'transaction_date', label: 'Date', render: r => formatDate(r.transaction_date) },
    { key: 'recorded_by', label: 'By', render: r => r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name}` : '—' },
    { key: 'actions', label: '', render: r => <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button> }
  ]

  if (profile?.role !== 'admin') return <div className="p-6 text-gray-500">Access denied.</div>

  return (
    <div className="p-6">
      <PageHeader title="Finance Ledger" subtitle="Track income and expenses"
        actions={<button onClick={() => { setForm({ transaction_type: 'income', category: '', amount: '', description: '', transaction_date: new Date().toISOString().split('T')[0] }); setError(''); setModalOpen(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Entry</button>} />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4"><div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-green-500" /><span className="text-sm text-gray-500">Total Income</span></div><p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p></div>
        <div className="card p-4"><div className="flex items-center gap-2 mb-2"><TrendingDown className="w-5 h-5 text-red-500" /><span className="text-sm text-gray-500">Total Expenses</span></div><p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p></div>
        <div className="card p-4"><div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5 text-blue-500" /><span className="text-sm text-gray-500">Net Balance</span></div><p className={`text-2xl font-bold ${net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(net)}</p></div>
      </div>
      <div className="flex gap-3 mb-4"><select className="input w-40" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="">All Types</option><option value="income">Income</option><option value="expense">Expense</option></select></div>
      <div className="card"><Table columns={columns} data={entries} loading={loading} emptyMessage="No entries." /></div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Finance Entry">
        {error && <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Type *</label><select className="input" value={form.transaction_type} onChange={e => set('transaction_type', e.target.value)}><option value="income">Income</option><option value="expense">Expense</option></select></div>
            <div><label className="label">Category</label><input className="input" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Fees, Salaries" /></div>
          </div>
          <div><label className="label">Amount (ZMW) *</label><input className="input" type="number" step="0.01" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} required /></div>
          <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></div>
          <div><label className="label">Date *</label><input className="input" type="date" value={form.transaction_date} onChange={e => set('transaction_date', e.target.value)} required /></div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Entry'}</button></div>
        </form>
      </Modal>
    </div>
  )
}
