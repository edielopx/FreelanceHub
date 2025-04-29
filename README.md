# FreelanceHub - Plataforma de Serviços Freelance

## Acesse a Plataforma Online

**Acesse FreelanceHub diretamente pelo link:**
### https://social-sage-edielopx.replit.app

Não é necessário instalação! Basta acessar o link acima para começar a usar.

## Visão Geral

FreelanceHub é uma plataforma dinâmica de serviços freelance, inspirada no modelo do Uber, mas voltada para a conexão entre freelancers e clientes em busca de serviços especializados. A plataforma permite que usuários busquem profissionais baseados em localização, especialidade e avaliações, facilitando a contratação de serviços personalizados.

## Público-Alvo

Desenvolvida principalmente para usuários de língua portuguesa no Brasil e Portugal, a plataforma conecta:
- **Clientes** que precisam contratar serviços específicos
- **Freelancers** que oferecem seus serviços profissionais

## Tecnologias Utilizadas

### Front-end
- **React**: Biblioteca JavaScript para construção de interfaces
- **TypeScript**: Superset tipado de JavaScript
- **TailwindCSS**: Framework CSS utilitário
- **Shadcn/UI**: Componentes de interface reutilizáveis
- **Tanstack Query**: Gerenciamento de estado e cache
- **Wouter**: Biblioteca de roteamento leve
- **Vite**: Ferramenta de build moderna e rápida

### Back-end
- **Node.js**: Ambiente de execução JavaScript
- **Express**: Framework web para Node.js
- **TypeScript**: Tipagem estática para JavaScript
- **PostgreSQL**: Banco de dados relacional
- **Drizzle ORM**: ORM para interação com banco de dados
- **Passport.js**: Middleware de autenticação
- **WebSockets**: Comunicação em tempo real

### Serviços Externos
- **Stripe**: Processamento de pagamentos
- **SendGrid**: Envio de emails
- **Google Maps API** (opcional): Funcionalidades de geolocalização

## Principais Funcionalidades

### Para Clientes
- **Cadastro e Autenticação**: Acesso seguro à plataforma
- **Busca de Freelancers**: Filtros por localização, categoria, preço e avaliação
- **Publicação de Trabalhos**: Criação de ofertas de trabalho para freelancers
- **Gerenciamento de Propostas**: Avaliação de propostas recebidas
- **Agendamento de Serviços**: Marcação de horários com profissionais
- **Sistema de Pagamentos**: Integração com Stripe para pagamentos seguros
- **Avaliações e Reviews**: Feedback sobre os serviços contratados
- **Mensagens em Tempo Real**: Comunicação direta com freelancers

### Para Freelancers
- **Perfil Profissional**: Criação de perfil destacando habilidades e experiência
- **Criação de Serviços**: Cadastro de serviços oferecidos com detalhes e preços
- **Envio de Propostas**: Resposta a ofertas de trabalho publicadas
- **Gerenciamento de Agenda**: Controle de disponibilidade e compromissos
- **Dashboard**: Visão geral de desempenho e atividades
- **Recebimento de Pagamentos**: Processamento seguro via Stripe
- **Mensagens em Tempo Real**: Comunicação com clientes

### Recursos do Sistema
- **Notificações em Tempo Real**: Alertas para novas mensagens, propostas e agendamentos
- **Sistema de Localização**: Busca por proximidade geográfica
- **Recuperação de Senha**: Processo seguro via email
- **Painel Administrativo**: Gerenciamento de usuários e sistema
- **Tutorial Interativo**: Orientação para novos usuários
- **Sistema de Gamificação**: Incentivos para uso contínuo da plataforma

## Como Acessar

Não é necessário instalar nada em seu computador! A plataforma está disponível online para uso imediato:

1. Acesse [https://freelancehub.replit.app](https://freelancehub.replit.app) em qualquer navegador
2. Crie sua conta (ou faça login se já tiver uma)
3. Comece a usar todas as funcionalidades da plataforma

### Credenciais para Testes

Para testar o sistema com um usuário administrador:
- **Usuário**: edielopx
- **Senha**: Verifique na página de login (botão "Ver senhas de teste")

## Estrutura do Projeto

```
freelancehub/
├── client/              # Código frontend
│   ├── src/
│   │   ├── assets/      # Recursos estáticos
│   │   ├── components/  # Componentes React
│   │   ├── hooks/       # Hooks customizados
│   │   ├── lib/         # Utilitários
│   │   ├── pages/       # Páginas da aplicação
│   │   └── types/       # Definições de tipos
├── server/              # Código backend
│   ├── auth.ts          # Autenticação
│   ├── routes.ts        # Rotas da API
│   ├── storage.ts       # Interface de armazenamento
│   └── notifications.ts # Sistema de notificações
└── shared/              # Código compartilhado
    └── schema.ts        # Esquema do banco de dados
```

## Uso do Painel Administrativo

Para acessar o painel administrativo:
1. Registre-se como um usuário normal
2. Acesse a página de administração em `/admin`
3. Apenas o usuário "edielopx" tem permissões de administrador

## Principais APIs

- **/api/register**: Registro de novos usuários
- **/api/login**: Autenticação de usuários
- **/api/freelancers**: Busca de freelancers
- **/api/jobs**: Gerenciamento de trabalhos
- **/api/proposals**: Sistema de propostas
- **/api/appointments**: Agendamento de serviços
- **/api/messages**: Sistema de mensagens
- **/api/payments**: Processamento de pagamentos

## Considerações de Segurança

- Senhas armazenadas com hash seguro (scrypt)
- Proteção contra CSRF em formulários
- Autenticação baseada em sessão
- Validação de dados com Zod

## Contribuição e Suporte

Para contribuir com o projeto ou reportar problemas, entre em contato com o mantenedor do repositório.

## Licença

Este projeto está licenciado sob os termos da licença MIT.
