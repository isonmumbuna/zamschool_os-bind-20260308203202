import { supabase } from '../supabase'

export async function getSubjects(schoolId) {
  const { data, error } = await supabase.from('subjects').select('*').eq('school_id', schoolId).order('name')
  if (error) throw error
  return data
}

export async function createSubject(payload) {
  const { data, error } = await supabase.from('subjects').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateSubject(subjectId, updates) {
  const { data, error } = await supabase.from('subjects').update(updates).eq('id', subjectId).select().single()
  if (error) throw error
  return data
}

export async function deleteSubject(subjectId) {
  const { error } = await supabase.from('subjects').delete().eq('id', subjectId)
  if (error) throw error
}
