import { MessageCircle } from 'lucide-react'

const WHATSAPP_NUMBER = '5541995969494'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Olá! Vim pelo site da Dra. Andressa e gostaria de falar com a equipe.',
)}`

export default function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Clínica Dra. Andressa no WhatsApp"
      title="Falar no WhatsApp"
      className="whatsapp-float-30b"
      onClick={(event) => event.stopPropagation()}
    >
      <MessageCircle size={29} strokeWidth={2.1} />
    </a>
  )
}
