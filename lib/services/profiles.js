import { supabase } from '../supabase'

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', userId).select().single()
  if (error) throw error
  return data
}

export async function getSchoolDirectory(schoolId, role = null) {
  let q = supabase.from('profiles').select('id, first_name, last_name, email, role, avatar_url, is_active').eq('school_id', schoolId).eq('is_active', true)
  if (role) q = q.eq('role', role)
  const { data, error } = await q.order('first_name')
  if (error) throw error
  return data
}
