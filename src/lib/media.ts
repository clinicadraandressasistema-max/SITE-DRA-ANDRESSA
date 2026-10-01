const imagens = import.meta.glob<string>(
  "../assets/images/**/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,avif,AVIF,gif,GIF,svg,SVG}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

const videos = import.meta.glob<string>(
  "../assets/images/**/*.{mp4,MP4,webm,WEBM}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

function listarArquivos(
  arquivos: Record<string, string>,
  pasta: string
): string[] {
  const limpa = pasta
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "");

  const prefixo = `../assets/images/${limpa}/`;

  return Object.entries(arquivos)
    .filter(([caminho]) => {
      if (!caminho.startsWith(prefixo)) return false;

      const nome = caminho.slice(prefixo.length);

      // Apenas arquivos da pasta escolhida.
      return !nome.includes("/");
    })
    .sort(([a], [b]) =>
      a.localeCompare(b, "pt-BR", { numeric: true })
    )
    .map(([, url]) => url);
}

export function imagensDaPasta(pasta: string): string[] {
  return listarArquivos(imagens, pasta);
}

export function videosDaPasta(pasta: string): string[] {
  return listarArquivos(videos, pasta);
}

export function pastaEspecialidade(nome: string): string {
  const pastas: Record<string, string> = {
    "Cirurgia Geral": "cirurgia-geral",
    "Tricologia": "tricologia",
    "Transplante Capilar": "transplante-capilar",
    "Barba e Sobrancelhas": "barba-sobrancelhas",
  };

  return pastas[nome] || "";
}