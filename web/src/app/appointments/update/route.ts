import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const id = String(formData.get('id') || '')
  const kind = String(formData.get('kind') || 'private')
  const title = String(formData.get('title') || '')
  const date = String(formData.get('date') || '')
  const time = String(formData.get('time') || '')
  const location = String(formData.get('location') || '')
  const notes = String(formData.get('notes') || '')

  const supabase = await createClient()

  if (!id || !title || !date || !time) {
    return NextResponse.redirect(new URL('/dashboard?e=appointment-update-missing-fields', request.url), { status: 303 })
  }

  const appointmentAt = `${date}T${time}:00`

  const { error } = await supabase
    .from('appointments')
    .update({
      kind,
      title,
      appointment_at: appointmentAt,
      location: location || null,
      notes: notes || null,
    })
    .eq('id', id)

  if (error) {
    return NextResponse.redirect(
      new URL('/dashboard?e=' + encodeURIComponent(error.message), request.url),
      { status: 303 }
    )
  }

  return NextResponse.redirect(new URL('/dashboard?appointment=updated', request.url), { status: 303 })
}
