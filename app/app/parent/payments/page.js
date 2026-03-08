'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/appContext'
import { supabase } from '@/lib/supabase'
import { getParentStudents } from '@/lib/services/users'
import { submitFeePayment, getFeePayments } from '@/lib/services/finance'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import { Plus, AlertCircle } from 'lucide-react'
import { formatDate, formatCurrency, STATUS_COLORS } from '@/lib/utils'

export default function ParentPayments() {
  const { profile } = useApp()
  const [children, setChildren] = useState([])
  const [parentRow, setParentRow] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ student_id: '', amount: '', payment_method: 'cash', reference_number: '', term: '', academic_year: new Date().getFullYear().toString(), notes: '' })
  const sid = profile?.school_id

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('parents').select('id').eq('profile_id', profile.id).single().then(({ data }) => {
      if (!data) { setLoading(false); return }
      setParentRow(data)
      getParentStudents(data.id).then(ch => { setChildren(ch || []); setLoading(false) })
    })
  }, [profile])

  const loadPayments = useCallback(async () => {
    if (!parentRow) return
    const data = await getFeePayments(sid)
    setPayments(data?.filter(p => children.some(c => c.students.id === p.student_id)) || [])
  }, [parentRow, children, sid])

  useEffect(() => { loadPayments() }, [loadPayments])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await submitFeePayment({
        school_id: sid, student_id: form.student_id, parent_id: parentRow.id,
        amount: parseFloat(form.amount), payment_method: form.payment_method,
        reference_number: form.reference_number || null, term: form.term,
        academic_year: form.academic_year, notes: form.notes || null,
        payment_date: new Date().toISOString().split('T')[0], status: 'pending'
      })
      setModalOpen(false); loadPayments()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="p-6">
      <PageHeader title="Payments" subtitle="Submit and track fee payments"
        actions={<button onClick={() => { setForm({ student_id: children[0]?.students.id || '', amount: '', payment_method: 'cash', reference_number: '', term: '', academic_year: new Date().getFullYear().toString(), notes: '' }); setError(''); setModalOpen(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Submit Payment</button>} />
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="table-th">Student</th><th className="table-th">Amount</th><th className="table-th">Term</th><th className="table-th">Method</th><th className="table-th">Date</th><th className="table-th">Status</th></tr></thead>
          <tbody>
            {payments.length === 0
              ? <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No payment records yet.</td></tr>
              : payments.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="table-td font-medium">{p.students?.profiles?.first_name} {p.students?.profiles?.last_name}</td>
                  <td className="table-td font-semibold">{formatCurrency(p.amount)}</td>
                  <td className="table-td">{p.term} · {p.academic_year}</td>
                  <td className="table-td">{p.payment_method}</td>
                  <td className="table-td">{formatDate(p.payment_date)}</td>
                  <td className="table-td"><span className={`badge ${STATUS_COLORS[p.status]}`}>{p.status}</span></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Submit Fee Payment">
        {error && <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Child *</label><select className="input" value={form.student_id} onChange={e => set('student_id', e.target.value)} required><option value="">Select child</option>{children.map(c => <option key={c.students.id} value={c.students.id}>{c.students?.profiles?.first_name} {c.students?.profiles?.last_name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Amount (ZMW) *</label><input className="input" type="number" step="0.01" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} required /></div>
            <div><label className="label">Payment Method *</label><select className="input" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}><option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="mobile_money">Mobile Money</option><option value="cheque">Cheque</option></select></div>
          </div>
          <div><label className="label">Reference Number</label><input className="input" value={form.reference_number} onChange={e => set('reference_number', e.target.value)} placeholder="Receipt or transaction number" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Term *</label><input className="input" value={form.term} onChange={e => set('term', e.target.value)} required placeholder="Term 1, Term 2..." /></div>
            <div><label className="label">Academic Year *</label><input className="input" value={form.academic_year} onChange={e => set('academic_year', e.target.value)} required /></div>
          </div>
          <div><label className="label">Notes</label><textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Submitting...' : 'Submit Payment'}</button></div>
        </form>
      </Modal>
    </div>
  )
}
