'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/appContext'
import { getSubjects, createSubject, updateSubject, deleteSubject } from '@/lib/services/subjects'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import Table from '@/components/Table'
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function SubjectsPage() {
  const { profile } = useApp()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const sid = profile?.school_id

  const load = useCallback(async () => {
    if (!sid) return
    setLoading(true)
    try { setSubjects(await getSubjects(sid) || []) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [sid])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setForm({ name: '', code: '', description: '' }); setError(''); setModalOpen(true) }
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, code: s.code, description: s.description || '' }); setError(''); setModalOpen(true) }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editing) await updateSubject(editing.id, form)
      else await createSubject({ ...form, school_id: sid })
      setModalOpen(false); load()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject?')) return
    try { await deleteSubject(id); load() } catch (err) { alert(err.message) }
  }

  const columns = [
    { key: 'name', label: 'Subject Name', render: r => <span className="font-medium">{r.name}</span> },
    { key: 'code', label: 'Code', render: r => <span className="badge bg-gray-100 text-gray-700">{r.code}</span> },
    { key: 'description', label: 'Description', render: r => r.description || '—' },
    { key: 'created_at', label: 'Created', render: r => formatDate(r.created_at) },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    )}
  ]

  if (profile?.role !== 'admin') return <div className="p-6 text-gray-500">Access denied.</div>

  return (
    <div className="p-6">
      <PageHeader title="Subjects" subtitle="Manage academic subjects" actions={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Subject</button>} />
      <div className="card"><Table columns={columns} data={subjects} loading={loading} emptyMessage="No subjects yet." /></div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Subject' : 'New Subject'}>
        {error && <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Subject Name *</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Mathematics" /></div>
            <div><label className="label">Code *</label><input className="input" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} required placeholder="MATH" /></div>
          </div>
          <div><label className="label">Description</label><textarea className="input resize-none" rows={3} value={form.description} onChange={e => set('description', e.target.value)} /></div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
    </div>
  )
}
