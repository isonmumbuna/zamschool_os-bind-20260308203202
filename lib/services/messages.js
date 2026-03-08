import { supabase } from '../supabase'

export async function getMessages(schoolId, profileId) {
  const { data, error } = await supabase.from('messages')
    .select('*, sender:sender_id(id, first_name, last_name, avatar_url), receiver:receiver_id(id, first_name, last_name, avatar_url)')
    .eq('school_id', schoolId)
    .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function sendMessage(schoolId, senderId, receiverId, content) {
  const { data, error } = await supabase.from('messages').insert({ school_id: schoolId, sender_id: senderId, receiver_id: receiverId, content }).select().single()
  if (error) throw error
  return data
}

export async function markMessageRead(messageId) {
  const { error } = await supabase.from('messages').update({ is_read: true }).eq('id', messageId)
  if (error) throw error
}
