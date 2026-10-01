export const clinicConfig = {
  whatsapp: "https://wa.me/554195969494",
  instagram: "",
  phone: "",
  email: "",
  address: "",
  bookingUrl: "/agendar",
};

export const convenios: Array<{
  nome: string;
  logo: string;
  servicos?: string[];
}> = [];

export const clinicLocations = [
  {
    id: "ciom",
    name: "CIOM - Centro Integrado de Odontologia e Medicina",
    address:
      "R. Baltazar Carrasco dos Reis, 2843 - Água Verde, Curitiba - PR, 80250-130",
    image: "",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(
        "R. Baltazar Carrasco dos Reis, 2843 - Água Verde, Curitiba - PR"
      ),
  },
  {
    id: "santa-felicidade",
    name: "Clínica de Oftalmologia Dr. Marco Túlio - Santa Felicidade",
    address:
      "Av. Manoel Ribas, 6449 - loja 02 - Santa Felicidade, Curitiba - PR",
    image: "",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(
        "Av. Manoel Ribas, 6449 - loja 02 - Santa Felicidade, Curitiba - PR"
      ),
  },
];