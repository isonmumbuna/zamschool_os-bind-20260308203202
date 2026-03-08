'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/appContext'
import { supabase } from '@/lib/supabase'
import { getParentStudents } from '@/lib/services/users'
import { getAttendance } from '@/lib/services/attendance'
import PageHeader from '@/components/PageHeader'
import { formatDate, STATUS_COLORS } from '@/lib/utils'

export default function ParentAttendance() {
  const { profile } = useApp()
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState('')
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const sid = profile?.school_id

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('parents').select('id').eq('profile_id', profile.id).single().then(({ data }) => {
      if (!data) { setLoading(false); return }
      getParentStudents(data.id).then(ch => {
        setChildren(ch || [])
        if (ch?.length === 1) setSelectedChild(ch[0].students.id)
        setLoading(false)
      })
    })
  }, [profile])

  const loadAttendance = useCallback(async () => {
    if (!selectedChild) return
    const data = await getAttendance(sid, { studentId: selectedChild })
    setAttendance(data || [])
  }, [selectedChild, sid])

  useEffect(() => { loadAttendance() }, [loadAttendance])

  return (
    <div className="p-6">
      <PageHeader title="Attendance" subtitle="View your children's attendance records" />
      <div className="mb-4">
        <select className="input w-64" value={selectedChild} onChange={e => setSelectedChild(e.target.value)}>
          <option value="">Select child</option>
          {children.map(c => <option key={c.students.id} value={c.students.id}>{c.students?.profiles?.first_name} {c.students?.profiles?.last_name}</option>)}
        </select>
      </div>
      {selectedChild && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="table-th">Date</th><th className="table-th">Session</th><th className="table-th">Status</th><th className="table-th">Remarks</th></tr></thead>
            <tbody>
              {attendance.length === 0
                ? <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No attendance records found.</td></tr>
                : attendance.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="table-td">{formatDate(r.attendance_date)}</td>
                    <td className="table-td text-gray-500">{r.session_name}</td>
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
