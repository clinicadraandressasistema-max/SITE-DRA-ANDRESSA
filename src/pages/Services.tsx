import { ArrowRight, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import SectionHeader from '../components/SectionHeader'
import { services } from '../data/services'

export default function Services() {
  return (
    <>
      <section className="page-hero services-hero">
        <div className="container page-hero-grid">
          <Reveal>
            <span className="eyebrow light">Serviços</span>
            <h1>
              Procedimentos e avaliações apresentados com clareza, elegância e
              contexto.
            </h1>
          </Reveal>

          <Reveal delay={100}>
            <p>
              Conheça as áreas de atuação da Dra. Andressa e entenda como cada
              avaliação ou procedimento pode fazer parte de um plano
              individualizado.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section section-ivory">
        <div className="container">
          <Reveal>
            <SectionHeader
              eyebrow="Áreas de atuação"
              title="Escolha o tema que deseja conhecer."
              description="Veja detalhes dos atendimentos e, quando desejar, avance diretamente para o agendamento."
            />
          </Reveal>

          <div className="service-detail-list">
            {services.map((service, index) => (
              <Reveal
                key={service.id}
                delay={(index % 3) * 60}
                className="service-detail"
              >
                <div
                  id={service.id}
                  className={`service-detail-number accent-${service.accent}`}
                >
                  0{index + 1}
                </div>

                <div className="service-detail-copy">
                  <span>{service.eyebrow}</span>
                  <h2>{service.title}</h2>
                  <p>{service.description}</p>

                  <ul>
                    {service.details.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="service-detail-action">
                  <div
                    className="service-media-showcase"
                    style={{
                      backgroundImage: `url('/media/images/servicos/${service.id}.png')`,
                    }}
                  >
                    <span>{service.eyebrow}</span>
                    <strong>{service.title}</strong>
                  </div>

                  <Link
                    to={`/agendamento?servico=${service.id}`}
                    className="button button-primary"
                  >
                    <CalendarDays size={17} />
                    Agendar
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="simple-cta">
        <div className="container">
          <h2>Não sabe qual caminho é o mais adequado?</h2>
          <p>
            Comece por uma avaliação e a equipe orientará os próximos passos.
          </p>

          <Link to="/agendamento" className="button button-light">
            Agendar avaliação
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  )
}
