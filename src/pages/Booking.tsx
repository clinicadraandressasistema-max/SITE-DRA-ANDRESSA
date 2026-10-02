import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  MessageCircle,
  RefreshCcw,
  Search,
  UserCheck,
  UserPlus,
  UserRound,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Reveal from '../components/Reveal'
import {
  checkExistingPatient,
  createBooking,
  fetchBookingCatalog,
  fetchBookingSlots,
  fetchBookingMonthSummary,
  identifyPatient,
  manageBooking,
  type BookingPatient,
  type BookingSelection,
} from '../services/bookingApi'
import '../styles/booking-experience-v2.css'
import { whatsappUrl } from '../data/site'
import { buildGoogleCalendarUrl, downloadCalendarFile } from '../utils/calendar'

// BLOCO_30B_AUTOAGENDAMENTO_SEGURO

type AnyRecord = Record<string, unknown>

type IdentityMode =
  | 'choose'
  | 'existing'
  | 'new'

function asRecord(value: unknown): AnyRecord | null {
  return typeof value === 'object' && value !== null
    ? (value as AnyRecord)
    : null
}

function records(value: unknown): AnyRecord[] {
  if (!Array.isArray(value)) return []

  return value
    .map(asRecord)
    .filter(
      (item): item is AnyRecord =>
        item !== null,
    )
}

function text(
  item: AnyRecord | null | undefined,
  keys: string[],
  fallback = '',
) {
  if (!item) return fallback

  for (const key of keys) {
    const value = item[key]

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim()
    ) {
      return String(value)
    }
  }

  return fallback
}

function entityId(
  item: AnyRecord,
  alternatives: string[] = [],
) {
  return text(
    item,
    [
      'id',
      ...alternatives,
    ],
  )
}

function extractCatalog(raw: unknown) {
  const response = asRecord(raw)
  let root: unknown =
    response?.catalog ?? raw

  if (
    Array.isArray(root) &&
    root.length === 1 &&
    asRecord(root[0])
  ) {
    root = root[0]
  }

  const object =
    asRecord(root) || {}

  return {
    services: records(
      object.services ??
      object.servicos,
    ),

    locations: records(
      object.locations ??
      object.unidades,
    ),

    providers: records(
      object.providers ??
      object.professionals ??
      object.profissionais,
    ),
  }
}

function serviceTitle(item?: AnyRecord) {
  return text(
    item,
    [
      'public_name',
      'display_name',
      'name',
      'title',
    ],
    'Serviço',
  )
}

function serviceDescription(
  item?: AnyRecord,
) {
  return text(
    item,
    [
      'public_description',
      'description',
      'subtitle',
    ],
  )
}

function serviceDuration(
  item?: AnyRecord,
) {
  const duration = text(
    item,
    [
      'duration_minutes',
      'duration',
    ],
  )

  if (!duration) return ''

  return `${duration} min`
}

function locationTitle(
  item?: AnyRecord,
) {
  return text(
    item,
    [
      'name',
      'title',
      'display_name',
      'city',
    ],
    'Unidade',
  )
}

function providerTitle(
  item?: AnyRecord,
) {
  return text(
    item,
    [
      'full_name',
      'name',
      'display_name',
      'provider_name',
    ],
    'Profissional',
  )
}

function slotStart(
  item?: AnyRecord,
) {
  return text(
    item,
    [
      'slot_start',
      'start_at',
      'start',
    ],
  )
}

function formatTime(
  iso: string,
) {
  if (!iso) return ''

  try {
    return new Intl.DateTimeFormat(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit',
        timeZone:
          'America/Sao_Paulo',
      },
    ).format(
      new Date(iso),
    )
  } catch {
    return iso
  }
}

function formatDate(
  value: string,
) {
  if (!value) return ''

  const parts =
    value.split('-')

  if (parts.length !== 3) {
    return value
  }

  return [
    parts[2],
    parts[1],
    parts[0],
  ].join('/')
}

function today() {
  try {
    return new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone:
          'America/Sao_Paulo',
      },
    ).format(new Date())
  } catch {
    return new Date()
      .toISOString()
      .slice(0, 10)
  }
}


function shiftBookingMonth(
  value: string,
  delta: number,
) {
  const [year, month] =
    value.split('-').map(Number)

  const date =
    new Date(year, month - 1 + delta, 1)

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
  ].join('-')
}

function bookingMonthBounds(value: string) {
  const [year, month] =
    value.split('-').map(Number)

  const lastDay =
    new Date(year, month, 0).getDate()

  return {
    from:
      value + '-01',
    to:
      value +
      '-' +
      String(lastDay).padStart(2, '0'),
  }
}

function buildBookingCalendarMonth(value: string) {
  const [year, month] =
    value.split('-').map(Number)

  const first =
    new Date(year, month - 1, 1)

  const count =
    new Date(year, month, 0).getDate()

  const cells: Array<string | null> =
    Array.from(
      { length: first.getDay() },
      () => null,
    )

  for (let day = 1; day <= count; day += 1) {
    cells.push(
      value +
        '-' +
        String(day).padStart(2, '0'),
    )
  }

  return cells
}

function bookingMonthLabel(value: string) {
  const [year, month] =
    value.split('-').map(Number)

  const label =
    new Intl.DateTimeFormat(
      'pt-BR',
      {
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Sao_Paulo',
      },
    ).format(
      new Date(year, month - 1, 1),
    )

  return (
    label.charAt(0).toUpperCase() +
    label.slice(1)
  )
}

function addBookingDays(
  value: string,
  days: number,
) {
  const [year, month, day] =
    value.split('-').map(Number)

  const date =
    new Date(year, month - 1, day)

  date.setDate(
    date.getDate() + days,
  )

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function whatsappHelp() {
  return `https://wa.me/5541995969494?text=${encodeURIComponent(
    'Olá! Estou no site da Dra. Andressa e preciso de ajuda para localizar ou conferir meu agendamento.',
  )}`
}

function bookingResultList(raw: unknown) {
  if (Array.isArray(raw)) return records(raw)

  const root = asRecord(raw)
  if (!root) return []

  const list = records(
    root.bookings ??
    root.appointments ??
    root.results ??
    root.items ??
    root.data,
  )

  if (list.length) return list

  const single = asRecord(
    root.booking ??
    root.appointment ??
    root.receipt ??
    root.data,
  )

  return single ? [single] : []
}

function bookingResultStart(item: AnyRecord) {
  return text(item, ['start_at', 'startAt', 'slot_start', 'date'])
}

function bookingResultService(item: AnyRecord) {
  return text(
    item,
    ['service', 'service_name', 'serviceName', 'procedure'],
    'Atendimento',
  )
}

function bookingResultLocation(item: AnyRecord) {
  return text(
    item,
    ['location', 'location_name', 'locationName', 'unit'],
    'Clínica Dra. Andressa',
  )
}

function bookingResultProvider(item: AnyRecord) {
  return text(
    item,
    ['provider', 'provider_name', 'professional', 'professional_name'],
    'Dra. Andressa Dallarmi',
  )
}

function bookingResultProtocol(item: AnyRecord) {
  return text(
    item,
    ['reference', 'protocol', 'booking_protocol', 'protocol_code', 'code'],
    'Agendamento',
  )
}

export default function Booking() {
  const [params] =
    useSearchParams()

  const preselected =
    params.get('servico') || ''

  const [mode, setMode] =
    useState<'book' | 'manage'>(
      'book',
    )

  const [
    identityMode,
    setIdentityMode,
  ] =
    useState<IdentityMode>(
      'choose',
    )

  const [step, setStep] =
    useState(1)

  const [loading, setLoading] =
    useState(false)

  const [
    catalogLoading,
    setCatalogLoading,
  ] =
    useState(false)

  const [
    slotsLoading,
    setSlotsLoading,
  ] =
    useState(false)

  const [error, setError] =
    useState('')

  const [
    identityMessage,
    setIdentityMessage,
  ] =
    useState('')

  const [
    duplicateWarning,
    setDuplicateWarning,
  ] =
    useState(false)

  const [
    existingPhone,
    setExistingPhone,
  ] =
    useState('')

  const [
    existingBirthDate,
    setExistingBirthDate,
  ] =
    useState('')

  const [
    existingEmail,
    setExistingEmail,
  ] =
    useState('')

  const [
    verifiedExisting,
    setVerifiedExisting,
  ] =
    useState(false)

  const [
    patient,
    setPatient,
  ] =
    useState<BookingPatient>({
      fullName: '',
      phone: '',
      birthDate: '',
      email: '',
    })

  const [
    services,
    setServices,
  ] =
    useState<AnyRecord[]>([])

  const [
    locations,
    setLocations,
  ] =
    useState<AnyRecord[]>([])

  const [
    providers,
    setProviders,
  ] =
    useState<AnyRecord[]>([])

  const [
    slots,
    setSlots,
  ] =
    useState<AnyRecord[]>([])

  const [
    monthSummary,
    setMonthSummary,
  ] =
    useState<AnyRecord[]>([])

  const [
    monthLoading,
    setMonthLoading,
  ] =
    useState(false)

  const [
    calendarMonth,
    setCalendarMonth,
  ] =
    useState(
      () => today().slice(0, 7),
    )

  const [
    maxAdvanceDays,
    setMaxAdvanceDays,
  ] =
    useState(180)

  const [
    serviceId,
    setServiceId,
  ] =
    useState('')

  const [
    locationId,
    setLocationId,
  ] =
    useState('')

  const [
    providerId,
    setProviderId,
  ] =
    useState('')

  const [date, setDate] =
    useState('')

  const [
    selectedSlotStart,
    setSelectedSlotStart,
  ] =
    useState('')

  const [notes, setNotes] =
    useState('')

  const [
    success,
    setSuccess,
  ] =
    useState<{
      protocol?: string
      message?: string
      managementToken?: string
      startAt?: string
      patientName?: string
    } | null>(null)

  const [bookingLookupPhone, setBookingLookupPhone] = useState('')
  const [bookingLookupProtocol, setBookingLookupProtocol] = useState('')
  const [bookingLookupLoading, setBookingLookupLoading] = useState(false)
  const [bookingLookupMessage, setBookingLookupMessage] = useState('')
  const [bookingLookupResults, setBookingLookupResults] = useState<AnyRecord[]>([])

  const selectedService =
    useMemo(
      () =>
        services.find(
          (item) =>
            entityId(
              item,
              ['service_id'],
            ) === serviceId,
        ),
      [services, serviceId],
    )

  const selectedLocation =
    useMemo(
      () =>
        locations.find(
          (item) =>
            entityId(
              item,
              ['location_id'],
            ) === locationId,
        ),
      [locations, locationId],
    )

  const selectedProvider =
    useMemo(
      () =>
        providers.find(
          (item) =>
            entityId(
              item,
              ['provider_id'],
            ) === providerId,
        ),
      [providers, providerId],
    )

  const selectedTime =
    formatTime(
      selectedSlotStart,
    )

  const monthSummaryMap =
    useMemo(
      () => {
        const map =
          new Map<string, AnyRecord>()

        monthSummary.forEach(
          (item) => {
            const key =
              text(
                item,
                ['calendar_date', 'date'],
              ).slice(0, 10)

            if (key) {
              map.set(key, item)
            }
          },
        )

        return map
      },
      [monthSummary],
    )

  const bookingCalendarDays =
    useMemo(
      () =>
        buildBookingCalendarMonth(
          calendarMonth,
        ),
      [calendarMonth],
    )

  const lastAllowedBookingDate =
    useMemo(
      () =>
        addBookingDays(
          today(),
          maxAdvanceDays,
        ),
      [maxAdvanceDays],
    )

  const previousBookingMonthDisabled =
    calendarMonth <=
    today().slice(0, 7)

  const nextBookingMonth =
    shiftBookingMonth(
      calendarMonth,
      1,
    )

  const nextBookingMonthDisabled =
    bookingMonthBounds(
      nextBookingMonth,
    ).from >
    lastAllowedBookingDate

  useEffect(() => {
    if (!success) return

    const timer =
      window.setTimeout(
        () => resetAll(),
        90000,
      )

    return () =>
      window.clearTimeout(timer)
  }, [success])

  useEffect(() => {
    if (
      step !== 4 ||
      !serviceId ||
      !locationId ||
      !providerId ||
      !date
    ) {
      return
    }

    void loadSlots()
  }, [
    step,
    serviceId,
    locationId,
    providerId,
    date,
  ])

  useEffect(() => {
    if (
      step !== 4 ||
      !serviceId ||
      !locationId ||
      !providerId
    ) {
      return
    }

    void loadMonthSummary()
  }, [
    step,
    serviceId,
    locationId,
    providerId,
    calendarMonth,
  ])

  async function loadCatalog() {
    setCatalogLoading(true)
    setError('')

    try {
      const response =
        await fetchBookingCatalog()

      const catalog =
        extractCatalog(response)

      setServices(
        catalog.services,
      )

      setLocations(
        catalog.locations,
      )

      setProviders(
        catalog.providers,
      )

      if (preselected) {
        const found =
          catalog.services.find(
            (item) => {
              const id =
                entityId(
                  item,
                  ['service_id'],
                )

              const slug =
                text(
                  item,
                  ['slug', 'code'],
                )

              return (
                id === preselected ||
                slug === preselected
              )
            },
          )

        if (found) {
          setServiceId(
            entityId(
              found,
              ['service_id'],
            ),
          )
        }
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível carregar as opções de agendamento.',
      )
    } finally {
      setCatalogLoading(false)
    }
  }

    async function findExisting() {
    setError('')
    setIdentityMessage('')

    const phone = existingPhone.replace(/\D/g, '')
    const birthDate = existingBirthDate.trim()
    const email = existingEmail.trim().toLowerCase()

    if (phone.length < 10 || !birthDate || !email || !email.includes('@')) {
      setError(
        'Informe telefone/WhatsApp, data de nascimento e e-mail para confirmar seu cadastro.',
      )
      return
    }

    setLoading(true)

    try {
      const result = await identifyPatient(
        existingPhone,
        birthDate,
        email,
      )

      if (result.found && result.fullName) {
        setVerifiedExisting(true)

        setPatient({
          fullName: result.fullName,
          phone: existingPhone,
          birthDate,
          email,
        })

        setIdentityMessage(
          result.message ||
          'Cadastro localizado com sucesso.',
        )

        await loadCatalog()
      } else {
        setVerifiedExisting(false)

        setError(
          'Não foi possível confirmar seu cadastro. Confira as informações digitadas ou fale com a clínica.',
        )
      }
    } catch {
      setVerifiedExisting(false)
      setError(
        'Não foi possível confirmar seu cadastro. Confira as informações digitadas ou fale com a clínica.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function continueExisting() {
    if (!verifiedExisting) return

    setError('')
    setStep(2)
  }

    async function continueNewPatient() {
    setError('')
    setDuplicateWarning(false)

    const phone = patient.phone.replace(/\D/g, '')
    const email = (patient.email ?? '').trim().toLowerCase()

    if (
      !patient.fullName.trim() ||
      phone.length < 10 ||
      !patient.birthDate ||
      !email ||
      !email.includes('@')
    ) {
      setError(
        'Informe nome completo, telefone/WhatsApp, data de nascimento e e-mail para continuar.',
      )
      return
    }

    setLoading(true)

    try {
      const check = await checkExistingPatient(
        patient.phone,
        patient.birthDate,
        email,
      )

      if (check.exists) {
        setDuplicateWarning(true)

        setError(
          'Já pode existir um cadastro associado às informações fornecidas. Para sua segurança, confirme seu cadastro ou fale com a clínica.',
        )
        return
      }

      setPatient({
        ...patient,
        email,
      })

      await loadCatalog()
      setStep(2)
    } catch {
      setError(
        'Não foi possível validar seus dados agora. Confira as informações ou fale com a clínica.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadMonthSummary() {
    setMonthLoading(true)
    setError('')

    try {
      const range =
        bookingMonthBounds(
          calendarMonth,
        )

      const response =
        await fetchBookingMonthSummary({
          serviceId,
          locationId,
          providerId,
          from: range.from,
          to: range.to,
        })

      const object =
        asRecord(response)

      setMonthSummary(
        records(
          object?.days,
        ),
      )

      const maxDays =
        Number(
          object?.max_advance_days ||
          180,
        )

      if (
        Number.isFinite(maxDays) &&
        maxDays > 0
      ) {
        setMaxAdvanceDays(maxDays)
      }
    } catch (e) {
      setMonthSummary([])

      setError(
        e instanceof Error
          ? e.message
          : 'Nao foi possivel carregar o calendario de vagas.',
      )
    } finally {
      setMonthLoading(false)
    }
  }

  async function loadSlots() {
    setSlotsLoading(true)
    setError('')
    setSelectedSlotStart('')

    try {
      const response =
        await fetchBookingSlots({
          serviceId,
          locationId,
          providerId,
          from:
            `${date}T00:00:00-03:00`,
          to:
            `${date}T23:59:59-03:00`,
        })

      const object =
        asRecord(response)

      setSlots(
        records(
          object?.slots,
        ),
      )
    } catch (e) {
      setSlots([])

      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível carregar os horários.',
      )
    } finally {
      setSlotsLoading(false)
    }
  }

  function selectService(
    item: AnyRecord,
  ) {
    const id =
      entityId(
        item,
        ['service_id'],
      )

    setServiceId(id)
    setLocationId('')
    setProviderId('')
    setDate('')
    setSelectedSlotStart('')
    setSlots([])
    setError('')
  }

  function goNext() {
    setError('')

    if (step === 2) {
      if (!serviceId) {
        setError(
          'Escolha um serviço para continuar.',
        )
        return
      }

      if (
        locations.length === 0 ||
        providers.length === 0
      ) {
        setError(
          'Este serviço ainda não possui unidade e profissional liberados para autoagendamento.',
        )
        return
      }
    }

    if (step === 3) {
      if (
        !locationId ||
        !providerId
      ) {
        setError(
          'Escolha a unidade e o profissional.',
        )
        return
      }
    }

    if (step === 4) {
      if (
        !date ||
        !selectedSlotStart
      ) {
        setError(
          'Escolha uma data e um horário disponível.',
        )
        return
      }
    }

    setStep(
      (current) =>
        Math.min(
          5,
          current + 1,
        ),
    )
  }

  async function confirmBooking() {
    if (
      !selectedService ||
      !selectedLocation ||
      !selectedProvider ||
      !selectedSlotStart
    ) {
      setError(
        'Existem informações pendentes no agendamento.',
      )
      return
    }

    setLoading(true)
    setError('')

    try {
      const selection:
        BookingSelection = {
          serviceId,
          serviceName:
            serviceTitle(
              selectedService,
            ),

          locationId,
          locationName:
            locationTitle(
              selectedLocation,
            ),

          professionalId:
            providerId,

          professionalName:
            providerTitle(
              selectedProvider,
            ),

          date,
          time:
            selectedTime,

          startAt:
            selectedSlotStart,
        }

      const response =
        await createBooking({
          patient,
          selection,
          notes,
        })

      const root =
        asRecord(response)

      const receipt =
        asRecord(
          root?.receipt,
        )

      const protocol =
        text(
          receipt,
          [
            'reference',
            'protocol',
            'booking_protocol',
            'protocol_code',
            'code',
          ],
        )

      const managementToken =
        text(root, ['managementToken', 'management_token', 'token']) ||
        text(receipt, ['managementToken', 'management_token', 'token'])

      const confirmationMessage =
        text(receipt, ['confirmation_message', 'message']) ||
        text(root, ['message']) ||
        'Seu agendamento foi registrado com sucesso.'

      setSuccess({
        protocol,
        managementToken,
        startAt: selectedSlotStart,
        patientName: patient.fullName,
        message: confirmationMessage,
      })
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível concluir o agendamento.',
      )
    } finally {
      setLoading(false)
    }
  }

    async function lookupMyBookings() {
    setError('')
    setBookingLookupMessage('')
    setBookingLookupResults([])

    const phone = bookingLookupPhone.replace(/\D/g, '')
    const protocol = bookingLookupProtocol.trim().toUpperCase()

    if (phone.length < 10 || !protocol) {
      setBookingLookupMessage(
        'Informe o protocolo do agendamento e o telefone/WhatsApp utilizado no cadastro.',
      )
      return
    }

    setBookingLookupLoading(true)

    try {
      const response = await manageBooking({
        phone,
        protocol,
        reference: protocol,
      })

      const list = bookingResultList(response)
      setBookingLookupResults(list)

      setBookingLookupMessage(
        list.length
          ? 'Agendamento localizado com segurança.'
          : 'Não foi possível localizar o agendamento. Confira os dados ou fale com a clínica.',
      )
    } catch {
      setBookingLookupMessage(
        'Não foi possível localizar o agendamento. Confira os dados ou fale com a clínica.',
      )
    } finally {
      setBookingLookupLoading(false)
    }
  }

    function resetAll() {
    setIdentityMode('choose')
    setVerifiedExisting(false)
    setExistingPhone('')
    setExistingBirthDate('')
    setExistingEmail('')
    setIdentityMessage('')
    setDuplicateWarning(false)

    setPatient({
      fullName: '',
      phone: '',
      birthDate: '',
      email: '',
    })

    setStep(1)

    setServices([])
    setLocations([])
    setProviders([])
    setSlots([])

    setServiceId('')
    setLocationId('')
    setProviderId('')
    setDate('')
    setSelectedSlotStart('')
    setNotes('')

    setError('')
    setSuccess(null)
  }

  if (success) {
    const calendarEvent = {
      title: `Consulta - ${serviceTitle(selectedService)}`,
      startAt: success.startAt || selectedSlotStart,
      durationMinutes:
        Number(
          text(
            selectedService,
            ['duration_minutes', 'duration'],
            '60',
          ),
        ) || 60,
      location: locationTitle(selectedLocation),
      description: [
        'Agendamento na Clínica Dra. Andressa Dallarmi.',
        `Profissional: ${providerTitle(selectedProvider)}`,
        success.protocol ? `Protocolo: ${success.protocol}` : '',
        'Em caso de dúvida, entre em contato com a clínica.',
      ].filter(Boolean).join('\n'),
      url: window.location.origin + '/agendamento',
    }

    const patientLabel =
      success.patientName ||
      patient.fullName ||
      'Paciente'

    const bookingWhatsapp = whatsappUrl(
      [
        'Olá! Acabei de realizar um autoagendamento pelo site da Dra. Andressa.',
        `Paciente: ${patientLabel}`,
        `Serviço: ${serviceTitle(selectedService)}`,
        `Data: ${formatDate(date)}`,
        `Horário: ${selectedTime}`,
        success.protocol ? `Protocolo: ${success.protocol}` : '',
        '',
        'Gostaria de confirmar as orientações para garantir/reservar este horário, incluindo a regra de pagamento ou sinal quando aplicável.',
      ].filter(Boolean).join('\n'),
    )

    return (
      <section className="booking-page confirmation-page">
        <div className="container confirmation-wrap">
          <div className="confirmation-card">
            <span className="success-icon">
              <Check size={34} />
            </span>

            <span className="eyebrow">
              Agendamento registrado
            </span>

            <h1>
              Tudo certo. Seu horário foi registrado.
            </h1>

            <p>{success.message}</p>

            {success.protocol && (
              <div className="protocol-box">
                <span>Seu protocolo</span>
                <strong>{success.protocol}</strong>
                <small>
                  Guarde este número. Ele ajuda a localizar seu agendamento depois.
                </small>
              </div>
            )}

            <div className="confirmation-summary">
              <div>
                <span>Serviço</span>
                <strong>{serviceTitle(selectedService)}</strong>
              </div>
              <div>
                <span>Profissional</span>
                <strong>{providerTitle(selectedProvider)}</strong>
              </div>
              <div>
                <span>Unidade</span>
                <strong>{locationTitle(selectedLocation)}</strong>
              </div>
              <div>
                <span>Data</span>
                <strong>{formatDate(date)}</strong>
              </div>
              <div>
                <span>Horário</span>
                <strong>{selectedTime}</strong>
              </div>
            </div>

            <div className="booking-payment-notice">
              <strong>Próximo passo: confirmação da reserva</strong>
              <p>
                Para garantir a data e o horário, a equipe da clínica confirmará com você
                a regra deste atendimento. Conforme o serviço, poderá ser solicitado o
                pagamento da consulta ou de uma parte do valor como sinal. A orientação
                será feita de forma individual e a clínica entrará em contato.
              </p>
              <small>
                Se preferir agilizar, você também pode iniciar a conversa pelo WhatsApp.
              </small>
            </div>

            <div className="booking-calendar-actions">
              <a
                className="button button-primary"
                href={bookingWhatsapp}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={17} />
                Falar com a clínica
              </a>

              <a
                className="button button-outline"
                href={buildGoogleCalendarUrl(calendarEvent)}
                target="_blank"
                rel="noreferrer"
              >
                <CalendarDays size={17} />
                Google Agenda
              </a>

              <button
                type="button"
                className="button button-outline"
                onClick={() => downloadCalendarFile(calendarEvent)}
              >
                <CalendarDays size={17} />
                iPhone / Outlook
              </button>
            </div>

            <div className="booking-calendar-note">
              O arquivo de calendário inclui lembretes de 24 horas e 2 horas antes.
            </div>

            <div className="booking-confirmation-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => {
                  setSuccess(null)
                  setMode('manage')
                  setBookingLookupPhone(patient.phone || '')
                  setBookingLookupProtocol(success.protocol || '')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                <Search size={17} />
                Consultar este agendamento
              </button>

              <button
                type="button"
                className="button button-primary"
                onClick={resetAll}
              >
                <RefreshCcw size={17} />
                Fazer novo agendamento
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="booking-page">
      <div className="booking-top">
        <div className="container booking-title-grid">
          <Reveal>
            <span className="eyebrow light">
              Autoagendamento
            </span>

            <h1>
              Seu atendimento
              começa aqui.
            </h1>

            <p>
              Encontre o atendimento ideal,
              escolha o melhor horário
              e faça seu agendamento
              de forma simples e segura.
            </p>
          </Reveal>

          <Reveal
            delay={120}
            className="booking-doctor-visual"
          >
            <div className="booking-doctor-panel">
              <img
                src="/media/images/autoagendamento/dra-andressa-autoagendamento-principal.png"
                alt="Dra. Andressa Dallarmi"
                className="booking-doctor-image"
              />
            </div>
          </Reveal>


        </div>
      </div>

      <div className="container booking-shell">
        <div className="booking-mode-tabs">
          <button
            className={
              mode === 'book'
                ? 'active'
                : ''
            }
            onClick={() =>
              setMode('book')
            }
          >
            Novo agendamento
          </button>

          <button
            className={
              mode === 'manage'
                ? 'active'
                : ''
            }
            onClick={() =>
              setMode('manage')
            }
          >
            Já tenho agendamento
          </button>
        </div>

        {mode === 'manage' ? (
          <div className="manage-booking-card">
            <span className="eyebrow">
              Consultar meu agendamento
            </span>

            <h2>
              Esqueceu a data ou o horário?
            </h2>

            <p>
              Informe os dados usados no agendamento. Você poderá conferir
              data, horário, serviço e unidade e salvar a consulta diretamente
              no calendário do celular.
            </p>

            <div className="manage-booking-form">
              <div className="manage-booking-field">
                <label>Telefone *</label>
                <input
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(41) 99999-9999"
                  value={bookingLookupPhone}
                  onChange={(event) =>
                    setBookingLookupPhone(event.target.value)
                  }
                />
              </div>

              <div className="manage-booking-field">
                <label>Protocolo *</label>
                <input
                  autoComplete="off"
                  placeholder="Número do protocolo"
                  value={bookingLookupProtocol}
                  onChange={(event) =>
                    setBookingLookupProtocol(event.target.value)
                  }
                />
              </div>

              <div className="manage-booking-search">
                <button
                  type="button"
                  className="button button-primary"
                  disabled={bookingLookupLoading}
                  onClick={() => void lookupMyBookings()}
                >
                  <Search size={18} />
                  {bookingLookupLoading
                    ? 'Consultando...'
                    : 'Ver meu agendamento'}
                </button>
              </div>
            </div>

            <small>
              Para sua segurança, a consulta exige protocolo e telefone/WhatsApp.
            </small>

            {bookingLookupMessage && (
              <div className="manage-booking-message">
                {bookingLookupMessage}
              </div>
            )}

            {bookingLookupResults.length > 0 && (
              <div className="manage-booking-results">
                {bookingLookupResults.map((item, index) => {
                  const startAt = bookingResultStart(item)
                  const protocol = bookingResultProtocol(item)
                  const service = bookingResultService(item)
                  const location = bookingResultLocation(item)
                  const provider = bookingResultProvider(item)
                  const status =
                    text(item, ['status'], 'agendado')
                      .replaceAll('_', ' ')

                  const dateTime =
                    startAt
                      ? new Date(startAt)
                      : null

                  const calendarEvent = {
                    title: `Consulta - ${service}`,
                    startAt,
                    durationMinutes:
                      Number(
                        text(
                          item,
                          ['duration_minutes', 'duration'],
                          '60',
                        ),
                      ) || 60,
                    location,
                    description: [
                      'Agendamento na Clínica Dra. Andressa Dallarmi.',
                      `Profissional: ${provider}`,
                      `Protocolo: ${protocol}`,
                    ].join('\n'),
                    url:
                      window.location.origin +
                      '/agendamento',
                  }

                  const help = whatsappUrl(
                    [
                      'Olá! Gostaria de ajuda com este agendamento:',
                      `Protocolo: ${protocol}`,
                      `Serviço: ${service}`,
                      startAt
                        ? `Data/hora: ${new Date(startAt).toLocaleString('pt-BR')}`
                        : '',
                    ].filter(Boolean).join('\n'),
                  )

                  return (
                    <article
                      className="manage-booking-result"
                      key={
                        text(
                          item,
                          ['id', 'appointment_id'],
                          String(index),
                        )
                      }
                    >
                      <div className="manage-booking-result-head">
                        <div>
                          <small>Protocolo</small>
                          <strong>{protocol}</strong>
                        </div>

                        <span className="manage-booking-status">
                          {status}
                        </span>
                      </div>

                      <div className="manage-booking-result-grid">
                        <div>
                          <CalendarDays size={17} />
                          <span>
                            <small>Data</small>
                            <strong>
                              {dateTime
                                ? dateTime.toLocaleDateString('pt-BR')
                                : 'A confirmar'}
                            </strong>
                          </span>
                        </div>

                        <div>
                          <Clock3 size={17} />
                          <span>
                            <small>Horário</small>
                            <strong>
                              {dateTime
                                ? dateTime.toLocaleTimeString(
                                    'pt-BR',
                                    {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    },
                                  )
                                : 'A confirmar'}
                            </strong>
                          </span>
                        </div>

                        <div>
                          <UserRound size={17} />
                          <span>
                            <small>Atendimento</small>
                            <strong>{service}</strong>
                          </span>
                        </div>

                        <div>
                          <MapPin size={17} />
                          <span>
                            <small>Unidade</small>
                            <strong>{location}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="manage-booking-result-actions">
                        {startAt && (
                          <>
                            <a
                              className="button button-outline"
                              href={buildGoogleCalendarUrl(calendarEvent)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <CalendarDays size={16} />
                              Google Agenda
                            </a>

                            <button
                              type="button"
                              className="button button-outline"
                              onClick={() =>
                                downloadCalendarFile(
                                  calendarEvent,
                                  `agendamento-${protocol}.ics`,
                                )
                              }
                            >
                              <CalendarDays size={16} />
                              iPhone / Outlook
                            </button>
                          </>
                        )}

                        <a
                          className="button button-outline"
                          href={help}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle size={16} />
                          Solicitar ajuda
                        </a>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            <div className="manage-help-actions">
              <a
                href={whatsappHelp()}
                target="_blank"
                rel="noreferrer"
                className="button button-outline"
              >
                <MessageCircle size={18} />
                Não encontrei / preciso de ajuda
              </a>
            </div>
          </div>
        ) : (
          <div className="booking-workspace">
            <aside className="booking-steps">
              {[
                [1, 'Identificação', UserRound],
                [2, 'Serviço', CalendarDays],
                [3, 'Unidade', MapPin],
                [4, 'Data e horário', Clock3],
                [5, 'Confirmar', Check],
              ].map(
                ([number, label, Icon]) => {
                  const N =
                    number as number

                  const I =
                    Icon as typeof UserRound

                  return (
                    <button
                      key={N}
                      className={
                        `${
                          step === N
                            ? 'active'
                            : ''
                        } ${
                          step > N
                            ? 'done'
                            : ''
                        }`
                      }
                      onClick={() => {
                        if (step > N) {
                          setStep(N)
                        }
                      }}
                    >
                      <span>
                        <I size={17} />
                      </span>

                      <div>
                        <small>
                          Passo 0{N}
                        </small>

                        <strong>
                          {label as string}
                        </strong>
                      </div>
                    </button>
                  )
                },
              )}
            </aside>

            <div className="booking-form-card">
              {step === 1 && (
                <div className="booking-step-content">
                  <span className="eyebrow">
                    Passo 01
                  </span>

                  <h2>
                    Vamos começar
                    pela sua identificação
                  </h2>

                  <p>
                    Escolha a opção que
                    corresponde ao seu cadastro.
                  </p>

                  {identityMode ===
                    'choose' && (
                    <div className="identity-choice-grid">
                      <button
                        className="identity-choice-card"
                        onClick={() => {
                          setError('')
                          setIdentityMode(
                            'existing',
                          )
                        }}
                      >
                        <span className="identity-icon">
                          <UserCheck size={28} />
                        </span>

                        <div>
                          <small>
                            Já sou paciente
                          </small>

                          <strong>
                            Já tenho cadastro
                          </strong>

                          <p>
                            Localize seu cadastro
                            utilizando telefone, data de nascimento e e-mail.
                          </p>
                        </div>

                        <ChevronRight />
                      </button>

                      <button
                        className="identity-choice-card secondary"
                        onClick={() => {
                          setError('')
                          setIdentityMode(
                            'new',
                          )
                        }}
                      >
                        <span className="identity-icon">
                          <UserPlus size={28} />
                        </span>

                        <div>
                          <small>
                            Primeira vez
                          </small>

                          <strong>
                            Sou paciente novo
                          </strong>

                          <p>
                            Faça seu cadastro
                            para continuar
                            o agendamento.
                          </p>
                        </div>

                        <ChevronRight />
                      </button>
                    </div>
                  )}

                  {identityMode ===
                    'existing' && (
                    <div className="identity-panel">
                      <button
                        className="identity-back"
                        onClick={() => {
                          setError('')
                          setIdentityMessage('')
                          setIdentityMode(
                            'choose',
                          )
                        }}
                      >
                        <ChevronLeft size={17} />
                        Voltar
                      </button>

                      <div className="identity-heading">
                        <span className="identity-heading-icon">
                          <Search size={23} />
                        </span>

                        <div>
                          <h3>
                            Localizar meu cadastro
                          </h3>

                          <p>
                            Para sua segurança, informe
                            telefone/WhatsApp, data de nascimento
                            e e-mail cadastrados na clínica.
                          </p>
                        </div>
                      </div>

                      <div className="form-grid two">
                        <label>
                          Telefone / WhatsApp *
                          <input
                            value={existingPhone}
                            onChange={(e) =>
                              setExistingPhone(e.target.value)
                            }
                            placeholder="(41) 99999-9999"
                            autoComplete="tel"
                            inputMode="tel"
                          />
                        </label>

                        <label>
                          Data de nascimento *
                          <input
                            type="date"
                            value={existingBirthDate}
                            onChange={(e) =>
                              setExistingBirthDate(e.target.value)
                            }
                            autoComplete="bday"
                          />
                        </label>

                        <label className="full">
                          E-mail *
                          <input
                            type="email"
                            value={existingEmail}
                            onChange={(e) =>
                              setExistingEmail(e.target.value)
                            }
                            autoComplete="email"
                            placeholder="seuemail@exemplo.com"
                          />
                        </label>
                      </div>

                      {identityMessage &&
                        verifiedExisting && (
                        <div className="identity-success">
                          <Check size={20} />

                          <div>
                            <strong>
                              Cadastro localizado
                            </strong>

                            <span>
                              {identityMessage}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="identity-actions">
                        {!verifiedExisting ? (
                          <button
                            className="button button-primary"
                            disabled={loading}
                            onClick={findExisting}
                          >
                            <Search size={17} />

                            {loading
                              ? 'Localizando...'
                              : 'Localizar meu cadastro'}
                          </button>
                        ) : (
                          <button
                            className="button button-primary"
                            onClick={
                              continueExisting
                            }
                          >
                            Continuar para agendamento
                            <ChevronRight size={17} />
                          </button>
                        )}

                        <a
                          className="button button-ghost"
                          href={whatsappHelp()}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle size={17} />
                          Preciso de ajuda
                        </a>
                      </div>
                    </div>
                  )}

                  {identityMode ===
                    'new' && (
                    <div className="identity-panel">
                      <button
                        className="identity-back"
                        onClick={() => {
                          setError('')
                          setDuplicateWarning(
                            false,
                          )
                          setIdentityMode(
                            'choose',
                          )
                        }}
                      >
                        <ChevronLeft size={17} />
                        Voltar
                      </button>

                      <div className="identity-heading">
                        <span className="identity-heading-icon">
                          <UserPlus size={23} />
                        </span>

                        <div>
                          <h3>
                            Criar meu cadastro
                          </h3>

                          <p>
                            Para evitar duplicidade, o sistema
                            verificará somente seus dados básicos:
                            telefone, nascimento e e-mail.
                          </p>
                        </div>
                      </div>

                      <div className="form-grid two">
                        <label>
                          Nome completo *
                          <input
                            value={patient.fullName}
                            onChange={(e) =>
                              setPatient({
                                ...patient,
                                fullName: e.target.value,
                              })
                            }
                            autoComplete="name"
                          />
                        </label>

                        <label>
                          Telefone / WhatsApp *
                          <input
                            value={patient.phone}
                            onChange={(e) =>
                              setPatient({
                                ...patient,
                                phone: e.target.value,
                              })
                            }
                            autoComplete="tel"
                            inputMode="tel"
                            placeholder="(41) 99999-9999"
                          />
                        </label>

                        <label>
                          Data de nascimento *
                          <input
                            type="date"
                            value={patient.birthDate}
                            onChange={(e) =>
                              setPatient({
                                ...patient,
                                birthDate: e.target.value,
                              })
                            }
                            autoComplete="bday"
                          />
                        </label>

                        <label>
                          E-mail *
                          <input
                            type="email"
                            value={patient.email}
                            onChange={(e) =>
                              setPatient({
                                ...patient,
                                email: e.target.value,
                              })
                            }
                            autoComplete="email"
                            placeholder="seuemail@exemplo.com"
                          />
                        </label>
                      </div>

                      {duplicateWarning && (
                        <div className="duplicate-warning">
                          <AlertTriangle size={22} />

                          <div>
                            <strong>
                              Você já possui
                              cadastro na clínica
                            </strong>

                            <span>
                              Não criaremos outro
                              paciente com os mesmos
                              dados. Utilize a opção
                              “Já tenho cadastro”.
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="identity-actions">
                        {!duplicateWarning ? (
                          <button
                            className="button button-primary"
                            disabled={loading}
                            onClick={
                              continueNewPatient
                            }
                          >
                            {loading
                              ? 'Verificando...'
                              : 'Continuar'}

                            <ChevronRight size={17} />
                          </button>
                        ) : (
                          <button
                            className="button button-primary"
                            onClick={() => {
                              setError('')
                              setDuplicateWarning(
                                false,
                              )

                              setExistingPhone(
                                patient.phone || '',
                              )

                              setExistingBirthDate(
                                patient.birthDate || '',
                              )

                              setExistingEmail(
                                patient.email || '',
                              )

                              setIdentityMode(
                                'existing',
                              )
                            }}
                          >
                            Já tenho cadastro
                            <ChevronRight size={17} />
                          </button>
                        )}

                        <a
                          className="button button-ghost"
                          href={whatsappHelp()}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle size={17} />
                          Preciso de ajuda
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="booking-step-content">
                  <span className="eyebrow">
                    Passo 02
                  </span>

                  <h2>
                    O que você deseja agendar?
                  </h2>

                  <p>
                    Abaixo aparecem somente
                    os serviços liberados
                    pelo sistema administrativo.
                  </p>

                  {catalogLoading ? (
                    <div className="booking-empty">
                      Carregando serviços...
                    </div>
                  ) : services.length === 0 ? (
                    <div className="booking-empty important">
                      <CalendarDays size={27} />

                      <div>
                        <strong>
                          Nenhum serviço disponível
                          para autoagendamento
                        </strong>

                        <span>
                          Assim que a clínica
                          liberar um serviço
                          no sistema,
                          ele aparecerá aqui.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="choice-grid">
                      {services.map(
                        (service) => {
                          const id =
                            entityId(
                              service,
                              ['service_id'],
                            )

                          if (!id) return null

                          return (
                            <button
                              key={id}
                              className={
                                serviceId === id
                                  ? 'selected'
                                  : ''
                              }
                              onClick={() =>
                                selectService(
                                  service,
                                )
                              }
                            >
                              <small>
                                Serviço disponível
                              </small>

                              <strong>
                                {serviceTitle(
                                  service,
                                )}
                              </strong>

                              {serviceDescription(
                                service,
                              ) && (
                                <span>
                                  {serviceDescription(
                                    service,
                                  )}
                                </span>
                              )}

                              {serviceDuration(
                                service,
                              ) && (
                                <span className="service-duration">
                                  <Clock3 size={14} />
                                  {serviceDuration(
                                    service,
                                  )}
                                </span>
                              )}
                            </button>
                          )
                        },
                      )}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="booking-step-content">
                  <span className="eyebrow">
                    Passo 03
                  </span>

                  <h2>
                    Onde e com quem?
                  </h2>

                  <p>
                    Unidades e profissionais
                    são carregados das
                    configurações da clínica.
                  </p>

                  <div className="choice-grid compact">
                    <div className="choice-group">
                      <h3>
                        Unidade
                      </h3>

                      {locations.length === 0 ? (
                        <div className="booking-empty small">
                          Nenhuma unidade
                          liberada.
                        </div>
                      ) : (
                        locations.map(
                          (location) => {
                            const id =
                              entityId(
                                location,
                                ['location_id'],
                              )

                            if (!id) return null

                            return (
                              <button
                                key={id}
                                className={
                                  locationId === id
                                    ? 'selected'
                                    : ''
                                }
                                onClick={() => {
                                  setLocationId(
                                    id,
                                  )
                                  setDate('')
                                  setSelectedSlotStart(
                                    '',
                                  )
                                }}
                              >
                                <MapPin size={18} />

                                <strong>
                                  {locationTitle(
                                    location,
                                  )}
                                </strong>
                              </button>
                            )
                          },
                        )
                      )}
                    </div>

                    <div className="choice-group">
                      <h3>
                        Profissional
                      </h3>

                      {providers.length === 0 ? (
                        <div className="booking-empty small">
                          Nenhum profissional
                          liberado.
                        </div>
                      ) : (
                        providers.map(
                          (provider) => {
                            const id =
                              entityId(
                                provider,
                                ['provider_id'],
                              )

                            if (!id) return null

                            return (
                              <button
                                key={id}
                                className={
                                  providerId === id
                                    ? 'selected'
                                    : ''
                                }
                                onClick={() => {
                                  setProviderId(
                                    id,
                                  )
                                  setDate('')
                                  setSelectedSlotStart(
                                    '',
                                  )
                                }}
                              >
                                <UserRound size={18} />

                                <strong>
                                  {providerTitle(
                                    provider,
                                  )}
                                </strong>
                              </button>
                            )
                          },
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* BLOCO_32_CALENDARIO_MENSAL_UI */}
              {step === 4 && (
                <div className="booking-step-content">
                  <style>{`
                    .booking-month-shell {
                      margin-top: 28px;
                      border: 1px solid #eadde0;
                      border-radius: 24px;
                      padding: 22px;
                      background: linear-gradient(180deg,#fff 0%,#fffafa 100%);
                    }
                    .booking-month-head {
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      gap: 12px;
                      margin-bottom: 18px;
                    }
                    .booking-month-title {
                      font-size: 21px;
                      font-weight: 800;
                      color: #1f1c1d;
                      text-align: center;
                    }
                    .booking-month-arrow {
                      width: 42px;
                      height: 42px;
                      border-radius: 13px;
                      border: 1px solid #eadde0;
                      background: #fff;
                      color: #7b0e29;
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      cursor: pointer;
                    }
                    .booking-month-arrow:disabled {
                      opacity: .3;
                      cursor: not-allowed;
                    }
                    .booking-calendar-grid {
                      display: grid;
                      grid-template-columns: repeat(7,minmax(0,1fr));
                      gap: 8px;
                    }
                    .booking-weekday {
                      text-align: center;
                      font-size: 11px;
                      font-weight: 800;
                      letter-spacing: .06em;
                      color: #8a7379;
                      padding: 8px 2px;
                    }
                    .booking-day {
                      min-height: 84px;
                      border-radius: 16px;
                      border: 1px solid #ece6e8;
                      padding: 9px 7px;
                      background: #f7f6f6;
                      color: #8d898a;
                      text-align: left;
                      display: flex;
                      flex-direction: column;
                      justify-content: space-between;
                      gap: 5px;
                    }
                    button.booking-day {
                      cursor: pointer;
                    }
                    .booking-day.available {
                      background: #effaf3;
                      border-color: #b9e4c8;
                      color: #155b32;
                      box-shadow: 0 7px 20px rgba(22,112,61,.06);
                    }
                    .booking-day.available:hover {
                      transform: translateY(-1px);
                      border-color: #75c593;
                    }
                    .booking-day.sold-out {
                      background: #fff9e7;
                      border-color: #f1d98a;
                      color: #815d00;
                    }
                    .booking-day.selected {
                      outline: 2px solid #7b0e29;
                      outline-offset: 1px;
                      box-shadow: 0 8px 24px rgba(123,14,41,.13);
                    }
                    .booking-day.outside {
                      opacity: .42;
                    }
                    .booking-day-number {
                      font-size: 15px;
                      font-weight: 800;
                      line-height: 1;
                    }
                    .booking-day-status {
                      font-size: 10px;
                      font-weight: 750;
                      line-height: 1.15;
                    }
                    .booking-calendar-legend {
                      display: flex;
                      flex-wrap: wrap;
                      gap: 12px 18px;
                      margin-top: 15px;
                      font-size: 12px;
                      color: #6e6164;
                    }
                    .booking-calendar-legend span {
                      display: inline-flex;
                      align-items: center;
                      gap: 7px;
                    }
                    .booking-calendar-dot {
                      width: 9px;
                      height: 9px;
                      border-radius: 50%;
                      display: inline-block;
                    }
                    .booking-selected-date {
                      margin-top: 24px;
                      margin-bottom: 12px;
                      font-size: 16px;
                      font-weight: 750;
                      color: #341f25;
                    }
                    .booking-calendar-loading {
                      text-align: center;
                      padding: 10px;
                      margin-bottom: 12px;
                      color: #7b0e29;
                      font-size: 13px;
                      font-weight: 700;
                    }
                    @media (max-width: 680px) {
                      .booking-month-shell {
                        padding: 14px 10px;
                        border-radius: 18px;
                      }
                      .booking-calendar-grid {
                        gap: 4px;
                      }
                      .booking-day {
                        min-height: 65px;
                        border-radius: 11px;
                        padding: 7px 4px;
                      }
                      .booking-day-number {
                        font-size: 13px;
                      }
                      .booking-day-status {
                        font-size: 8px;
                      }
                      .booking-month-title {
                        font-size: 17px;
                      }
                      .booking-month-arrow {
                        width: 36px;
                        height: 36px;
                      }
                    }
                  `}</style>

                  <span className="eyebrow">
                    Passo 04
                  </span>

                  <h2>
                    Escolha data e horário
                  </h2>

                  <p>
                    Veja as vagas do mês e selecione uma data.
                    Depois escolha um dos horários disponíveis.
                  </p>

                  <div className="booking-month-shell">
                    <div className="booking-month-head">
                      <button
                        type="button"
                        className="booking-month-arrow"
                        disabled={previousBookingMonthDisabled}
                        onClick={() => {
                          setCalendarMonth(
                            shiftBookingMonth(
                              calendarMonth,
                              -1,
                            ),
                          )
                          setDate('')
                          setSelectedSlotStart('')
                          setSlots([])
                        }}
                        aria-label="Mês anterior"
                      >
                        <ChevronLeft size={20} />
                      </button>

                      <div className="booking-month-title">
                        {bookingMonthLabel(
                          calendarMonth,
                        )}
                      </div>

                      <button
                        type="button"
                        className="booking-month-arrow"
                        disabled={nextBookingMonthDisabled}
                        onClick={() => {
                          setCalendarMonth(
                            nextBookingMonth,
                          )
                          setDate('')
                          setSelectedSlotStart('')
                          setSlots([])
                        }}
                        aria-label="Próximo mês"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>

                    {monthLoading && (
                      <div className="booking-calendar-loading">
                        Atualizando vagas do mês...
                      </div>
                    )}

                    <div className="booking-calendar-grid">
                      {[
                        'DOM',
                        'SEG',
                        'TER',
                        'QUA',
                        'QUI',
                        'SEX',
                        'SÁB',
                      ].map((label) => (
                        <div
                          className="booking-weekday"
                          key={label}
                        >
                          {label}
                        </div>
                      ))}

                      {bookingCalendarDays.map(
                        (calendarDate, index) => {
                          if (!calendarDate) {
                            return (
                              <div
                                key={'empty-' + index}
                              />
                            )
                          }

                          const item =
                            monthSummaryMap.get(
                              calendarDate,
                            )

                          const availableCount =
                            Number(
                              item?.available_count ||
                              0,
                            )

                          const dayStatus =
                            text(
                              item,
                              ['status'],
                              'unavailable',
                            )

                          const inRange =
                            calendarDate >= today() &&
                            calendarDate <=
                              lastAllowedBookingDate

                          const selectable =
                            inRange &&
                            availableCount > 0

                          const soldOut =
                            inRange &&
                            dayStatus === 'sold_out'

                          const selected =
                            date === calendarDate

                          const dayNumber =
                            Number(
                              calendarDate.slice(8, 10),
                            )

                          const className = [
                            'booking-day',
                            selectable
                              ? 'available'
                              : soldOut
                                ? 'sold-out'
                                : '',
                            selected
                              ? 'selected'
                              : '',
                            !inRange
                              ? 'outside'
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' ')

                          const content = (
                            <>
                              <span className="booking-day-number">
                                {dayNumber}
                              </span>

                              <span className="booking-day-status">
                                {selectable
                                  ? availableCount === 1
                                    ? '1 vaga'
                                    : availableCount +
                                      ' vagas'
                                  : soldOut
                                    ? 'Esgotado'
                                    : inRange
                                      ? 'Sem agenda'
                                      : ''}
                              </span>
                            </>
                          )

                          if (!selectable) {
                            return (
                              <div
                                key={calendarDate}
                                className={className}
                                title={
                                  soldOut
                                    ? 'Vagas esgotadas'
                                    : 'Data indisponível'
                                }
                              >
                                {content}
                              </div>
                            )
                          }

                          return (
                            <button
                              type="button"
                              key={calendarDate}
                              className={className}
                              onClick={() => {
                                setDate(
                                  calendarDate,
                                )
                                setSelectedSlotStart('')
                              }}
                            >
                              {content}
                            </button>
                          )
                        },
                      )}
                    </div>

                    <div className="booking-calendar-legend">
                      <span>
                        <i
                          className="booking-calendar-dot"
                          style={{
                            background: '#58b777',
                          }}
                        />
                        Vagas disponíveis
                      </span>

                      <span>
                        <i
                          className="booking-calendar-dot"
                          style={{
                            background: '#e2bd45',
                          }}
                        />
                        Vagas esgotadas
                      </span>

                      <span>
                        <i
                          className="booking-calendar-dot"
                          style={{
                            background: '#c7c4c5',
                          }}
                        />
                        Sem atendimento
                      </span>
                    </div>
                  </div>

                  {!date ? (
                    <div className="booking-empty">
                      Clique em uma data verde para ver
                      os horários disponíveis.
                    </div>
                  ) : slotsLoading ? (
                    <div className="booking-empty">
                      Consultando horários...
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="booking-empty important">
                      <Clock3 size={25} />

                      <div>
                        <strong>
                          As vagas desta data acabaram de mudar
                        </strong>

                        <span>
                          Escolha outra data disponível no
                          calendário.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="booking-selected-date">
                        Horários disponíveis em {formatDate(date)}
                      </div>

                      <div className="time-grid">
                        {slots.map(
                          (slot, index) => {
                            const start =
                              slotStart(slot)

                            if (!start) return null

                            return (
                              <button
                                key={
                                  start + '-' + index
                                }
                                className={
                                  selectedSlotStart ===
                                  start
                                    ? 'selected'
                                    : ''
                                }
                                onClick={() => {
                                  setSelectedSlotStart(
                                    start,
                                  )
                                  setStep(5)
                                }}
                              >
                                {formatTime(start)}
                              </button>
                            )
                          },
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="booking-step-content">
                  <span className="eyebrow">
                    Passo 05
                  </span>

                  <h2>
                    Confira seu agendamento
                  </h2>

                  <div className="review-list">
                    <div>
                      <span>
                        Cadastro
                      </span>

                      <strong>
                        {verifiedExisting
                          ? 'Paciente já cadastrado'
                          : patient.fullName}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Serviço
                      </span>

                      <strong>
                        {serviceTitle(
                          selectedService,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Unidade
                      </span>

                      <strong>
                        {locationTitle(
                          selectedLocation,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Profissional
                      </span>

                      <strong>
                        {providerTitle(
                          selectedProvider,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Data
                      </span>

                      <strong>
                        {formatDate(date)}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Horário
                      </span>

                      <strong>
                        {selectedTime}
                      </strong>
                    </div>
                  </div>

                  <label>
                    Observações para a recepção
                    <textarea
                      rows={4}
                      value={notes}
                      onChange={(e) =>
                        setNotes(
                          e.target.value,
                        )
                      }
                      placeholder="Opcional. Não informe dados clínicos sensíveis neste campo."
                    />
                  </label>
                </div>
              )}

              {error && (
                <div className="form-error">
                  {error}
                </div>
              )}

              {step > 1 && (
                <div className="booking-nav">
                  <button
                    className="button button-ghost"
                    disabled={loading}
                    onClick={() =>
                      setStep(
                        (current) =>
                          Math.max(
                            1,
                            current - 1,
                          ),
                      )
                    }
                  >
                    <ChevronLeft size={18} />
                    Voltar
                  </button>

                  {step < 5 ? (
                    <button
                      className="button button-primary"
                      disabled={
                        catalogLoading ||
                        slotsLoading
                      }
                      onClick={goNext}
                    >
                      Continuar
                      <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button
                      className="button button-primary"
                      disabled={loading}
                      onClick={
                        confirmBooking
                      }
                    >
                      {loading
                        ? 'Confirmando...'
                        : 'Confirmar agendamento'}

                      <Check size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

