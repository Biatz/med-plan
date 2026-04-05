import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const id = String(formData.get('id') || '')

  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.redirect(
      new URL('/dashboard?e=' + encodeURIComponent(error.message), request.url),
      { status: 303 }
    )
  }

  return NextResponse.redirect(new URL('/dashboard?appointment=deleted', request.url), { status: 303 })
}
