import { supabase } from '../supabase'

export async function getClasses(schoolId) {
  const { data, error } = await supabase.from('classes').select('*, profiles(first_name, last_name)').eq('school_id', schoolId).order('grade_level').order('name')
  if (error) throw error
  return data
}

export async function createClass(payload) {
  const { data, error } = await supabase.from('classes').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateClass(classId, updates) {
  const { data, error } = await supabase.from('classes').update(updates).eq('id', classId).select().single()
  if (error) throw error
  return data
}

export async function deleteClass(classId) {
  const { error } = await supabase.from('classes').delete().eq('id', classId)
  if (error) throw error
}

export async function getClassSubjects(classId) {
  const { data, error } = await supabase.from('class_subjects').select('*, subjects(id, name, code), teachers(id, profile_id, profiles(first_name, last_name))').eq('class_id', classId)
  if (error) throw error
  return data
}

export async function assignSubjectToClass(payload) {
  const { data, error } = await supabase.from('class_subjects').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function removeClassSubject(id) {
  const { error } = await supabase.from('class_subjects').delete().eq('id', id)
  if (error) throw error
}
