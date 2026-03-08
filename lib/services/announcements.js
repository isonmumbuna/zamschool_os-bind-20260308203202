import { supabase } from '../supabase'

export async function getAnnouncements(schoolId, filters = {}) {
  let q = supabase.from('announcements').select('*, profiles(first_name, last_name)').eq('school_id', schoolId)
  if (filters.status) q = q.eq('status', filters.status)
  if (filters.audience) q = q.eq('audience', filters.audience)
  const { data, error } = await q.order('publish_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createAnnouncement(payload) {
  const { data, error } = await supabase.from('announcements').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateAnnouncement(id, updates) {
  const { data, error } = await supabase.from('announcements').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteAnnouncement(id) {
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw error
}

export async function markAnnouncementSeen(announcementId, profileId) {
  const { error } = await supabase.from('announcement_seen').upsert(
    { announcement_id: announcementId, profile_id: profileId },
    { onConflict: 'announcement_id,profile_id' }
  )
  if (error) throw error
}
