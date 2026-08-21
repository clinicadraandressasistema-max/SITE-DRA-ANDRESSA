import Reveal from '../components/Reveal'
import SectionHeader from '../components/SectionHeader'
import MediaCard from '../components/MediaCard'
import { mediaItems } from '../data/media'

export default function Gallery() {
  return (
    <>
      <section className="page-hero gallery-hero">
        <div className="container page-hero-grid"><Reveal><span className="eyebrow light">Galeria</span><h1>Uma vitrine viva para resultados, histórias, bastidores e conteúdo médico.</h1></Reveal><Reveal delay={100}><p>Você poderá alimentar esta página sem reconstruir o layout: basta trocar os arquivos ou editar a lista de mídias.</p></Reveal></div>
      </section>
      <section className="section section-rose-soft">
        <div className="container">
          <Reveal><SectionHeader eyebrow="Mídia da clínica" title="Fotos e vídeos organizados em um mesmo espaço." description="As imagens abaixo são placeholders. A estrutura aceita arquivos locais, YouTube e links públicos do Google Drive." /></Reveal>
          <div className="media-grid gallery-grid">{mediaItems.map((item, index) => <Reveal key={item.id} delay={(index % 4) * 70}><MediaCard item={item}/></Reveal>)}</div>
          <Reveal className="editor-note"><strong>Como alimentar depois:</strong><p>Arquivos locais: use <code>/public/media/images</code> e <code>/public/media/videos</code>. Links externos: edite <code>src/data/media.ts</code>. Para antes/depois, use apenas materiais com autorização adequada para divulgação.</p></Reveal>
        </div>
      </section>
    </>
  )
}
