import { MessageCircle } from 'lucide-react'
import { whatsappUrl } from '../data/site'

export default function WhatsAppButton() {
  const href = whatsappUrl()
  if (href === '#') return null
  return (
    <a className="whatsapp-float" href={href} target="_blank" rel="noreferrer" aria-label="Falar com a clínica pelo WhatsApp">
      <MessageCircle size={24} />
      <span>Fale conosco</span>
    </a>
  )
}
