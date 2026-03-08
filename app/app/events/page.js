'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/appContext'
import { getEvents, createEvent, updateEvent, deleteEvent } from '@/lib/services/events'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import { Plus, Pencil, Trash2, Calendar, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function EventsPage() {
  const { profile } = useApp()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', location: '', category: 'school', audience: 'all' })
  const sid = profile?.school_id
  const canManage = ['admin', 'teacher'].includes(profile?.role)

  const load = useCallback(async () => {
    if (!sid) return
    setLoading(true)
    try { setEvents(await getEvents(sid) || []) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [sid])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setForm({ title: '', description: '', start_date: '', end_date: '', location: '', category: 'school', audience: 'all' }); setError(''); setModalOpen(true) }
  const openEdit = (e) => { setEditing(e); setForm({ title: e.title, description: e.description || '', start_date: e.start_date, end_date: e.end_date || '', location: e.location || '', category: e.category, audience: e.audience }); setError(''); setModalOpen(true) }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = { ...form, school_id: sid, created_by: profile.id, end_date: form.end_date || null }
      if (editing) await updateEvent(editing.id, payload)
      else await createEvent(payload)
      setModalOpen(false); load()
    } catch (err) { setError(err.message) }\
    finally { setSaving(false) }\
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return
    try { await deleteEvent(id); load() } catch (err) { alert(err.message) }\
  }

  return (
    <div className="p-6">
      <PageHeader title="Events" subtitle="School calendar and important dates"
        actions={canManage ? <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Create Event</button> : null} />

      {loading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card p-5 h-24 animate-pulse" />)}</div>
        : events.length === 0 ? <div className="card p-12 text-center text-gray-400"><Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No events scheduled yet.</p></div>
        : (\n          <div className="space-y-3">\n            {events.map(e => (\n              <div key={e.id} className="card p-5 flex items-start gap-4 hover:shadow-md transition-shadow">\n                <div className="w-12 h-12 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">\n                  <span className="text-brand-600 text-lg font-bold">{new Date(e.start_date).getDate()}</span>\n                </div>\n                <div className="flex-1">\n                  <h3 className="font-semibold text-gray-900">{e.title}</h3>\n                  <p className="text-sm text-gray-500 mt-0.5">{formatDate(e.start_date)}{e.end_date && ` - ${formatDate(e.end_date)}`}{e.location && ` \u00b7 ${e.location}`}</p>\n                  {e.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{e.description}</p>}\n                  <p className="text-xs text-gray-400 mt-2">Category: {e.category} \u00b7 Audience: {e.audience}</p>\n                </div>\n                {canManage && (\n                  <div className="flex gap-1 flex-shrink-0">\n                    <button onClick={() => openEdit(e)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil className="w-4 h-4" /></button>\n                    <button onClick={() => handleDelete(e.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>\n                  </div>\n                )}\n              </div>\n            ))}\n          </div>\n        )}\n\n      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Event' : 'Create Event'}>\n        {error && <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}\n        <form onSubmit={handleSave} className="space-y-4">\n          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => set('title', e.target.value)} required /></div>\n          <div><label className="label">Description</label><textarea className="input resize-none" rows={3} value={form.description} onChange={e => set('description', e.target.value)} /></div>\n          <div className="grid grid-cols-2 gap-3">\n            <div><label className="label">Start Date *</label><input className="input" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} required /></div>\n            <div><label className="label">End Date</label><input className="input" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} /></div>\n          </div>\n          <div><label className="label">Location</label><input className="input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. School Hall, Online" /></div>\n          <div className="grid grid-cols-2 gap-3">\n            <div><label className="label">Category</label><select className="input" value={form.category} onChange={e => set('category', e.target.value)}><option value="school">School</option><option value="academic">Academic</option><option value="sport">Sport</option><option value="social">Social</option></select></div>\n            <div><label className="label">Audience</label><select className="input" value={form.audience} onChange={e => set('audience', e.target.value)}><option value="all">All</option><option value="students">Students</option><option value="parents">Parents</option><option value="teachers">Teachers</option></select></div>\n          </div>\n          <div className="flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button></div>\n        </form>\n      </Modal>\n    </div>\n  )\n}
