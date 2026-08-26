import { ArrowRight, CalendarDays, CircleCheck, Globe2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import SectionHeader from '../components/SectionHeader'
import ServiceCard from '../components/ServiceCard'
import MediaCard from '../components/MediaCard'
import { services } from '../data/services'
import { galleryAlbums } from '../data/media'
import { siteData } from '../data/site'

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-orbit hero-orbit-a" />
        <div className="hero-orbit hero-orbit-b" />

        <div className="container hero-grid">
          <Reveal className="hero-copy">
            <span className="eyebrow light">
              Cirurgia • Tricologia • Restauração capilar
            </span>

            <h1>
              Precisão médica.<br />
              <em>Naturalidade</em> em cada detalhe.
            </h1>

            <p>{siteData.professional.description}</p>

            <div className="hero-actions">
              <Link className="button button-light" to="/agendamento">
                <CalendarDays size={18} />
                Agendar avaliação
              </Link>

              <Link className="button button-ghost-light" to="/servicos">
                Conhecer serviços
                <ArrowRight size={18} />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={140} className="hero-art">
            <div className="hero-logo-card">
              <img src="/brand/logo.png" alt="Dra. Andressa Dallarmi" />

              <div className="hero-metric">
                <strong>Brasil • Portugal • Israel</strong>
                <span>Experiência e formação internacional</span>
              </div>
            </div>

            <div className="hero-floating-card">
              <Sparkles size={18} />
              <span>Planejamento individualizado</span>
            </div>
          </Reveal>
        </div>

        <div className="hero-marquee">
          <span>
            ESTÉTICA • TÉCNICA • SEGURANÇA • ACOMPANHAMENTO • NATURALIDADE •
          </span>
        </div>
      </section>

      <section className="section section-ivory">
        <div className="container split-intro">
          <Reveal>
            <span className="giant-number">01</span>
          </Reveal>

          <Reveal delay={80}>
            <SectionHeader
              eyebrow="Uma medicina feita nos detalhes"
              title="Cada plano começa entendendo a pessoa, não apenas o procedimento."
              description="Avaliação, indicação, técnica e acompanhamento caminham juntos para uma experiência mais segura, clara e individualizada."
            />

            <div className="principles">
              <div>
                <CircleCheck />
                <span>Avaliação médica personalizada</span>
              </div>

              <div>
                <CircleCheck />
                <span>Planejamento técnico e estético</span>
              </div>

              <div>
                <CircleCheck />
                <span>Acompanhamento em cada etapa</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section services-showcase">
        <div className="container">
          <Reveal>
            <SectionHeader
              eyebrow="Serviços"
              title="Cuidado médico com diferentes caminhos e a mesma atenção aos detalhes."
              description="Conheça as principais áreas de atuação e encontre informações para entender melhor cada possibilidade de cuidado."
            />
          </Reveal>

          <div className="service-grid">
            {services.slice(0, 4).map((service, index) => (
              <Reveal key={service.id} delay={index * 70}>
                <ServiceCard service={service} index={index} />
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="section-cta">
              <Link to="/servicos" className="button button-outline">
                Ver todos os serviços
                <ArrowRight size={17} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section editorial-band">
        <div className="container editorial-grid">
          <Reveal className="editorial-card large">
            <span className="eyebrow light">Dra. Andressa Dallarmi</span>

            <h2>
              Experiência cirúrgica, restauração capilar e uma abordagem
              guiada por harmonia.
            </h2>

            <p>
              Formação médica, prática cirúrgica e atuação internacional
              reunidas em um atendimento próximo e individualizado.
            </p>

            <Link to="/sobre" className="text-link light">
              Conhecer trajetória
              <ArrowRight size={18} />
            </Link>
          </Reveal>

          <Reveal delay={100} className="editorial-stack">
            <div className="mini-feature mini-feature-image feature-international">
              <Globe2 />
              <div>
                <strong>Experiência internacional</strong>
                <span>Brasil, Portugal e Israel</span>
              </div>
            </div>

            <div className="mini-feature mini-feature-image feature-natural">
              <Sparkles />
              <div>
                <strong>Naturalidade</strong>
                <span>Planejamento alinhado às características individuais</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section-rose-soft">
        <div className="container">
          <Reveal>
            <SectionHeader
              eyebrow="Galeria & conteúdo"
              title="Resultados, bastidores e conteúdos para acompanhar de perto."
              description="Conheça momentos da clínica, acompanhe conteúdos da Dra. Andressa e explore informações sobre cuidados, procedimentos e evolução."
            />
          </Reveal>

          <div className="media-grid home-media">
            {galleryAlbums.slice(0, 3).map((album, index) => (
              <Reveal key={album.id} delay={index * 80}>
                <MediaCard item={album} />
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="section-cta">
              <Link to="/galeria" className="button button-outline">
                Abrir galeria
                <ArrowRight size={17} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="booking-banner">
        <div className="container booking-banner-inner">
          <Reveal>
            <span className="eyebrow light">Autoagendamento</span>
            <h2>
              Escolha o atendimento, a unidade, o profissional, a data e o
              horário diretamente pelo site.
            </h2>
          </Reveal>

          <Reveal delay={90}>
            <p>
              Agende sua avaliação com praticidade e consulte os horários
              disponíveis para o atendimento que você procura.
            </p>

            <Link className="button button-light" to="/agendamento">
              Agendar agora
              <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}
