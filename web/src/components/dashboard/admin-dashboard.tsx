import PushRegister from '@/components/push-register'

type PanicAlert = {
  id: string
  triggered_at: string
  status: 'open' | 'acknowledged' | 'resolved'
  message: string | null
  acknowledged_name: string | null
}

type MedicationSchedule = {
  id: string
  time_of_day: string
  amount: string | null
}

type MedicationRow = {
  id: string
  product_name: string | null
  dosage: string | null
  active: boolean
  archived: boolean
  category: 'regular' | 'as_needed' | 'pan'
  medication_schedules: MedicationSchedule[] | null
}

type AppointmentRow = {
  id: string
  kind: 'medical' | 'private'
  title: string
  appointment_at: string
  location: string | null
  notes: string | null
}

type OpenIntake = {
  key: string
  medication_id: string
  schedule_id: string
  product_name: string
  amount: string
  planned_for: string
  time_label: string
  is_overdue: boolean
}

type Profile = {
  full_name?: string | null
  role?: string | null
}

export default function AdminDashboard({
  profile,
  patientId,
  patientName,
  openAlerts,
  acknowledgedAlert,
  acknowledgedName,
  medications,
  appointments,
  openIntakes,
  activeRegularMeds,
  archivedMeds,
}: {
  profile: Profile | null
  patientId: string | null
  patientName: string | null
  openAlerts: PanicAlert[]
  acknowledgedAlert: PanicAlert | null
  acknowledgedName: string | null
  medications: MedicationRow[]
  appointments: AppointmentRow[]
  openIntakes: OpenIntake[]
  activeRegularMeds: MedicationRow[]
  archivedMeds: MedicationRow[]
}) {
  const nextAppointment = appointments[0] || null

  return (
    <>
      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-2xl shadow-black/20 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
              Familie / Admin
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
              Hallo {profile?.full_name || 'Nutzer'}
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Rolle: <span className="font-medium text-white">{profile?.role || '-'}</span>
              {patientName ? <> · Patient: <span className="font-medium text-white">{patientName}</span></> : null}
            </p>
            <PushRegister />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-[280px]">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Offene Notfälle</div>
              <div className="mt-2 text-2xl font-bold text-white">{openAlerts.length}</div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Offene Einnahmen</div>
              <div className="mt-2 text-2xl font-bold text-white">{openIntakes.length}</div>
            </div>
          </div>
        </div>
      </section>

      {openAlerts.length ? (
        <section className="rounded-[30px] border border-red-500/40 bg-[linear-gradient(180deg,rgba(220,38,38,0.30),rgba(24,24,27,0.96))] p-6 shadow-2xl shadow-red-950/30 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-red-300/30 bg-red-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-100">
                Notfall aktiv
              </div>
              <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                Hilfe wird benötigt
              </h2>
              <p className="mt-3 text-base text-red-50/90">
                {new Date(openAlerts[0].triggered_at).toLocaleString('de-DE')}
              </p>
              <p className="mt-3 text-base leading-7 text-red-50/90">
                {openAlerts[0].message || 'Kein Zusatztext'}
              </p>
            </div>

            <form className="lg:min-w-[220px]" action="/panic/ack" method="post">
              <input type="hidden" name="id" value={openAlerts[0].id} />
              <button className="w-full rounded-2xl bg-white px-6 py-4 text-lg font-bold text-black transition hover:bg-gray-200">
                Ich übernehme
              </button>
            </form>
          </div>
        </section>
      ) : acknowledgedAlert ? (
        <section className="rounded-[28px] border border-green-500/35 bg-green-500/10 p-5 shadow-2xl shadow-black/20 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-green-100">Notfall übernommen</h2>
              <p className="mt-2 text-base text-green-50/80">
                {acknowledgedName ? `${acknowledgedName} kümmert sich.` : 'Die Familie kümmert sich.'}
              </p>
            </div>

            <form action="/panic/reset" method="post">
              <input type="hidden" name="id" value={acknowledgedAlert.id} />
              <button className="rounded-2xl border border-green-400/30 bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200">
                Als erledigt markieren
              </button>
            </form>
          </div>
        </section>
      ) : (
        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-2xl shadow-black/20 sm:p-7">
          <div className="text-lg font-semibold text-white">Kein aktiver Notfall</div>
          <div className="mt-2 text-sm text-[var(--muted)]">Aktuell liegt kein offener Alarm vor.</div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-2xl shadow-black/20">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Nächster Termin</div>
          {nextAppointment ? (
            <>
              <div className="mt-3 text-xl font-semibold text-white">{nextAppointment.title}</div>
              <div className="mt-2 text-sm text-[var(--muted)]">
                {new Date(nextAppointment.appointment_at).toLocaleString('de-DE')}
              </div>
              {nextAppointment.location ? (
                <div className="mt-2 text-sm text-[var(--muted)]">{nextAppointment.location}</div>
              ) : null}
            </>
          ) : (
            <div className="mt-3 text-sm text-[var(--muted)]">Kein Termin eingetragen</div>
          )}
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-2xl shadow-black/20">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Heute offen</div>
          <div className="mt-3 text-xl font-semibold text-white">
            {openIntakes.length ? `${openIntakes.length} Einnahmen` : 'Alles erledigt'}
          </div>
          <div className="mt-2 text-sm text-[var(--muted)]">
            {openIntakes[0]
              ? `${openIntakes[0].product_name} um ${openIntakes[0].time_label}`
              : 'Heute keine offene Einnahme'}
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-2xl shadow-black/20">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Medikation</div>
          <div className="mt-3 text-xl font-semibold text-white">{activeRegularMeds.length} aktiv</div>
          <div className="mt-2 text-sm text-[var(--muted)]">{archivedMeds.length} archiviert</div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <details className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-2xl shadow-black/20">
          <summary className="cursor-pointer list-none text-lg font-semibold text-white">
            Termine
          </summary>
          <p className="mt-2 text-sm text-[var(--muted)]">Anlegen und bearbeiten</p>

          <form action="/appointments/create" method="post" className="mt-5 grid gap-3">
            <input type="hidden" name="patient_id" value={patientId || ''} />
            <select className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" name="kind" defaultValue="medical">
              <option value="medical">Arzttermin</option>
              <option value="private">Privater Termin</option>
            </select>
            <input className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" type="text" name="title" placeholder="Titel" required />
            <input className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" type="date" name="date" required />
            <input className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" type="time" name="time" required />
            <input className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" type="text" name="location" placeholder="Ort" />
            <textarea className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" name="notes" placeholder="Notizen" rows={3} />
            <button className="rounded-2xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200">
              Termin anlegen
            </button>
          </form>
        </details>

        <details className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-2xl shadow-black/20">
          <summary className="cursor-pointer list-none text-lg font-semibold text-white">
            Medikamente
          </summary>
          <p className="mt-2 text-sm text-[var(--muted)]">Neues Medikament erfassen</p>

          <form action="/medications/create" method="post" className="mt-5 grid gap-3">
            <input type="hidden" name="patient_id" value={patientId || ''} />
            <input className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" type="text" name="product_name" placeholder="Produktname" required />
            <input className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" type="text" name="dosage" placeholder="Dosierung" />
            <select className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" name="category" defaultValue="regular">
              <option value="regular">Feste Medikation</option>
              <option value="as_needed">Bedarf</option>
              <option value="pan">PAN</option>
            </select>
            <select className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" name="active" defaultValue="true">
              <option value="true">aktiv</option>
              <option value="false">nicht aktiv</option>
            </select>
            <textarea className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" name="instructions" placeholder="Hinweise" rows={3} />
            <input className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" type="text" name="morning_amount" placeholder="morgens" />
            <input className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" type="text" name="midday_amount" placeholder="mittags" />
            <input className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" type="text" name="evening_amount" placeholder="abends" />
            <input className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" type="text" name="night_amount" placeholder="nachts" />
            <button className="rounded-2xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200">
              Medikament anlegen
            </button>
          </form>
        </details>

        <details className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-2xl shadow-black/20">
          <summary className="cursor-pointer list-none text-lg font-semibold text-white">
            Verwaltung
          </summary>
          <p className="mt-2 text-sm text-[var(--muted)]">Bestände und offene Aufgaben</p>

          <div className="mt-5 space-y-3">
            {openIntakes.length ? openIntakes.slice(0, 8).map((entry) => (
              <div
                key={entry.key}
                className={`rounded-2xl border p-4 ${
                  entry.is_overdue
                    ? 'border-red-500/30 bg-red-500/10'
                    : 'border-blue-500/30 bg-blue-500/10'
                }`}
              >
                <div className="text-sm font-semibold text-white">{entry.product_name}</div>
                <div className="mt-1 text-xs text-white/75">
                  {entry.time_label}{entry.amount ? ` · ${entry.amount}` : ''}
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-green-500/35 bg-green-500/10 p-4 text-sm text-green-100">
                Keine offenen Einnahmen
              </div>
            )}

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] p-4 text-sm text-[var(--muted)]">
              Aktive Medikamente: <span className="font-medium text-white">{activeRegularMeds.length}</span><br />
              Archiviert: <span className="font-medium text-white">{archivedMeds.length}</span><br />
              Termine gesamt: <span className="font-medium text-white">{appointments.length}</span>
            </div>
          </div>
        </details>
      </section>
    </>
  )
}
