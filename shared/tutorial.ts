// Tipos para o sistema de tutorial onboarding

// Tipos de perfil de usuário que podem ter tutoriais diferentes
export type UserTutorialType = "freelancer" | "client";

// Etapas do tutorial para cada tipo de usuário
export const FREELANCER_TUTORIAL_STEPS = [
  "profile_creation",        // Criação do perfil profissional
  "add_skills",              // Adicionar habilidades ao perfil
  "create_service",          // Criar um serviço oferecido
  "submit_proposal",         // Enviar uma proposta para um trabalho
  "message_client",          // Enviar uma mensagem para um cliente
  "complete_appointment",    // Completar um agendamento
] as const;

export const CLIENT_TUTORIAL_STEPS = [
  "profile_completion",      // Completar perfil pessoal
  "post_job",                // Publicar um trabalho
  "review_proposals",        // Revisar propostas recebidas
  "hire_freelancer",         // Contratar um freelancer
  "schedule_appointment",    // Agendar um serviço
  "leave_review",            // Deixar uma avaliação
] as const;

export type FreelancerTutorialStep = typeof FREELANCER_TUTORIAL_STEPS[number];
export type ClientTutorialStep = typeof CLIENT_TUTORIAL_STEPS[number];
export type TutorialStep = FreelancerTutorialStep | ClientTutorialStep;

// Interface para o progresso do tutorial de um usuário
export interface TutorialProgress {
  id: number;
  userId: number;
  userType: UserTutorialType;
  completedSteps: TutorialStep[];
  pointsEarned: number;
  badgesEarned: string[];
  tutorialCompleted: boolean;
  currentStep: TutorialStep | null;
  lastUpdated: Date;
}

// Schema para inserção de progresso do tutorial
export interface InsertTutorialProgress {
  userId: number;
  userType: UserTutorialType;
  completedSteps: TutorialStep[];
  pointsEarned: number;
  badgesEarned: string[];
  tutorialCompleted: boolean;
  currentStep: TutorialStep | null;
}

// Mensagens e dicas para cada passo do tutorial
export const TUTORIAL_MESSAGES: Record<TutorialStep, {
  title: string;
  description: string;
  hint: string;
  points: number;
}> = {
  // Mensagens para freelancers
  profile_creation: {
    title: "Crie seu perfil profissional",
    description: "Complete seu perfil profissional para aumentar suas chances de conseguir trabalhos.",
    hint: "Um perfil completo tem 70% mais chances de ser contratado!",
    points: 50
  },
  add_skills: {
    title: "Adicione suas habilidades",
    description: "Adicione habilidades relevantes ao seu perfil para aparecer nas buscas dos clientes.",
    hint: "Seja específico e honesto sobre suas habilidades e nível de experiência.",
    points: 30
  },
  create_service: {
    title: "Crie seu primeiro serviço",
    description: "Ofereça um serviço específico com descrição detalhada e preço.",
    hint: "Serviços bem definidos atraem mais clientes!",
    points: 50
  },
  submit_proposal: {
    title: "Envie sua primeira proposta",
    description: "Encontre um trabalho interessante e envie uma proposta personalizada.",
    hint: "Propostas personalizadas têm 3x mais chances de serem aceitas.",
    points: 40
  },
  message_client: {
    title: "Comunique-se com um cliente",
    description: "Inicie uma conversa com um cliente potencial.",
    hint: "Comunicação clara é essencial para o sucesso do projeto.",
    points: 20
  },
  complete_appointment: {
    title: "Complete seu primeiro projeto",
    description: "Finalize um serviço agendado com sucesso.",
    hint: "Projetos bem executados levam a ótimas avaliações e mais trabalhos futuros!",
    points: 100
  },

  // Mensagens para clientes
  profile_completion: {
    title: "Complete seu perfil pessoal",
    description: "Adicione informações sobre você para que os freelancers possam te conhecer melhor.",
    hint: "Um perfil completo transmite confiança para os freelancers.",
    points: 40
  },
  post_job: {
    title: "Publique seu primeiro trabalho",
    description: "Crie um anúncio detalhado para encontrar o profissional ideal.",
    hint: "Descrições claras atraem propostas mais relevantes.",
    points: 50
  },
  review_proposals: {
    title: "Analise propostas recebidas",
    description: "Revise as propostas enviadas por freelancers para seu trabalho.",
    hint: "Compare não apenas os preços, mas também experiência e avaliações.",
    points: 30
  },
  hire_freelancer: {
    title: "Contrate seu primeiro freelancer",
    description: "Selecione um freelancer para realizar seu projeto.",
    hint: "Contrate baseado na qualidade do trabalho e comunicação, não apenas no preço.",
    points: 60
  },
  schedule_appointment: {
    title: "Agende um serviço",
    description: "Marque um horário com um profissional para a realização do serviço.",
    hint: "Escolha um horário conveniente para ambos para garantir maior produtividade.",
    points: 30
  },
  leave_review: {
    title: "Deixe uma avaliação",
    description: "Avalie o trabalho realizado pelo freelancer.",
    hint: "Avaliações justas ajudam toda a comunidade a encontrar os melhores profissionais.",
    points: 40
  }
};

// Badges que podem ser ganhos durante o tutorial
export const TUTORIAL_BADGES = {
  PROFILE_EXPERT: {
    id: "profile_expert",
    name: "Especialista em Perfil",
    description: "Criou um perfil completo e detalhado",
    icon: "badge-profile"
  },
  FIRST_JOB: {
    id: "first_job",
    name: "Primeira Oportunidade",
    description: "Publicou ou se candidatou ao primeiro trabalho",
    icon: "badge-job"
  },
  COMMUNICATOR: {
    id: "communicator",
    name: "Comunicador",
    description: "Estabeleceu comunicação efetiva na plataforma",
    icon: "badge-chat"
  },
  STARTER: {
    id: "starter",
    name: "Iniciante",
    description: "Completou as etapas básicas do tutorial",
    icon: "badge-starter"
  },
  ADVANCED_USER: {
    id: "advanced_user",
    name: "Usuário Avançado",
    description: "Dominou os recursos principais da plataforma",
    icon: "badge-advanced"
  },
  PLATFORM_MASTER: {
    id: "platform_master",
    name: "Mestre da Plataforma",
    description: "Completou todo o tutorial interativo",
    icon: "badge-master"
  }
};

// Níveis de pontuação
export const TUTORIAL_LEVELS = [
  { level: 1, points: 0, title: "Novato" },
  { level: 2, points: 100, title: "Aprendiz" },
  { level: 3, points: 200, title: "Intermediário" },
  { level: 4, points: 300, title: "Avançado" },
  { level: 5, points: 400, title: "Experiente" },
  { level: 6, points: 500, title: "Mestre" }
];

// Função para determinar o nível atual com base nos pontos
export function getCurrentLevel(points: number) {
  for (let i = TUTORIAL_LEVELS.length - 1; i >= 0; i--) {
    if (points >= TUTORIAL_LEVELS[i].points) {
      return TUTORIAL_LEVELS[i];
    }
  }
  return TUTORIAL_LEVELS[0];
}