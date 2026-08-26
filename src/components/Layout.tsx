import { useEffect, useState } from 'react'
import { Instagram, Menu, X, ArrowUpRight, CalendarDays } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import PageTransition from './PageTransition'
import WhatsAppButton from './WhatsAppButton'
import SecurityNotice from './SecurityNotice'
import { siteData, whatsappUrl } from '../data/site'

const nav = [
  ['/', 'Início'],
  ['/sobre', 'Dra. Andressa'],
  ['/servicos', 'Serviços'],
  ['/galeria', 'Galeria'],
  ['/agendamento', 'Autoagendamento'],
] as const

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link to="/" className="brand-lockup" aria-label="Dra. Andressa Dallarmi - início">
          <img src="/brand/logo.png" alt="Logo Dra. Andressa Dallarmi" />
          <div>
            <strong>{siteData.brand.name}</strong>
            <span>{siteData.brand.subtitle}</span>
          </div>
        </Link>

        <nav className="desktop-nav" aria-label="Navegação principal">
          {nav.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <a className="icon-link" href={siteData.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
            <Instagram size={19} />
          </a>
          <Link className="button button-primary header-book" to="/agendamento">
            <CalendarDays size={17} /> Agendar
          </Link>
          <button className="menu-button" onClick={() => setOpen((v) => !v)} aria-label="Abrir menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${open ? 'open' : ''}`}>
        <div className="mobile-menu-inner">
          {nav.map(([to, label], index) => (
            <NavLink key={to} to={to} style={{ transitionDelay: `${index * 55}ms` }}>
              <span>0{index + 1}</span>{label}<ArrowUpRight size={18} />
            </NavLink>
          ))}
          <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="mobile-contact">Conversar com a clínica</a>
        </div>
      </div>

      <PageTransition>{children}</PageTransition>

      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/brand/logo.png" alt="" />
            <p>Atendimento médico com planejamento individualizado, segurança e acompanhamento próximo.</p>
          </div>
          <div>
            <span className="footer-label">Navegação</span>
            <Link to="/sobre">Sobre a médica</Link>
            <Link to="/servicos">Serviços</Link>
            <Link to="/galeria">Galeria</Link>
            <Link to="/agendamento">Autoagendamento</Link>
          </div>
          <div>
            <span className="footer-label">Contato</span>
            <a href={siteData.social.instagram} target="_blank" rel="noreferrer">Instagram</a>
            <a href={whatsappUrl()} target="_blank" rel="noreferrer">WhatsApp</a>
          </div>
          <div>
            <span className="footer-label">Registro profissional</span>
            <p>{siteData.professional.crm}</p>
            <p>{siteData.professional.rqe}</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Dra. Andressa Dallarmi.</span>
          <span>Conteúdo informativo. A indicação e os resultados dependem de avaliação médica individual.</span>
        </div>
      </footer>
      <SecurityNotice />
      <WhatsAppButton />
    </div>
  )
}
