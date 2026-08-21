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
  ShieldCheck,
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
  identifyPatient,
  type BookingPatient,
  type BookingSelection,
} from '../services/bookingApi'
import '../styles/booking-upgrade.css'

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

function whatsappHelp() {
  const raw =
    import.meta.env
      .VITE_WHATSAPP_NUMBER ||
    ''

  const phone =
    String(raw)
      .replace(/\D/g, '')

  const message =
    encodeURIComponent(
      'Olá! Preciso de ajuda para acessar meu cadastro e realizar meu agendamento pelo site.',
    )

  return phone
    ? `https://wa.me/${phone}?text=${message}`
    : '#'
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
    existingCpf,
    setExistingCpf,
  ] =
    useState('')

  const [
    existingPhone,
    setExistingPhone,
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
      cpf: '',
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
    } | null>(null)

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

    if (
      !existingCpf.trim() ||
      !existingPhone.trim()
    ) {
      setError(
        'Informe CPF e telefone para localizar seu cadastro com segurança.',
      )
      return
    }

    setLoading(true)

    try {
      const result =
        await identifyPatient(
          existingCpf,
          existingPhone,
        )

      if (result.found) {
        setVerifiedExisting(true)

        setPatient({
          fullName: '',
          cpf: existingCpf,
          phone: existingPhone,
          birthDate: '',
          email: '',
        })

        setIdentityMessage(
          result.message ||
          'Cadastro localizado com sucesso.',
        )

        await loadCatalog()
      } else {
        setVerifiedExisting(false)

        setError(
          result.message ||
          'Não foi possível localizar o cadastro informado.',
        )
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível localizar seu cadastro.',
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

    if (
      !patient.fullName.trim() ||
      !patient.phone.trim()
    ) {
      setError(
        'Informe nome completo e telefone para continuar.',
      )
      return
    }

    setLoading(true)

    try {
      const check =
        await checkExistingPatient(
          patient.cpf,
          patient.phone,
        )

      if (check.exists) {
        setDuplicateWarning(true)

        setError(
          check.message ||
          'Você já possui cadastro na clínica.',
        )

        return
      }

      await loadCatalog()
      setStep(2)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível verificar seu cadastro.',
      )
    } finally {
      setLoading(false)
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

      setSuccess({
        protocol,
        message:
          'Seu agendamento foi registrado com sucesso.',
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

  function resetAll() {
    setIdentityMode('choose')
    setVerifiedExisting(false)
    setExistingCpf('')
    setExistingPhone('')
    setIdentityMessage('')
    setDuplicateWarning(false)

    setPatient({
      fullName: '',
      phone: '',
      birthDate: '',
      cpf: '',
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
              Tudo certo.
              Seu horário foi reservado.
            </h1>

            <p>
              {success.message}
            </p>

            {success.protocol && (
              <div className="protocol-box">
                <span>
                  Seu protocolo
                </span>

                <strong>
                  {success.protocol}
                </strong>

                <small>
                  Guarde este número para
                  consultar seu agendamento.
                </small>
              </div>
            )}

            <div className="confirmation-summary">
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

            <p className="privacy-note">
              Você pode tirar um print
              desta tela como comprovante.
              Os dados preenchidos serão
              removidos desta página
              automaticamente.
            </p>

            <button
              className="button button-primary"
              onClick={resetAll}
            >
              <RefreshCcw size={17} />
              Fazer novo agendamento
            </button>
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
              Todas as opções exibidas
              nesta página são carregadas
              a partir das configurações
              liberadas pela clínica.
            </p>
          </Reveal>

          <Reveal
            delay={90}
            className="booking-security"
          >
            <ShieldCheck />

            <div>
              <strong>
                Privacidade por padrão
              </strong>

              <span>
                Esta página não exibe
                prontuário, dados financeiros
                ou histórico clínico.
              </span>
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
              Consultar / remarcar / cancelar
            </span>

            <h2>
              Já possui um agendamento?
            </h2>

            <p>
              A consulta por protocolo
              será vinculada à próxima
              etapa da integração.
              Enquanto isso, a clínica
              pode ajudar pelo WhatsApp.
            </p>

            <a
              href={whatsappHelp()}
              target="_blank"
              rel="noreferrer"
              className="button button-primary"
            >
              <MessageCircle size={18} />
              Preciso de ajuda
            </a>
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
                            utilizando CPF
                            e telefone.
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
                            Para sua segurança,
                            informe CPF
                            e telefone cadastrados
                            na clínica.
                          </p>
                        </div>
                      </div>

                      <div className="form-grid two">
                        <label>
                          CPF *
                          <input
                            value={existingCpf}
                            onChange={(e) =>
                              setExistingCpf(
                                e.target.value,
                              )
                            }
                            placeholder="000.000.000-00"
                            autoComplete="off"
                          />
                        </label>

                        <label>
                          Telefone *
                          <input
                            value={existingPhone}
                            onChange={(e) =>
                              setExistingPhone(
                                e.target.value,
                              )
                            }
                            placeholder="(41) 99999-9999"
                            autoComplete="tel"
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
                            Antes de criar um
                            novo paciente,
                            o sistema verificará
                            CPF e telefone
                            para evitar duplicação.
                          </p>
                        </div>
                      </div>

                      <div className="form-grid two">
                        <label>
                          Nome completo *
                          <input
                            value={
                              patient.fullName
                            }
                            onChange={(e) =>
                              setPatient({
                                ...patient,
                                fullName:
                                  e.target.value,
                              })
                            }
                          />
                        </label>

                        <label>
                          Telefone *
                          <input
                            value={
                              patient.phone
                            }
                            onChange={(e) =>
                              setPatient({
                                ...patient,
                                phone:
                                  e.target.value,
                              })
                            }
                          />
                        </label>

                        <label>
                          CPF
                          <input
                            value={
                              patient.cpf
                            }
                            onChange={(e) =>
                              setPatient({
                                ...patient,
                                cpf:
                                  e.target.value,
                              })
                            }
                          />
                        </label>

                        <label>
                          Data de nascimento
                          <input
                            type="date"
                            value={
                              patient.birthDate
                            }
                            onChange={(e) =>
                              setPatient({
                                ...patient,
                                birthDate:
                                  e.target.value,
                              })
                            }
                          />
                        </label>

                        <label className="full">
                          E-mail
                          <input
                            type="email"
                            value={
                              patient.email
                            }
                            onChange={(e) =>
                              setPatient({
                                ...patient,
                                email:
                                  e.target.value,
                              })
                            }
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

                              setExistingCpf(
                                patient.cpf || '',
                              )

                              setExistingPhone(
                                patient.phone || '',
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

              {step === 4 && (
                <div className="booking-step-content">
                  <span className="eyebrow">
                    Passo 04
                  </span>

                  <h2>
                    Escolha data e horário
                  </h2>

                  <p>
                    Horários ocupados,
                    bloqueados ou não liberados
                    pelo sistema não aparecem.
                  </p>

                  <div className="date-picker-line">
                    <label>
                      Data
                      <input
                        type="date"
                        min={today()}
                        value={date}
                        onChange={(e) => {
                          setDate(
                            e.target.value,
                          )

                          setSelectedSlotStart(
                            '',
                          )
                        }}
                      />
                    </label>
                  </div>

                  {!date ? (
                    <div className="booking-empty">
                      Escolha uma data para
                      consultar os horários
                      disponíveis.
                    </div>
                  ) : slotsLoading ? (
                    <div className="booking-empty">
                      Consultando agenda...
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="booking-empty important">
                      <Clock3 size={25} />

                      <div>
                        <strong>
                          Nenhum horário disponível
                          nesta data
                        </strong>

                        <span>
                          Escolha outra data
                          para continuar.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="time-grid">
                      {slots.map(
                        (slot, index) => {
                          const start =
                            slotStart(slot)

                          if (!start) return null

                          return (
                            <button
                              key={
                                `${start}-${index}`
                              }
                              className={
                                selectedSlotStart ===
                                start
                                  ? 'selected'
                                  : ''
                              }
                              onClick={() =>
                                setSelectedSlotStart(
                                  start,
                                )
                              }
                            >
                              {formatTime(
                                start,
                              )}
                            </button>
                          )
                        },
                      )}
                    </div>
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
