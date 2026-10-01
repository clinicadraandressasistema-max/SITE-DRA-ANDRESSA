import { imagensDaPasta } from "../lib/media";
import { useEffect, useMemo, useState } from "react";
import { clinicConfig, clinicLocations } from "../config";
import {
  clinicContent,
  type ClinicContentType,
} from "../data/clinicContent";

import "../styles/home-extras.css";

function whatsappWithMessage(message: string) {
  const base = clinicConfig.whatsapp?.trim();

  if (!base) return;

  const separator = base.includes("?") ? "&" : "?";

  window.open(
    `${base}${separator}text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer"
  );
}

export function SpecialtiesContentHub() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] =
    useState<"todos" | ClinicContentType>("todos");

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const items = useMemo(() => {
    if (filter === "todos") return clinicContent;

    return clinicContent.filter((item) => item.type === filter);
  }, [filter]);

  return (
    <>
      <section className="dallarmi-content-callout">
        <div className="container dallarmi-content-callout-inner">
          <div>
            <p className="dallarmi-extra-overline">
              CONTEÚDOS DA CLÍNICA
            </p>

            <h3>
              Informação também faz parte
              <br />
              <em>do cuidado.</em>
            </h3>

            <p>
              Artigos, vídeos, orientações, bastidores e conteúdos
              relacionados aos tratamentos e à rotina da Clínica Dall'Armi.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
          >
            Explorar conteúdos
            <span>→</span>
          </button>
        </div>
      </section>

      {open && (
        <div
          className="dallarmi-content-screen"
          role="dialog"
          aria-modal="true"
          aria-label="Conteúdos da Clínica Dall'Armi"
        >
          <header className="dallarmi-content-header">
            <div>
              <span>DALL'ARMI</span>
              <small>CONTEÚDOS DA CLÍNICA</small>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar conteúdos"
            >
              ×
            </button>
          </header>

          <div className="dallarmi-content-scroll">
            <div className="dallarmi-content-intro">
              <p className="dallarmi-extra-overline">
                CONHECIMENTO • SAÚDE • CUIDADO
              </p>

              <h2>
                Conteúdo para cuidar
                <br />
                <em>com mais informação.</em>
              </h2>

              <p>
                Este espaço foi preparado para reunir conteúdos produzidos
                pela clínica, informações sobre tratamentos, vídeos,
                orientações e registros autorizados de acompanhamento.
              </p>
            </div>

            <div className="dallarmi-content-filters">
              <button
                className={filter === "todos" ? "active" : ""}
                onClick={() => setFilter("todos")}
              >
                Todos
              </button>

              <button
                className={filter === "artigo" ? "active" : ""}
                onClick={() => setFilter("artigo")}
              >
                Artigos
              </button>

              <button
                className={filter === "video" ? "active" : ""}
                onClick={() => setFilter("video")}
              >
                Vídeos
              </button>

              <button
                className={filter === "resultado" ? "active" : ""}
                onClick={() => setFilter("resultado")}
              >
                Resultados
              </button>
            </div>

            <div className="dallarmi-content-grid">
              {items.map((item) => (
                <article
                  className="dallarmi-content-card"
                  key={item.id}
                >
                  <div className="dallarmi-content-image">
                    <img
                      src={
  imagensDaPasta(`conteudos/${item.id}/capa`)[0] ||
  imagensDaPasta(`conteudos/${item.id}`)[0] ||
  item.image
}
                      alt={item.title}
                      onError={(event) => {
                        event.currentTarget.src =
                          "/media/images/placeholder-clinic.svg";
                      }}
                    />

                    <span>
                      {item.type === "artigo" && "ARTIGO"}
                      {item.type === "video" && "VÍDEO"}
                      {item.type === "resultado" && "RESULTADO"}
                    </span>
                  </div>

                  <div className="dallarmi-content-card-body">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>

                    {item.href ? (
                      <a href={item.href}>
                        Abrir conteúdo <span>→</span>
                      </a>
                    ) : (
                      <span className="dallarmi-content-soon">
                        Conteúdo em preparação
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ClinicalTeamCTA() {
  return (
    <section className="dallarmi-team-cta">
      <div className="container dallarmi-team-cta-inner">
        <div>
          <p className="dallarmi-extra-overline">
            PROFISSIONAIS DA SAÚDE
          </p>

          <h2>
            Quer fazer parte
            <br />
            <em>do nosso corpo clínico?</em>
          </h2>

          <p>
            A Clínica Dall'Armi está aberta ao contato de profissionais
            interessados em conhecer oportunidades para integrar o corpo
            clínico.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            whatsappWithMessage(
              "Olá! Vim pelo site da Clínica Dall'Armi e gostaria de informações sobre como fazer parte do corpo clínico."
            )
          }
        >
          Falar com nossa equipe
          <span>→</span>
        </button>
      </div>
    </section>
  );
}

function UnitGallery({
  folder,
  nome,
  ordem,
}: {
  folder: string;
  nome: string;
  ordem: number;
}) {
  const fotos = imagensDaPasta(`unidades/${folder}/fotos`);
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    setAtual(0);
  }, [folder]);

  useEffect(() => {
    if (fotos.length < 2) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const timer = window.setInterval(() => {
      setAtual((anterior) => (anterior + 1) % fotos.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [folder, fotos.length]);

  const anterior = () =>
    setAtual((valor) => (valor - 1 + fotos.length) % fotos.length);

  const proxima = () =>
    setAtual((valor) => (valor + 1) % fotos.length);

  return (
    <div className="dallarmi-location-image dallarmi-unit-gallery">
      {fotos.length > 0 ? (
        <img
          src={fotos[atual % fotos.length]}
          alt={`${nome} - fotografia ${atual + 1}`}
          loading="lazy"
        />
      ) : (
        <div className="dallarmi-unit-placeholder">
          <span>CLÍNICA DALL'ARMI</span>
          <p>Fotografias do ambiente em preparação.</p>
        </div>
      )}

      {fotos.length > 1 && (
        <>
          <button
            type="button"
            className="dallarmi-unit-prev"
            aria-label={`Foto anterior da ${nome}`}
            onClick={anterior}
          >
            ‹
          </button>

          <button
            type="button"
            className="dallarmi-unit-next"
            aria-label={`Próxima foto da ${nome}`}
            onClick={proxima}
          >
            ›
          </button>

          <div className="dallarmi-unit-dots">
            {fotos.map((foto, index) => (
              <button
                key={foto}
                type="button"
                aria-label={`Ver foto ${index + 1} da ${nome}`}
                aria-current={atual === index ? "true" : undefined}
                className={atual === index ? "active" : ""}
                onClick={() => setAtual(index)}
              />
            ))}
          </div>
        </>
      )}

      <span className="dallarmi-unit-number">
        {String(ordem + 1).padStart(2, "0")}
      </span>
    </div>
  );
}
export function LocationsSection() {
  return (
    <section
      className="dallarmi-locations"
      id="locais-atendimento"
    >
      <div className="container">
        <div className="dallarmi-locations-heading">
          <div>
            <p className="dallarmi-extra-overline">
              LOCAIS DE ATENDIMENTO
            </p>

            <h2>
              Escolha a unidade
              <br />
              <em>mais conveniente para você.</em>
            </h2>
          </div>

          <p>
            Conheça nossos locais de atendimento e os ambientes preparados
            para receber você.
          </p>
        </div>

        <div className="dallarmi-locations-grid">
          {clinicLocations.map((location, index) => (
            <article
              className="dallarmi-location-card"
              key={location.id}
            >
              <UnitGallery folder={location.id} nome={location.name} ordem={index} />

              <div className="dallarmi-location-body">
                <small>LOCAL DE ATENDIMENTO</small>

                <h3>{location.name}</h3>

                {location.address ? (
                  <p>{location.address}</p>
                ) : (
                  <p>
                    Informações de endereço serão adicionadas aqui.
                  </p>
                )}

                <div className="dallarmi-location-actions">
                  <button
                    type="button"
                    onClick={() =>
                      whatsappWithMessage(
                        `Olá! Vim pelo site da Clínica Dall'Armi e gostaria de informações sobre atendimento na ${location.name}.`
                      )
                    }
                  >
                    Falar sobre esta unidade
                  </button>

                  {location.mapUrl && (
                    <a
                      href={location.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver no mapa
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}