import { Award, BookOpen, Globe2, HeartHandshake } from 'lucide-react'
import Reveal from '../components/Reveal'
import SectionHeader from '../components/SectionHeader'
import { siteData } from '../data/site'

const timeline = [
  [
    'Formação médica',
    'Graduação em Medicina pela Faculdade Evangélica Mackenzie do Paraná.',
  ],
  [
    'Cirurgia Geral',
    'Residência Médica em Cirurgia Geral pelo HONPAR.',
  ],
  [
    'Tricologia & transplante capilar',
    'Pós-graduação com prática clínica e cirúrgica voltada à saúde e restauração capilar.',
  ],
  [
    'Experiência internacional',
    'Mestrado Integrado em Medicina pela Universidade do Porto e estágio internacional em cirurgia no Sheba Medical Center.',
  ],
]

export default function About() {
  return (
    <>
      <section className="page-hero about-hero">
        <div className="container page-hero-grid about-hero-grid">
          <Reveal>
            <span className="eyebrow light">Sobre a médica</span>

            <h1>
              Ciência, cirurgia e estética em uma trajetória construída com
              profundidade.
            </h1>
          </Reveal>

          <Reveal delay={100} className="about-hero-portrait">
            <img
              className="about-doctor-cutout"
              src="/media/images/dra-andressa/dra-andressa-sobre-principal.png"
              alt="Dra. Andressa Dallarmi"
            />

            <div className="about-photo-caption">
              <span>Dra. Andressa Dallarmi</span>
              <p>{siteData.professional.title}</p>

              <div className="credential-row">
                <span>{siteData.professional.crm}</span>
                <span>{siteData.professional.rqe}</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section-ivory">
        <div className="container about-public-grid">
          <Reveal className="about-philosophy-card">
            <span className="eyebrow">Atendimento individualizado</span>

            <h2>Precisão técnica com cuidado em cada etapa.</h2>

            <p>
              Cada indicação nasce de uma avaliação cuidadosa, considerando
              características individuais, objetivos e segurança.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <SectionHeader
              eyebrow="Dra. Andressa Dallarmi"
              title="Uma abordagem precisa, estética e individualizada."
              description="A experiência do paciente é conduzida com discrição, segurança e atenção aos detalhes, do primeiro contato ao acompanhamento da evolução."
            />

            <div className="about-icons">
              <div>
                <Award />
                <strong>Cirurgia</strong>
                <span>Base técnica e planejamento médico.</span>
              </div>

              <div>
                <BookOpen />
                <strong>Tricologia</strong>
                <span>Investigação e cuidado capilar.</span>
              </div>

              <div>
                <Globe2 />
                <strong>Internacional</strong>
                <span>Vivências acadêmicas e profissionais fora do Brasil.</span>
              </div>

              <div>
                <HeartHandshake />
                <strong>Acompanhamento</strong>
                <span>Comunicação próxima em todas as etapas.</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section timeline-section">
        <div className="container">
          <Reveal>
            <SectionHeader
              eyebrow="Formação & trajetória"
              title="Uma linha do tempo que conecta formação, prática cirúrgica e restauração capilar."
            />
          </Reveal>

          <div className="timeline">
            {timeline.map(([title, text], index) => (
              <Reveal
                key={title}
                delay={index * 70}
                className="timeline-item"
              >
                <span>0{index + 1}</span>

                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
