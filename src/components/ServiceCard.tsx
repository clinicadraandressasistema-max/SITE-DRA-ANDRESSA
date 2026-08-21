import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ServiceItem } from '../data/services'

export default function ServiceCard({ service, index }: { service: ServiceItem; index: number }) {
  return (
    <article className={`service-card accent-${service.accent}`}>
      <div className="service-card-top">
        <span>0{index + 1}</span>
        <small>{service.eyebrow}</small>
      </div>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
      <Link to={`/servicos#${service.id}`} className="text-link">Conhecer <ArrowUpRight size={17} /></Link>
    </article>
  )
}
