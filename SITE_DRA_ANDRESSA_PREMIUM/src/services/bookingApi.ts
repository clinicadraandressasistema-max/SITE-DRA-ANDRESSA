const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
const functionName = (import.meta.env.VITE_PUBLIC_BOOKING_FUNCTION as string | undefined) || 'public-booking'

export type BookingPatient = {
  fullName: string
  phone: string
  birthDate?: string
  cpf?: string
  email?: string
}

export type BookingSelection = {
  serviceId?: string
  serviceName: string
  locationId?: string
  locationName: string
  professionalId?: string
  professionalName: string
  date: string
  time: string
}

export type BookingRequest = {
  patient: BookingPatient
  selection: BookingSelection
  notes?: string
}

export type BookingResponse = {
  ok: boolean
  bookingId?: string
  protocol?: string
  message?: string
  raw?: unknown
}

async function callPublicBooking(body: Record<string, unknown>) {
  if (!supabaseUrl || !publishableKey) {
    throw new Error('Integração de autoagendamento ainda não configurada neste ambiente.')
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
    body: JSON.stringify(body),
  })

  const text = await response.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: text }
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data && 'message' in data ? String((data as { message?: unknown }).message) : `Erro ${response.status}`
    throw new Error(message)
  }

  return data
}

export async function fetchBookingBootstrap() {
  return callPublicBooking({ action: 'bootstrap' })
}

export async function identifyPatient(patient: BookingPatient) {
  return callPublicBooking({ action: 'identify_patient', patient })
}

export async function fetchAvailability(filters: Record<string, unknown>) {
  return callPublicBooking({ action: 'availability', ...filters })
}

export async function createBooking(request: BookingRequest): Promise<BookingResponse> {
  const raw = await callPublicBooking({ action: 'create_booking', ...request })
  if (typeof raw === 'object' && raw) {
    const r = raw as Record<string, unknown>
    return {
      ok: r.ok !== false,
      bookingId: r.bookingId ? String(r.bookingId) : r.id ? String(r.id) : undefined,
      protocol: r.protocol ? String(r.protocol) : undefined,
      message: r.message ? String(r.message) : undefined,
      raw,
    }
  }
  return { ok: true, raw }
}

export async function manageBooking(input: Record<string, unknown>) {
  return callPublicBooking({ action: 'manage_booking', ...input })
}
