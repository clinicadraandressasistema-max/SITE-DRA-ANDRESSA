import { ExternalLink, Play } from 'lucide-react'
import type { MediaItem } from '../data/media'

export default function MediaCard({ item }: { item: MediaItem }) {
  const content = (
    <>
      <div className="media-visual">
        <img src={item.cover || item.src} alt={item.title} />
        {item.type !== 'image' && <span className="play-pill"><Play fill="currentColor" size={18} /></span>}
      </div>
      <div className="media-copy">
        <span>{item.category}</span>
        <h3>{item.title}</h3>
        {item.description && <p>{item.description}</p>}
      </div>
    </>
  )

  if (item.type === 'image') return <article className="media-card">{content}</article>
  return <a className="media-card" href={item.src} target="_blank" rel="noreferrer">{content}<ExternalLink className="media-external" size={18} /></a>
}
