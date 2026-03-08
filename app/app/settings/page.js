'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/lib/appContext'
import { updateProfile } from '@/lib/services/profiles'
import PageHeader from '@/components/PageHeader'
import { Save, User, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'
import Image from 'next/image'

export default function SettingsPage() {
  const { profile, refreshProfile } = useApp()
  const [activeTab, setActiveTab] = useState('profile')
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '', gender: '', avatar_url: '' })
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)
  const [passwordMsg, setPasswordMsg] = useState(null)

  useEffect(() => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        avatar_url: profile.avatar_url || ''
      })
    }
  }, [profile])

  const setProfileField = (k, v) => setProfileForm(f => ({ ...f, [k]: v }))
  const setPasswordField = (k, v) => setPasswordForm(f => ({ ...f, [k]: v }))

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      await updateProfile(profile.id, profileForm)
      await refreshProfile()
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message })
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setSavingPassword(true)
    setPasswordMsg(null)
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' })
      setSavingPassword(false)
      return
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters.' })
      setSavingPassword(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password
      })
      if (error) throw error
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' })
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message })
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'profile' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <User className="w-4 h-4" /> Profile
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'password' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <Lock className="w-4 h-4" /> Password
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          {profileMsg && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-5 text-sm ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {profileMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{profileMsg.text}
            </div>
          )}
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xl flex-shrink-0">
                {profileForm.avatar_url ? <Image src={profileForm.avatar_url} alt="Avatar" width={64} height={64} className="w-full h-full rounded-full object-cover" /> : getInitials(profileForm.first_name, profileForm.last_name)}
              </div>
              <div className="flex-1">
                <label className="label">Avatar URL</label>
                <input className="input" type="url" value={profileForm.avatar_url} onChange={e => setProfileField('avatar_url', e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">First Name</label><input className="input" value={profileForm.first_name} onChange={e => setProfileField('first_name', e.target.value)} required /></div>
              <div><label className="label">Last Name</label><input className="input" value={profileForm.last_name} onChange={e => setProfileField('last_name', e.target.value)} required /></div>
            </div>
            <div><label className="label">Email</label><input className="input bg-gray-50 cursor-not-allowed" value={profile?.email} disabled /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Phone</label><input className="input" value={profileForm.phone} onChange={e => setProfileField('phone', e.target.value)} /></div>
              <div><label className="label">Gender</label><select className="input" value={profileForm.gender} onChange={e => setProfileField('gender', e.target.value)}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
            </div>
            <button type="submit" disabled={savingProfile} className="btn-primary"><Save className="w-4 h-4" />{savingProfile ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
          {passwordMsg && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-5 text-sm ${passwordMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {passwordMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{passwordMsg.text}
            </div>
          )}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div><label className="label">New Password</label><input className="input" type="password" value={passwordForm.new_password} onChange={e => setPasswordField('new_password', e.target.value)} required minLength={8} /></div>
            <div><label className="label">Confirm New Password</label><input className="input" type="password" value={passwordForm.confirm_password} onChange={e => setPasswordField('confirm_password', e.target.value)} required minLength={8} /></div>
            <button type="submit" disabled={savingPassword} className="btn-primary"><Lock className="w-4 h-4" />{savingPassword ? 'Changing...' : 'Change Password'}</button>
          </form>
        </div>
      )}
    </div>
  )
}
