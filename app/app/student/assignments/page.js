'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/lib/appContext'
import { supabase } from '@/lib/supabase'
import { getAssignments } from '@/lib/services/assignments'
import PageHeader from '@/components/PageHeader'
import { formatDate } from '@/lib/utils'
import { ClipboardList, AlertCircle } from 'lucide-react'

export default function StudentAssignments() {
  const { profile } = useApp()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const sid = profile?.school_id
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      const { data: student } = await supabase.from('students').select('class_id').eq('profile_id', profile.id).single()
      if (!student?.class_id) { setLoading(false); return }
      const data = await getAssignments(sid, { classId: student.class_id })
      setAssignments(data || [])
      setLoading(false)
    }
    load()
  }, [profile, sid])

  const filtered = assignments.filter(a => {
    if (filter === 'upcoming') return a.due_date >= today
    if (filter === 'overdue') return a.due_date < today
    return true
  })

  return (
    <div className="p-6">
      <PageHeader title="Assignments" subtitle="Your coursework and deadlines" />
      <div className="flex gap-2 mb-4">
        {['all', 'upcoming', 'overdue'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === f ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {loading ? <div className="card p-8 text-center text-gray-400">Loading...</div>
        : filtered.length === 0 ? <div className="card p-12 text-center text-gray-400"><ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No assignments found.</p></div>
        : (
          <div className="space-y-3">
            {filtered.map(a => {
              const overdue = a.due_date < today
              return (
                <div key={a.id} className="card p-4 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${overdue ? 'bg-red-100' : 'bg-brand-50'}`}>
                    {overdue ? <AlertCircle className="w-5 h-5 text-red-500" /> : <ClipboardList className="w-5 h-5 text-brand-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{a.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{a.subjects?.name} · {a.classes?.name}</p>
                    {a.description && <p className="text-sm text-gray-600 mt-1">{a.description}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-gray-700'}`}>Due: {formatDate(a.due_date)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.total_marks} marks</p>
                    {overdue && <span className="badge bg-red-100 text-red-700 mt-1">Overdue</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </div>
  )
}
