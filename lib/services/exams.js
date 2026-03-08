import { supabase } from '../supabase'

export async function getExams(schoolId, filters = {}) {
  let q = supabase.from('exams').select('*, subjects(name, code), classes(name, grade_level)').eq('school_id', schoolId)
  if (filters.classId) q = q.eq('class_id', filters.classId)
  if (filters.subjectId) q = q.eq('subject_id', filters.subjectId)
  const { data, error } = await q.order('exam_date', { ascending: false })
  if (error) throw error
  return data
}

export async function createExam(payload) {
  const { data, error } = await supabase.from('exams').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateExam(examId, updates) {
  const { data, error } = await supabase.from('exams').update(updates).eq('id', examId).select().single()
  if (error) throw error
  return data
}

export async function deleteExam(examId) {
  const { error } = await supabase.from('exams').delete().eq('id', examId)
  if (error) throw error
}
