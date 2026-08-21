export type ServiceItem = {
  id: string
  title: string
  eyebrow: string
  description: string
  details: string[]
  accent: 'wine' | 'rose' | 'gold' | 'plum'
}

export const services: ServiceItem[] = [
  {
    id: 'transplante-capilar',
    title: 'Transplante capilar',
    eyebrow: 'Restauração capilar',
    description: 'Planejamento individualizado para desenho, densidade e distribuição dos fios com foco em naturalidade.',
    details: ['Avaliação personalizada', 'Técnicas de restauração capilar', 'Acompanhamento de evolução'],
    accent: 'wine',
  },
  {
    id: 'transplante-feminino',
    title: 'Transplante capilar feminino',
    eyebrow: 'FUE & Long Hair',
    description: 'Abordagem delicada e personalizada para diferentes padrões de rarefação e objetivos estéticos.',
    details: ['Planejamento de linha frontal', 'Estratégia conforme área doadora', 'Acompanhamento pós-procedimento'],
    accent: 'rose',
  },
  {
    id: 'barba-sobrancelha',
    title: 'Barba e sobrancelhas',
    eyebrow: 'Restauração localizada',
    description: 'Planejamento de desenho e distribuição para preencher áreas específicas com harmonia facial.',
    details: ['Desenho personalizado', 'Distribuição estratégica', 'Avaliação médica prévia'],
    accent: 'gold',
  },
  {
    id: 'tricologia',
    title: 'Consulta em tricologia',
    eyebrow: 'Saúde dos fios e couro cabeludo',
    description: 'Investigação das causas de queda, afinamento e alterações capilares para definir uma estratégia de cuidado.',
    details: ['Avaliação clínica', 'Investigação individualizada', 'Plano de acompanhamento'],
    accent: 'plum',
  },
  {
    id: 'cirurgia-dermatologica',
    title: 'Cirurgia dermatológica',
    eyebrow: 'Procedimentos cirúrgicos',
    description: 'Avaliação cirúrgica criteriosa para procedimentos dermatológicos selecionados, conforme indicação médica.',
    details: ['Consulta pré-operatória', 'Planejamento cirúrgico', 'Acompanhamento pós-operatório'],
    accent: 'wine',
  },
  {
    id: 'cirurgia-geral',
    title: 'Cirurgia geral',
    eyebrow: 'Avaliação médica especializada',
    description: 'Consulta médica para avaliação, orientação e condução de condições relacionadas à cirurgia geral.',
    details: ['Avaliação médica', 'Orientação terapêutica', 'Encaminhamento quando necessário'],
    accent: 'rose',
  },
]
