import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

function getBaseUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
  }

  const { data: access } = await supabase
    .from('patient_access')
    .select('patient_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!access?.patient_id) {
    return NextResponse.redirect(new URL('/dashboard?e=no-access', request.url), { status: 303 })
  }

  const { error } = await supabase
    .from('panic_alerts')
    .insert({
      patient_id: access.patient_id,
      triggered_by: user.id,
      status: 'open',
      message: 'Notfall ausgelöst',
    })

  if (error && error.code !== '23505') {
    return NextResponse.redirect(
      new URL('/dashboard?e=' + encodeURIComponent(error.message), request.url),
      { status: 303 }
    )
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (publicKey && privateKey) {
    webpush.setVapidDetails('mailto:info@angelika.app', publicKey, privateKey)

    const { data: subscriptions } = await admin
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth')

    const recipients = subscriptions || []

    const payload = JSON.stringify({
      title: '!!! NOTFALL !!!',
      body: 'Angelika braucht sofort Hilfe.',
      url: `${getBaseUrl(request)}/dashboard?panic=open`,
      tag: 'panic-alert',
      renotify: true,
      requireInteraction: true,
    })

    const results = await Promise.allSettled(
      recipients.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
      )
    )

    console.log('PUSH recipients:', recipients.length)
    console.log(
      'PUSH results:',
      results.map((r) =>
        r.status === 'fulfilled'
          ? { status: 'fulfilled' }
          : {
              status: 'rejected',
              reason: String(r.reason),
            }
      )
    )
  }

  return NextResponse.redirect(new URL('/dashboard?panic=ok', request.url), { status: 303 })
}
