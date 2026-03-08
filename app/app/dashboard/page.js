'use client'
import { useEffect, useState } from 'react'
import { useApp } from '@/lib/appContext'
import { supabase } from '@/lib/supabase'
import { Users, BookOpen, ClipboardList, Bell, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function Dashboard() {
  const { profile, school } = useApp()
  const [stats, setStats] = useState({})
  const [announcements, setAnnouncements] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.school_id) return
    const sid = profile.school_id
    const load = async () => {
      try {
        const [s, t, cl, ann, ev] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact' }).eq('school_id', sid).eq('is_active', true),
          supabase.from('teachers').select('id', { count: 'exact' }).eq('school_id', sid).eq('is_active', true),
          supabase.from('classes').select('id', { count: 'exact' }).eq('school_id', sid),
          supabase.from('announcements').select('id, title, priority, publish_at, audience').eq('school_id', sid).eq('status', 'live').order('publish_at', { ascending: false }).limit(5),
          supabase.from('events').select('id, title, start_date, category, location').eq('school_id', sid).gte('start_date', new Date().toISOString()).order('start_date').limit(5)
        ])
        setStats({ students: s.count || 0, teachers: t.count || 0, classes: cl.count || 0 })
        setAnnouncements(ann.data || [])
        setEvents(ev.data || [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [profile?.school_id])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const statCards = [
    { label: 'Students', value: stats.students, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Teachers', value: stats.teachers, icon: BookOpen, color: 'bg-green-50 text-green-600' },
    { label: 'Classes', value: stats.classes, icon: ClipboardList, color: 'bg-purple-50 text-purple-600' },
    { label: 'Announcements', value: announcements.length, icon: Bell, color: 'bg-orange-50 text-orange-600' }
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting()}, {profile?.first_name}! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">{school?.name} · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}><Icon className="w-5 h-5" /></div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{loading ? '—' : (value ?? '—')}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-gray-900">Recent Announcements</h2><Bell className="w-4 h-4 text-gray-400" /></div>
          {announcements.length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">No active announcements</p>
            : <div className="space-y-3">{announcements.map(a => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.priority === 'urgent' ? 'bg-red-500' : 'bg-brand-400'}`} />
                <div><p className="text-sm font-medium text-gray-800">{a.title}</p><p className="text-xs text-gray-400 mt-0.5">{formatDate(a.publish_at)} · {a.audience}</p></div>
              </div>
            ))}</div>}
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-gray-900">Upcoming Events</h2><Calendar className="w-4 h-4 text-gray-400" /></div>
          {events.length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">No upcoming events</p>
            : <div className="space-y-3">{events.map(ev => (
              <div key={ev.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-600 text-xs font-bold">{new Date(ev.start_date).getDate()}</span>
                </div>
                <div><p className="text-sm font-medium text-gray-800">{ev.title}</p><p className="text-xs text-gray-400 mt-0.5">{formatDate(ev.start_date)}{ev.location ? ` · ${ev.location}` : ''}</p></div>
              </div>
            ))}</div>}
        </div>
      </div>
    </div>
  )
}
