import { supabase } from '../supabase'

export async function getEvents(schoolId, filters = {}) {
  let q = supabase.from('events').select('*, profiles(first_name, last_name)').eq('school_id', schoolId)
  if (filters.category) q = q.eq('category', filters.category)
  const { data, error } = await q.order('start_date', { ascending: true })
  if (error) throw error
  return data
}

export async function createEvent(payload) {
  const { data, error } = await supabase.from('events').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateEvent(id, updates) {
  const { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteEvent(id) {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}
