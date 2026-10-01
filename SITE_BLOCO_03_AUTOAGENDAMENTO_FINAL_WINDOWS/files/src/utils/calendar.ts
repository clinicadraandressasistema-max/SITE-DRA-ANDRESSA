export type CalendarEventInput = {
  title: string
  startAt: string
  endAt?: string
  durationMinutes?: number
  description?: string
  location?: string
  url?: string
}

function compactUtc(value: Date) {
  return value
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
}

function resolveDates(event: CalendarEventInput) {
  const start = new Date(event.startAt)
  const duration = Math.max(5, Number(event.durationMinutes || 60))
  const end = event.endAt
    ? new Date(event.endAt)
    : new Date(start.getTime() + duration * 60_000)

  return { start, end }
}

export function buildGoogleCalendarUrl(event: CalendarEventInput) {
  const { start, end } = resolveDates(event)
  const query = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${compactUtc(start)}/${compactUtc(end)}`,
    details: event.description || '',
    location: event.location || '',
  })

  if (event.url) query.set('sprop', event.url)

  return `https://calendar.google.com/calendar/render?${query.toString()}`
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

export function downloadCalendarFile(
  event: CalendarEventInput,
  filename = 'agendamento-dra-andressa.ics',
) {
  const { start, end } = resolveDates(event)
  const uid = `dra-andressa-${start.getTime()}-${Math.random().toString(36).slice(2)}@agenda`
  const now = compactUtc(new Date())

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dra. Andressa Dallarmi//Autoagendamento//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${compactUtc(start)}`,
    `DTEND:${compactUtc(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description || '')}`,
    `LOCATION:${escapeIcs(event.location || '')}`,
    event.url ? `URL:${event.url}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Lembrete: consulta amanhã',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Lembrete: consulta em 2 horas',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  const blob = new Blob([lines.join('\r\n')], {
    type: 'text/calendar;charset=utf-8',
  })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(href), 1500)
}
