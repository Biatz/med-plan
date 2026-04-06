'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PanicRealtimeRefresh({ patientId }: { patientId: string | null }) {
  const router = useRouter()

  useEffect(() => {
    if (!patientId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`panic-alerts-${patientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'panic_alerts',
          filter: `patient_id=eq.${patientId}`,
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [patientId, router])

  return null
}
