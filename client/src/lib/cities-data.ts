export interface EstadoData {
  nome: string;
  sigla: string;
  cidades: string[];
}

export const estadosBrasileiros: EstadoData[] = [
  {
    nome: "Acre",
    sigla: "AC",
    cidades: ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá", "Feijó"]
  },
  {
    nome: "Alagoas",
    sigla: "AL",
    cidades: ["Maceió", "Arapiraca", "Palmeira dos Índios", "Rio Largo", "Penedo"]
  },
  {
    nome: "Amapá",
    sigla: "AP",
    cidades: ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Mazagão"]
  },
  {
    nome: "Amazonas",
    sigla: "AM",
    cidades: ["Manaus", "Parintins", "Itacoatiara", "Manacapuru", "Coari"]
  },
  {
    nome: "Bahia",
    sigla: "BA",
    cidades: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Juazeiro", "Itabuna", "Lauro de Freitas", "Ilhéus", "Jequié", "Teixeira de Freitas"]
  },
  {
    nome: "Ceará",
    sigla: "CE",
    cidades: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral", "Crato", "Itapipoca", "Maranguape", "Iguatu", "Quixadá"]
  },
  {
    nome: "Distrito Federal",
    sigla: "DF",
    cidades: ["Brasília", "Ceilândia", "Taguatinga", "Plano Piloto", "Gama", "Samambaia", "Águas Claras", "Recanto das Emas", "Planaltina", "Santa Maria"]
  },
  {
    nome: "Espírito Santo",
    sigla: "ES",
    cidades: ["Vitória", "Vila Velha", "Cariacica", "Serra", "Linhares", "Cachoeiro de Itapemirim", "Colatina", "Guarapari", "São Mateus", "Aracruz"]
  },
  {
    nome: "Goiás",
    sigla: "GO",
    cidades: ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Luziânia", "Águas Lindas de Goiás", "Valparaíso de Goiás", "Trindade", "Formosa", "Itumbiara"]
  },
  {
    nome: "Maranhão",
    sigla: "MA",
    cidades: ["São Luís", "Imperatriz", "São José de Ribamar", "Timon", "Caxias", "Codó", "Paço do Lumiar", "Açailândia", "Bacabal", "Balsas"]
  },
  {
    nome: "Mato Grosso",
    sigla: "MT",
    cidades: ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop", "Tangará da Serra", "Cáceres", "Sorriso", "Lucas do Rio Verde", "Primavera do Leste", "Barra do Garças"]
  },
  {
    nome: "Mato Grosso do Sul",
    sigla: "MS",
    cidades: ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã", "Naviraí", "Nova Andradina", "Aquidauana", "Sidrolândia", "Paranaíba"]
  },
  {
    nome: "Minas Gerais",
    sigla: "MG",
    cidades: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba", "Governador Valadares", "Ipatinga"]
  },
  {
    nome: "Pará",
    sigla: "PA",
    cidades: ["Belém", "Ananindeua", "Santarém", "Marabá", "Castanhal", "Parauapebas", "Abaetetuba", "Cametá", "Bragança", "Altamira"]
  },
  {
    nome: "Paraíba",
    sigla: "PB",
    cidades: ["João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux", "Sousa", "Cajazeiras", "Cabedelo", "Guarabira", "Sapé"]
  },
  {
    nome: "Paraná",
    sigla: "PR",
    cidades: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "São José dos Pinhais", "Foz do Iguaçu", "Colombo", "Guarapuava", "Paranaguá"]
  },
  {
    nome: "Pernambuco",
    sigla: "PE",
    cidades: ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina", "Paulista", "Cabo de Santo Agostinho", "Camaragibe", "Garanhuns", "Vitória de Santo Antão"]
  },
  {
    nome: "Piauí",
    sigla: "PI",
    cidades: ["Teresina", "Parnaíba", "Picos", "Piripiri", "Floriano", "Barras", "Campo Maior", "Pedro II", "Altos", "José de Freitas"]
  },
  {
    nome: "Rio de Janeiro",
    sigla: "RJ",
    cidades: ["Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Belford Roxo", "Campos dos Goytacazes", "São João de Meriti", "Petrópolis", "Volta Redonda"]
  },
  {
    nome: "Rio Grande do Norte",
    sigla: "RN",
    cidades: ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Macaíba", "Ceará-Mirim", "Caicó", "Assu", "Currais Novos", "Santa Cruz"]
  },
  {
    nome: "Rio Grande do Sul",
    sigla: "RS",
    cidades: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria", "Gravataí", "Viamão", "Novo Hamburgo", "São Leopoldo", "Rio Grande"]
  },
  {
    nome: "Rondônia",
    sigla: "RO",
    cidades: ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal", "Rolim de Moura", "Jaru", "Guajará-Mirim", "Pimenta Bueno", "Ouro Preto do Oeste"]
  },
  {
    nome: "Roraima",
    sigla: "RR",
    cidades: ["Boa Vista", "Caracaraí", "Rorainópolis", "Alto Alegre", "Mucajaí", "Pacaraima", "Cantá", "Bonfim", "Amajari", "Iracema"]
  },
  {
    nome: "Santa Catarina",
    sigla: "SC",
    cidades: ["Joinville", "Florianópolis", "Blumenau", "São José", "Chapecó", "Itajaí", "Criciúma", "Jaraguá do Sul", "Palhoça", "Lages"]
  },
  {
    nome: "São Paulo",
    sigla: "SP",
    cidades: ["São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André", "Ribeirão Preto", "Osasco", "Sorocaba", "São José dos Campos", "Santos", "São José do Rio Preto", "Mauá", "Diadema", "Jundiaí", "Piracicaba"]
  },
  {
    nome: "Sergipe",
    sigla: "SE",
    cidades: ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana", "São Cristóvão", "Estância", "Tobias Barreto", "Nossa Senhora da Glória", "Simão Dias", "Capela"]
  },
  {
    nome: "Tocantins",
    sigla: "TO",
    cidades: ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins", "Colinas do Tocantins", "Guaraí", "Tocantinópolis", "Miracema do Tocantins", "Dianópolis"]
  }
];

// Função auxiliar para pesquisar estados e cidades
export function pesquisarLocais(query: string): { estados: EstadoData[], cidades: Array<{cidade: string, estado: string, sigla: string}> } {
  if (!query || query.length < 2) {
    return { estados: [], cidades: [] };
  }

  const termoBusca = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Pesquisar estados que correspondem à consulta
  const estadosEncontrados = estadosBrasileiros.filter(estado => 
    estado.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(termoBusca) ||
    estado.sigla.toLowerCase().includes(termoBusca)
  );
  
  // Pesquisar cidades que correspondem à consulta
  const cidadesEncontradas: Array<{cidade: string, estado: string, sigla: string}> = [];
  
  estadosBrasileiros.forEach(estado => {
    estado.cidades.forEach(cidade => {
      if (cidade.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(termoBusca)) {
        cidadesEncontradas.push({
          cidade,
          estado: estado.nome,
          sigla: estado.sigla
        });
      }
    });
  });
  
  // Limitar os resultados para evitar listas muito grandes
  return {
    estados: estadosEncontrados.slice(0, 5),
    cidades: cidadesEncontradas.slice(0, 10)
  };
}

// Formatador para exibição de cidades e estados
export function formatarLocalidade(cidade: string, estado: string): string {
  return `${cidade}, ${estado}`;
}