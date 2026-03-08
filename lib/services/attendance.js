import { supabase } from '../supabase'

export async function getAttendance(schoolId, filters = {}) {
  let q = supabase.from('attendance').select('*, students(id, student_number, profiles(first_name, last_name)), classes(name)').eq('school_id', schoolId)
  if (filters.classId) q = q.eq('class_id', filters.classId)
  if (filters.date) q = q.eq('attendance_date', filters.date)
  if (filters.studentId) q = q.eq('student_id', filters.studentId)
  if (filters.from) q = q.gte('attendance_date', filters.from)
  if (filters.to) q = q.lte('attendance_date', filters.to)
  const { data, error } = await q.order('attendance_date', { ascending: false })
  if (error) throw error
  return data
}

export async function recordAttendanceBulk(schoolId, classId, date, sessionName, rows, recordedBy) {
  const records = rows.map(r => ({
    school_id: schoolId, class_id: classId, student_id: r.student_id,
    date, attendance_date: date, status: r.status,
    remarks: r.remarks || null, notes: r.notes || null,
    session_name: sessionName, recorded_by: recordedBy
  }))
  const { data, error } = await supabase.from('attendance').upsert(records, {
    onConflict: 'student_id,class_id,attendance_date,session_name', ignoreDuplicates: false
  }).select()
  if (error) throw error
  return data
}

export async function getStudentAttendanceSummary(studentId, schoolId) {
  const { data, error } = await supabase.from('attendance').select('status').eq('student_id', studentId).eq('school_id', schoolId)
  if (error) throw error
  const summary = { present: 0, absent: 0, late: 0, excused: 0, total: data.length }
  data.forEach(r => { summary[r.status] = (summary[r.status] || 0) + 1 })
  return summary
}
