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

type PatientContactRow = {
  id: string
  name: string
  role: string | null
  phone: string
  is_primary: boolean
  sort_order: number
}

export default function AdminDashboard({
  profile,
  patientId,
  patientName,
  openAlerts,
  acknowledgedAlert,
  acknowledgedName,
  appointments,
  openIntakes,
  activeRegularMeds,
  archivedMeds,
  contacts,
}: {
  profile: Profile | null
  patientId: string | null
  patientName: string | null
  openAlerts: PanicAlert[]
  acknowledgedAlert: PanicAlert | null
  acknowledgedName: string | null
  appointments: AppointmentRow[]
  openIntakes: OpenIntake[]
  activeRegularMeds: MedicationRow[]
  archivedMeds: MedicationRow[]
  contacts: PatientContactRow[]
}) {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const dayAfterTomorrowStart = new Date(todayStart)
  dayAfterTomorrowStart.setDate(dayAfterTomorrowStart.getDate() + 2)

  const appointmentsToday = appointments.filter((appointment) => {
    const d = new Date(appointment.appointment_at)
    return d >= todayStart && d < tomorrowStart
  })

  const appointmentsTomorrow = appointments.filter((appointment) => {
    const d = new Date(appointment.appointment_at)
    return d >= tomorrowStart && d < dayAfterTomorrowStart
  })

  const appointmentsLater = appointments.filter((appointment) => {
    const d = new Date(appointment.appointment_at)
    return d >= dayAfterTomorrowStart
  })

  const emergencyContacts = contacts.filter((contact) => contact.phone)

  const contactLabel = (contact: PatientContactRow) =>
    contact.role ? `${contact.name} (${contact.role})` : contact.name

  const contactHref = (phone: string) => `tel:${phone.replace(/\s+/g, '')}`

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
              <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Notfälle</div>
              <div className="mt-2 text-2xl font-bold text-white">{openAlerts.length}</div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Offen heute</div>
              <div className="mt-2 text-2xl font-bold text-white">{openIntakes.length}</div>
            </div>
          </div>
        </div>
      </section>

      {openAlerts.length ? (
        <section className="rounded-[34px] border-2 border-red-400/70 bg-[linear-gradient(180deg,rgba(220,38,38,0.42),rgba(127,29,29,0.22),rgba(24,24,27,0.98))] p-6 shadow-[0_0_0_1px_rgba(248,113,113,0.18),0_20px_60px_rgba(127,29,29,0.45)] sm:p-8">
          <div className="rounded-2xl border border-red-300/25 bg-red-950/20 px-4 py-3 text-center text-sm font-black uppercase tracking-[0.35em] text-red-100">
            !!! NOTFALL AKTIV !!!
          </div>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-red-200/30 bg-red-500/25 px-4 py-2 text-sm font-bold uppercase tracking-[0.22em] text-red-50">
                Sofort reagieren
              </div>

              <h2 className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl">
                Hilfe wird jetzt benötigt
              </h2>

              <p className="mt-4 text-lg font-semibold text-red-50">
                {new Date(openAlerts[0].triggered_at).toLocaleString('de-DE')}
              </p>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-red-50/95">
                {openAlerts[0].message || 'Es wurde ein Notfall ohne Zusatztext ausgelöst.'}
              </p>
            </div>

            <div className="lg:min-w-[320px]">
              <form action="/panic/ack" method="post">
                <input type="hidden" name="id" value={openAlerts[0].id} />
                <button className="w-full rounded-[24px] bg-white px-6 py-5 text-xl font-black text-black shadow-xl transition hover:scale-[1.01] hover:bg-red-50">
                  Ich übernehme sofort
                </button>
              </form>

              {emergencyContacts.length ? (
                <div className="mt-4 grid gap-3">
                  {emergencyContacts.map((contact) => (
                    <a
                      key={contact.id}
                      href={contactHref(contact.phone!)}
                      className="rounded-[20px] border border-red-200/30 bg-red-950/35 px-5 py-4 text-center text-base font-bold text-white transition hover:bg-red-900/50"
                    >
                      {contactLabel(contact)} anrufen
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
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
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Termine</div>

          {appointments.length ? (
            <div className="mt-3 space-y-4">
              {appointmentsToday.length ? (
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Heute</div>
                  <div className="mt-2 space-y-2">
                    {appointmentsToday.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--card-2)] px-3 py-2"
                      >
                        <div className="text-sm font-medium text-white">
                          {new Date(appointment.appointment_at).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · {appointment.title}
                        </div>
                        {appointment.location ? (
                          <div className="mt-1 text-xs text-[var(--muted)]">{appointment.location}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {appointmentsTomorrow.length ? (
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Morgen</div>
                  <div className="mt-2 space-y-2">
                    {appointmentsTomorrow.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--card-2)] px-3 py-2"
                      >
                        <div className="text-sm font-medium text-white">
                          {new Date(appointment.appointment_at).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · {appointment.title}
                        </div>
                        {appointment.location ? (
                          <div className="mt-1 text-xs text-[var(--muted)]">{appointment.location}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {appointmentsLater.length ? (
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Später</div>
                  <div className="mt-2 space-y-2">
                    {appointmentsLater.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--card-2)] px-3 py-2"
                      >
                        <div className="text-sm font-medium text-white">
                          {new Date(appointment.appointment_at).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                          })}{' '}
                          ·{' '}
                          {new Date(appointment.appointment_at).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · {appointment.title}
                        </div>
                        {appointment.location ? (
                          <div className="mt-1 text-xs text-[var(--muted)]">{appointment.location}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
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

      <details id="verwaltung" open className="scroll-mt-24 rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-2xl shadow-black/20 sm:p-7">
        <summary className="cursor-pointer list-none text-lg font-semibold text-white">
          Verwaltung
        </summary>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Termine und Medikamente nur bei Bedarf bearbeiten.
        </p>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <section className="rounded-[24px] border border-[var(--border)] bg-[var(--card-2)] p-5">
            <h3 className="text-lg font-semibold text-white">Termin anlegen</h3>
            <form action="/appointments/create" method="post" className="mt-4 grid gap-3">
              <input type="hidden" name="patient_id" value={patientId || ''} />
              <select className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" name="kind" defaultValue="medical">
                <option value="medical">Arzttermin</option>
                <option value="private">Privater Termin</option>
              </select>
              <input className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" type="text" name="title" placeholder="Titel" required />
              <input className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" type="date" name="date" required />
              <input className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" type="time" name="time" required />
              <input className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" type="text" name="location" placeholder="Ort" />
              <textarea className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" name="notes" placeholder="Notizen" rows={3} />
              <button className="rounded-2xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200">
                Termin anlegen
              </button>
            </form>
          </section>

          <section className="rounded-[24px] border border-[var(--border)] bg-[var(--card-2)] p-5">
            <h3 className="text-lg font-semibold text-white">Medikament anlegen</h3>
            <form action="/medications/create" method="post" className="mt-4 grid gap-3">
              <input type="hidden" name="patient_id" value={patientId || ''} />
              <input className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" type="text" name="product_name" placeholder="Produktname" required />
              <input className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" type="text" name="dosage" placeholder="Dosierung" />
              <select className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" name="category" defaultValue="regular">
                <option value="regular">Feste Medikation</option>
                <option value="as_needed">Bedarf</option>
                <option value="pan">PAN</option>
              </select>
              <select className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" name="active" defaultValue="true">
                <option value="true">aktiv</option>
                <option value="false">nicht aktiv</option>
              </select>
              <textarea className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" name="instructions" placeholder="Hinweise" rows={3} />
              <input className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" type="text" name="morning_amount" placeholder="morgens" />
              <input className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" type="text" name="midday_amount" placeholder="mittags" />
              <input className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" type="text" name="evening_amount" placeholder="abends" />
              <input className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" type="text" name="night_amount" placeholder="nachts" />
              <button className="rounded-2xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200">
                Medikament anlegen
              </button>
            </form>
          </section>

          <section className="rounded-[24px] border border-[var(--border)] bg-[var(--card-2)] p-5">
            <h3 className="text-lg font-semibold text-white">Notfallkontakte</h3>

            <form action="/patient-contacts/create" method="post" className="mt-4 grid gap-3">
              <input type="hidden" name="patient_id" value={patientId || ''} />
              <input className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" type="text" name="name" placeholder="Name" required />
              <input className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" type="text" name="role" placeholder="Rolle" />
              <input className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" type="text" name="phone" placeholder="Telefonnummer" required />
              <input className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-white" type="number" name="sort_order" placeholder="Sortierung" defaultValue="0" />
              <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
                <input type="checkbox" name="is_primary" value="1" />
                Primärer Kontakt
              </label>
              <button className="rounded-2xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200">
                Kontakt anlegen
              </button>
            </form>

            <div className="mt-6 space-y-4">
              {contacts.length ? contacts.map((contact) => (
                <form
                  key={contact.id}
                  action="/patient-contacts/update"
                  method="post"
                  className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
                >
                  <input type="hidden" name="id" value={contact.id} />
                  <input type="hidden" name="patient_id" value={patientId || ''} />
                  <input className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" type="text" name="name" defaultValue={contact.name} required />
                  <input className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" type="text" name="role" defaultValue={contact.role || ''} placeholder="Rolle" />
                  <input className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" type="text" name="phone" defaultValue={contact.phone} required />
                  <input className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3 text-white" type="number" name="sort_order" defaultValue={contact.sort_order} />
                  <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
                    <input type="checkbox" name="is_primary" value="1" defaultChecked={contact.is_primary} />
                    Primärer Kontakt
                  </label>
                  <div className="flex gap-3">
                    <button className="rounded-2xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-gray-200">
                      Speichern
                    </button>
                    <button
                      formAction="/patient-contacts/delete"
                      formMethod="post"
                      className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 font-semibold text-red-100 transition hover:bg-red-500/20"
                    >
                      Löschen
                    </button>
                  </div>
                </form>
              )) : (
                <div className="text-sm text-[var(--muted)]">Noch keine Kontakte eingetragen.</div>
              )}
            </div>
          </section>
        </div>
      </details>
    </>
  )
}
