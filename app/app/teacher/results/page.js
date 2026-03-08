'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/appContext'
import { supabase } from '@/lib/supabase'
import { upsertResultsBulk } from '@/lib/services/results'
import { getExams } from '@/lib/services/exams'
import PageHeader from '@/components/PageHeader'
import { Save, Award } from 'lucide-react'

export default function TeacherResults() {
  const { profile } = useApp()
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState('')
  const [examStudents, setExamStudents] = useState([])
  const [scores, setScores] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const sid = profile?.school_id

  useEffect(() => {
    if (!sid) return
    getExams(sid).then(e => setExams(e || [])).catch(console.error)
  }, [sid])

  const loadStudentsForExam = useCallback(async () => {
    if (!selectedExam) return
    setLoading(true)
    const exam = exams.find(e => e.id === selectedExam)
    if (!exam) { setLoading(false); return }
    const { data: studs } = await supabase.from('students').select('id, student_number, profiles(first_name, last_name)').eq('class_id', exam.class_id).eq('school_id', sid).eq('is_active', true)
    setExamStudents(studs || [])

    const { data: existing } = await supabase.from('results').select('student_id, score, grade, remarks').eq('exam_id', selectedExam).eq('school_id', sid)
    const map = {}
    studs?.forEach(s => { map[s.id] = { score: '', grade: '', remarks: '' } })
    existing?.forEach(r => { map[r.student_id] = { score: r.score ?? '', grade: r.grade || '', remarks: r.remarks || '' } })
    setScores(map)
    setLoading(false)
  }, [selectedExam, exams, sid])

  useEffect(() => { loadStudentsForExam() }, [loadStudentsForExam])

  const setScore = (id, field, value) => setScores(m => ({ ...m, [id]: { ...m[id], [field]: value } }))

  const computeGrade = (score, total) => {
    const pct = (score / total) * 100
    if (pct >= 90) return 'A+'
    if (pct >= 80) return 'A'
    if (pct >= 70) return 'B'
    if (pct >= 60) return 'C'
    if (pct >= 50) return 'D'
    return 'F'
  }

  const handleSave = async () => {
    setSaving(true)
    const exam = exams.find(e => e.id === selectedExam)
    try {
      const rows = examStudents.map(s => ({
        student_id: s.id, exam_id: selectedExam,
        score: scores[s.id]?.score !== '' ? Number(scores[s.id]?.score) : null,
        grade: scores[s.id]?.score !== '' ? computeGrade(Number(scores[s.id]?.score), exam.total_marks) : null,
        remarks: scores[s.id]?.remarks || null
      }))
      await upsertResultsBulk(sid, rows)
      alert('Results saved successfully!')
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  const exam = exams.find(e => e.id === selectedExam)

  return (
    <div className="p-6">
      <PageHeader title="Results" subtitle="Enter and publish student scores" />
      <div className="flex gap-3 mb-6">
        <select className="input w-80" value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
          <option value="">Select exam to enter results...</option>
          {exams.map(e => <option key={e.id} value={e.id}>{e.title} — {e.classes?.name} — {e.subjects?.name}</option>)}
        </select>
      </div>

      {selectedExam && (
        <div className="card">
          {exam && <div className="px-4 py-3 bg-brand-50 border-b border-gray-100 flex items-center justify-between"><div className="flex items-center gap-2"><Award className="w-4 h-4 text-brand-600" /><span className="text-sm font-medium text-brand-800">{exam.title}</span><span className="text-xs text-brand-600">Total Marks: {exam.total_marks}</span></div><button onClick={handleSave} disabled={saving} className="btn-primary py-1.5 text-xs"><Save className="w-3.5 h-3.5" />{saving ? 'Saving...' : 'Save Results'}</button></div>}
          {loading ? <div className="p-8 text-center text-gray-400">Loading students...</div>
            : examStudents.length === 0 ? <div className="p-8 text-center text-gray-400">No students in this class.</div>
            : (
              <div className="divide-y divide-gray-100">
                {examStudents.map(s => (
                  <div key={s.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                    <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
                      {(s.profiles?.first_name?.[0] || '') + (s.profiles?.last_name?.[0] || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{s.profiles?.first_name} {s.profiles?.last_name}</p>
                      <p className="text-xs text-gray-400">{s.student_number}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input className="input w-24 text-sm" type="number" min="0" max={exam?.total_marks} placeholder="Score" value={scores[s.id]?.score ?? ''} onChange={e => setScore(s.id, 'score', e.target.value)} />
                      <span className="text-xs text-gray-400">/ {exam?.total_marks}</span>
                      {scores[s.id]?.score !== '' && <span className="badge bg-brand-100 text-brand-700">{computeGrade(Number(scores[s.id]?.score), exam?.total_marks)}</span>}
                      <input className="input w-44 text-xs" placeholder="Remarks..." value={scores[s.id]?.remarks || ''} onChange={e => setScore(s.id, 'remarks', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}
    </div>
  )
}
