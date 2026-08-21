import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, MapPin, RefreshCcw, ShieldCheck, UserRound } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Reveal from '../components/Reveal'
import { services } from '../data/services'
import { createBooking, manageBooking, type BookingPatient, type BookingSelection } from '../services/bookingApi'

const fallbackLocations = [
  { id: 'curitiba', name: 'Curitiba' },
  { id: 'sao-jose', name: 'São José dos Pinhais' },
  { id: 'outra', name: 'Outra unidade / confirmar com a clínica' },
]

const fallbackProfessionals = [{ id: 'andressa', name: 'Dra. Andressa Dallarmi' }]
const fallbackTimes = ['08:30', '09:30', '10:30', '14:00', '15:00', '16:30']

function todayPlus(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export default function Booking() {
  const [params] = useSearchParams()
  const preselected = params.get('servico') || ''
  const [mode, setMode] = useState<'book' | 'manage'>('book')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ protocol?: string; message?: string } | null>(null)
  const [patient, setPatient] = useState<BookingPatient>({ fullName: '', phone: '', birthDate: '', cpf: '', email: '' })
  const [serviceId, setServiceId] = useState(preselected)
  const [locationId, setLocationId] = useState('')
  const [professionalId, setProfessionalId] = useState('andressa')
  const [date, setDate] = useState(todayPlus(2))
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [manageProtocol, setManageProtocol] = useState('')
  const [managePhone, setManagePhone] = useState('')
  const [manageResult, setManageResult] = useState<unknown>(null)

  const selectedService = useMemo(() => services.find((s) => s.id === serviceId), [serviceId])
  const selectedLocation = fallbackLocations.find((l) => l.id === locationId)
  const selectedProfessional = fallbackProfessionals.find((p) => p.id === professionalId)

  useEffect(() => {
    if (!success) return
    const timer = window.setTimeout(() => resetAll(), 90000)
    return () => window.clearTimeout(timer)
  }, [success])

  function resetAll() {
    setStep(1)
    setPatient({ fullName: '', phone: '', birthDate: '', cpf: '', email: '' })
    setServiceId(preselected)
    setLocationId('')
    setProfessionalId('andressa')
    setDate(todayPlus(2))
    setTime('')
    setNotes('')
    setSuccess(null)
    setError('')
  }

  function next() {
    setError('')
    if (step === 1 && (!patient.fullName.trim() || !patient.phone.trim())) return setError('Informe nome completo e telefone para continuar.')
    if (step === 2 && !serviceId) return setError('Escolha um serviço.')
    if (step === 3 && (!locationId || !professionalId)) return setError('Escolha unidade e profissional.')
    if (step === 4 && (!date || !time)) return setError('Escolha data e horário.')
    setStep((s) => Math.min(5, s + 1))
  }

  async function confirmBooking() {
    if (!selectedService || !selectedLocation || !selectedProfessional) return
    setLoading(true)
    setError('')
    try {
      const selection: BookingSelection = {
        serviceId,
        serviceName: selectedService.title,
        locationId,
        locationName: selectedLocation.name,
        professionalId,
        professionalName: selectedProfessional.name,
        date,
        time,
      }
      const result = await createBooking({ patient, selection, notes })
      setSuccess({ protocol: result.protocol || result.bookingId, message: result.message || 'Agendamento recebido com sucesso.' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível concluir o agendamento.')
    } finally {
      setLoading(false)
    }
  }

  async function lookupBooking() {
    setLoading(true)
    setError('')
    try {
      const result = await manageBooking({ protocol: manageProtocol, phone: managePhone, operation: 'lookup' })
      setManageResult(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível localizar o agendamento.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <section className="booking-page confirmation-page">
        <div className="container confirmation-wrap">
          <div className="confirmation-card">
            <span className="success-icon"><Check size={34}/></span>
            <span className="eyebrow">Agendamento registrado</span>
            <h1>Pronto. Seu pedido de horário foi recebido.</h1>
            <p>{success.message}</p>
            {success.protocol && <div className="protocol-box"><span>Protocolo</span><strong>{success.protocol}</strong></div>}
            <div className="confirmation-summary">
              <div><span>Serviço</span><strong>{selectedService?.title}</strong></div>
              <div><span>Unidade</span><strong>{selectedLocation?.name}</strong></div>
              <div><span>Data</span><strong>{date.split('-').reverse().join('/')}</strong></div>
              <div><span>Horário</span><strong>{time}</strong></div>
            </div>
            <p className="privacy-note">Você pode tirar um print desta tela como comprovante. Os dados preenchidos serão apagados desta página automaticamente.</p>
            <button className="button button-primary" onClick={resetAll}><RefreshCcw size={17}/> Fazer novo agendamento</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="booking-page">
      <div className="booking-top">
        <div className="container booking-title-grid">
          <Reveal><span className="eyebrow light">Autoagendamento</span><h1>Seu atendimento começa aqui.</h1><p>Escolha as opções disponíveis e finalize em poucos passos. A disponibilidade deve refletir as regras cadastradas no sistema administrativo.</p></Reveal>
          <Reveal delay={90} className="booking-security"><ShieldCheck/><div><strong>Privacidade por padrão</strong><span>A área pública não exibe prontuário, dados financeiros ou histórico clínico.</span></div></Reveal>
        </div>
      </div>

      <div className="container booking-shell">
        <div className="booking-mode-tabs">
          <button className={mode === 'book' ? 'active' : ''} onClick={() => setMode('book')}>Novo agendamento</button>
          <button className={mode === 'manage' ? 'active' : ''} onClick={() => setMode('manage')}>Já tenho agendamento</button>
        </div>

        {mode === 'manage' ? (
          <div className="manage-booking-card">
            <div><span className="eyebrow">Consultar / remarcar / cancelar</span><h2>Localize seu agendamento</h2><p>Use o protocolo recebido e o telefone informado no agendamento.</p></div>
            <div className="form-grid two">
              <label>Protocolo<input value={manageProtocol} onChange={(e) => setManageProtocol(e.target.value)} placeholder="Ex.: AGD-123456"/></label>
              <label>Telefone<input value={managePhone} onChange={(e) => setManagePhone(e.target.value)} placeholder="(41) 99999-9999"/></label>
            </div>
            {error && <div className="form-error">{error}</div>}
            <button disabled={loading || !manageProtocol || !managePhone} className="button button-primary" onClick={lookupBooking}>{loading ? 'Consultando...' : 'Consultar agendamento'}</button>
            {manageResult && <pre className="manage-result">{JSON.stringify(manageResult, null, 2)}</pre>}
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
              ].map(([number, label, Icon]) => {
                const N = number as number
                const I = Icon as typeof UserRound
                return <button key={N} className={`${step === N ? 'active' : ''} ${step > N ? 'done' : ''}`} onClick={() => step > N && setStep(N)}><span><I size={17}/></span><div><small>Passo 0{N}</small><strong>{label as string}</strong></div></button>
              })}
            </aside>

            <div className="booking-form-card">
              {step === 1 && <div className="booking-step-content"><span className="eyebrow">Passo 01</span><h2>Vamos identificar você</h2><p>Se já houver cadastro no sistema, a integração poderá vincular este agendamento ao paciente existente sem expor outras informações.</p><div className="form-grid two"><label>Nome completo *<input value={patient.fullName} onChange={(e) => setPatient({ ...patient, fullName: e.target.value })}/></label><label>Telefone *<input value={patient.phone} onChange={(e) => setPatient({ ...patient, phone: e.target.value })}/></label><label>Data de nascimento<input type="date" value={patient.birthDate} onChange={(e) => setPatient({ ...patient, birthDate: e.target.value })}/></label><label>CPF (opcional)<input value={patient.cpf} onChange={(e) => setPatient({ ...patient, cpf: e.target.value })}/></label><label className="full">E-mail (opcional)<input type="email" value={patient.email} onChange={(e) => setPatient({ ...patient, email: e.target.value })}/></label></div></div>}

              {step === 2 && <div className="booking-step-content"><span className="eyebrow">Passo 02</span><h2>O que você deseja agendar?</h2><div className="choice-grid">{services.map((service) => <button key={service.id} className={serviceId === service.id ? 'selected' : ''} onClick={() => setServiceId(service.id)}><small>{service.eyebrow}</small><strong>{service.title}</strong><span>{service.description}</span></button>)}</div></div>}

              {step === 3 && <div className="booking-step-content"><span className="eyebrow">Passo 03</span><h2>Onde e com quem?</h2><p>No sistema final, essas opções devem vir apenas das unidades e profissionais liberados para autoagendamento.</p><div className="choice-grid compact"><div className="choice-group"><h3>Unidade</h3>{fallbackLocations.map((location) => <button key={location.id} className={locationId === location.id ? 'selected' : ''} onClick={() => setLocationId(location.id)}><MapPin size={18}/><strong>{location.name}</strong></button>)}</div><div className="choice-group"><h3>Profissional</h3>{fallbackProfessionals.map((professional) => <button key={professional.id} className={professionalId === professional.id ? 'selected' : ''} onClick={() => setProfessionalId(professional.id)}><UserRound size={18}/><strong>{professional.name}</strong></button>)}</div></div></div>}

              {step === 4 && <div className="booking-step-content"><span className="eyebrow">Passo 04</span><h2>Escolha data e horário</h2><div className="date-picker-line"><label>Data<input type="date" min={todayPlus(1)} value={date} onChange={(e) => { setDate(e.target.value); setTime('') }}/></label></div><div className="time-grid">{fallbackTimes.map((slot) => <button key={slot} className={time === slot ? 'selected' : ''} onClick={() => setTime(slot)}>{slot}</button>)}</div><small className="integration-hint">Na integração definitiva, horários bloqueados, ocupados e indisponíveis não devem aparecer nesta lista.</small></div>}

              {step === 5 && <div className="booking-step-content"><span className="eyebrow">Passo 05</span><h2>Confira antes de confirmar</h2><div className="review-list"><div><span>Paciente</span><strong>{patient.fullName}</strong></div><div><span>Serviço</span><strong>{selectedService?.title}</strong></div><div><span>Unidade</span><strong>{selectedLocation?.name}</strong></div><div><span>Profissional</span><strong>{selectedProfessional?.name}</strong></div><div><span>Data</span><strong>{date.split('-').reverse().join('/')}</strong></div><div><span>Horário</span><strong>{time}</strong></div></div><label>Observações para a recepção<textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional. Não coloque informações clínicas sensíveis neste campo."/></label></div>}

              {error && <div className="form-error">{error}</div>}
              <div className="booking-nav">
                <button className="button button-ghost" disabled={step === 1 || loading} onClick={() => setStep((s) => Math.max(1, s - 1))}><ChevronLeft size={18}/> Voltar</button>
                {step < 5 ? <button className="button button-primary" onClick={next}>Continuar <ChevronRight size={18}/></button> : <button className="button button-primary" disabled={loading} onClick={confirmBooking}>{loading ? 'Enviando...' : 'Confirmar agendamento'} <Check size={18}/></button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
