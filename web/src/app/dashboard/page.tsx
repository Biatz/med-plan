import Link from 'next/link'
import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import PushRegister from '@/components/push-register'
import DashboardAutoRefresh from '@/components/dashboard-auto-refresh'
import PanicRealtimeRefresh from '@/components/panic-realtime-refresh'
import AdminDashboard from '@/components/dashboard/admin-dashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PanicAlert = {
  id: string
  triggered_at: string
  status: 'open' | 'acknowledged' | 'resolved'
  message: string | null
  acknowledged_by: string | null
  acknowledged_at: string | null
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
  instructions: string | null
  schedule_mode: 'fixed' | 'rolling_interval'
  interval_hours: number | null
  reset_time: string | null
  is_key_med: boolean
  medication_schedules: MedicationSchedule[] | null
}

type AppointmentRow = {
  id: string
  title: string
  appointment_at: string
  location: string | null
  notes: string | null
}

type IntakeEventRow = {
  id: string
  medication_id: string
  schedule_id: string | null
  planned_for: string
  taken_at: string
}

type PatientContactRow = {
  id: string
  name: string
  role: string | null
  phone: string
  is_primary: boolean
  sort_order: number
}

type TodayDose = {
  key: string
  medicationId: string
  medication: string
  scheduleId: string | null
  amount: string
  time: string
  plannedForIso: string
  minutes: number
  isTaken: boolean
  isKey: boolean
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function timeToMinutes(value: string) {
  const [hh, mm] = value.slice(0, 5).split(':').map(Number)
  return hh * 60 + mm
}

export default async function DashboardPage() {
  noStore()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const { data: patients } = await supabase
    .from('patient_access')
    .select('access_role, patients(id, full_name)')
    .eq('user_id', user.id)

  const patientRow = Array.isArray(patients) && patients.length
    ? (Array.isArray((patients[0] as any).patients)
        ? (patients[0] as any).patients[0]
        : (patients[0] as any).patients)
    : null

  const patientId = patientRow?.id ?? null
  const patientName = patientRow?.full_name ?? null

  let alerts: PanicAlert[] = []
  let medications: MedicationRow[] = []
  let appointments: AppointmentRow[] = []
  let intakeEvents: IntakeEventRow[] = []
  let contacts: PatientContactRow[] = []

  const now = new Date()
  const dayStart = startOfDay(now)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  if (patientId) {
    const { data: alertData } = await supabase
      .from('panic_alerts')
      .select('id, triggered_at, status, message, acknowledged_by, acknowledged_at, acknowledged_name')
      .eq('patient_id', patientId)
      .order('triggered_at', { ascending: false })
    alerts = (alertData || []) as PanicAlert[]

    const { data: medData } = await supabase
      .from('medications')
      .select('id, product_name, dosage, active, archived, category, instructions, schedule_mode, interval_hours, reset_time, is_key_med, medication_schedules(id, time_of_day, amount)')
      .eq('patient_id', patientId)
      .order('category', { ascending: true })
      .order('product_name', { ascending: true })
    medications = (medData || []) as MedicationRow[]

    const { data: appointmentData } = await supabase
      .from('appointments')
      .select('id, title, appointment_at, location, notes')
      .eq('patient_id', patientId)
      .gte('appointment_at', new Date().toISOString())
      .order('appointment_at', { ascending: true })
    appointments = (appointmentData || []) as AppointmentRow[]

    const { data: intakeData } = await supabase
      .from('intake_events')
      .select('id, medication_id, schedule_id, planned_for, taken_at')
      .eq('patient_id', patientId)
      .gte('planned_for', dayStart.toISOString())
      .lt('planned_for', dayEnd.toISOString())
      .order('planned_for', { ascending: true })
    intakeEvents = (intakeData || []) as IntakeEventRow[]

    const { data: contactData } = await supabase
      .from('patient_contacts')
      .select('id, name, role, phone, is_primary, sort_order')
      .eq('patient_id', patientId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    contacts = (contactData || []) as PatientContactRow[]
  }

  const openAlerts = alerts.filter((a) => a.status === 'open')
  const latestAlert = alerts[0] || null
  const openAlert = latestAlert?.status === 'open' ? latestAlert : null
  const acknowledgedAlert = latestAlert?.status === 'acknowledged' ? latestAlert : null

  const acknowledgedName =
    acknowledgedAlert?.acknowledged_name && acknowledgedAlert.acknowledged_name.trim().length > 0
      ? acknowledgedAlert.acknowledged_name
      : null

  const visibleMeds = medications.filter((m) => !m.archived)
  const archivedMeds = medications.filter((m) => m.archived)
  const regularMeds = visibleMeds.filter((m) => m.category === 'regular')
  const activeRegularMeds = regularMeds.filter((m) => m.active)
  const inactiveRegularMeds = regularMeds.filter((m) => !m.active)
  const asNeededMeds = visibleMeds.filter((m) => m.category === 'as_needed')
  const panMeds = visibleMeds.filter((m) => m.category === 'pan')
  const nextAppointment = appointments[0] || null

  const todayStart = new Date(dayStart)
  const tomorrowStart = new Date(dayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const dayAfterTomorrowStart = new Date(dayStart)
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

  const morphineMed = activeRegularMeds.find((m) => m.schedule_mode === 'rolling_interval') || null
  const normalMeds = activeRegularMeds.filter((m) => m.id !== morphineMed?.id)

  const openIntakes = normalMeds.flatMap((med) =>
    (med.medication_schedules || [])
      .slice()
      .sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))
      .map((schedule) => {
        const [hh, mm] = schedule.time_of_day.slice(0, 5).split(':').map(Number)
        const planned = new Date(dayStart)
        planned.setHours(hh, mm, 0, 0)

        const taken = intakeEvents.some((e) =>
          e.medication_id === med.id &&
          e.schedule_id === schedule.id &&
          e.planned_for.slice(0, 16) === planned.toISOString().slice(0, 16)
        )

        return {
          key: `${med.id}-${schedule.id}-${planned.toISOString()}`,
          medication_id: med.id,
          schedule_id: schedule.id,
          product_name: med.product_name || 'Medikament',
          amount: schedule.amount || '',
          planned_for: planned.toISOString(),
          time_label: schedule.time_of_day.slice(0, 5),
          is_overdue: planned.getTime() < now.getTime(),
          taken,
        }
      })
  ).filter((item) => !item.taken)

  if (morphineMed) {
    const lastMorphineEvent = intakeEvents
      .filter((e) => e.medication_id === morphineMed.id)
      .sort((a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime())[0] || null

    const intervalMs = (morphineMed.interval_hours || 8) * 60 * 60 * 1000
    const resetMinutes = morphineMed.reset_time ? timeToMinutes(morphineMed.reset_time) : 8 * 60

    let morphineDue: Date | null = null
    let morphineAmount = '1'

    if (!lastMorphineEvent) {
      morphineDue = new Date(dayStart)
      morphineDue.setHours(8, 0, 0, 0)
      morphineAmount = '2'
    } else {
      const lastTaken = new Date(lastMorphineEvent.taken_at)
      let nextDue = new Date(lastTaken.getTime() + intervalMs)

      const nextDueDayStart = new Date(nextDue)
      nextDueDayStart.setHours(0, 0, 0, 0)

      const resetPoint = new Date(nextDueDayStart)
      resetPoint.setHours(Math.floor(resetMinutes / 60), resetMinutes % 60, 0, 0)

      if (nextDue >= resetPoint) {
        nextDue = resetPoint
        morphineAmount = '2'
      }

      morphineDue = nextDue
    }

    if (morphineDue && morphineDue >= dayStart && morphineDue < dayEnd) {
      const morphineTaken = intakeEvents.some((e) =>
        e.medication_id === morphineMed.id &&
        e.planned_for.slice(0, 16) === morphineDue.toISOString().slice(0, 16)
      )

      if (!morphineTaken) {
        const hh = String(morphineDue.getHours()).padStart(2, '0')
        const mm = String(morphineDue.getMinutes()).padStart(2, '0')

        openIntakes.push({
          key: `morphine-open-${morphineDue.toISOString()}`,
          medication_id: morphineMed.id,
          schedule_id: '',
          product_name: morphineMed.product_name || 'Morphin',
          amount: morphineAmount,
          planned_for: morphineDue.toISOString(),
          time_label: `${hh}:${mm}`,
          is_overdue: morphineDue.getTime() < now.getTime(),
          taken: false,
        })
      }
    }
  }

  openIntakes.sort((a, b) => new Date(a.planned_for).getTime() - new Date(b.planned_for).getTime())

  const todayDoses: TodayDose[] = []

  for (const med of normalMeds) {
    for (const schedule of (med.medication_schedules || []).slice().sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))) {
      const planned = new Date(dayStart)
      const [hh, mm] = schedule.time_of_day.slice(0, 5).split(':').map(Number)
      planned.setHours(hh, mm, 0, 0)

      const isTaken = intakeEvents.some((e) =>
        e.medication_id === med.id &&
        e.schedule_id === schedule.id &&
        e.planned_for.slice(0, 16) === planned.toISOString().slice(0, 16)
      )

      todayDoses.push({
        key: `${med.id}-${schedule.id}-${planned.toISOString()}`,
        medicationId: med.id,
        medication: med.product_name || 'Medikament',
        scheduleId: schedule.id,
        amount: schedule.amount || '',
        time: schedule.time_of_day.slice(0, 5),
        plannedForIso: planned.toISOString(),
        minutes: hh * 60 + mm,
        isTaken,
        isKey: med.is_key_med,
      })
    }
  }

  if (morphineMed) {
    const lastMorphineEvent = intakeEvents
      .filter((e) => e.medication_id === morphineMed.id)
      .sort((a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime())[0] || null

    const resetMinutes = morphineMed.reset_time ? timeToMinutes(morphineMed.reset_time) : 8 * 60
    const intervalMs = (morphineMed.interval_hours || 8) * 60 * 60 * 1000
    const basePlan = [
      { time: '08:00', amount: '2' },
      { time: '16:00', amount: '1' },
      { time: '00:00', amount: '2' },
    ]

    if (!lastMorphineEvent) {
      for (const item of basePlan) {
        const planned = new Date(dayStart)
        const [hh, mm] = item.time.split(':').map(Number)
        planned.setHours(hh, mm, 0, 0)

        const isTaken = intakeEvents.some((e) =>
          e.medication_id === morphineMed.id &&
          e.planned_for.slice(0, 16) === planned.toISOString().slice(0, 16)
        )

        todayDoses.push({
          key: `morphin-base-${item.time}`,
          medicationId: morphineMed.id,
          medication: morphineMed.product_name || 'Morphin',
          scheduleId: null,
          amount: item.amount,
          time: item.time,
          plannedForIso: planned.toISOString(),
          minutes: hh * 60 + mm,
          isTaken,
          isKey: true,
        })
      }
    } else {
      const lastTaken = new Date(lastMorphineEvent.taken_at)
      let nextDue = new Date(lastTaken.getTime() + intervalMs)

      const nextDueDayStart = new Date(nextDue)
      nextDueDayStart.setHours(0, 0, 0, 0)

      const resetPoint = new Date(nextDueDayStart)
      resetPoint.setHours(Math.floor(resetMinutes / 60), resetMinutes % 60, 0, 0)

      if (nextDue >= resetPoint) {
        nextDue = resetPoint
      }

      if (nextDue >= dayStart && nextDue < dayEnd) {
        const hh = String(nextDue.getHours()).padStart(2, '0')
        const mm = String(nextDue.getMinutes()).padStart(2, '0')
        const label = `${hh}:${mm}`

        const isTaken = intakeEvents.some((e) =>
          e.medication_id === morphineMed.id &&
          e.planned_for.slice(0, 16) === nextDue.toISOString().slice(0, 16)
        )

        todayDoses.push({
          key: `morphin-dynamic-${nextDue.toISOString()}`,
          medicationId: morphineMed.id,
          medication: morphineMed.product_name || 'Morphin',
          scheduleId: null,
          amount: label === '08:00' ? '2' : '1',
          time: label,
          plannedForIso: nextDue.toISOString(),
          minutes: nextDue.getHours() * 60 + nextDue.getMinutes(),
          isTaken,
          isKey: true,
        })
      }
    }
  }

  todayDoses.sort((a, b) => a.minutes - b.minutes)

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const nextMedication =
    todayDoses.find((d) => !d.isTaken && d.minutes >= currentMinutes)
    || todayDoses.find((d) => !d.isTaken)
    || null

  const lastMorphineEvent = morphineMed
    ? intakeEvents
        .filter((e) => e.medication_id === morphineMed.id)
        .sort((a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime())[0] || null
    : null

  const morphineOpenEntry = openIntakes.find((entry) => entry.medication_id === morphineMed?.id) || null

  const timeText = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const dateText = now.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6">
      <DashboardAutoRefresh />
      <PanicRealtimeRefresh patientId={patientId} />
      <div className="mx-auto max-w-4xl space-y-4">
        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-4 shadow-2xl shadow-black/20 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="inline-flex items-center rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5">
              Start
            </Link>

            <form action="/auth/signout" method="post">
              <button className="inline-flex items-center rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5" type="submit">
                Abmelden
              </button>
            </form>
          </div>
        </section>

        {profile?.role === 'patient' ? (
          <>
            <section className="rounded-[32px] border border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-2xl shadow-black/20 sm:p-6">
              <div className="text-center">
                <div className="text-6xl font-bold tracking-tight text-white sm:text-7xl">{timeText}</div>
                <div className="mt-3 text-lg capitalize text-[var(--muted)] sm:text-2xl">{dateText}</div>
              </div>
            </section>

            <section className="rounded-[32px] border border-red-500/35 bg-[linear-gradient(180deg,rgba(220,38,38,0.22),rgba(127,29,29,0.16))] p-4 shadow-2xl shadow-red-950/30 sm:p-5">
              <form action="/panic" method="post">
                <button className="w-full rounded-[28px] bg-[var(--danger)] px-5 py-8 text-2xl font-bold tracking-wide text-white shadow-xl shadow-red-950/40 transition hover:brightness-110 active:scale-[0.99] sm:py-10 sm:text-4xl">
                  HILFE HOLEN
                </button>
              </form>
            </section>

            <section className="rounded-[32px] border border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-2xl shadow-black/20 sm:p-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-white sm:text-2xl">
                  Hallo {profile?.full_name || 'Angelika'}
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-2xl shadow-black/20 sm:p-6">
              <div className="text-center">
                <div className="text-base font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Termine
                </div>
              </div>

              {appointments.length ? (
                <div className="mt-4 space-y-4">
                  {appointmentsToday.length ? (
                    <div>
                      <div className="text-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        Heute
                      </div>
                      <div className="mt-2 space-y-2">
                        {appointmentsToday.map((appointment) => (
                          <div
                            key={appointment.id}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3"
                          >
                            <div className="text-sm font-semibold text-white">
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
                      <div className="text-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        Morgen
                      </div>
                      <div className="mt-2 space-y-2">
                        {appointmentsTomorrow.map((appointment) => (
                          <div
                            key={appointment.id}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3"
                          >
                            <div className="text-sm font-semibold text-white">
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
                      <div className="text-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        Später
                      </div>
                      <div className="mt-2 space-y-2">
                        {appointmentsLater.slice(0, 3).map((appointment) => (
                          <div
                            key={appointment.id}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-4 py-3"
                          >
                            <div className="text-sm font-semibold text-white">
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
                <div className="mt-3 text-center text-base text-[var(--muted)]">Kein Termin eingetragen</div>
              )}
            </section>

            <section className="rounded-[32px] border border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-2xl shadow-black/20 sm:p-6">
              <div className="text-center">
                <div className="text-base font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Nächstes Medikament
                </div>
                {nextMedication ? (
                  <>
                    <div className="mt-3 text-xl font-bold text-white">{nextMedication.medication}</div>
                    <div className="mt-2 text-base text-[var(--muted)] sm:text-lg">
                      um {nextMedication.time}{nextMedication.amount ? ` · ${nextMedication.amount}` : ''}
                    </div>
                    <form action="/intake/confirm" method="post" className="mt-4">
                      <input type="hidden" name="medication_id" value={nextMedication.medicationId} />
                      <input type="hidden" name="schedule_id" value={nextMedication.scheduleId || ''} />
                      <input type="hidden" name="planned_for" value={nextMedication.plannedForIso} />
                      <button className="rounded-2xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200">
                        genommen
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="mt-3 text-base text-[var(--muted)]">Keine Einnahme geplant</div>
                )}
              </div>
            </section>

            {openAlert ? (
              <section className="rounded-[32px] border border-amber-500/35 bg-amber-500/10 p-5 text-center shadow-2xl shadow-black/20 sm:p-6">
                <div className="text-xl font-bold text-amber-100 sm:text-2xl">Familie wurde informiert</div>
                <div className="mt-3 text-base text-amber-50/80 sm:text-lg">
                  Bitte warten. Jemand aus der Familie kümmert sich.
                </div>
              </section>
            ) : acknowledgedAlert ? (
              <section className="rounded-[32px] border border-green-500/35 bg-green-500/10 p-5 text-center shadow-2xl shadow-black/20 sm:p-6">
                <div className="text-xl font-bold text-green-100 sm:text-2xl">Hilfe wurde angenommen</div>
                <div className="mt-3 text-base text-green-50/80 sm:text-lg">
                  {acknowledgedName ? `${acknowledgedName} kümmert sich.` : 'Die Familie kümmert sich.'}
                </div>
              </section>
            ) : (
              <section className="rounded-[32px] border border-[var(--border)] bg-[var(--card)]/95 p-5 text-center shadow-2xl shadow-black/20 sm:p-6">
                <div className="text-lg font-semibold text-white sm:text-xl">Alles ruhig</div>
                <div className="mt-2 text-base text-[var(--muted)]">
                  Es liegt aktuell kein offener Notfall vor.
                </div>
              </section>
            )}

          </>
        ) : (
          <AdminDashboard
            profile={profile}
            patientId={patientId}
            patientName={patientName}
            openAlerts={openAlerts}
            acknowledgedAlert={acknowledgedAlert}
            acknowledgedName={acknowledgedName}
            appointments={appointments}
            openIntakes={openIntakes}
            activeRegularMeds={activeRegularMeds}
            archivedMeds={archivedMeds}
            contacts={contacts}
          />
        )}
      </div>
    </main>
  )
}
