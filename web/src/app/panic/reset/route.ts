import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const id = String(formData.get('id') || '')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !id) {
    return NextResponse.redirect(new URL('/dashboard?e=no-user-or-id', request.url), { status: 303 })
  }

  const { data, error } = await supabase.rpc('resolve_panic_alert', {
    alert_id: id,
  })

  console.log('RESET rpc:', data, error)

  if (error) {
    return NextResponse.redirect(
      new URL('/dashboard?e=' + encodeURIComponent(error.message), request.url)
    )
  }

  if (!data || data.length === 0) {
    return NextResponse.redirect(new URL('/dashboard?e=no-row-reset', request.url), { status: 303 })
  }

  return NextResponse.redirect(new URL('/dashboard?reset=ok', request.url), { status: 303 })
}
