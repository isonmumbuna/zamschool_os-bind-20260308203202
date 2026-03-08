'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/appContext'
import { getAnnouncements, createAnnouncement, deleteAnnouncement, markAnnouncementSeen } from '@/lib/services/announcements'
import { getClasses } from '@/lib/services/classes'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import { Plus, Trash2, Bell, AlertCircle } from 'lucide-react'
import { formatDate, STATUS_COLORS } from '@/lib/utils'

export default function AnnouncementsPage() {
  const { profile } = useApp()
  const [announcements, setAnnouncements] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', content: '', audience: 'all', priority: 'normal', status: 'live', publish_at: new Date().toISOString().slice(0, 16), expires_at: '', target_class_id: '' })
  const sid = profile?.school_id
  const canCreate = ['admin', 'teacher'].includes(profile?.role)

  const load = useCallback(async () => {
    if (!sid) return
    setLoading(true)
    try {
      const [ann, cls] = await Promise.all([getAnnouncements(sid), canCreate ? getClasses(sid) : Promise.resolve([])])
      setAnnouncements(ann || [])
      setClasses(cls || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [sid, canCreate])

  useEffect(() => { load() }, [load])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await createAnnouncement({ ...form, school_id: sid, created_by: profile.id, publish_at: form.publish_at || new Date().toISOString(), expires_at: form.expires_at || null, target_class_id: form.target_class_id || null })
      setModalOpen(false); load()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return
    try { await deleteAnnouncement(id); load() } catch (err) { alert(err.message) }
  }

  const handleOpen = async (ann) => {
    await markAnnouncementSeen(ann.id, profile.id).catch(() => {})
  }

  return (
    <div className="p-6">
      <PageHeader title="Announcements" subtitle="School notices and communications"
        actions={canCreate ? <button onClick={() => { setForm({ title: '', content: '', audience: 'all', priority: 'normal', status: 'live', publish_at: new Date().toISOString().slice(0, 16), expires_at: '', target_class_id: '' }); setError(''); setModalOpen(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Create</button> : null} />

      {loading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card p-5 h-24 animate-pulse" />)}</div>
        : announcements.length === 0 ? <div className="card p-12 text-center text-gray-400"><Bell className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No announcements yet.</p></div>
        : (
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className="card p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpen(a)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${a.priority === 'urgent' ? 'bg-red-500' : 'bg-brand-400'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900">{a.title}</h3>
                        <span className={`badge ${STATUS_COLORS[a.priority] || STATUS_COLORS.normal}`}>{a.priority}</span>
                        <span className={`badge ${STATUS_COLORS[a.status] || STATUS_COLORS.live}`}>{a.status}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{a.content}</p>
                      <p className="text-xs text-gray-400 mt-2">{a.profiles?.first_name} {a.profiles?.last_name} · {formatDate(a.publish_at)} · For: {a.audience}</p>
                    </div>
                  </div>
                  {canCreate && (
                    <button onClick={e => { e.stopPropagation(); handleDelete(a.id) }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Announcement">
        {error && <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => set('title', e.target.value)} required /></div>
          <div><label className="label">Content *</label><textarea className="input resize-none" rows={4} value={form.content} onChange={e => set('content', e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Audience</label><select className="input" value={form.audience} onChange={e => set('audience', e.target.value)}><option value="all">All</option><option value="students">Students</option><option value="parents">Parents</option><option value="teachers">Teachers</option></select></div>
            <div><label className="label">Priority</label><select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}><option value="normal">Normal</option><option value="urgent">Urgent</option><option value="info">Info</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Publish At</label><input className="input" type="datetime-local" value={form.publish_at} onChange={e => set('publish_at', e.target.value)} /></div>
            <div><label className="label">Expires At</label><input className="input" type="datetime-local" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} /></div>
          </div>
          <div><label className="label">Target Class (optional)</label><select className="input" value={form.target_class_id} onChange={e => set('target_class_id', e.target.value)}><option value="">All classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Publishing...' : 'Publish'}</button></div>
        </form>
      </Modal>
    </div>
  )
}
