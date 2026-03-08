import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { first_name, last_name, email, password, phone, gender, role, school_id,
            student_number, class_id, enrollment_date,
            employee_number, department, specialization, hire_date,
            relation_type, occupation } = body

    if (!first_name || !last_name || !email || !password || !school_id || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { first_name, last_name }
    })
    if (authErr) throw new Error(authErr.message)
    const userId = authUser.user.id

    const { error: profileErr } = await supabaseAdmin.from('profiles').insert({
      id: userId, school_id, role, first_name, last_name, email,
      phone: phone || null, gender: gender || null, is_active: true
    })
    if (profileErr) { await supabaseAdmin.auth.admin.deleteUser(userId); throw new Error(profileErr.message) }

    if (role === 'student') {
      const { error: sErr } = await supabaseAdmin.from('students').insert({
        profile_id: userId, school_id, class_id: class_id || null,
        student_number: student_number || `STU${Date.now()}`,
        enrollment_date: enrollment_date || new Date().toISOString().split('T')[0], is_active: true
      })
      if (sErr) throw new Error(sErr.message)
    }

    if (role === 'teacher') {
      const { error: tErr } = await supabaseAdmin.from('teachers').insert({
        profile_id: userId, school_id,
        employee_number: employee_number || `EMP${Date.now()}`,
        department: department || null, specialization: specialization || null,
        hire_date: hire_date || new Date().toISOString().split('T')[0], is_active: true
      })
      if (tErr) throw new Error(tErr.message)
    }

    if (role === 'parent') {
      const { error: pErr } = await supabaseAdmin.from('parents').insert({
        profile_id: userId, school_id, relation_type: relation_type || 'parent',
        occupation: occupation || null, phone: phone || null
      })
      if (pErr) throw new Error(pErr.message)
    }

    return NextResponse.json({ success: true, userId })
  } catch (err) {
    console.error('Create user error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
