import { imagensDaPasta, videosDaPasta, pastaEspecialidade } from "../lib/media";
import { useEffect, useRef } from "react";
import "../styles/specialty-modal.css";

type Media = {
  src: string;
  alt: string;
};

type Doctor = {
  nome: string;
  registro: string;
  foto: string;
};

type Specialty = {
  descricao: string;
  avaliacao: string;
  profissionais: Doctor[];
  fotos: Media[];
  videos: Media[];
  resultados: Media[];
};

const andressa: Doctor = {
  nome: "Dra. Andressa Dallarmi",
  registro: "CRM-PR 28292 | RQE 2826",
  foto: "/media/images/dra-andressa/dra-andressa-sobre-principal.png",
};

/*
  EDITE OS CONTEÚDOS AQUI.

  Para adicionar uma fotografia:

  fotos: [
    {
      src: "/assets/images/especialidades/tricologia/foto-1.webp",
      alt: "Descrição da fotografia"
    }
  ]

  Para vídeos, use a mesma estrutura com um arquivo .mp4.

  Não publique imagens ou resultados identificáveis de pacientes
  sem autorização apropriada e revisão das regras médicas aplicáveis.
*/

const detalhes: Record<string, Specialty> = {
  "Cirurgia Geral": {
    descricao:
      "A Cirurgia Geral compreende avaliação médica, planejamento e acompanhamento de condições que possam necessitar de tratamento cirúrgico.",
    avaliacao:
      "A indicação de qualquer procedimento depende de avaliação individualizada.",
    profissionais: [andressa],
    fotos: [],
    videos: [],
    resultados: [],
  },

  Tricologia: {
    descricao:
      "A Tricologia é uma área de estudo e cuidado relacionada aos cabelos e ao couro cabeludo, incluindo investigação de queixas capilares.",
    avaliacao:
      "A avaliação médica permite investigar as necessidades do paciente e definir possibilidades de acompanhamento.",
    profissionais: [andressa],
    fotos: [],
    videos: [],
    resultados: [],
  },

  "Transplante Capilar": {
    descricao:
      "O transplante capilar envolve avaliação e planejamento individualizado, considerando as características e necessidades de cada paciente.",
    avaliacao:
      "A possibilidade de realização e o planejamento são definidos mediante avaliação médica.",
    profissionais: [andressa],
    fotos: [],
    videos: [],
    resultados: [],
  },

  "Barba e Sobrancelhas": {
    descricao:
      "Procedimentos de restauração de barba e sobrancelhas são planejados considerando as características individuais e a harmonia das áreas tratadas.",
    avaliacao:
      "A indicação depende de avaliação médica e das características de cada caso.",
    profissionais: [andressa],
    fotos: [],
    videos: [],
    resultados: [],
  },
};

type Props = {
  nome: string | null;
  fechar: () => void;
  selecionar: (nome: string) => void;
  agendar: () => void;
};

export default function SpecialtyModal({
  nome,
  fechar,
  selecionar,
  agendar,
}: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!nome) return;

    const overflowAnterior = document.body.style.overflow;
    const elementoAnterior = document.activeElement;

    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const teclado = (event: KeyboardEvent) => {
      if (event.key === "Escape") fechar();
    };

    document.addEventListener("keydown", teclado);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", teclado);

      if (elementoAnterior instanceof HTMLElement) {
        elementoAnterior.focus();
      }
    };
  }, [nome, fechar]);

  if (!nome) return null;

  const catalogo = nome === "__catalogo__";
  const info = detalhes[nome];
  const pasta = pastaEspecialidade(nome);

  const galeria = imagensDaPasta(`especialidades/${pasta}/galeria`)
    .map((src) => ({ src, alt: `Fotografia de ${nome}` }));

  const videos = videosDaPasta(`especialidades/${pasta}/videos`)
    .map((src) => ({ src, alt: `Vídeo sobre ${nome}` }));

  const resultados = imagensDaPasta(`especialidades/${pasta}/resultados`)
    .map((src) => ({ src, alt: `Registro de ${nome}` }));

  const renderMidia = (
    titulo: string,
    itens: Media[],
    tipo: "foto" | "video"
  ) => (
    <section className="dsm-section">
      <h3>{titulo}</h3>

      {itens.length === 0 ? (
        <div className="dsm-empty">
          <span>{tipo === "video" ? "▷" : "◇"}</span>
          <p>Conteúdos em preparação.</p>
        </div>
      ) : (
        <div className="dsm-gallery">
          {itens.map((item, index) => (
            <div key={`${item.src}-${index}`}>
              {tipo === "video" ? (
                <video
                  src={item.src}
                  controls
                  preload="metadata"
                  aria-label={item.alt}
                />
              ) : (
                <img src={item.src} alt={item.alt} loading="lazy" />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div
      className="dsm-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) fechar();
      }}
    >
      <section
        className="dsm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dsm-title"
      >
        <header className="dsm-header">
          <div>
            <strong>DALL'ARMI</strong>
            <small>CLÍNICA MÉDICA & CIRÚRGICA</small>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={fechar}
            aria-label="Fechar especialidade"
          >
            ×
          </button>
        </header>

        <div className="dsm-content">
          {catalogo ? (
            <>
              <p className="dsm-eyebrow">NOSSOS SERVIÇOS</p>
              <h2 id="dsm-title">Especialidades e tratamentos</h2>

              <div className="dsm-catalog">
                {Object.keys(detalhes).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selecionar(item)}
                  >
                    {item} <span>→</span>
                  </button>
                ))}
              </div>
            </>
          ) : info ? (
            <>
              <p className="dsm-eyebrow">
                ESPECIALIDADES E TRATAMENTOS
              </p>

              <h2 id="dsm-title">{nome}</h2>

              <p className="dsm-description">
                {info.descricao}
              </p>

              <div className="dsm-note">
                {info.avaliacao}
              </div>

              <section className="dsm-section">
                <h3>Profissionais desta especialidade</h3>

                {info.profissionais.length === 0 ? (
                  <p>Profissionais em atualização.</p>
                ) : (
                  <div className="dsm-doctors">
                    {info.profissionais.map((medico) => (
                      <div className="dsm-doctor" key={medico.nome}>
                        <img
                          src={medico.foto}
                          alt={medico.nome}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />

                        <div>
                          <strong>{medico.nome}</strong>
                          <small>{medico.registro}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {renderMidia("Galeria de fotografias", galeria, "foto")}
              {renderMidia("Vídeos e orientações", videos, "video")}
              {renderMidia("Resultados e acompanhamento", resultados, "foto")}

              <p className="dsm-disclaimer">
                Os resultados de procedimentos variam conforme as
                características individuais. Registros clínicos somente
                serão divulgados mediante as autorizações necessárias.
              </p>

              <button
                className="dsm-book"
                type="button"
                onClick={agendar}
              >
                Agendar uma avaliação <span>→</span>
              </button>
            </>
          ) : (
            <>
              <h2 id="dsm-title">{nome}</h2>
              <p>Informações em preparação.</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}