'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/lib/appContext'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import { BookOpen, Users } from 'lucide-react'

export default function TeacherClassesPage() {
  const { profile } = useApp()
  const [classSubjects, setClassSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id || profile?.role !== 'teacher') return
    const load = async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('profile_id', profile.id).single()
      if (!teacher) { setLoading(false); return }
      const { data } = await supabase.from('class_subjects').select('*, classes(id, name, grade_level, capacity), subjects(name, code)').eq('teacher_id', teacher.id)
      setClassSubjects(data || [])
      setLoading(false)
    }
    load()
  }, [profile])

  return (
    <div className="p-6">
      <PageHeader title="My Classes" subtitle="Classes and subjects assigned to you" />
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="card p-6 h-32 animate-pulse" />)}</div>
      ) : classSubjects.length === 0 ? (
        <div className="card p-12 text-center text-gray-400"><BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No classes assigned yet.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classSubjects.map(cs => (
            <div key={cs.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center"><BookOpen className="w-5 h-5 text-brand-600" /></div>
                <span className="badge bg-gray-100 text-gray-600 text-xs">{cs.subjects?.code}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{cs.subjects?.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{cs.classes?.name} · Grade {cs.classes?.grade_level}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-gray-400"><Users className="w-3.5 h-3.5" /> Capacity: {cs.classes?.capacity}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
