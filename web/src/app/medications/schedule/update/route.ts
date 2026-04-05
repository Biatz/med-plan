import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const id = String(formData.get('id') || '')
  const time = String(formData.get('time') || '')
  const amount = String(formData.get('amount') || '')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !id || !time) {
    return NextResponse.redirect(new URL('/dashboard?e=missing-fields', request.url), { status: 303 })
  }

  const { error } = await supabase.rpc('update_medication_schedule', {
    sched_id: id,
    new_time: time,
    new_amount: amount,
  })

  if (error) {
    return NextResponse.redirect(
      new URL('/dashboard?e=' + encodeURIComponent(error.message), request.url)
    )
  }

  return NextResponse.redirect(new URL('/dashboard?schedule=ok', request.url), { status: 303 })
}
