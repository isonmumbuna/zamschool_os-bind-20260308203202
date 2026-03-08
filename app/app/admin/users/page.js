'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/appContext'
import { getStudents, getTeachers, getParents, updateStudentStatus, updateTeacherStatus, getParentStudents, linkParentStudent, unlinkParentStudent } from '@/lib/services/users'
import { getClasses } from '@/lib/services/classes'
import { getStudents as getAllStudents } from '@/lib/services/users'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import Table from '@/components/Table'
import { Plus, Users, BookOpen, Heart, Search, AlertCircle, Link2, Unlink } from 'lucide-react'
import { formatDate, getInitials, STATUS_COLORS } from '@/lib/utils'

const TABS = ['students', 'teachers', 'parents']

export default function UsersPage() {
  const { profile } = useApp()
  const [tab, setTab] = useState('students')
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [parents, setParents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [selectedParent, setSelectedParent] = useState(null)
  const [parentChildren, setParentChildren] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({})
  const [linkStudentId, setLinkStudentId] = useState('')
  const sid = profile?.school_id

  const load = useCallback(async () => {
    if (!sid) return
    setLoading(true)
    try {
      const [s, t, p, cl] = await Promise.all([getStudents(sid), getTeachers(sid), getParents(sid), getClasses(sid)])
      setStudents(s || []); setTeachers(t || []); setParents(p || []); setClasses(cl || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [sid])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setForm({ role: tab === 'students' ? 'student' : tab === 'teachers' ? 'teacher' : 'parent', first_name: '', last_name: '', email: '', phone: '', gender: '', password: '' })
    setError(''); setModalOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, school_id: sid }) })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to create user')
      setModalOpen(false); load()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const openLinkModal = async (parent) => {
    setSelectedParent(parent)
    const children = await getParentStudents(parent.id)
    setParentChildren(children || [])
    setLinkStudentId('')
    setLinkModalOpen(true)
  }

  const handleLink = async () => {
    if (!linkStudentId) return
    try {
      await linkParentStudent(selectedParent.id, linkStudentId)
      const children = await getParentStudents(selectedParent.id)
      setParentChildren(children || [])
      setLinkStudentId('')
    } catch (err) { alert(err.message) }
  }

  const handleUnlink = async (id) => {
    try {
      await unlinkParentStudent(id)
      const children = await getParentStudents(selectedParent.id)
      setParentChildren(children || [])
    } catch (err) { alert(err.message) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const filterData = (data) => {
    if (!search) return data
    const q = search.toLowerCase()
    return data.filter(r => {
      const p = r.profiles
      return `${p?.first_name} ${p?.last_name} ${p?.email}`.toLowerCase().includes(q)
    })
  }

  const studentCols = [
    { key: 'name', label: 'Student', render: r => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold">{getInitials(r.profiles?.first_name, r.profiles?.last_name)}</div>
        <div><p className="font-medium text-sm">{r.profiles?.first_name} {r.profiles?.last_name}</p><p className="text-xs text-gray-400">{r.profiles?.email}</p></div>
      </div>
    )},
    { key: 'student_number', label: 'Student #' },
    { key: 'class', label: 'Class', render: r => r.classes?.name || '—' },
    { key: 'enrollment_date', label: 'Enrolled', render: r => formatDate(r.enrollment_date) },
    { key: 'status', label: 'Status', render: r => (
      <button onClick={() => updateStudentStatus(r.id, !r.is_active).then(load)} className={`badge ${r.is_active ? STATUS_COLORS.confirmed : STATUS_COLORS.rejected}`}>
        {r.is_active ? 'Active' : 'Inactive'}
      </button>
    )}
  ]

  const teacherCols = [
    { key: 'name', label: 'Teacher', render: r => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-bold">{getInitials(r.profiles?.first_name, r.profiles?.last_name)}</div>
        <div><p className="font-medium text-sm">{r.profiles?.first_name} {r.profiles?.last_name}</p><p className="text-xs text-gray-400">{r.profiles?.email}</p></div>
      </div>
    )},
    { key: 'employee_number', label: 'Employee #' },
    { key: 'department', label: 'Department', render: r => r.department || '—' },
    { key: 'hire_date', label: 'Hired', render: r => formatDate(r.hire_date) },
    { key: 'status', label: 'Status', render: r => <span className={`badge ${r.is_active ? STATUS_COLORS.confirmed : STATUS_COLORS.rejected}`}>{r.is_active ? 'Active' : 'Inactive'}</span> }
  ]

  const parentCols = [
    { key: 'name', label: 'Parent', render: r => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-xs font-bold">{getInitials(r.profiles?.first_name, r.profiles?.last_name)}</div>
        <div><p className="font-medium text-sm">{r.profiles?.first_name} {r.profiles?.last_name}</p><p className="text-xs text-gray-400">{r.profiles?.email}</p></div>
      </div>
    )},
    { key: 'relation_type', label: 'Relation', render: r => r.relation_type || '—' },
    { key: 'phone', label: 'Phone', render: r => r.phone || r.profiles?.phone || '—' },
    { key: 'actions', label: 'Children', render: r => (
      <button onClick={() => openLinkModal(r)} className="btn-secondary py-1 px-2 text-xs"><Link2 className="w-3 h-3" /> Link Children</button>
    )}
  ]

  const colsMap = { students: studentCols, teachers: teacherCols, parents: parentCols }
  const dataMap = { students: filterData(students), teachers: filterData(teachers), parents: filterData(parents) }

  if (profile?.role !== 'admin') return <div className="p-6 text-gray-500">Access denied.</div>

  return (
    <div className="p-6">
      <PageHeader title="Users" subtitle="Manage students, teachers, and parents"
        actions={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add {tab.slice(0, -1)}</button>} />
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {TABS.map(t => {
          const icons = { students: Users, teachers: BookOpen, parents: Heart }
          const Icon = icons[t]
          return (
            <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              <Icon className="w-3.5 h-3.5" />{t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          )
        })}
        <div className="ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9 w-56" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="card"><Table columns={colsMap[tab]} data={dataMap[tab]} loading={loading} emptyMessage={`No ${tab} found.`} /></div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Add ${tab.slice(0, -1)}`}>
        {error && <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First Name *</label><input className="input" value={form.first_name || ''} onChange={e => set('first_name', e.target.value)} required /></div>
            <div><label className="label">Last Name *</label><input className="input" value={form.last_name || ''} onChange={e => set('last_name', e.target.value)} required /></div>
          </div>
          <div><label className="label">Email *</label><input className="input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Phone</label><input className="input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className="label">Gender</label><select className="input" value={form.gender || ''} onChange={e => set('gender', e.target.value)}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></div>
          </div>
          {tab === 'students' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Student Number *</label><input className="input" value={form.student_number || ''} onChange={e => set('student_number', e.target.value)} required /></div>
                <div><label className="label">Class</label><select className="input" value={form.class_id || ''} onChange={e => set('class_id', e.target.value)}><option value="">Select class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              </div>
              <div><label className="label">Enrollment Date</label><input className="input" type="date" value={form.enrollment_date || ''} onChange={e => set('enrollment_date', e.target.value)} /></div>
            </>
          )}
          {tab === 'teachers' && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Employee Number *</label><input className="input" value={form.employee_number || ''} onChange={e => set('employee_number', e.target.value)} required /></div>
              <div><label className="label">Department</label><input className="input" value={form.department || ''} onChange={e => set('department', e.target.value)} /></div>
              <div><label className="label">Specialization</label><input className="input" value={form.specialization || ''} onChange={e => set('specialization', e.target.value)} /></div>
              <div><label className="label">Hire Date</label><input className="input" type="date" value={form.hire_date || ''} onChange={e => set('hire_date', e.target.value)} /></div>
            </div>
          )}
          {tab === 'parents' && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Relation Type</label><select className="input" value={form.relation_type || ''} onChange={e => set('relation_type', e.target.value)}><option value="">Select</option><option value="parent">Parent</option><option value="guardian">Guardian</option><option value="sibling">Sibling</option></select></div>
              <div><label className="label">Occupation</label><input className="input" value={form.occupation || ''} onChange={e => set('occupation', e.target.value)} /></div>
            </div>
          )}
          <div><label className="label">Password *</label><input className="input" type="password" value={form.password || ''} onChange={e => set('password', e.target.value)} required minLength={8} placeholder="Min 8 characters" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create User'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={linkModalOpen} onClose={() => setLinkModalOpen(false)} title={`Children — ${selectedParent?.profiles?.first_name} ${selectedParent?.profiles?.last_name}`}>
        <div className="space-y-4">
          <div className="flex gap-2">
            <select className="input flex-1" value={linkStudentId} onChange={e => setLinkStudentId(e.target.value)}>
              <option value="">Select student to link...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.profiles?.first_name} {s.profiles?.last_name} ({s.student_number})</option>)}
            </select>
            <button onClick={handleLink} disabled={!linkStudentId} className="btn-primary px-3"><Link2 className="w-4 h-4" /></button>
          </div>
          {parentChildren.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">No children linked yet.</p>
            : <div className="space-y-2">{parentChildren.map(pc => (
              <div key={pc.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div><p className="font-medium text-sm">{pc.students?.profiles?.first_name} {pc.students?.profiles?.last_name}</p><p className="text-xs text-gray-400">{pc.students?.student_number} · {pc.students?.classes?.name}</p></div>
                <button onClick={() => handleUnlink(pc.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Unlink className="w-4 h-4" /></button>
              </div>
            ))}</div>}
        </div>
      </Modal>
    </div>
  )
}
