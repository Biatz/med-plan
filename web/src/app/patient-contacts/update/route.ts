import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const id = String(formData.get('id') || '')
  const patientId = String(formData.get('patient_id') || '')
  const name = String(formData.get('name') || '').trim()
  const role = String(formData.get('role') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const sortOrder = Number(formData.get('sort_order') || 0)
  const isPrimary = formData.get('is_primary') === '1'

  if (!id || !patientId || !name || !phone) redirect('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (isPrimary) {
    await supabase
      .from('patient_contacts')
      .update({ is_primary: false })
      .eq('patient_id', patientId)
      .neq('id', id)
  }

  await supabase
    .from('patient_contacts')
    .update({
      name,
      role: role || null,
      phone,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      is_primary: isPrimary,
    })
    .eq('id', id)

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
