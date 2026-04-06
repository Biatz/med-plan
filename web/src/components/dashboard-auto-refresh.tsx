'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardAutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh()
    }, 5000)

    return () => window.clearInterval(id)
  }, [router])

  return null
}
