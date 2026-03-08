'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/lib/appContext'
import { supabase } from '@/lib/supabase'
import { getResults } from '@/lib/services/results'
import PageHeader from '@/components/PageHeader'
import { formatDate } from '@/lib/utils'
import { Award } from 'lucide-react'

export default function StudentResults() {
  const { profile } = useApp()
  const [results, setResults] = useState([])
  const [studentRow, setStudentRow] = useState(null)
  const [loading, setLoading] = useState(true)
  const sid = profile?.school_id

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      const { data: student } = await supabase.from('students').select('id').eq('profile_id', profile.id).single()
      if (!student) { setLoading(false); return }
      setStudentRow(student)
      const data = await getResults(sid, { studentId: student.id })
      setResults(data || [])
      setLoading(false)
    }
    load()
  }, [profile, sid])

  const getGradeColor = (grade) => {
    if (!grade) return 'bg-gray-100 text-gray-600'
    if (grade.startsWith('A')) return 'bg-green-100 text-green-700'
    if (grade === 'B') return 'bg-blue-100 text-blue-700'
    if (grade === 'C') return 'bg-yellow-100 text-yellow-700'
    if (grade === 'D') return 'bg-orange-100 text-orange-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="p-6">
      <PageHeader title="My Results" subtitle="Academic performance history" />
      {loading ? <div className="card p-8 text-center text-gray-400">Loading...</div>
        : results.length === 0 ? <div className="card p-12 text-center text-gray-400"><Award className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No results available yet.</p></div>
        : (
          <div className="space-y-3">
            {results.map(r => {
              const source = r.exams || r.assignments
              const sourceName = r.exams ? 'Exam' : 'Assignment'
              return (
                <div key={r.id} className="card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0"><Award className="w-5 h-5 text-brand-600" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{source?.title}</p>
                    <p className="text-sm text-gray-500">{sourceName} · {source?.subjects?.name} · {formatDate(r.exams?.exam_date || r.assignments?.due_date)}</p>
                    {r.remarks && <p className="text-xs text-gray-500 mt-1 italic">"{r.remarks}"</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900">{r.score ?? '—'}<span className="text-sm text-gray-400 font-normal"> / {source?.total_marks}</span></p>
                    {r.grade && <span className={`badge ${getGradeColor(r.grade)}`}>{r.grade}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </div>
  )
}
