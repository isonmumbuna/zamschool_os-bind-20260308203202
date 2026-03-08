import { supabase } from '../supabase'

export async function getResults(schoolId, filters = {}) {
  let q = supabase.from('results').select('*, students(id, student_number, profiles(first_name, last_name)), exams(title, total_marks, exam_date, subjects(name)), assignments(title, total_marks, due_date, subjects(name))').eq('school_id', schoolId)
  if (filters.studentId) q = q.eq('student_id', filters.studentId)
  if (filters.examId) q = q.eq('exam_id', filters.examId)
  if (filters.assignmentId) q = q.eq('assignment_id', filters.assignmentId)
  const { data, error } = await q.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertResultsBulk(schoolId, rows) {
  const records = rows.map(r => ({
    school_id: schoolId, student_id: r.student_id,
    exam_id: r.exam_id || null, assignment_id: r.assignment_id || null,
    score: r.score, grade: r.grade || null, remarks: r.remarks || null
  }))
  const { data, error } = await supabase.from('results').upsert(records, { onConflict: 'student_id,exam_id', ignoreDuplicates: false }).select()
  if (error) throw error
  return data
}

export async function deleteResult(resultId) {
  const { error } = await supabase.from('results').delete().eq('id', resultId)
  if (error) throw error
}
