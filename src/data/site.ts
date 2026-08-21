export const siteData = {
  brand: {
    name: 'Dra. Andressa Dallarmi',
    subtitle: 'Cirurgia Geral & Estética',
    shortName: 'Dra. Andressa',
  },
  professional: {
    title: 'Médica cirurgiã com olhar técnico, estético e individualizado.',
    description:
      'Atuação em cirurgia geral, tricologia e restauração capilar, com planejamento cuidadoso e acompanhamento próximo em todas as etapas.',
    crm: 'CRM 28292 PR',
    rqe: 'RQE 2826',
    highlights: [
      'Restauração capilar com planejamento individualizado',
      'Experiência internacional',
      'Atendimento presencial e avaliação personalizada',
    ],
  },
  social: {
    instagram: import.meta.env.VITE_INSTAGRAM_URL || '#',
    whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '',
  },
}

export function whatsappUrl(message = 'Olá! Vim pelo site da Dra. Andressa e gostaria de informações.') {
  const number = siteData.social.whatsappNumber.replace(/\D/g, '')
  if (!number) return '#'
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
