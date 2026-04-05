import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
            Familienhilfe
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Med-Plan
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            Medikamente, Termine und Notfallhilfe in einer klaren, ruhigen und gut lesbaren Oberfläche.
          </p>

          {user ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-sm text-[var(--muted)]">
                Angemeldet als <span className="font-medium text-white">{user.email}</span>
              </div>
              <Link
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200"
                href="/dashboard"
              >
                Zum Dashboard
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-5 py-3 font-medium text-white transition hover:bg-white/5 sm:w-auto"
                  type="submit"
                >
                  Abmelden
                </button>
              </form>
            </div>
          ) : (
            <div className="mt-8">
              <Link
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200"
                href="/login"
              >
                Login
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
