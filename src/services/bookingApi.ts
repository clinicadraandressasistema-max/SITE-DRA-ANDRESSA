const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
const functionName =
  (import.meta.env.VITE_PUBLIC_BOOKING_FUNCTION as string | undefined) ||
  'public-booking'

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
  startAt?: string
}

export type BookingRequest = {
  patient: BookingPatient
  selection: BookingSelection
  notes?: string
}

async function callPublicBooking(body: Record<string, unknown>) {
  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      'Integração de autoagendamento ainda não configurada.',
    )
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
      body: JSON.stringify(body),
    },
  )

  const text = await response.text()

  let data: any = {}

  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { error: text }
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      `Erro ${response.status}`,
    )
  }

  return data
}

export async function identifyPatient(
  cpf: string,
  phone: string,
) {
  return callPublicBooking({
    action: 'identify',
    cpf,
    phone,
  })
}

export async function checkExistingPatient(
  cpf?: string,
  phone?: string,
) {
  return callPublicBooking({
    action: 'check_existing',
    cpf: cpf || null,
    phone: phone || null,
  })
}

export async function fetchBookingCatalog() {
  return callPublicBooking({
    action: 'catalog',
  })
}

export async function fetchBookingSlots(input: {
  serviceId: string
  locationId: string
  providerId?: string
  from: string
  to: string
}) {
  return callPublicBooking({
    action: 'slots',
    service_id: input.serviceId,
    location_id: input.locationId,
    provider_id: input.providerId || null,
    from: input.from,
    to: input.to,
  })
}

export async function createBooking(
  request: BookingRequest,
) {
  return callPublicBooking({
    action: 'create',

    full_name:
      request.patient.fullName,

    phone:
      request.patient.phone,

    birth_date:
      request.patient.birthDate || null,

    cpf:
      request.patient.cpf || null,

    email:
      request.patient.email || null,

    service_id:
      request.selection.serviceId,

    provider_id:
      request.selection.professionalId,

    location_id:
      request.selection.locationId,

    start_at:
      request.selection.startAt,

    patient_message:
      request.notes || null,
  })
}

export async function fetchReceipt(token: string) {
  return callPublicBooking({
    action: 'receipt',
    token,
  })
}

export async function rescheduleBooking(
  input: Record<string, unknown>,
) {
  return callPublicBooking({
    action: 'reschedule',
    ...input,
  })
}

export async function cancelBooking(
  input: Record<string, unknown>,
) {
  return callPublicBooking({
    action: 'cancel',
    ...input,
  })
}

export async function manageBooking(
  input: Record<string, unknown>,
) {
  return callPublicBooking({
    action: 'manage_booking',
    ...input,
  })
}
