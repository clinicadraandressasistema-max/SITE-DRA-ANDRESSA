import { ArrowRight, Images } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { GalleryAlbum } from '../data/media'

type Props = {
  item: GalleryAlbum
  onOpen?: () => void
}

export default function MediaCard({ item, onOpen }: Props) {
  const content = (
    <>
      <div
        className="media-visual album-cover"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(64,8,23,.05), rgba(64,8,23,.62)), url('${item.cover}')`,
        }}
      >
        <div className="album-cover-content">
          <Images size={20} />
          <span>{item.subtitle}</span>
        </div>
      </div>

      <div className="media-copy">
        <span>{item.category}</span>
        <h3>{item.title}</h3>
        <p>{item.description}</p>

        <div className="media-card-action">
          <strong>
            {item.items.length > 0
              ? `${item.items.length} conteúdo${item.items.length === 1 ? '' : 's'}`
              : 'Conhecer'}
          </strong>
          <ArrowRight size={17} />
        </div>
      </div>
    </>
  )

  if (onOpen) {
    return (
      <button
        type="button"
        className="media-card media-card-button"
        onClick={onOpen}
      >
        {content}
      </button>
    )
  }

  return (
    <Link className="media-card" to={`/galeria?album=${item.id}`}>
      {content}
    </Link>
  )
}
