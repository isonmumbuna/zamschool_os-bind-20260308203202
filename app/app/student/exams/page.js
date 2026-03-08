'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/lib/appContext'
import { supabase } from '@/lib/supabase'
import { getExams } from '@/lib/services/exams'
import PageHeader from '@/components/PageHeader'
import { formatDate } from '@/lib/utils'
import { FileText } from 'lucide-react'

export default function StudentExams() {
  const { profile } = useApp()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const sid = profile?.school_id
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      const { data: student } = await supabase.from('students').select('class_id').eq('profile_id', profile.id).single()
      if (!student?.class_id) { setLoading(false); return }
      const data = await getExams(sid, { classId: student.class_id })
      setExams(data || [])
      setLoading(false)
    }
    load()
  }, [profile, sid])

  const upcoming = exams.filter(e => e.exam_date >= today)
  const past = exams.filter(e => e.exam_date < today)

  const ExamCard = ({ exam }) => {
    const isUpcoming = exam.exam_date >= today
    const daysUntil = isUpcoming ? Math.ceil((new Date(exam.exam_date) - new Date()) / (1000 * 60 * 60 * 24)) : null
    return (
      <div className={`card p-4 flex items-start gap-4 ${isUpcoming ? 'border-brand-200' : ''}`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isUpcoming ? 'bg-brand-50' : 'bg-gray-50'}`}>
          <FileText className={`w-5 h-5 ${isUpcoming ? 'text-brand-600' : 'text-gray-400'}`} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{exam.title}</p>
          <p className="text-sm text-gray-500 mt-0.5">{exam.subjects?.name} · {exam.classes?.name}</p>
          {exam.start_time && <p className="text-xs text-gray-400 mt-1">Time: {exam.start_time} · Duration: {exam.duration_minutes} min</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-medium text-gray-700">{formatDate(exam.exam_date)}</p>
          {isUpcoming && daysUntil !== null && <p className={`text-xs font-medium mt-0.5 ${daysUntil <= 3 ? 'text-red-600' : 'text-brand-600'}`}>{daysUntil === 0 ? 'Today!' : `${daysUntil} days`}</p>}
          <p className="text-xs text-gray-400 mt-0.5">{exam.total_marks} marks</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader title="Exams" subtitle="Your scheduled examinations" />
      {loading ? <div className="card p-8 text-center text-gray-400">Loading...</div> : (
        <div className="space-y-6">
          {upcoming.length > 0 && <div><h2 className="font-semibold text-gray-900 mb-3">Upcoming</h2><div className="space-y-3">{upcoming.map(e => <ExamCard key={e.id} exam={e} />)}</div></div>}
          {past.length > 0 && <div><h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Past</h2><div className="space-y-3">{past.map(e => <ExamCard key={e.id} exam={e} />)}</div></div>}
          {exams.length === 0 && <div className="card p-12 text-center text-gray-400"><FileText className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No exams scheduled.</p></div>}
        </div>
      )}
    </div>
  )
}
