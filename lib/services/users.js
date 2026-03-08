import { supabase } from '../supabase'

export async function getStudents(schoolId) {
  const { data, error } = await supabase.from('students').select('*, profiles(id, first_name, last_name, email, phone, avatar_url, gender, is_active), classes(id, name, grade_level)').eq('school_id', schoolId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getTeachers(schoolId) {
  const { data, error } = await supabase.from('teachers').select('*, profiles(id, first_name, last_name, email, phone, avatar_url, gender, is_active)').eq('school_id', schoolId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getParents(schoolId) {
  const { data, error } = await supabase.from('parents').select('*, profiles(id, first_name, last_name, email, phone, avatar_url, is_active)').eq('school_id', schoolId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getParentStudents(parentId) {
  const { data, error } = await supabase.from('parent_students').select('*, students(id, student_number, profiles(first_name, last_name), classes(name))').eq('parent_id', parentId)
  if (error) throw error
  return data
}

export async function linkParentStudent(parentId, studentId, relationship = 'parent') {
  const { data, error } = await supabase.from('parent_students').insert({ parent_id: parentId, student_id: studentId, relationship }).select().single()
  if (error) throw error
  return data
}

export async function unlinkParentStudent(id) {
  const { error } = await supabase.from('parent_students').delete().eq('id', id)
  if (error) throw error
}

export async function updateStudentStatus(studentId, isActive) {
  const { data, error } = await supabase.from('students').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', studentId).select().single()
  if (error) throw error
  return data
}

export async function updateTeacherStatus(teacherId, isActive) {
  const { data, error } = await supabase.from('teachers').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', teacherId).select().single()
  if (error) throw error
  return data
}
