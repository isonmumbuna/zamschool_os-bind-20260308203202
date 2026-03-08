'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/appContext'
import { getLessons, createLesson, deleteLesson } from '@/lib/services/lessons'
import { getClasses } from '@/lib/services/classes'
import { getSubjects } from '@/lib/services/subjects'
import { getTeachers } from '@/lib/services/users'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import { Plus, Trash2 } from 'lucide-react'
import { DAYS } from '@/lib/utils'

const HOURS = ['07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00']
const COLORS = ['bg-blue-100 text-blue-800','bg-green-100 text-green-800','bg-purple-100 text-purple-800','bg-orange-100 text-orange-800','bg-pink-100 text-pink-800','bg-teal-100 text-teal-800']

export default function AdminTimetable() {
  const { profile } = useApp()
  const [lessons, setLessons] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ class_id: '', subject_id: '', teacher_id: '', day_of_week: 1, start_time: '08:00', end_time: '09:00', title: '' })
  const sid = profile?.school_id

  const load = useCallback(async () => {
    if (!sid) return
    setLoading(true)
    try {
      const [l, cl, sub, tch] = await Promise.all([getLessons(sid, selectedClass ? { classId: selectedClass } : {}), getClasses(sid), getSubjects(sid), getTeachers(sid)])
      setLessons(l || []); setClasses(cl || []); setSubjects(sub || []); setTeachers(tch || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [sid, selectedClass])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await createLesson({ ...form, school_id: sid, day_of_week: parseInt(form.day_of_week), teacher_id: form.teacher_id || null })
      setModalOpen(false); load()
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this lesson?')) return
    try { await deleteLesson(id); load() } catch (err) { alert(err.message) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const getLessonForSlot = (day, time) => lessons.filter(l => l.day_of_week === day && l.start_time && l.start_time.slice(0, 5) === time)
  const subjectColors = {}
  subjects.forEach((s, i) => { subjectColors[s.id] = COLORS[i % COLORS.length] })

  if (profile?.role !== 'admin') return <div className="p-6 text-gray-500">Access denied.</div>

  return (
    <div className="p-6">
      <PageHeader title="Timetable" subtitle="Manage weekly lesson schedule"
        actions={
          <div className="flex items-center gap-2">
            <select className="input w-44" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => { setForm({ class_id: '', subject_id: '', teacher_id: '', day_of_week: 1, start_time: '08:00', end_time: '09:00', title: '' }); setModalOpen(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Lesson</button>
          </div>
        } />

      <div className="card overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="table-th w-20">Time</th>
              {[1,2,3,4,5].map(d => <th key={d} className="table-th">{DAYS[d]}</th>)}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(time => (
              <tr key={time} className="border-b border-gray-50">
                <td className="table-td text-xs text-gray-400 font-mono">{time}</td>
                {[1,2,3,4,5].map(day => {
                  const slot = getLessonForSlot(day, time)
                  return (
                    <td key={day} className="table-td min-w-[120px] align-top py-1">
                      {slot.map(l => (
                        <div key={l.id} className={`rounded-lg px-2 py-1.5 text-xs mb-1 ${subjectColors[l.subject_id] || COLORS[0]}`}>
                          <p className="font-semibold">{l.subjects?.name}</p>
                          <p className="opacity-70">{l.classes?.name}</p>
                          <button onClick={() => handleDelete(l.id)} className="mt-1 opacity-60 hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Lesson">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Class *</label><select className="input" value={form.class_id} onChange={e => set('class_id', e.target.value)} required><option value="">Select class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="label">Subject *</label><select className="input" value={form.subject_id} onChange={e => set('subject_id', e.target.value)} required><option value="">Select subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          </div>
          <div><label className="label">Teacher</label><select className="input" value={form.teacher_id} onChange={e => set('teacher_id', e.target.value)}><option value="">No teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.profiles?.first_name} {t.profiles?.last_name}</option>)}</select></div>
          <div><label className="label">Lesson Title *</label><input className="input" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Algebra" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Day *</label><select className="input" value={form.day_of_week} onChange={e => set('day_of_week', e.target.value)}>{[1,2,3,4,5].map(d => <option key={d} value={d}>{DAYS[d]}</option>)}</select></div>
            <div><label className="label">Start Time</label><select className="input" value={form.start_time} onChange={e => set('start_time', e.target.value)}>{HOURS.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
            <div><label className="label">End Time</label><select className="input" value={form.end_time} onChange={e => set('end_time', e.target.value)}>{HOURS.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
          </div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Adding...' : 'Add Lesson'}</button></div>
        </form>
      </Modal>
    </div>
  )
}
