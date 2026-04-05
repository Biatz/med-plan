import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const patientId = String(formData.get('patient_id') || '')
  const kind = String(formData.get('kind') || 'private')
  const title = String(formData.get('title') || '')
  const date = String(formData.get('date') || '')
  const time = String(formData.get('time') || '')
  const location = String(formData.get('location') || '')
  const notes = String(formData.get('notes') || '')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !patientId || !title || !date || !time) {
    return NextResponse.redirect(new URL('/dashboard?e=appointment-missing-fields', request.url), { status: 303 })
  }

  const appointmentAt = `${date}T${time}:00`

  const { error } = await supabase
    .from('appointments')
    .insert({
      patient_id: patientId,
      created_by: user.id,
      kind,
      title,
      appointment_at: appointmentAt,
      location: location || null,
      notes: notes || null,
    })

  if (error) {
    return NextResponse.redirect(
      new URL('/dashboard?e=' + encodeURIComponent(error.message), request.url),
      { status: 303 }
    )
  }

  return NextResponse.redirect(new URL('/dashboard?appointment=create-ok', request.url), { status: 303 })
}
