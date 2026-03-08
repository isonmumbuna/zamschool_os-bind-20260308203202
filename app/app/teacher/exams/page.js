'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/appContext'
import { supabase } from '@/lib/supabase'
import { getExams, createExam, updateExam, deleteExam } from '@/lib/services/exams'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import Table from '@/components/Table'
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function TeacherExams() {
  const { profile } = useApp()
  const [exams, setExams] = useState([])
  const [myClasses, setMyClasses] = useState([])
  const [mySubjects, setMySubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', description: '', exam_date: '', start_time: '', duration_minutes: 60, total_marks: 100, class_id: '', subject_id: '' })
  const sid = profile?.school_id

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('teachers').select('id').eq('profile_id', profile.id).single().then(({ data }) => {
      if (!data) { setLoading(false); return }
      supabase.from('class_subjects').select('class_id, subject_id, classes(id, name), subjects(id, name)').eq('teacher_id', data.id).then(({ data: cs }) => {
        const classes = [], subjects = [], seenC = new Set(), seenS = new Set()
        cs?.forEach(r => {
          if (r.classes && !seenC.has(r.classes.id)) { seenC.add(r.classes.id); classes.push(r.classes) }
          if (r.subjects && !seenS.has(r.subjects.id)) { seenS.add(r.subjects.id); subjects.push(r.subjects) }
        })
        setMyClasses(classes); setMySubjects(subjects)
      })
    })
  }, [profile])

  const load = useCallback(async () => {
    if (!sid) return
    setLoading(true)
    try { setExams(await getExams(sid) || []) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [sid])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setForm({ title: '', description: '', exam_date: '', start_time: '', duration_minutes: 60, total_marks: 100, class_id: myClasses[0]?.id || '', subject_id: mySubjects[0]?.id || '' }); setError(''); setModalOpen(true) }
  const openEdit = (e) => { setEditing(e); setForm({ title: e.title, description: e.description || '', exam_date: e.exam_date, start_time: e.start_time || '', duration_minutes: e.duration_minutes, total_marks: e.total_marks, class_id: e.class_id, subject_id: e.subject_id }); setError(''); setModalOpen(true) }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = { ...form, school_id: sid, duration_minutes: parseInt(form.duration_minutes), total_marks: parseInt(form.total_marks), start_time: form.start_time || null }
      if (editing) await updateExam(editing.id, payload)
      else await createExam(payload)
      setModalOpen(false); load()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this exam?')) return
    try { await deleteExam(id); load() } catch (err) { alert(err.message) }
  }

  const columns = [
    { key: 'title', label: 'Title', render: r => <span className="font-medium">{r.title}</span> },
    { key: 'subject', label: 'Subject', render: r => r.subjects?.name || '—' },
    { key: 'class', label: 'Class', render: r => r.classes?.name || '—' },
    { key: 'exam_date', label: 'Date', render: r => formatDate(r.exam_date) },
    { key: 'start_time', label: 'Time', render: r => r.start_time || '—' },
    { key: 'duration_minutes', label: 'Duration', render: r => `${r.duration_minutes} min` },
    { key: 'total_marks', label: 'Marks' },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    )}
  ]

  return (
    <div className="p-6">
      <PageHeader title="Exams" subtitle="Schedule and manage examinations"
        actions={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Schedule Exam</button>} />
      <div className="card"><Table columns={columns} data={exams} loading={loading} emptyMessage="No exams scheduled." /></div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Exam' : 'Schedule Exam'}>
        {error && <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => set('title', e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Class *</label><select className="input" value={form.class_id} onChange={e => set('class_id', e.target.value)} required><option value="">Select class</option>{myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="label">Subject *</label><select className="input" value={form.subject_id} onChange={e => set('subject_id', e.target.value)} required><option value="">Select subject</option>{mySubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Date *</label><input className="input" type="date" value={form.exam_date} onChange={e => set('exam_date', e.target.value)} required /></div>
            <div><label className="label">Start Time</label><input className="input" type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} /></div>
            <div><label className="label">Duration (min)</label><input className="input" type="number" min="1" value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} /></div>
          </div>
          <div><label className="label">Total Marks</label><input className="input" type="number" min="1" value={form.total_marks} onChange={e => set('total_marks', e.target.value)} /></div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Schedule'}</button></div>
        </form>
      </Modal>
    </div>
  )
}
