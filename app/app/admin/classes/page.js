'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/appContext'
import { getClasses, createClass, updateClass, deleteClass, getClassSubjects, assignSubjectToClass, removeClassSubject } from '@/lib/services/classes'
import { getSubjects } from '@/lib/services/subjects'
import { getTeachers } from '@/lib/services/users'
import { getSchoolDirectory } from '@/lib/services/profiles'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import Table from '@/components/Table'
import { Plus, Pencil, Trash2, ChevronRight, X, AlertCircle } from 'lucide-react'

export default function ClassesPage() {
  const { profile } = useApp()
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [directory, setDirectory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState(null)
  const [classSubjects, setClassSubjects] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [subjectModalOpen, setSubjectModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', grade_level: '', capacity: 40, supervisor_id: '' })
  const [subjectForm, setSubjectForm] = useState({ subject_id: '', teacher_id: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const sid = profile?.school_id

  const loadAll = useCallback(async () => {
    if (!sid) return
    setLoading(true)
    try {
      const [cls, sub, tch, dir] = await Promise.all([getClasses(sid), getSubjects(sid), getTeachers(sid), getSchoolDirectory(sid, 'teacher')])
      setClasses(cls || []); setSubjects(sub || []); setTeachers(tch || []); setDirectory(dir || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [sid])

  useEffect(() => { loadAll() }, [loadAll])

  const loadClassSubjects = async (classId) => {
    const cs = await getClassSubjects(classId)
    setClassSubjects(cs || [])
  }

  const openCreate = () => { setEditing(null); setForm({ name: '', grade_level: '', capacity: 40, supervisor_id: '' }); setError(''); setModalOpen(true) }
  const openEdit = (cls) => { setEditing(cls); setForm({ name: cls.name, grade_level: cls.grade_level, capacity: cls.capacity, supervisor_id: cls.supervisor_id || '' }); setError(''); setModalOpen(true) }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = { ...form, school_id: sid, grade_level: parseInt(form.grade_level), capacity: parseInt(form.capacity), supervisor_id: form.supervisor_id || null }
      if (editing) await updateClass(editing.id, payload)
      else await createClass(payload)
      setModalOpen(false); loadAll()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this class?')) return
    try { await deleteClass(id); loadAll() } catch (err) { alert(err.message) }
  }

  const selectClass = async (cls) => { setSelectedClass(cls); await loadClassSubjects(cls.id) }

  const handleAssignSubject = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await assignSubjectToClass({ class_id: selectedClass.id, subject_id: subjectForm.subject_id, teacher_id: subjectForm.teacher_id || null })
      setSubjectModalOpen(false); await loadClassSubjects(selectedClass.id)
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'name', label: 'Class Name', render: r => <span className="font-medium">{r.name}</span> },
    { key: 'grade_level', label: 'Grade', render: r => `Grade ${r.grade_level}` },
    { key: 'capacity', label: 'Capacity' },
    { key: 'supervisor', label: 'Supervisor', render: r => r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name}` : '—' },
    { key: 'actions', label: '', render: r => (
      <div className="flex items-center gap-1">
        <button onClick={() => selectClass(r)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"><ChevronRight className="w-4 h-4" /></button>
        <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    )}
  ]

  if (profile?.role !== 'admin') return <div className="p-6 text-gray-500">Access denied.</div>

  return (
    <div className="p-6">
      <PageHeader title="Classes" subtitle="Manage classes and subject assignments"
        actions={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Class</button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card"><Table columns={columns} data={classes} loading={loading} emptyMessage="No classes yet." /></div>
        {selectedClass && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="font-semibold text-gray-900">{selectedClass.name}</h3><p className="text-xs text-gray-400">Grade {selectedClass.grade_level} · Subjects</p></div>
              <div className="flex gap-1">
                <button onClick={() => { setSubjectForm({ subject_id: '', teacher_id: '' }); setSubjectModalOpen(true) }} className="btn-primary py-1.5 text-xs px-3"><Plus className="w-3.5 h-3.5" /> Assign</button>
                <button onClick={() => setSelectedClass(null)} className="p-1.5 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
            </div>
            {classSubjects.length === 0
              ? <p className="text-sm text-gray-400 text-center py-4">No subjects assigned</p>
              : <div className="space-y-2">{classSubjects.map(cs => (
                <div key={cs.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div><p className="text-sm font-medium">{cs.subjects?.name}</p><p className="text-xs text-gray-400">{cs.subjects?.code} · {cs.teachers?.profiles ? `${cs.teachers.profiles.first_name} ${cs.teachers.profiles.last_name}` : 'No teacher'}</p></div>
                  <button onClick={() => removeClassSubject(cs.id).then(() => loadClassSubjects(selectedClass.id))} className="p-1 text-gray-300 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}</div>}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Class' : 'New Class'}>
        {error && <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Class Name *</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Form 3A" /></div>
            <div><label className="label">Grade Level *</label><input className="input" type="number" min="1" max="13" value={form.grade_level} onChange={e => set('grade_level', e.target.value)} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Capacity</label><input className="input" type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)} /></div>
            <div><label className="label">Supervisor</label><select className="input" value={form.supervisor_id} onChange={e => set('supervisor_id', e.target.value)}><option value="">None</option>{directory.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}</select></div>
          </div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>

      <Modal open={subjectModalOpen} onClose={() => setSubjectModalOpen(false)} title="Assign Subject to Class">
        <form onSubmit={handleAssignSubject} className="space-y-4">
          <div><label className="label">Subject *</label><select className="input" value={subjectForm.subject_id} onChange={e => setSubjectForm(f => ({ ...f, subject_id: e.target.value }))} required><option value="">Select subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}</select></div>
          <div><label className="label">Teacher</label><select className="input" value={subjectForm.teacher_id} onChange={e => setSubjectForm(f => ({ ...f, teacher_id: e.target.value }))}><option value="">No teacher assigned</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.profiles?.first_name} {t.profiles?.last_name}</option>)}</select></div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setSubjectModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Assigning...' : 'Assign'}</button></div>
        </form>
      </Modal>
    </div>
  )
}
