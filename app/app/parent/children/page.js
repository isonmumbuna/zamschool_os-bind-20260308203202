'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/lib/appContext'
import { supabase } from '@/lib/supabase'
import { getParentStudents } from '@/lib/services/users'
import PageHeader from '@/components/PageHeader'
import { Users, BookOpen } from 'lucide-react'
import { getInitials } from '@/lib/utils'

export default function ParentChildren() {
  const { profile } = useApp()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      const { data: parent } = await supabase.from('parents').select('id').eq('profile_id', profile.id).single()
      if (!parent) { setLoading(false); return }
      const data = await getParentStudents(parent.id)
      setChildren(data || [])
      setLoading(false)
    }
    load()
  }, [profile])

  return (
    <div className="p-6">
      <PageHeader title="My Children" subtitle="Children linked to your account" />
      {loading ? <div className="card p-8 text-center text-gray-400">Loading...</div>
        : children.length === 0 ? <div className="card p-12 text-center text-gray-400"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No children linked yet. Contact the school administrator.</p></div>
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map(c => (
              <div key={c.id} className="card p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-700 font-bold">
                    {getInitials(c.students?.profiles?.first_name, c.students?.profiles?.last_name)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{c.students?.profiles?.first_name} {c.students?.profiles?.last_name}</p>
                    <p className="text-sm text-gray-500">{c.students?.student_number}</p>
                    <span className="badge bg-brand-50 text-brand-700 text-xs mt-1">{c.relationship || 'Child'}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><BookOpen className="w-3.5 h-3.5 text-gray-400" /><span>{c.students?.classes?.name || 'No class assigned'}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
