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
    shell: command.endsWith('.cmd'),
    ...opts,
  })
  return result.status ?? 1
}
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8') }
function write(rel, value) {
  const dst = path.join(root, rel)
  fs.mkdirSync(path.dirname(dst), { recursive: true })
  fs.writeFileSync(dst, value, 'utf8')
}
function replaceOnce(text, search, replacement, label) {
  const index = text.indexOf(search)
  if (index < 0) fail(`Não encontrei o ponto de atualização: ${label}. O site foi alterado desde a base esperada.`)
  if (text.indexOf(search, index + search.length) >= 0) fail(`Ponto duplicado: ${label}.`)
  return text.slice(0, index) + replacement + text.slice(index + search.length)
}
function replaceRegex(text, regex, replacement, label) {
  const match = text.match(regex)
  if (!match) fail(`Não encontrei a seção: ${label}.`)
  return text.replace(regex, replacement)
}

const expected = [
  'package.json',
  'src/pages/Booking.tsx',
  'src/services/bookingApi.ts',
  'src/components/Layout.tsx',
]
for (const rel of expected) if (!fs.existsSync(path.join(root, rel))) fail(`Arquivo não encontrado: ${rel}`)
const pkg = JSON.parse(read('package.json'))
if (pkg.name !== 'site-dra-andressa-dallarmi') fail('Execute dentro de C:\\Projetos\\SITE-DRA-ANDRESSA')

const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
const backupRoot = path.join(path.dirname(root), 'BACKUPS_SITE_DRA_ANDRESSA')
const backup = path.join(backupRoot, `.backup_site_autoagendamento_final_${stamp}`)
fs.mkdirSync(backup, { recursive: true })
const touched = [
  'src/pages/Booking.tsx',
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
console.log(' SITE DRA. ANDRESSA - AUTOAGENDAMENTO FINAL')
console.log('==============================================================')
console.log('Backup:', backup)
console.log('')

let booking = read('src/pages/Booking.tsx')
const mainSource = fs.existsSync(path.join(root, 'src/main.tsx'))
  ? read('src/main.tsx')
  : ''

const bookingUpgradeLoaded =
  booking.includes("import '../styles/booking-upgrade.css'") ||
  mainSource.includes("import './styles/booking-upgrade.css'")

if (!bookingUpgradeLoaded) {
  fail('Não encontrei o CSS atual do autoagendamento nem no Booking.tsx nem no main.tsx.')
}
if (!booking.includes("mode === 'manage'")) fail('A aba Já tenho agendamento não foi encontrada.')
if (!booking.includes('Seu horário foi reservado.')) fail('Tela atual de confirmação não encontrada.')

booking = replaceOnce(
  booking,
  "  identifyPatient,\n  type BookingPatient,",
  "  identifyPatient,\n  manageBooking,\n  type BookingPatient,",
  'import manageBooking',
)
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
if (!booking.includes("booking-experience-v2.css")) {
  booking = replaceOnce(
    booking,
    helperMarker,
    "import '../styles/booking-experience-v2.css'\nimport { whatsappUrl } from '../data/site'\nimport { buildGoogleCalendarUrl, downloadCalendarFile } from '../utils/calendar'\n\n" + helperMarker,
    'imports experiência final',
  )
}

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
  return text(item, ['service', 'service_name', 'serviceName', 'procedure'], 'Atendimento')
}
function bookingResultLocation(item: AnyRecord) {
  return text(item, ['location', 'location_name', 'locationName', 'unit'], 'Clínica Dra. Andressa')
}
function bookingResultProvider(item: AnyRecord) {
  return text(item, ['provider', 'provider_name', 'professional', 'professional_name'], 'Dra. Andressa Dallarmi')
}
function bookingResultProtocol(item: AnyRecord) {
  return text(item, ['reference', 'protocol', 'booking_protocol', 'protocol_code', 'code'], 'Agendamento')
}
`
booking = replaceOnce(booking, helperMarker, helpers, 'helpers do agendamento')

const successState = `  const [
    success,
    setSuccess,
  ] =
    useState<{
      protocol?: string
      message?: string
    } | null>(null)
`
const newState = successState.replace(
  '      message?: string\n',
  '      message?: string\n      managementToken?: string\n      startAt?: string\n      patientName?: string\n',
) + `
  const [bookingLookupCpf, setBookingLookupCpf] = useState('')
  const [bookingLookupPhone, setBookingLookupPhone] = useState('')
  const [bookingLookupProtocol, setBookingLookupProtocol] = useState('')
  const [bookingLookupLoading, setBookingLookupLoading] = useState(false)
  const [bookingLookupMessage, setBookingLookupMessage] = useState('')
  const [bookingLookupResults, setBookingLookupResults] = useState<AnyRecord[]>([])
`
booking = replaceOnce(booking, successState, newState, 'estado de confirmação')

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
booking = replaceOnce(booking, setSuccessOld, setSuccessNew, 'resultado da criação')

const beforeReset = `  function resetAll() {`
const lookupFn = `  async function lookupMyBookings() {
    setError('')
    setBookingLookupMessage('')
    setBookingLookupResults([])

    const cpf = bookingLookupCpf.replace(/\\D/g, '')
    const phone = bookingLookupPhone.replace(/\\D/g, '')
    const protocol = bookingLookupProtocol.trim()

    if (!phone || (!cpf && !protocol)) {
      setBookingLookupMessage('Informe seu telefone e também o CPF ou o protocolo do agendamento.')
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
          : text(root, ['message'], 'Nenhum agendamento foi localizado. Confira os dados ou fale com a clínica pelo WhatsApp.'),
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
booking = replaceOnce(booking, beforeReset, lookupFn + beforeReset, 'função de consulta')

const successRegex = /  if \(success\) \{[\s\S]*?\n  \}\n\n  return \(\n    <section className="booking-page">/
const successReplacement = `  if (success) {
    const calendarEvent = {
      title: \`Consulta - \${serviceTitle(selectedService)}\`,
      startAt: success.startAt || selectedSlotStart,
      durationMinutes: Number(text(selectedService, ['duration_minutes', 'duration'], '60')) || 60,
      location: locationTitle(selectedLocation),
      description: [
        'Agendamento na Clínica Dra. Andressa Dallarmi.',
        \`Profissional: \${providerTitle(selectedProvider)}\`,
        success.protocol ? \`Protocolo: \${success.protocol}\` : '',
        'Em caso de dúvida, entre em contato com a clínica.',
      ].filter(Boolean).join('\\n'),
      url: window.location.origin + '/agendamento',
    }

    const patientLabel = success.patientName || patient.fullName || 'Paciente'
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
            <span className="success-icon"><Check size={34} /></span>
            <span className="eyebrow">Agendamento registrado</span>
            <h1>Tudo certo. Seu horário foi registrado.</h1>
            <p>{success.message}</p>

            {success.protocol && (
              <div className="protocol-box">
                <span>Seu protocolo</span>
                <strong>{success.protocol}</strong>
                <small>Guarde este número. Ele ajuda a localizar seu agendamento depois.</small>
              </div>
            )}

            <div className="confirmation-summary">
              <div><span>Serviço</span><strong>{serviceTitle(selectedService)}</strong></div>
              <div><span>Profissional</span><strong>{providerTitle(selectedProvider)}</strong></div>
              <div><span>Unidade</span><strong>{locationTitle(selectedLocation)}</strong></div>
              <div><span>Data</span><strong>{formatDate(date)}</strong></div>
              <div><span>Horário</span><strong>{selectedTime}</strong></div>
            </div>

            <div className="booking-payment-notice">
              <strong>Próximo passo: confirmação da reserva</strong>
              <p>
                Para garantir a data e o horário, a equipe da clínica confirmará com você a regra deste atendimento.
                Conforme o serviço, poderá ser solicitado o pagamento da consulta ou de uma parte do valor como sinal.
                A orientação será feita de forma individual e a clínica entrará em contato.
              </p>
              <small>Se preferir agilizar, você também pode iniciar a conversa pelo WhatsApp abaixo.</small>
            </div>

            <div className="booking-calendar-actions">
              <a className="button button-primary" href={bookingWhatsapp} target="_blank" rel="noreferrer">
                <MessageCircle size={17} /> Falar com a clínica
              </a>
              <a className="button button-outline" href={buildGoogleCalendarUrl(calendarEvent)} target="_blank" rel="noreferrer">
                <CalendarDays size={17} /> Google Agenda
              </a>
              <button className="button button-outline" onClick={() => downloadCalendarFile(calendarEvent)}>
                <CalendarDays size={17} /> iPhone / Outlook
              </button>
            </div>
            <div className="booking-calendar-note">
              O arquivo de calendário inclui lembretes de 24 horas e 2 horas antes. No Google Agenda, serão usados também os lembretes configurados na sua conta.
            </div>

            <div className="booking-confirmation-actions">
              <button
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
                <Search size={17} /> Consultar este agendamento
              </button>
              <button className="button button-primary" onClick={resetAll}>
                <RefreshCcw size={17} /> Fazer novo agendamento
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="booking-page">`
booking = replaceRegex(booking, successRegex, successReplacement, 'confirmação final')

const manageRegex = /          <div className="manage-booking-card">[\s\S]*?          <\/div>\n        \) : \(/
const manageReplacement = `          <div className="manage-booking-card">
            <span className="eyebrow">Consultar meu agendamento</span>
            <h2>Esqueceu a data ou o horário?</h2>
            <p>
              Informe os dados usados no agendamento. Você poderá conferir data, horário,
              serviço e unidade e salvar a consulta diretamente no calendário do celular.
            </p>

            <div className="manage-booking-form">
              <div className="manage-booking-field">
                <label>CPF</label>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  value={bookingLookupCpf}
                  onChange={(event) => setBookingLookupCpf(event.target.value)}
                />
              </div>
              <div className="manage-booking-field">
                <label>Telefone *</label>
                <input
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(41) 99999-9999"
                  value={bookingLookupPhone}
                  onChange={(event) => setBookingLookupPhone(event.target.value)}
                />
              </div>
              <div className="manage-booking-field">
                <label>Protocolo (se tiver)</label>
                <input
                  autoComplete="off"
                  placeholder="Número do protocolo"
                  value={bookingLookupProtocol}
                  onChange={(event) => setBookingLookupProtocol(event.target.value)}
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
                  {bookingLookupLoading ? 'Consultando...' : 'Ver meu agendamento'}
                </button>
              </div>
            </div>

            <small>Para sua segurança, informe o telefone e também o CPF ou protocolo.</small>

            {bookingLookupMessage && (
              <div className="manage-booking-message">{bookingLookupMessage}</div>
            )}

            {bookingLookupResults.length > 0 && (
              <div className="manage-booking-results">
                {bookingLookupResults.map((item, index) => {
                  const startAt = bookingResultStart(item)
                  const protocol = bookingResultProtocol(item)
                  const service = bookingResultService(item)
                  const location = bookingResultLocation(item)
                  const provider = bookingResultProvider(item)
                  const status = text(item, ['status'], 'agendado').replaceAll('_', ' ')
                  const dateTime = startAt ? new Date(startAt) : null
                  const calendarEvent = {
                    title: \`Consulta - \${service}\`,
                    startAt,
                    durationMinutes: Number(text(item, ['duration_minutes', 'duration'], '60')) || 60,
                    location,
                    description: [
                      'Agendamento na Clínica Dra. Andressa Dallarmi.',
                      \`Profissional: \${provider}\`,
                      \`Protocolo: \${protocol}\`,
                    ].join('\\n'),
                    url: window.location.origin + '/agendamento',
                  }
                  const help = whatsappUrl(
                    [
                      'Olá! Gostaria de ajuda com este agendamento:',
                      \`Protocolo: \${protocol}\`,
                      \`Serviço: \${service}\`,
                      startAt ? \`Data/hora: \${new Date(startAt).toLocaleString('pt-BR')}\` : '',
                    ].filter(Boolean).join('\\n'),
                  )

                  return (
                    <article className="manage-booking-result" key={text(item, ['id', 'appointment_id'], String(index))}>
                      <div className="manage-booking-result-head">
                        <div><small>Protocolo</small><strong>{protocol}</strong></div>
                        <span className="manage-booking-status">{status}</span>
                      </div>
                      <div className="manage-booking-result-grid">
                        <div><CalendarDays size={17} /><span><small>Data</small><strong>{dateTime ? dateTime.toLocaleDateString('pt-BR') : 'A confirmar'}</strong></span></div>
                        <div><Clock3 size={17} /><span><small>Horário</small><strong>{dateTime ? dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'A confirmar'}</strong></span></div>
                        <div><UserRound size={17} /><span><small>Atendimento</small><strong>{service}</strong></span></div>
                        <div><MapPin size={17} /><span><small>Unidade</small><strong>{location}</strong></span></div>
                      </div>
                      <div className="manage-booking-result-actions">
                        {startAt && (
                          <>
                            <a className="button button-outline" href={buildGoogleCalendarUrl(calendarEvent)} target="_blank" rel="noreferrer">
                              <CalendarDays size={16} /> Google Agenda
                            </a>
                            <button type="button" className="button button-outline" onClick={() => downloadCalendarFile(calendarEvent, \`agendamento-\${protocol}.ics\`)}>
                              <CalendarDays size={16} /> iPhone / Outlook
                            </button>
                          </>
                        )}
                        <a className="button button-outline" href={help} target="_blank" rel="noreferrer">
                          <MessageCircle size={16} /> Solicitar ajuda
                        </a>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            <div className="manage-help-actions">
              <a href={whatsappHelp()} target="_blank" rel="noreferrer" className="button button-outline">
                <MessageCircle size={18} /> Não encontrei / preciso de ajuda
              </a>
            </div>
          </div>
        ) : (`
booking = replaceRegex(booking, manageRegex, manageReplacement, 'consulta de agendamento')
write('src/pages/Booking.tsx', booking)

let layout = read('src/components/Layout.tsx')
if (!layout.includes("import SecurityNotice from './SecurityNotice'")) fail('Layout atual não reconhecido.')
if (!layout.includes('      <SecurityNotice />')) fail('Montagem do SecurityNotice não encontrada.')
layout = replaceOnce(
  layout,
  "import SecurityNotice from './SecurityNotice'",
  "import SecurityNotice from './SecurityNotice'\nimport SitePresence from './SitePresence'",
  'import SitePresence',
)
layout = replaceOnce(
  layout,
  '      <SecurityNotice />',
  '      <SitePresence />\n      <SecurityNotice />',
  'montagem SitePresence',
)
write('src/components/Layout.tsx', layout)

for (const rel of [
  'src/utils/calendar.ts',
  'src/components/SitePresence.tsx',
  'src/styles/booking-experience-v2.css',
]) {
  const src = path.join(payload, rel)
  const dst = path.join(root, rel)
  fs.mkdirSync(path.dirname(dst), { recursive: true })
  fs.copyFileSync(src, dst)
}

console.log('OK - autoagendamento, consulta, calendários, WhatsApp e métrica aplicados.')
console.log('\nVALIDANDO BUILD...')
const build = run(npm, ['run', 'build'])
if (build !== 0) {
  restore()
  fail(`BUILD FALHOU. O site foi restaurado. Backup: ${backup}`)
}
console.log('\nOK - BUILD COMPLETO.')

const gitPaths = [
  'src/pages/Booking.tsx',
  'src/components/Layout.tsx',
  'src/components/SitePresence.tsx',
  'src/utils/calendar.ts',
  'src/styles/booking-experience-v2.css',
]
const add = spawnSync(git, ['add', ...gitPaths], { cwd: root, stdio: 'inherit', shell: win })
if (add.status === 0) {
  const diff = spawnSync(git, ['diff', '--cached', '--quiet'], { cwd: root, stdio: 'ignore', shell: win })
  if (diff.status === 1) {
    const commit = spawnSync(git, ['commit', '-m', 'Site autoagendamento final consulta calendario metricas'], { cwd: root, stdio: 'inherit', shell: win })
    if (commit.status === 0) {
      const push = spawnSync(git, ['push', 'origin', 'main'], { cwd: root, stdio: 'inherit', shell: win })
      if (push.status !== 0) console.log('AVISO: commit criado, mas o git push falhou. Rode: git push origin main')
    } else {
      console.log('AVISO: build passou, mas o commit não foi criado. As alterações permanecem no projeto.')
    }
  }
}

console.log('\nPUBLICANDO CLOUDFLARE...')
const deploy = run(npm, ['run', 'deploy'])
if (deploy !== 0) {
  console.log('AVISO: O código e o build estão OK, mas o deploy Cloudflare falhou.')
  console.log('Depois rode manualmente: npm run deploy')
}

console.log('\n==============================================================')
console.log(' SITE - AUTOAGENDAMENTO FINAL CONCLUIDO')
console.log('==============================================================')
console.log('Teste:')
console.log('1) Fazer um novo agendamento até a confirmação.')
console.log('2) Conferir aviso de pagamento/reserva e WhatsApp preenchido.')
console.log('3) Testar Google Agenda e arquivo iPhone/Outlook (.ics).')
console.log('4) Abrir Já tenho agendamento e consultar por telefone + CPF/protocolo.')
console.log('5) No sistema, conferir a métrica de visitantes online do site.')
console.log('')
console.log('Backup:', backup)
