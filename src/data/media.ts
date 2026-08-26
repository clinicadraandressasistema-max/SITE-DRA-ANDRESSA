export type GalleryMediaItem = {
  id: string
  type: 'image' | 'video' | 'youtube' | 'drive'
  title: string
  description?: string
  src: string
  poster?: string
}

export type GalleryAlbum = {
  id: string
  title: string
  subtitle: string
  description: string
  cover: string
  category: 'Resultados' | 'Clínica' | 'Conteúdo'
  items: GalleryMediaItem[]
}

/**
 * A galeria foi preparada em formato de álbuns.
 *
 * Quando as mídias reais forem adicionadas, basta inserir os itens em "items".
 * O site já suporta:
 * - imagem local
 * - vídeo local
 * - YouTube
 * - Google Drive em modo de visualização
 */
export const galleryAlbums: GalleryAlbum[] = [
  {
    id: 'resultados',
    title: 'Resultados e acompanhamento',
    subtitle: 'Evolução, cuidado e acompanhamento',
    description:
      'Acompanhe registros de evolução e resultados compartilhados com autorização.',
    cover: '/media/galeria/resultados/capa.jpg',
    category: 'Resultados',
    items: [],
  },
  {
    id: 'clinica',
    title: 'Bastidores da clínica',
    subtitle: 'Um olhar sobre a rotina e o atendimento',
    description:
      'Conheça um pouco da rotina, da estrutura e dos bastidores do atendimento.',
    cover: '/media/galeria/clinica/capa.jpg',
    category: 'Clínica',
    items: [],
  },
  {
    id: 'videos',
    title: 'Conteúdos da Dra. Andressa',
    subtitle: 'Informação médica em vídeo',
    description:
      'Assista a conteúdos sobre saúde capilar, procedimentos, cuidados e acompanhamento.',
    cover: '/media/galeria/videos/capa.jpg',
    category: 'Conteúdo',
    items: [],
  },
]
