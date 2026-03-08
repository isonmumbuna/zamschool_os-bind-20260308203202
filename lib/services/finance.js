import { supabase } from '../supabase'

export async function getFinances(schoolId, filters = {}) {
  let q = supabase.from('finances').select('*, profiles(first_name, last_name)').eq('school_id', schoolId)
  if (filters.type) q = q.eq('transaction_type', filters.type)
  if (filters.from) q = q.gte('transaction_date', filters.from)
  if (filters.to) q = q.lte('transaction_date', filters.to)
  const { data, error } = await q.order('transaction_date', { ascending: false })
  if (error) throw error
  return data
}

export async function createFinanceEntry(payload) {
  const { data, error } = await supabase.from('finances').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteFinanceEntry(id) {
  const { error } = await supabase.from('finances').delete().eq('id', id)
  if (error) throw error
}

export async function getFeePayments(schoolId, filters = {}) {
  let q = supabase.from('fee_payments').select('*, students(id, student_number, profiles(first_name, last_name)), parents(id, profiles(first_name, last_name))').eq('school_id', schoolId)
  if (filters.status) q = q.eq('status', filters.status)
  if (filters.studentId) q = q.eq('student_id', filters.studentId)
  const { data, error } = await q.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateFeePaymentStatus(id, status) {
  const { data, error } = await supabase.from('fee_payments').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function submitFeePayment(payload) {
  const { data, error } = await supabase.from('fee_payments').insert(payload).select().single()
  if (error) throw error
  return data
}
