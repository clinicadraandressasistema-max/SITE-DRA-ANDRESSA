import { useEffect, useMemo, useState } from 'react'
import { Image as ImageIcon, PlayCircle, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Reveal from '../components/Reveal'
import SectionHeader from '../components/SectionHeader'
import MediaCard from '../components/MediaCard'
import {
  galleryAlbums,
  type GalleryMediaItem,
} from '../data/media'

function youtubeEmbed(src: string) {
  try {
    const url = new URL(src)

    if (url.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${url.pathname.replace('/', '')}`
    }

    const id = url.searchParams.get('v')

    if (id) {
      return `https://www.youtube.com/embed/${id}`
    }

    if (url.pathname.includes('/embed/')) {
      return src
    }
  } catch {
    return src
  }

  return src
}

function drivePreview(src: string) {
  if (src.includes('/preview')) return src

  if (src.includes('/view')) {
    return src.replace(/\/view.*$/, '/preview')
  }

  return src
}

function GalleryAsset({ item }: { item: GalleryMediaItem }) {
  return (
    <article className="gallery-asset">
      <div className="gallery-asset-media">
        {item.type === 'image' && (
          <img src={item.src} alt={item.title} loading="lazy" />
        )}

        {item.type === 'video' && (
          <video
            controls
            playsInline
            preload="metadata"
            poster={item.poster}
          >
            <source src={item.src} />
            Seu navegador não conseguiu reproduzir este vídeo.
          </video>
        )}

        {item.type === 'youtube' && (
          <iframe
            src={youtubeEmbed(item.src)}
            title={item.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}

        {item.type === 'drive' && (
          <iframe
            src={drivePreview(item.src)}
            title={item.title}
            loading="lazy"
            allow="autoplay"
            allowFullScreen
          />
        )}
      </div>

      <div className="gallery-asset-copy">
        <h3>{item.title}</h3>
        {item.description && <p>{item.description}</p>}
      </div>
    </article>
  )
}

export default function Gallery() {
  const [params] = useSearchParams()
  const [activeId, setActiveId] = useState(params.get('album') || '')

  const activeAlbum = useMemo(
    () => galleryAlbums.find((item) => item.id === activeId) || null,
    [activeId],
  )

  useEffect(() => {
    const requestedAlbum = params.get('album') || ''

    if (requestedAlbum) {
      setActiveId(requestedAlbum)
    }
  }, [params])

  useEffect(() => {
    if (!activeAlbum) return

    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveId('')
      }
    }

    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = oldOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [activeAlbum])

  return (
    <>
      <section className="page-hero gallery-hero">
        <div className="container page-hero-grid">
          <Reveal>
            <span className="eyebrow light">Galeria</span>

            <h1>
              Uma vitrine viva para resultados, histórias, bastidores e
              conteúdo médico.
            </h1>
          </Reveal>

          <Reveal delay={100}>
            <p>
              Explore registros da clínica, conteúdos da Dra. Andressa e
              informações que ajudam a acompanhar mais de perto cada área de
              cuidado.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section section-rose-soft">
        <div className="container">
          <Reveal>
            <SectionHeader
              eyebrow="Galeria da clínica"
              title="Escolha uma categoria e acompanhe os conteúdos."
              description="Fotos, vídeos e informações reunidos para você conhecer melhor a clínica, os cuidados e a trajetória de cada acompanhamento."
            />
          </Reveal>

          <div className="media-grid gallery-grid">
            {galleryAlbums.map((album, index) => (
              <Reveal key={album.id} delay={(index % 4) * 70}>
                <MediaCard
                  item={album}
                  onOpen={() => setActiveId(album.id)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {activeAlbum && (
        <div
          className="gallery-modal-backdrop"
          role="presentation"
          onMouseDown={() => setActiveId('')}
        >
          <section
            className="gallery-modal"
            role="dialog"
            aria-modal="true"
            aria-label={activeAlbum.title}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="gallery-modal-header">
              <div>
                <span>{activeAlbum.category}</span>
                <h2>{activeAlbum.title}</h2>
                <p>{activeAlbum.description}</p>
              </div>

              <button
                type="button"
                onClick={() => setActiveId('')}
                aria-label="Fechar galeria"
              >
                <X size={21} />
              </button>
            </header>

            {activeAlbum.items.length > 0 ? (
              <div className="gallery-modal-content">
                {activeAlbum.items.map((item) => (
                  <GalleryAsset key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="gallery-empty-public">
                {activeAlbum.category === 'Conteúdo' ? (
                  <PlayCircle size={42} />
                ) : (
                  <ImageIcon size={42} />
                )}

                <h3>Novos conteúdos serão publicados em breve.</h3>
                <p>
                  Acompanhe esta página para conhecer novas fotos, vídeos e
                  atualizações da Dra. Andressa.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  )
}
