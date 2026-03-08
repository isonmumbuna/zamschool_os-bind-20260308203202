import { supabase } from '../supabase'

export async function getSchool(schoolId) {
  const { data, error } = await supabase.from('schools').select('*').eq('id', schoolId).single()
  if (error) throw error
  return data
}

export async function updateSchool(schoolId, updates) {
  const { data, error } = await supabase.from('schools').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', schoolId).select().single()
  if (error) throw error
  return data
}
