export type ClinicContentType =
  | "artigo"
  | "video"
  | "resultado";

export type ClinicContentItem = {
  id: string;
  type: ClinicContentType;
  title: string;
  description: string;
  image: string;
  href?: string;
};

export const clinicContent: ClinicContentItem[] = [
  {
    id: "avaliacao-capilar",
    type: "artigo",
    title: "Como funciona uma avaliação capilar",
    description:
      "Conteúdo educativo sobre avaliação médica, planejamento e acompanhamento.",
    image: "/assets/images/conteudos/avaliacao-capilar.webp",
  },
  {
    id: "bastidores-clinica",
    type: "video",
    title: "Conheça os bastidores da clínica",
    description:
      "Espaço preparado para vídeos institucionais, orientações e conteúdos da equipe.",
    image: "/assets/images/conteudos/video-clinica.webp",
  },
  {
    id: "resultados",
    type: "resultado",
    title: "Resultados e acompanhamento",
    description:
      "Área preparada para registros autorizados de evolução e acompanhamento de procedimentos.",
    image: "/assets/images/conteudos/resultados.webp",
  },
  {
    id: "cuidados",
    type: "artigo",
    title: "Cuidados antes e depois de procedimentos",
    description:
      "Área editorial preparada para conteúdos e orientações produzidos pela equipe médica.",
    image: "/assets/images/conteudos/cuidados.webp",
  },
];