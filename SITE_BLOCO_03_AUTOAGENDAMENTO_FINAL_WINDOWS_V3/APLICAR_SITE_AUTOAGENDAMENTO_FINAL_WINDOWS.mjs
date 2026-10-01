import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const here = path.dirname(fileURLToPath(import.meta.url))
const payload = path.join(here, 'files')
const win = process.platform === 'win32'
const npm = win ? 'npm.cmd' : 'npm'
const git = win ? 'git.exe' : 'git'

function fail(message) {
  console.error('\nERRO:', message)
  process.exit(1)
}

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: win && (command.endsWith('.cmd') || command.endsWith('.exe')),
    ...opts,
  })
  if (result.error) console.error('Falha ao iniciar comando:', result.error.message)
  return result.status ?? 1
}

function read(rel) {
  return fs
    .readFileSync(path.join(root, rel), 'utf8')
    .replace(/\r\n/g, '\n')
}

function write(rel, value) {
  const dst = path.join(root, rel)
  fs.mkdirSync(path.dirname(dst), { recursive: true })
  fs.writeFileSync(dst, value, 'utf8')
}

function replaceOnce(text, search, replacement, label) {
  const index = text.indexOf(search)
  if (index < 0) {
    fail(`Não encontrei o ponto de atualização: ${label}.`)
  }
  return text.slice(0, index) + replacement + text.slice(index + search.length)
}

function replaceRegex(text, regex, replacement, label) {
  if (!regex.test(text)) fail(`Não encontrei a seção: ${label}.`)
  regex.lastIndex = 0
  return text.replace(regex, replacement)
}

const expected = [
  'package.json',
  'src/pages/Booking.tsx',
  'src/services/bookingApi.ts',
  'src/components/Layout.tsx',
]

for (const rel of expected) {
  if (!fs.existsSync(path.join(root, rel))) fail(`Arquivo não encontrado: ${rel}`)
}

const pkg = JSON.parse(read('package.json'))
if (pkg.name !== 'site-dra-andressa-dallarmi') {
  fail('Execute dentro de C:\\Projetos\\SITE-DRA-ANDRESSA')
}

const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
const backupRoot = path.join(path.dirname(root), 'BACKUPS_SITE_DRA_ANDRESSA')
const backup = path.join(backupRoot, `.backup_site_autoagendamento_v3_${stamp}`)
fs.mkdirSync(backup, { recursive: true })

const touched = [
  'src/pages/Booking.tsx',
  'src/services/bookingApi.ts',
  'src/components/Layout.tsx',
  'src/utils/calendar.ts',
  'src/components/SitePresence.tsx',
  'src/styles/booking-experience-v2.css',
]

const existed = new Set()

for (const rel of touched) {
  const src = path.join(root, rel)
  if (fs.existsSync(src)) {
    existed.add(rel)
    const dst = path.join(backup, rel)
    fs.mkdirSync(path.dirname(dst), { recursive: true })
    fs.copyFileSync(src, dst)
  }
}

function restore() {
  console.log('\nRestaurando arquivos anteriores...')
  for (const rel of touched) {
    const dst = path.join(root, rel)
    const bak = path.join(backup, rel)
    if (existed.has(rel) && fs.existsSync(bak)) {
      fs.mkdirSync(path.dirname(dst), { recursive: true })
      fs.copyFileSync(bak, dst)
    } else if (!existed.has(rel) && fs.existsSync(dst)) {
      fs.rmSync(dst, { force: true })
    }
  }
}

console.log('==============================================================')
console.log(' SITE DRA. ANDRESSA - AUTOAGENDAMENTO FINAL V3')
console.log('==============================================================')
console.log('Backup:', backup)
console.log('Estrutura Windows/CRLF detectada e tratada.')
console.log('')

// -----------------------------------------------------------------------------
// 1. API DE CONSULTA DO AGENDAMENTO
// -----------------------------------------------------------------------------
let bookingApi = read('src/services/bookingApi.ts')

if (!bookingApi.includes('export async function manageBooking(')) {
  bookingApi += `

export async function manageBooking(
  input: Record<string, unknown>,
) {
  return callPublicBooking({
    action: 'manage_booking',
    ...input,
  })
}
`
  write('src/services/bookingApi.ts', bookingApi)
  console.log('OK - manageBooking adicionado ao bookingApi.ts.')
} else {
  console.log('OK - manageBooking já existe no bookingApi.ts.')
}

// -----------------------------------------------------------------------------
// 2. BOOKING.TSX
// -----------------------------------------------------------------------------
let booking = read('src/pages/Booking.tsx')

if (!booking.includes("mode === 'manage'")) {
  fail('A aba "Já tenho agendamento" não foi encontrada.')
}
if (!booking.includes('Seu horário foi reservado.')) {
  fail('A tela atual de confirmação não foi encontrada.')
}

// Importa manageBooking sem depender de CRLF ou espaçamento exato.
if (!/\bmanageBooking\b/.test(
  (booking.match(/import\s*\{[\s\S]*?\}\s*from\s*['"]\.\.\/services\/bookingApi['"]/) || [''])[0]
)) {
  booking = replaceRegex(
    booking,
    /(\s+identifyPatient,\n)(\s+type BookingPatient,)/,
    `$1  manageBooking,\n$2`,
    'import manageBooking',
  )
}

// Imports da experiência final no topo do módulo.
const bookingApiImportEnd = /(\}\s*from\s*['"]\.\.\/services\/bookingApi['"]\n)/
if (!booking.includes("booking-experience-v2.css")) {
  booking = replaceRegex(
    booking,
    bookingApiImportEnd,
    `$1import '../styles/booking-experience-v2.css'\nimport { whatsappUrl } from '../data/site'\nimport { buildGoogleCalendarUrl, downloadCalendarFile } from '../utils/calendar'\n`,
    'imports do autoagendamento final',
  )
}

// Funções auxiliares para interpretar retorno de consulta.
const helperMarker = `function whatsappHelp() {
  const raw =
    import.meta.env
      .VITE_WHATSAPP_NUMBER ||
    ''

  const phone =
    String(raw)
      .replace(/\\D/g, '')

  const message =
    encodeURIComponent(
      'Olá! Preciso de ajuda para acessar meu cadastro e realizar meu agendamento pelo site.',
    )

  return phone
    ? \`https://wa.me/\${phone}?text=\${message}\`
    : '#'
}
`

if (!booking.includes('function bookingResultList(')) {
  const helpers = helperMarker + `
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
`
  booking = replaceOnce(
    booking,
    helperMarker,
    helpers,
    'helpers do agendamento',
  )
}

// Estado de sucesso expandido + estado de consulta.
if (!booking.includes('const [bookingLookupCpf')) {
  const successState = `  const [
    success,
    setSuccess,
  ] =
    useState<{
      protocol?: string
      message?: string
    } | null>(null)
`

  const newState = `  const [
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

  const [bookingLookupCpf, setBookingLookupCpf] = useState('')
  const [bookingLookupPhone, setBookingLookupPhone] = useState('')
  const [bookingLookupProtocol, setBookingLookupProtocol] = useState('')
  const [bookingLookupLoading, setBookingLookupLoading] = useState(false)
  const [bookingLookupMessage, setBookingLookupMessage] = useState('')
  const [bookingLookupResults, setBookingLookupResults] = useState<AnyRecord[]>([])
`

  booking = replaceOnce(
    booking,
    successState,
    newState,
    'estado de confirmação e consulta',
  )
}

// Aproveita dados devolvidos no create para confirmação/WhatsApp/calendário.
if (!booking.includes('const managementToken =')) {
  const setSuccessOld = `      setSuccess({
        protocol,
        message:
          'Seu agendamento foi registrado com sucesso.',
      })`

  const setSuccessNew = `      const managementToken =
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
      })`

  booking = replaceOnce(
    booking,
    setSuccessOld,
    setSuccessNew,
    'resultado da criação',
  )
}

// Função real de busca do agendamento.
if (!booking.includes('async function lookupMyBookings()')) {
  const lookupFn = `  async function lookupMyBookings() {
    setError('')
    setBookingLookupMessage('')
    setBookingLookupResults([])

    const cpf = bookingLookupCpf.replace(/\\D/g, '')
    const phone = bookingLookupPhone.replace(/\\D/g, '')
    const protocol = bookingLookupProtocol.trim()

    if (!phone || (!cpf && !protocol)) {
      setBookingLookupMessage(
        'Informe seu telefone e também o CPF ou o protocolo do agendamento.',
      )
      return
    }

    setBookingLookupLoading(true)

    try {
      const response = await manageBooking({
        cpf: cpf || null,
        phone,
        protocol: protocol || null,
        reference: protocol || null,
      })

      const list = bookingResultList(response)
      setBookingLookupResults(list)

      const root = asRecord(response)
      setBookingLookupMessage(
        list.length
          ? \`Encontramos \${list.length} agendamento\${list.length === 1 ? '' : 's'} vinculado\${list.length === 1 ? '' : 's'} aos dados informados.\`
          : text(
              root,
              ['message'],
              'Nenhum agendamento foi localizado. Confira os dados ou fale com a clínica pelo WhatsApp.',
            ),
      )
    } catch (e) {
      setBookingLookupMessage(
        e instanceof Error
          ? e.message
          : 'Não foi possível consultar seu agendamento agora. Você pode falar com a clínica pelo WhatsApp.',
      )
    } finally {
      setBookingLookupLoading(false)
    }
  }

`

  booking = replaceOnce(
    booking,
    '  function resetAll() {',
    lookupFn + '  function resetAll() {',
    'função de consulta',
  )
}

// Confirmação pós-agendamento.
const successRegex =
  /  if \(success\) \{[\s\S]*?\n  \}\n\n  return \(\n    <section className="booking-page">/

const successReplacement = `  if (success) {
    const calendarEvent = {
      title: \`Consulta - \${serviceTitle(selectedService)}\`,
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
        \`Profissional: \${providerTitle(selectedProvider)}\`,
        success.protocol ? \`Protocolo: \${success.protocol}\` : '',
        'Em caso de dúvida, entre em contato com a clínica.',
      ].filter(Boolean).join('\\n'),
      url: window.location.origin + '/agendamento',
    }

    const patientLabel =
      success.patientName ||
      patient.fullName ||
      'Paciente'

    const bookingWhatsapp = whatsappUrl(
      [
        'Olá! Acabei de realizar um autoagendamento pelo site da Dra. Andressa.',
        \`Paciente: \${patientLabel}\`,
        \`Serviço: \${serviceTitle(selectedService)}\`,
        \`Data: \${formatDate(date)}\`,
        \`Horário: \${selectedTime}\`,
        success.protocol ? \`Protocolo: \${success.protocol}\` : '',
        '',
        'Gostaria de confirmar as orientações para garantir/reservar este horário, incluindo a regra de pagamento ou sinal quando aplicável.',
      ].filter(Boolean).join('\\n'),
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
                  setBookingLookupCpf(patient.cpf || '')
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
    <section className="booking-page">`

if (!booking.includes('Próximo passo: confirmação da reserva')) {
  booking = replaceRegex(
    booking,
    successRegex,
    successReplacement,
    'confirmação final',
  )
}

// Área "Já tenho agendamento".
const manageRegex =
  /          <div className="manage-booking-card">[\s\S]*?          <\/div>\n        \) : \(/

const manageReplacement = `          <div className="manage-booking-card">
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
                <label>CPF</label>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  value={bookingLookupCpf}
                  onChange={(event) =>
                    setBookingLookupCpf(event.target.value)
                  }
                />
              </div>

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
                <label>Protocolo (se tiver)</label>
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
              Para sua segurança, informe o telefone e também o CPF ou protocolo.
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
                    title: \`Consulta - \${service}\`,
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
                      \`Profissional: \${provider}\`,
                      \`Protocolo: \${protocol}\`,
                    ].join('\\n'),
                    url:
                      window.location.origin +
                      '/agendamento',
                  }

                  const help = whatsappUrl(
                    [
                      'Olá! Gostaria de ajuda com este agendamento:',
                      \`Protocolo: \${protocol}\`,
                      \`Serviço: \${service}\`,
                      startAt
                        ? \`Data/hora: \${new Date(startAt).toLocaleString('pt-BR')}\`
                        : '',
                    ].filter(Boolean).join('\\n'),
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
                                  \`agendamento-\${protocol}.ics\`,
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
        ) : (`

if (!booking.includes('Esqueceu a data ou o horário?')) {
  booking = replaceRegex(
    booking,
    manageRegex,
    manageReplacement,
    'consulta de agendamento',
  )
}

write('src/pages/Booking.tsx', booking)
console.log('OK - Booking.tsx atualizado.')

// -----------------------------------------------------------------------------
// 3. MÉTRICA DE VISITANTES DO SITE
// -----------------------------------------------------------------------------
let layout = read('src/components/Layout.tsx')

if (!layout.includes("import SitePresence from './SitePresence'")) {
  layout = replaceRegex(
    layout,
    /(import SecurityNotice from ['"]\.\/SecurityNotice['"]\n)/,
    `$1import SitePresence from './SitePresence'\n`,
    'import SitePresence',
  )
}

if (!layout.includes('<SitePresence />')) {
  layout = replaceRegex(
    layout,
    /(\s+<SecurityNotice \/>)/,
    `      <SitePresence />\n$1`,
    'montagem SitePresence',
  )
}

write('src/components/Layout.tsx', layout)

for (const rel of [
  'src/utils/calendar.ts',
  'src/components/SitePresence.tsx',
  'src/styles/booking-experience-v2.css',
]) {
  const src = path.join(payload, rel)
  if (!fs.existsSync(src)) fail(`Payload ausente: ${rel}`)

  const dst = path.join(root, rel)
  fs.mkdirSync(path.dirname(dst), { recursive: true })
  fs.copyFileSync(src, dst)
}

console.log('OK - calendário, WhatsApp e métrica de visitantes aplicados.')

// -----------------------------------------------------------------------------
// 4. BUILD
// -----------------------------------------------------------------------------
console.log('\nVALIDANDO BUILD COMPLETO...')

const build = run(npm, ['run', 'build'])

if (build !== 0) {
  restore()
  fail(`BUILD FALHOU. O site foi restaurado. Backup: ${backup}`)
}

console.log('\nOK - BUILD COMPLETO.')

// -----------------------------------------------------------------------------
// 5. GIT
// -----------------------------------------------------------------------------
const gitPaths = [
  'src/pages/Booking.tsx',
  'src/services/bookingApi.ts',
  'src/components/Layout.tsx',
  'src/components/SitePresence.tsx',
  'src/utils/calendar.ts',
  'src/styles/booking-experience-v2.css',
]

console.log('\nPREPARANDO GIT...')

const add = spawnSync(
  git,
  ['add', ...gitPaths],
  {
    cwd: root,
    stdio: 'inherit',
    shell: win,
  },
)

if (add.status === 0) {
  const diff = spawnSync(
    git,
    ['diff', '--cached', '--quiet'],
    {
      cwd: root,
      stdio: 'ignore',
      shell: win,
    },
  )

  if (diff.status === 1) {
    const commit = spawnSync(
      git,
      [
        'commit',
        '-m',
        'Site autoagendamento consulta calendario whatsapp metricas',
      ],
      {
        cwd: root,
        stdio: 'inherit',
        shell: win,
      },
    )

    if (commit.status === 0) {
      const push = spawnSync(
        git,
        ['push', 'origin', 'main'],
        {
          cwd: root,
          stdio: 'inherit',
          shell: win,
        },
      )

      if (push.status !== 0) {
        console.log(
          'AVISO: commit criado, mas o git push falhou. Rode depois: git push origin main',
        )
      }
    } else {
      console.log(
        'AVISO: build passou, mas o commit não foi criado. As alterações permanecem no projeto.',
      )
    }
  } else {
    console.log('Git: nenhuma alteração nova para commit.')
  }
}

// -----------------------------------------------------------------------------
// 6. CLOUDFLARE
// -----------------------------------------------------------------------------
console.log('\nPUBLICANDO CLOUDFLARE...')

const deploy = run(npm, ['run', 'deploy'])

if (deploy !== 0) {
  console.log(
    'AVISO: o código e o build estão OK, mas o deploy Cloudflare falhou.',
  )
  console.log('Depois rode manualmente: npm run deploy')
}

console.log('')
console.log('==============================================================')
console.log(' SITE - AUTOAGENDAMENTO FINAL V3 CONCLUIDO')
console.log('==============================================================')
console.log('Teste agora:')
console.log('1) Novo agendamento até a tela final.')
console.log('2) WhatsApp preenchido com paciente/serviço/data/horário/protocolo.')
console.log('3) Google Agenda.')
console.log('4) iPhone/Outlook (.ics) com lembretes.')
console.log('5) Já tenho agendamento > telefone + CPF ou protocolo.')
console.log('6) Solicitar ajuda pelo WhatsApp.')
console.log('7) Sistema > Dashboard > visitantes do site.')
console.log('')
console.log('Backup:', backup)
