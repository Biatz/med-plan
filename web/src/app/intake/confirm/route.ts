import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const medicationId = String(formData.get('medication_id') || '')
  const scheduleId = String(formData.get('schedule_id') || '')
  const plannedFor = String(formData.get('planned_for') || '')
  const supabase = await createClient()

  if (!medicationId || !plannedFor) {
    return NextResponse.redirect(new URL('/dashboard?e=intake-missing-fields', request.url), { status: 303 })
  }

  const { error } = await supabase.rpc('confirm_intake', {
    med_id: medicationId,
    sched_id: scheduleId || null,
    planned_at: plannedFor,
  })

  if (error) {
    return NextResponse.redirect(
      new URL('/dashboard?e=' + encodeURIComponent(error.message), request.url),
      { status: 303 }
    )
  }

  return NextResponse.redirect(new URL('/dashboard?intake=ok', request.url), { status: 303 })
}
