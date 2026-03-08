'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/lib/appContext'
import { supabase } from '@/lib/supabase'
import { getLessons } from '@/lib/services/lessons'
import PageHeader from '@/components/PageHeader'
import { DAYS } from '@/lib/utils'

const HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00']
const COLORS = ['bg-blue-100 text-blue-800','bg-green-100 text-green-800','bg-purple-100 text-purple-800','bg-orange-100 text-orange-800','bg-pink-100 text-pink-800']

export default function TeacherTimetable() {
  const { profile } = useApp()
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const sid = profile?.school_id

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('profile_id', profile.id).single()
      if (!teacher) { setLoading(false); return }
      const data = await getLessons(sid, { teacherId: teacher.id })
      setLessons(data || [])
      setLoading(false)
    }
    load()
  }, [profile, sid])

  const subjectColors = {}
  const seenSubjects = []
  lessons.forEach(l => { if (l.subject_id && !subjectColors[l.subject_id]) { subjectColors[l.subject_id] = COLORS[seenSubjects.length % COLORS.length]; seenSubjects.push(l.subject_id) } })
  const getLessonForSlot = (day, time) => lessons.filter(l => l.day_of_week === day && l.start_time && l.start_time.slice(0, 5) === time)

  return (
    <div className="p-6">
      <PageHeader title="My Timetable" subtitle="Your weekly teaching schedule" />
      {loading ? <div className="card p-8 text-center text-gray-400">Loading timetable...</div> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-max">
            <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="table-th w-20">Time</th>{[1,2,3,4,5].map(d => <th key={d} className="table-th">{DAYS[d]}</th>)}</tr></thead>
            <tbody>
              {HOURS.map(time => (
                <tr key={time} className="border-b border-gray-50">
                  <td className="table-td text-xs text-gray-400 font-mono">{time}</td>
                  {[1,2,3,4,5].map(day => {
                    const slot = getLessonForSlot(day, time)
                    return (
                      <td key={day} className="table-td min-w-[120px] align-top py-1">
                        {slot.map(l => (
                          <div key={l.id} className={`rounded-lg px-2 py-2 text-xs mb-1 ${subjectColors[l.subject_id] || COLORS[0]}`}>
                            <p className="font-semibold">{l.subjects?.name}</p>
                            <p className="opacity-70">{l.classes?.name}</p>
                            <p className="opacity-60">{l.start_time?.slice(0,5)} – {l.end_time?.slice(0,5)}</p>
                          </div>
                        ))}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
