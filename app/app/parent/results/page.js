'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/appContext'
import { supabase } from '@/lib/supabase'
import { getParentStudents } from '@/lib/services/users'
import { getResults } from '@/lib/services/results'
import PageHeader from '@/components/PageHeader'
import { formatDate } from '@/lib/utils'
import { Award } from 'lucide-react'

export default function ParentResults() {
  const { profile } = useApp()
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState('')
  const [results, setResults] = useState([])
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

  const loadResults = useCallback(async () => {
    if (!selectedChild) return
    const data = await getResults(sid, { studentId: selectedChild })
    setResults(data || [])
  }, [selectedChild, sid])

  useEffect(() => { loadResults() }, [loadResults])

  const getGradeColor = (grade) => {
    if (!grade) return 'bg-gray-100 text-gray-600'
    if (grade.startsWith('A')) return 'bg-green-100 text-green-700'
    if (grade === 'B') return 'bg-blue-100 text-blue-700'
    if (grade === 'C') return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="p-6">
      <PageHeader title="Results" subtitle="View your children's academic performance" />
      <div className="mb-4">
        <select className="input w-64" value={selectedChild} onChange={e => setSelectedChild(e.target.value)}>
          <option value="">Select child</option>
          {children.map(c => <option key={c.students.id} value={c.students.id}>{c.students?.profiles?.first_name} {c.students?.profiles?.last_name}</option>)}
        </select>
      </div>
      {selectedChild && (
        <div className="space-y-3">
          {results.length === 0
            ? <div className="card p-12 text-center text-gray-400"><Award className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No results available yet.</p></div>
            : results.map(r => {
              const source = r.exams || r.assignments
              return (
                <div key={r.id} className="card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0"><Award className="w-5 h-5 text-brand-600" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{source?.title}</p>
                    <p className="text-sm text-gray-500">{r.exams ? 'Exam' : 'Assignment'} · {source?.subjects?.name}</p>
                  </div>
                  <div className="text-right">
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
