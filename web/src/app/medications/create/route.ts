import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const patientId = String(formData.get('patient_id') || '')
  const name = String(formData.get('name') || '')
  const productName = String(formData.get('product_name') || '')
  const dosage = String(formData.get('dosage') || '')
  const form = String(formData.get('form') || '')
  const route = String(formData.get('route') || '')
  const instructions = String(formData.get('instructions') || '')
  const category = String(formData.get('category') || 'regular')
  const active = String(formData.get('active') || 'true') === 'true'
  const morning = String(formData.get('morning_amount') || '')
  const midday = String(formData.get('midday_amount') || '')
  const evening = String(formData.get('evening_amount') || '')
  const night = String(formData.get('night_amount') || '')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !patientId || !productName) {
    return NextResponse.redirect(new URL('/dashboard?e=missing-fields', request.url), { status: 303 })
  }

  const { error } = await supabase.rpc('create_medication_with_schedules', {
    patient_uuid: patientId,
    med_name: name,
    med_product_name: productName,
    med_dosage: dosage,
    med_form: form,
    med_route: route,
    med_instructions: instructions,
    med_category: category,
    med_active: active,
    morning_amount: morning,
    midday_amount: midday,
    evening_amount: evening,
    night_amount: night,
  })

  if (error) {
    return NextResponse.redirect(
      new URL('/dashboard?e=' + encodeURIComponent(error.message), request.url),
      { status: 303 }
    )
  }

  return NextResponse.redirect(new URL('/dashboard?med=create-ok', request.url), { status: 303 })
}
