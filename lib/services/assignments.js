import { supabase } from '../supabase'

export async function getAssignments(schoolId, filters = {}) {
  let q = supabase.from('assignments').select('*, subjects(name, code), classes(name, grade_level), teachers(id, profiles(first_name, last_name))').eq('school_id', schoolId)
  if (filters.classId) q = q.eq('class_id', filters.classId)
  if (filters.subjectId) q = q.eq('subject_id', filters.subjectId)
  if (filters.teacherId) q = q.eq('teacher_id', filters.teacherId)
  const { data, error } = await q.order('due_date', { ascending: false })
  if (error) throw error
  return data
}

export async function createAssignment(payload) {
  const { data, error } = await supabase.from('assignments').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateAssignment(id, updates) {
  const { data, error } = await supabase.from('assignments').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteAssignment(id) {
  const { error } = await supabase.from('assignments').delete().eq('id', id)
  if (error) throw error
}
