import { imagensDaPasta, pastaEspecialidade } from "./lib/media";
import SpecialtyModal from "./components/SpecialtyModal";
import { useEffect, useState } from "react";
import { clinicConfig } from "./config";

import {
  ClinicalTeamCTA,
  LocationsSection,
  SpecialtiesContentHub,
} from "./components/HomeExtras";
const especialidades = [
  {
    nome: "Cirurgia Geral",
    texto: "Avaliação, acompanhamento e cuidado cirúrgico individualizado.",
    imagem: "/media/images/servicos/cirurgia-geral.png",
  },
  {
    nome: "Tricologia",
    texto: "Cuidado médico voltado à saúde dos cabelos e couro cabeludo.",
    imagem: "/media/images/servicos/tricologia.png",
  },
  {
    nome: "Transplante Capilar",
    texto: "Planejamento individualizado com foco em naturalidade e harmonia.",
    imagem: "/media/images/servicos/transplante-capilar.png",
  },
  {
    nome: "Barba e Sobrancelhas",
    texto: "Restauração planejada respeitando características individuais.",
    imagem: "/media/images/servicos/barba-sobrancelha.png",
  },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [especialidadeAberta, setEspecialidadeAberta] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const fallbackSlides = [
    {
      src: "/media/images/dra-andressa/dra-andressa-sobre-principal.png",
      alt: "Clinica Dall'Armi",
    },
    {
      src: "/media/images/servicos/cirurgia-geral.png",
      alt: "Atendimento medico",
    },
    {
      src: "/media/images/servicos/transplante-feminino.png",
      alt: "Cuidado e restauracao capilar",
    },
  ];

  const bannerDesktop = imagensDaPasta("home/banners/desktop");
  const bannerMobile = imagensDaPasta("home/banners/mobile");

  const heroSlides = bannerDesktop.length
    ? bannerDesktop.map((src, index) => ({
        src,
        alt: `Imagem do banner da Clinica Dall'Armi - ${index + 1}`,
      }))
    : fallbackSlides;

  useEffect(() => {
    document.title = "Clínica Dall'Armi | Clínica Médica & Cirúrgica";
  }, []);

  useEffect(() => {
    const total = heroSlides.length;

    if (total < 2) return;

    const timer = window.setInterval(() => {
      setCurrentSlide((atual) => (atual + 1) % total);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [heroSlides.length]);
  const abrir = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const abrirWhatsApp = () => {
    const base = clinicConfig.whatsapp?.trim();

    if (!base) return;

    const mensagem =
      "Ol\u00e1! Vim pelo site da Cl\u00ednica Dall'Armi e gostaria de informa\u00e7\u00f5es sobre atendimento e agendamento.";

    const separador = base.includes("?") ? "&" : "?";

    window.open(
      `${base}${separador}text=${encodeURIComponent(mensagem)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const abrirAgendamento = () => {
    window.location.assign("/agendar");
  };

  const irParaContato = () => {
    document
      .getElementById("contato")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div id="dallarmi-public-home" className="site">
      <header className="header">
        <div className="container header-inner">
          <a href="#inicio" className="brand">
            <strong>DALL'ARMI</strong>
            <span>CLÍNICA MÉDICA & CIRÚRGICA</span>
          </a>

          <nav className={menuOpen ? "nav nav-open" : "nav"}>
            <a href="#inicio" onClick={() => setMenuOpen(false)}>Início</a>
            <a href="#clinica" onClick={() => setMenuOpen(false)}>A Clínica</a>
            <a href="#especialidades" onClick={() => setMenuOpen(false)}>Especialidades</a>
            <a href="#transplante" onClick={() => setMenuOpen(false)}>Transplante Capilar</a>
            <a href="#equipe" onClick={() => setMenuOpen(false)}>Corpo Clínico</a>
            <a href="/experiencias" onClick={() => setMenuOpen(false)}>Experiências</a>
            <a href="#atendimento" onClick={() => setMenuOpen(false)}>Convênios</a>
            <a
              href="#contato"
              onClick={(event) => {
                event.preventDefault();
                setMenuOpen(false);
                irParaContato();
              }}
            >
              Contato
            </a>
          </nav>

          <button
            className="header-book"
            type="button"
            onClick={() => setBookingOpen(true)}
          >
            Agende sua consulta
          </button>

          <button
            className="menu-button"
            type="button"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main>
                <section className="hero hero-carousel" id="inicio">
          <div className={`hero-carousel-frame ${bannerMobile.length ? "has-mobile-banners" : ""}`}>
            {heroSlides.map((slide, index) => (
              <div
                className={`hero-slide ${
                  index === currentSlide ? "hero-slide-active" : ""
                }`}
                key={slide.src}
                aria-hidden={index !== currentSlide}
              >
                <picture>
                  {bannerMobile.length > 0 && (
                    <source
                      media="(max-width: 560px)"
                      srcSet={bannerMobile[index] || slide.src}
                    />
                  )}
                  <img src={slide.src} alt={slide.alt} />
                </picture>
              </div>
            ))}

            <button
              className="carousel-arrow carousel-arrow-left"
              type="button"
              aria-label="Imagem anterior"
              onClick={() =>
                setCurrentSlide(
                  (currentSlide - 1 + heroSlides.length) %
                    heroSlides.length
                )
              }
            >
              â€¹
            </button>

            <button
              className="carousel-arrow carousel-arrow-right"
              type="button"
              aria-label="Próxima imagem"
              onClick={() =>
                setCurrentSlide(
                  (currentSlide + 1) % heroSlides.length
                )
              }
            >
              â€º
            </button>

            <div className="carousel-dots" aria-label="Imagens do banner">
              {heroSlides.map((_, index) => (
                <button
                  type="button"
                  key={index}
                  className={
                    index === currentSlide
                      ? "carousel-dot carousel-dot-active"
                      : "carousel-dot"
                  }
                  aria-label={`Ver imagem ${index + 1}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="intro" id="clinica">
          <div className="container intro-grid">
            <div>
              <p className="overline">CLÍNICA DALL'ARMI</p>

              <h2>
                Medicina com cuidado,
                <br />
                <em>segurança e atenção.</em>
              </h2>
            </div>

            <div className="intro-copy">
              <p>
                Uma clínica pensada para oferecer uma experiência médica
                organizada, acolhedora e individualizada, reunindo diferentes
                áreas do cuidado em um mesmo ambiente.
              </p>

              <a href="#contato">
                Conheça a Clínica Dall'Armi <span>→</span>
              </a>
            </div>
          </div>
        </section>

        <section className="specialties" id="especialidades">
          <div className="container">
            <div className="section-top">
              <div>
                <p className="overline">ESPECIALIDADES E TRATAMENTOS</p>

                <h2>
                  Saúde em todas
                  <br />
                  as etapas <em>da sua vida.</em>
                </h2>
              </div>

              <p>
                Cuidado médico personalizado, da avaliação aos tratamentos
                especializados.
              </p>
            </div>

            <div className="specialty-grid">
              {especialidades.map((item) => (
                <article className="specialty-card" key={item.nome}>
                  <div className="specialty-image">
                    <img src={imagensDaPasta(`especialidades/${pastaEspecialidade(item.nome)}/capa`)[0] || item.imagem} alt={item.nome} />
                  </div>

                  <div className="specialty-body">
                    <span className="specialty-mark">+</span>
                    <h3>{item.nome}</h3>
                    <p>{item.texto}</p>
                    <button className="dsm-open" type="button" onClick={() => setEspecialidadeAberta(item.nome)}>Saiba mais <span>→</span></button>
                  </div>
                </article>
              ))}
            </div>

            <div className="specialty-bottom">
              <button className="simple-link dsm-open" type="button" onClick={() => setEspecialidadeAberta("__catalogo__")}>Ver todas as especialidades <span>→</span></button>
            </div>
          </div>
        </section>

        <SpecialtiesContentHub />

        <section className="hair" id="transplante">
          <div className="container hair-grid">
            <div className="hair-copy">
              <p className="overline">RESTAURAÇÃO CAPILAR</p>

              <h2>
                Naturalidade começa
                <br />
                com um bom <em>planejamento.</em>
              </h2>

              <p>
                Avaliação individualizada, planejamento médico e acompanhamento
                em todas as etapas do tratamento.
              </p>

              <div className="hair-list">
                <span>Transplante capilar</span>
                <span>Transplante de barba</span>
                <span>Transplante de sobrancelhas</span>
              </div>

              <a className="btn btn-wine" href="#contato">
                Conheça a restauração capilar
                <span>→</span>
              </a>
            </div>

            <div className="hair-photo">
              <img
                src={imagensDaPasta("home/transplante")[0] || "/media/images/servicos/transplante-capilar.png"}
                alt="Restauração e transplante capilar"
              />
              <div className="hair-circle" />
            </div>
          </div>
        </section>

        <section className="doctor" id="equipe">
          <div className="container doctor-grid">
            <div className="doctor-photo">
              <img
                src={imagensDaPasta("equipe/dra-andressa")[0] || "/media/images/dra-andressa/dra-andressa-sobre-principal.png"}
                alt="Dra. Andressa Dallarmi"
              />
            </div>

            <div className="doctor-copy">
              <p className="overline">CORPO CLÍNICO</p>

              <h2>
                Dra. Andressa
                <br />
                <em>Dallarmi</em>
              </h2>

              <p className="doctor-role">
                Médica Cirurgiã
                <br />
                CRM 28292-PR | RQE 2826
              </p>

              <p>
                Atua em Cirurgia Geral, Tricologia, Restauração Capilar,
                Transplante Capilar, Transplante de Barba e Transplante de
                Sobrancelhas.
              </p>

              <p>
                Graduação em Medicina pela Faculdade Evangélica Mackenzie do
                Paraná, residência médica em Cirurgia Geral pelo HONPAR e
                pós-graduação em Tricologia e Transplante Capilar.
              </p>

              <div className="doctor-actions">
                <a className="btn btn-light" href="/experiencias">
                  Conheça a Dra. Andressa
                </a>

                <button
                  className="btn btn-wine"
                  onClick={() => setBookingOpen(true)}
                >
                  Agendar consulta
                </button>
              </div>
            </div>
          </div>
        </section>

        <ClinicalTeamCTA />

        <section className="pillars">
          <div className="container pillars-grid">
            <div>
              <span>01</span>
              <strong>Atendimento humanizado</strong>
              <p>Você no centro do cuidado.</p>
            </div>

            <div>
              <span>02</span>
              <strong>Avaliação individualizada</strong>
              <p>Cada paciente é único.</p>
            </div>

            <div>
              <span>03</span>
              <strong>Segurança médica</strong>
              <p>Responsabilidade em cada etapa.</p>
            </div>

            <div>
              <span>04</span>
              <strong>Cuidado integrado</strong>
              <p>Saúde de forma completa.</p>
            </div>
          </div>
        </section>

        <section className="attendance" id="atendimento">
          <div className="container attendance-grid">
            <div className="attendance-title">
              <p className="overline">FORMAS DE ATENDIMENTO</p>

              <h2>
                Atendimento com
                <br />
                <em>clareza e facilidade.</em>
              </h2>
            </div>

            <div className="attendance-main">
              <span>ATENDIMENTO ATUAL</span>
              <h3>Particular</h3>
              <p>Atendimento particular com agendamento prévio.</p>

              <button
                className="btn btn-wine"
                onClick={() => setBookingOpen(true)}
              >
                Agendar consulta
              </button>
            </div>
          </div>

          <div className="container insurance-empty">
            <div>
              <strong>Convênios e parceiros</strong>
              <p>
                Novos convênios poderão ser disponibilizados em breve.
                Consulte nossa equipe.
              </p>
            </div>

            <span>Em atualização</span>
          </div>
        </section>

        <LocationsSection />

        <section className="final-cta">
          <div className="container final-box">
            <div>
              <p className="overline">SUA SAÚDE EM BOAS MÃOS</p>

              <h2>
                Um cuidado pensado
                <br />
                <em>para você.</em>
              </h2>

              <p>
                Fale com nossa equipe para informações sobre consultas,
                tratamentos e agendamentos.
              </p>

              <button
                className="btn btn-wine"
                onClick={() => setBookingOpen(true)}
              >
                Agende sua consulta
                <span>→</span>
              </button>
            </div>

            <div className="final-detail">
              <div className="final-line" />
              <span>DALL'ARMI</span>
            </div>
          </div>
        </section>
      </main>

      <SpecialtyModal
        nome={especialidadeAberta}
        fechar={() => setEspecialidadeAberta(null)}
        selecionar={setEspecialidadeAberta}
        agendar={() => {
          setEspecialidadeAberta(null);
          setBookingOpen(true);
        }}
      />

      <footer className="footer" id="contato">
        <div className="container footer-grid">
          <div className="footer-brand">
            <strong>DALL'ARMI</strong>
            <span>CLÍNICA MÉDICA & CIRÚRGICA</span>
            <p>Medicina, cirurgia e cuidado individualizado.</p>
          </div>

          <div className="footer-links">
            <strong>Navegação</strong>
            <a href="#inicio">Início</a>
            <a href="#clinica">A Clínica</a>
            <a href="#especialidades">Especialidades</a>
            <a href="#transplante">Transplante Capilar</a>
            <a href="#equipe">Corpo Clínico</a>
            <a href="/experiencias">Experiências</a>
          </div>

          <div className="footer-links">
            <strong>Atendimento</strong>
            <button onClick={() => setBookingOpen(true)}>
              Agende sua consulta
            </button>
            <a href="#atendimento">Convênios</a>
          </div>

          <div className="footer-links footer-contact-actions">
            <strong>Contato</strong>

            <button type="button" onClick={abrirWhatsApp}>
              Falar pelo WhatsApp
            </button>

            <button type="button" onClick={abrirAgendamento}>
              Autoagendamento
            </button>

            {clinicConfig.phone && <span>{clinicConfig.phone}</span>}
            {clinicConfig.email && <span>{clinicConfig.email}</span>}
            {clinicConfig.address && <span>{clinicConfig.address}</span>}

            {!clinicConfig.phone &&
              !clinicConfig.email &&
              !clinicConfig.address && (
                <span>Dados em configuração</span>
              )}
          </div>
        </div>

        <div className="container footer-bottom">
          <span>DALL'ARMI – Clínica Médica & Cirúrgica</span>
          <span>Cuidar de você é a nossa especialidade.</span>
        </div>
      </footer>

      {bookingOpen && (
        <div className="modal-bg" onMouseDown={() => setBookingOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setBookingOpen(false)}
              aria-label="Fechar"
            >
              ×
            </button>

            <p className="overline">AGENDAMENTO</p>

            <h2>Como deseja continuar?</h2>

            <p>
              Escolha a forma que preferir para realizar seu agendamento.
            </p>

            <button
              className="booking-option"
              onClick={abrirWhatsApp}
            >
              <span>01</span>

              <div>
                <strong>Agendar pelo WhatsApp</strong>
                <small>Fale diretamente com nossa equipe.</small>
              </div>

              <b>→</b>
            </button>

            <button
              className="booking-option"
              onClick={abrirAgendamento}
            >
              <span>02</span>

              <div>
                <strong>Fazer autoagendamento</strong>
                <small>Escolha serviço, data e horário.</small>
              </div>

              <b>→</b>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
