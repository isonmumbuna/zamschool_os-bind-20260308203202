'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/lib/appContext'
import { getSchool, updateSchool } from '@/lib/services/schools'
import { writeAuditLog } from '@/lib/services/audit'
import PageHeader from '@/components/PageHeader'
import { Save, Building2, CheckCircle, AlertCircle } from 'lucide-react'

export default function SchoolSettings() {
  const { profile, refreshProfile } = useApp()
  const [form, setForm] = useState({ name: '', code: '', address: '', phone: '', email: '', logo_url: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    if (!profile?.school_id) return
    getSchool(profile.school_id).then(s => {
      setForm({ name: s.name || '', code: s.code || '', address: s.address || '', phone: s.phone || '', email: s.email || '', logo_url: s.logo_url || '' })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [profile?.school_id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setMsg(null)
    try {
      await updateSchool(profile.school_id, form)
      await writeAuditLog(profile.school_id, profile.id, 'update', 'school', profile.school_id, { fields: Object.keys(form) })
      await refreshProfile()
      setMsg({ type: 'success', text: 'School settings saved.' })
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setSaving(false) }
  }

  if (profile?.role !== 'admin') return <div className="p-6 text-gray-500">Access denied.</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="School Settings" subtitle="Manage your school's profile" />
      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-5 text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{msg.text}
        </div>
      )}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center"><Building2 className="w-6 h-6 text-brand-600" /></div>
          <div><p className="font-semibold text-gray-900">{form.name || 'Your School'}</p><p className="text-sm text-gray-500">{form.code}</p></div>
        </div>
        {loading ? <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div> : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">School Name *</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
              <div><label className="label">School Code *</label><input className="input" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} required /></div>
            </div>
            <div><label className="label">Address</label><textarea className="input resize-none" rows={2} value={form.address} onChange={e => set('address', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            </div>
            <div><label className="label">Logo URL</label><input className="input" type="url" value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." /></div>
            <button type="submit" disabled={saving} className="btn-primary"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
