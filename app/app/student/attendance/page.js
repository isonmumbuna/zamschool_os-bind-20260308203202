'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/lib/appContext'
import { supabase } from '@/lib/supabase'
import { getAttendance, getStudentAttendanceSummary } from '@/lib/services/attendance'
import PageHeader from '@/components/PageHeader'
import { formatDate, STATUS_COLORS } from '@/lib/utils'
import { UserCheck } from 'lucide-react'

export default function StudentAttendance() {
  const { profile } = useApp()
  const [attendance, setAttendance] = useState([])
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, excused: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const sid = profile?.school_id

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      const { data: student } = await supabase.from('students').select('id').eq('profile_id', profile.id).single()
      if (!student) { setLoading(false); return }
      const [att, sum] = await Promise.all([getAttendance(sid, { studentId: student.id }), getStudentAttendanceSummary(student.id, sid)])
      setAttendance(att || [])
      setSummary(sum)
      setLoading(false)
    }
    load()
  }, [profile, sid])

  const pct = (val) => summary.total ? Math.round((val / summary.total) * 100) : 0

  return (
    <div className="p-6">
      <PageHeader title="My Attendance" subtitle="Attendance history and summary" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Present', value: summary.present, pct: pct(summary.present), color: 'text-green-600 bg-green-50' },
          { label: 'Absent', value: summary.absent, pct: pct(summary.absent), color: 'text-red-600 bg-red-50' },
          { label: 'Late', value: summary.late, pct: pct(summary.late), color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Excused', value: summary.excused, pct: pct(summary.excused), color: 'text-blue-600 bg-blue-50' }
        ].map(({ label, value, pct: p, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block ${color}`}>{p}%</p>
          </div>
        ))}
      </div>
      {loading ? <div className="card p-8 text-center text-gray-400">Loading...</div>
        : attendance.length === 0 ? <div className="card p-12 text-center text-gray-400"><UserCheck className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No attendance records yet.</p></div>
        : (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="table-th">Date</th><th className="table-th">Class</th><th className="table-th">Session</th><th className="table-th">Status</th><th className="table-th">Remarks</th></tr></thead>
              <tbody>
                {attendance.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="table-td">{formatDate(r.attendance_date)}</td>
                    <td className="table-td">{r.classes?.name}</td>
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
