'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { GraduationCap, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function RegisterSchool() {
  const [form, setForm] = useState({ schoolName: '', schoolCode: '', address: '', phone: '', email: '', adminFirst: '', adminLast: '', adminEmail: '', adminPassword: '', adminConfirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (form.adminPassword !== form.adminConfirm) { setError('Passwords do not match'); return }
    if (form.adminPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const { data: school, error: schoolErr } = await supabase.from('schools').insert({ name: form.schoolName, code: form.schoolCode.toUpperCase(), address: form.address, phone: form.phone, email: form.email }).select().single()
      if (schoolErr) throw new Error(schoolErr.message)
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email: form.adminEmail, password: form.adminPassword, options: { data: { first_name: form.adminFirst, last_name: form.adminLast } } })
      if (authErr) throw new Error(authErr.message)
      if (authData.user) {
        const { error: profileErr } = await supabase.from('profiles').insert({ id: authData.user.id, school_id: school.id, role: 'admin', first_name: form.adminFirst, last_name: form.adminLast, email: form.adminEmail })
        if (profileErr) throw new Error(profileErr.message)
      }
      setSuccess(true)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  if (success) return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-10 text-center max-w-md w-full">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">School Registered!</h2>
        <p className="text-gray-600 mb-6">Check your email to confirm your account, then sign in.</p>
        <Link href="/login" className="btn-primary justify-center">Go to Sign In</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-700 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <GraduationCap className="w-10 h-10 text-white mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">Register Your School</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">School Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">School Name</label><input className="input" value={form.schoolName} onChange={e => set('schoolName', e.target.value)} required placeholder="St. Mary's High" /></div>
              <div><label className="label">School Code</label><input className="input" value={form.schoolCode} onChange={e => set('schoolCode', e.target.value)} required placeholder="SMH001" /></div>
            </div>
            <div><label className="label">Address</label><input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main Street, Lusaka" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">Admin Account</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">First Name</label><input className="input" value={form.adminFirst} onChange={e => set('adminFirst', e.target.value)} required /></div>
                <div><label className="label">Last Name</label><input className="input" value={form.adminLast} onChange={e => set('adminLast', e.target.value)} required /></div>
              </div>
              <div className="mt-3"><label className="label">Admin Email</label><input className="input" type="email" value={form.adminEmail} onChange={e => set('adminEmail', e.target.value)} required /></div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><label className="label">Password</label><input className="input" type="password" value={form.adminPassword} onChange={e => set('adminPassword', e.target.value)} required minLength={8} /></div>
                <div><label className="label">Confirm Password</label><input className="input" type="password" value={form.adminConfirm} onChange={e => set('adminConfirm', e.target.value)} required /></div>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">{loading ? 'Registering...' : 'Register School'}</button>
            <p className="text-center text-sm text-gray-500">Already have an account? <Link href="/login" className="text-brand-600 font-medium">Sign in</Link></p>
          </form>
        </div>
      </div>
    </div>
  )
}
