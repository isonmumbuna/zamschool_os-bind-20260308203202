import { supabase } from '../supabase'

export async function getAuditLogs(schoolId, filters = {}) {
  let q = supabase.from('audit_logs').select('*').eq('school_id', schoolId)
  if (filters.action) q = q.eq('action', filters.action)
  if (filters.resourceType) q = q.eq('resource_type', filters.resourceType)
  if (filters.from) q = q.gte('created_at', filters.from)
  if (filters.to) q = q.lte('created_at', filters.to)
  const { data, error } = await q.order('created_at', { ascending: false }).limit(200)
  if (error) throw error
  return data
}

export async function writeAuditLog(schoolId, userId, action, resourceType, resourceId, details = {}) {
  const { error } = await supabase.from('audit_logs').insert({ school_id: schoolId, user_id: userId, action, resource_type: resourceType, resource_id: resourceId, details })
  if (error) console.error('Audit log error:', error)
}
