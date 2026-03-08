import { supabase } from '../supabase'

export async function getLessons(schoolId, filters = {}) {
  let q = supabase.from('lessons').select('*, subjects(name, code), classes(name, grade_level), teachers(id, profiles(first_name, last_name))').eq('school_id', schoolId)
  if (filters.classId) q = q.eq('class_id', filters.classId)
  if (filters.teacherId) q = q.eq('teacher_id', filters.teacherId)
  const { data, error } = await q.order('day_of_week').order('start_time')
  if (error) throw error
  return data
}

export async function createLesson(payload) {
  const { data, error } = await supabase.from('lessons').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateLesson(id, updates) {
  const { data, error } = await supabase.from('lessons').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteLesson(id) {
  const { error } = await supabase.from('lessons').delete().eq('id', id)
  if (error) throw error
}
