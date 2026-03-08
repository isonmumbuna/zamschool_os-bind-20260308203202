'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/appContext'
import { BookOpen, Users, BarChart3, Shield, ArrowRight, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { profile, loading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!loading && profile) router.replace('/app/dashboard')
  }, [profile, loading, router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 to-brand-700">
      <div className="text-white text-center">
        <GraduationCap className="w-12 h-12 mx-auto mb-3 animate-pulse" />
        <p className="text-lg font-medium">Loading ZamSchool OS...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600">
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">ZamSchool OS</span>
        </div>
        <Link href="/login" className="flex items-center gap-2 bg-white text-brand-700 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-brand-50 transition-colors">
          Sign In <ArrowRight className="w-4 h-4" />
        </Link>
      </nav>
      <main className="max-w-5xl mx-auto px-8 pt-20 pb-32 text-center">
        <h1 className="text-5xl font-bold text-white leading-tight mb-6">Run Your School from<br/>One Secure Platform</h1>
        <p className="text-xl text-brand-200 mb-10 max-w-2xl mx-auto">Attendance, grades, timetables, messaging, finance — all in one place, safe and organized.</p>
        <div className="flex items-center justify-center gap-4 mb-20">
          <Link href="/login" className="bg-white text-brand-700 px-8 py-3.5 rounded-xl font-bold text-base hover:bg-brand-50 transition-colors shadow-lg">Get Started</Link>
          <Link href="/register-school" className="bg-white/10 text-white border border-white/20 px-8 py-3.5 rounded-xl font-bold text-base hover:bg-white/20 transition-colors">Register School</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Multi-Role Access', desc: 'Admin, Teacher, Student, Parent' },
            { icon: Shield, label: 'Secure by Design', desc: 'RLS-enforced data isolation' },
            { icon: BarChart3, label: 'Real-time Analytics', desc: 'Live dashboards and reports' },
            { icon: BookOpen, label: 'Full Academic Suite', desc: 'Exams, grades, timetables' }
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-left border border-white/10">
              <Icon className="w-7 h-7 text-brand-200 mb-3" />
              <h3 className="font-semibold text-white text-sm mb-1">{label}</h3>
              <p className="text-brand-300 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
