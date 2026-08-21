export type MediaItem = {
  id: string
  type: 'image' | 'youtube' | 'drive'
  title: string
  description?: string
  src: string
  cover?: string
  category: 'resultados' | 'procedimentos' | 'conteudo' | 'clinica'
}

// Troque ou acrescente itens aqui. Para arquivos locais, coloque as mídias em /public/media/images ou /public/media/videos.
export const mediaItems: MediaItem[] = [
  {
    id: 'placeholder-1',
    type: 'image',
    title: 'Resultados e acompanhamento',
    description: 'Espaço preparado para fotos autorizadas de evolução e resultados.',
    src: '/media/images/placeholder-result.svg',
    category: 'resultados',
  },
  {
    id: 'placeholder-2',
    type: 'image',
    title: 'Bastidores da clínica',
    description: 'Use este espaço para equipe, estrutura e momentos de atendimento.',
    src: '/media/images/placeholder-clinic.svg',
    category: 'clinica',
  },
  {
    id: 'placeholder-3',
    type: 'image',
    title: 'Conteúdo em vídeo',
    description: 'Você pode substituir por vídeo do YouTube, Drive público ou arquivo local.',
    src: '/media/images/placeholder-video.svg',
    category: 'conteudo',
  },
]
