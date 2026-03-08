'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/appContext'
import { supabase } from '@/lib/supabase'
import { recordAttendanceBulk, getAttendance } from '@/lib/services/attendance'
import PageHeader from '@/components/PageHeader'
import { Save, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { formatDate, STATUS_COLORS } from '@/lib/utils'

const STATUSES = ['present', 'absent', 'late', 'excused']
const STATUS_ICONS = { present: CheckCircle, absent: XCircle, late: Clock, excused: AlertCircle }

export default function TeacherAttendance() {
  const { profile } = useApp()
  const [teacherRow, setTeacherRow] = useState(null)
  const [myClasses, setMyClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState([])
  const [attendanceMap, setAttendanceMap] = useState({})
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('roll-call')
  const sid = profile?.school_id

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('teachers').select('id').eq('profile_id', profile.id).single().then(({ data }) => {
      if (!data) return
      setTeacherRow(data)
      supabase.from('class_subjects').select('classes(id, name, grade_level)').eq('teacher_id', data.id).then(({ data: cs }) => {
        const unique = []
        const seen = new Set()
        cs?.forEach(r => { if (r.classes && !seen.has(r.classes.id)) { seen.add(r.classes.id); unique.push(r.classes) } })
        setMyClasses(unique)
        if (unique.length === 1) setSelectedClass(unique[0].id)
      })
    })
  }, [profile])

  const loadStudents = useCallback(async () => {
    if (!selectedClass || !sid) return
    setLoading(true)
    try {
      const { data: studs } = await supabase.from('students').select('id, student_number, profiles(first_name, last_name)').eq('class_id', selectedClass).eq('school_id', sid).eq('is_active', true).order('student_number')
      setStudents(studs || [])
      const initMap = {}
      studs?.forEach(s => { initMap[s.id] = { status: 'present', remarks: '' } })
      const { data: existing } = await supabase.from('attendance').select('student_id, status, remarks').eq('class_id', selectedClass).eq('attendance_date', selectedDate).eq('school_id', sid)
      existing?.forEach(r => { if (initMap[r.student_id]) initMap[r.student_id] = { status: r.status, remarks: r.remarks || '' } })
      setAttendanceMap(initMap)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [selectedClass, selectedDate, sid])

  useEffect(() => { loadStudents() }, [loadStudents])

  const loadHistory = useCallback(async () => {
    if (!selectedClass || !sid) return
    const hist = await getAttendance(sid, { classId: selectedClass })
    setHistory(hist || [])
  }, [selectedClass, sid])

  useEffect(() => { if (activeTab === 'history') loadHistory() }, [activeTab, loadHistory])

  const setStatus = (id, status) => setAttendanceMap(m => ({ ...m, [id]: { ...m[id], status } }))
  const setRemarks = (id, remarks) => setAttendanceMap(m => ({ ...m, [id]: { ...m[id], remarks } }))

  const handleSave = async () => {
    if (!teacherRow || !selectedClass) return
    setSaving(true)
    try {
      const rows = students.map(s => ({ student_id: s.id, status: attendanceMap[s.id]?.status || 'present', remarks: attendanceMap[s.id]?.remarks || null }))
      await recordAttendanceBulk(sid, selectedClass, selectedDate, 'Morning Roll Call', rows, profile.id)
      alert('Attendance saved successfully!')
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  const summary = Object.values(attendanceMap).reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc }, {})

  return (
    <div className="p-6">
      <PageHeader title="Attendance" subtitle="Record daily student attendance" />
      <div className="flex gap-2 mb-4">
        {['roll-call', 'history'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === t ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t === 'roll-call' ? 'Roll Call' : 'History'}
          </button>
        ))}
      </div>

      {activeTab === 'roll-call' && (
        <>
          <div className="flex flex-wrap gap-3 mb-5">
            <select className="input w-48" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">Select class</option>
              {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="input w-44" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>
          {selectedClass && (
            <>
              <div className="flex gap-3 mb-4 flex-wrap">
                {STATUSES.map(s => <div key={s} className={`badge ${STATUS_COLORS[s]}`}>{s}: {summary[s] || 0}</div>)}
              </div>
              <div className="card">
                {loading ? <div className="p-8 text-center text-gray-400">Loading students...</div>
                  : students.length === 0 ? <div className="p-8 text-center text-gray-400">No students in this class.</div>
                  : (
                    <>
                      <div className="divide-y divide-gray-100">
                        {students.map(s => {
                          const att = attendanceMap[s.id] || { status: 'present', remarks: '' }
                          return (
                            <div key={s.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                              <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
                                {(s.profiles?.first_name?.[0] || '') + (s.profiles?.last_name?.[0] || '')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm">{s.profiles?.first_name} {s.profiles?.last_name}</p>
                                <p className="text-xs text-gray-400">{s.student_number}</p>
                              </div>
                              <div className="flex gap-1">
                                {STATUSES.map(st => {
                                  const Icon = STATUS_ICONS[st]
                                  return (
                                    <button key={st} onClick={() => setStatus(s.id, st)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${att.status === st ? STATUS_COLORS[st] + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                      <Icon className="w-3 h-3" />{st}
                                    </button>
                                  )
                                })}
                              </div>
                              <input className="input text-xs w-40" placeholder="Remarks..." value={att.remarks} onChange={e => setRemarks(s.id, e.target.value)} />
                            </div>
                          )
                        })}
                      </div>
                      <div className="p-4 border-t border-gray-100">
                        <button onClick={handleSave} disabled={saving} className="btn-primary"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Attendance'}</button>
                      </div>
                    </>
                  )}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="table-th">Student</th><th className="table-th">Class</th><th className="table-th">Date</th><th className="table-th">Status</th><th className="table-th">Remarks</th></tr></thead>
            <tbody>
              {history.length === 0
                ? <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No attendance records</td></tr>
                : history.slice(0, 100).map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="table-td font-medium">{r.students?.profiles?.first_name} {r.students?.profiles?.last_name}</td>
                    <td className="table-td">{r.classes?.name}</td>
                    <td className="table-td">{formatDate(r.attendance_date)}</td>
                    <td className="table-td"><span className={`badge ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                    <td className="table-td text-gray-500">{r.remarks || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
