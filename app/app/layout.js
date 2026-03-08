'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useApp } from '@/lib/appContext'
import Link from 'next/link'
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, Calendar,
  Bell, DollarSign, Settings, LogOut, Menu, X, GraduationCap,
  Clock, FileText, BarChart3, MessageSquare, Shield,
  UserCheck, BookMarked, Award, Wallet
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import NotificationBell from '@/components/NotificationBell'

const NAV_BY_ROLE = {
  admin: [
    { href: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/app/admin/school', icon: GraduationCap, label: 'School' },
    { href: '/app/admin/users', icon: Users, label: 'Users' },
    { href: '/app/admin/classes', icon: BookOpen, label: 'Classes' },
    { href: '/app/admin/subjects', icon: BookMarked, label: 'Subjects' },
    { href: '/app/admin/timetable', icon: Clock, label: 'Timetable' },
    { href: '/app/announcements', icon: Bell, label: 'Announcements' },
    { href: '/app/events', icon: Calendar, label: 'Events' },
    { href: '/app/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/app/admin/fees', icon: DollarSign, label: 'Payments' },
    { href: '/app/admin/finance', icon: BarChart3, label: 'Finance' },
    { href: '/app/admin/audit', icon: Shield, label: 'Audit' },
    { href: '/app/settings', icon: Settings, label: 'Settings' }
  ],
  teacher: [
    { href: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/app/teacher/classes', icon: BookOpen, label: 'My Classes' },
    { href: '/app/teacher/timetable', icon: Clock, label: 'Timetable' },
    { href: '/app/teacher/assignments', icon: ClipboardList, label: 'Assignments' },
    { href: '/app/teacher/exams', icon: FileText, label: 'Exams' },
    { href: '/app/teacher/attendance', icon: UserCheck, label: 'Attendance' },
    { href: '/app/teacher/results', icon: Award, label: 'Results' },
    { href: '/app/announcements', icon: Bell, label: 'Announcements' },
    { href: '/app/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/app/settings', icon: Settings, label: 'Settings' }
  ],
  student: [
    { href: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/app/student/timetable', icon: Clock, label: 'Timetable' },
    { href: '/app/student/assignments', icon: ClipboardList, label: 'Assignments' },
    { href: '/app/student/exams', icon: FileText, label: 'Exams' },
    { href: '/app/student/results', icon: Award, label: 'Results' },
    { href: '/app/student/attendance', icon: UserCheck, label: 'Attendance' },
    { href: '/app/announcements', icon: Bell, label: 'Announcements' },
    { href: '/app/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/app/settings', icon: Settings, label: 'Settings' }
  ],
  parent: [
    { href: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/app/parent/children', icon: Users, label: 'My Children' },
    { href: '/app/parent/attendance', icon: UserCheck, label: 'Attendance' },
    { href: '/app/parent/results', icon: Award, label: 'Results' },
    { href: '/app/parent/payments', icon: Wallet, label: 'Payments' },
    { href: '/app/announcements', icon: Bell, label: 'Announcements' },
    { href: '/app/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/app/settings', icon: Settings, label: 'Settings' }
  ]
}

export default function AppLayout({ children }) {
  const { profile, school, loading, signOut } = useApp()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !profile) router.replace('/login')
  }, [profile, loading, router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <GraduationCap className="w-10 h-10 text-brand-600 mx-auto mb-3 animate-pulse" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  )

  if (!profile) return null

  const navItems = NAV_BY_ROLE[profile.role] || NAV_BY_ROLE.admin

  const NavItem = ({ href, icon: Icon, label }) => {
    const active = pathname === href || (href !== '/app/dashboard' && pathname.startsWith(href))
    return (
      <Link href={href} onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
        aria-current={active ? 'page' : undefined}>
        <Icon className="w-4 h-4 flex-shrink-0" />{label}
      </Link>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate">ZamSchool OS</p>
          <p className="text-xs text-gray-400 truncate">{school?.name || 'School'}</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => <NavItem key={item.href} {...item} />)}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xs flex-shrink-0">
            {getInitials(profile.first_name, profile.last_name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{profile.first_name} {profile.last_name}</p>
            <p className="text-xs text-gray-400 capitalize">{profile.role}</p>
          </div>
        </div>
        <button onClick={signOut} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed inset-y-0">
        <SidebarContent />
      </aside>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-64 bg-white shadow-xl">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700" aria-label="Close menu"><X className="w-5 h-5" /></button>
            <SidebarContent />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" aria-label="Open menu"><Menu className="w-5 h-5" /></button>
          <div className="flex items-center gap-2 ml-auto">
            <NotificationBell userId={profile.id} />
            <Link href="/app/settings" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xs">{getInitials(profile.first_name, profile.last_name)}</div>
              <span className="hidden md:block text-sm font-medium text-gray-700">{profile.first_name}</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 min-h-0">{children}</main>
      </div>
    </div>
  )
}
