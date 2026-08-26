import { MessageCircle } from 'lucide-react'
import { whatsappUrl } from '../data/site'

export default function WhatsAppButton() {
  return (
    <a
      className="whatsapp-float whatsapp-float-clean"
      href={whatsappUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar com a clínica pelo WhatsApp"
    >
      <span className="whatsapp-icon-shell">
        <span className="whatsapp-icon-pulse" />
        <span className="whatsapp-icon-circle">
          <MessageCircle size={19} />
        </span>
      </span>

      <span className="whatsapp-copy">
        <strong>Chame a gente agora!</strong>
        <small>Atendimento rápido no WhatsApp</small>
      </span>
    </a>
  )
}
