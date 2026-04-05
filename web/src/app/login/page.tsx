'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-md">
        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
            Login
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
            Med-Plan
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Bitte mit deinem Benutzer anmelden.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                E-Mail
              </label>
              <input
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white outline-none transition placeholder:text-[var(--muted)] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
                type="email"
                placeholder="name@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Passwort
              </label>
              <input
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white outline-none transition placeholder:text-[var(--muted)] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
                type="password"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              className="w-full rounded-2xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:opacity-70"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Bitte warten ...' : 'Anmelden'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
