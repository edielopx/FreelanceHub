# Documentação do FreelanceHub

## Visão Geral

O FreelanceHub é uma plataforma web que conecta freelancers e clientes por meio de uma interface geolocalizada e categorizada. A plataforma permite que usuários encontrem profissionais qualificados em suas proximidades ou em locais específicos, visualizem perfis, avaliações e entrem em contato para contratar serviços.

## Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js, TypeScript
- **Banco de Dados**: PostgreSQL com Drizzle ORM
- **Autenticação**: Passport.js com sessões
- **Email**: SendGrid
- **Pagamentos**: Stripe

## Estrutura do Projeto

O projeto está estruturado em três partes principais:

1. **Cliente (client/)**: Contém o código de frontend React
2. **Servidor (server/)**: Contém o código de backend Express
3. **Compartilhado (shared/)**: Contém esquemas e tipos compartilhados entre frontend e backend

## Arquivos Principais e Suas Funções

### Arquivos de Backend

#### 1. `server/index.ts`

Este é o ponto de entrada do servidor. Ele inicializa o Express, configura os middlewares necessários e inicia o servidor HTTP.

**Importância**: Define a configuração base do servidor e conecta todos os componentes do backend.

```typescript
// Código simplificado
import express from "express";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());

// Configurar rotas
const server = await registerRoutes(app);

// Iniciar servidor
server.listen(5000, () => {
  console.log("Servidor rodando na porta 5000");
});
```

#### 2. `server/routes.ts`

Define todas as rotas da API, conectando os endpoints HTTP às funções de armazenamento.

**Importância**: É o ponto central de comunicação entre o cliente e o servidor. Define todas as operações que podem ser realizadas na API.

```typescript
// Exemplos de rotas
app.get("/api/freelancers", async (req, res) => {
  // Lógica para buscar freelancers com filtros
});

app.get("/api/freelancers/:id", async (req, res) => {
  // Lógica para buscar detalhes de um freelancer específico
});

// etc.
```

#### 3. `server/storage.ts`

Define a interface de armazenamento e a implementação de memória para testes.

**Importância**: Separa a lógica de negócio da lógica de armazenamento, permitindo múltiplas implementações.

```typescript
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  // etc.
}

export class MemStorage implements IStorage {
  // Implementação para testes e desenvolvimento
}
```

#### 4. `server/storage-database.ts`

Implementa o armazenamento usando banco de dados PostgreSQL e Drizzle ORM.

**Importância**: Fornece persistência real de dados para o ambiente de produção.

```typescript
export class DatabaseStorage implements IStorage {
  // Implementação usando banco de dados
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  // etc.
}
```

#### 5. `server/auth.ts`

Configura a autenticação com Passport.js, incluindo registro, login e sessões.

**Importância**: Gerencia toda a segurança de acesso e identificação de usuários.

```typescript
export function setupAuth(app: Express) {
  // Configurar passport, sessões, etc.
  app.post("/api/register", async (req, res) => {
    // Registro de usuários
  });
  
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Login
  });
  // etc.
}
```

#### 6. `server/email.ts`

Gerencia o envio de emails usando a API SendGrid.

**Importância**: Permite comunicação por email com os usuários para recuperação de senha, confirmações, etc.

```typescript
export async function sendEmail(params: EmailParams): Promise<boolean> {
  // Lógica para enviar emails
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
  // Lógica específica para emails de redefinição de senha
}
```

#### 7. `server/config.ts`

Arquivo de configuração global para o servidor.

**Importância**: Centraliza as configurações do servidor, facilitando alterações.

```typescript
export const USE_DATABASE = true;
// outras configurações
```

### Arquivos Compartilhados

#### 8. `shared/schema.ts`

Define os esquemas de dados e tipos compartilhados entre cliente e servidor.

**Importância**: Garante consistência entre o frontend e o backend, definindo um contrato claro de dados.

```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  // etc.
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// etc. para todos os modelos de dados
```

### Arquivos de Frontend

#### 9. `client/src/App.tsx`

Componente principal que define as rotas e a estrutura da aplicação.

**Importância**: Organiza a navegação e a estrutura geral da interface.

```typescript
function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/map" component={MapPage} />
      <!-- outras rotas -->
    </Switch>
  );
}
```

#### 10. `client/src/hooks/use-auth.tsx`

Hook personalizado para gerenciar o estado de autenticação.

**Importância**: Centraliza a lógica de autenticação no frontend, facilitando o acesso ao usuário logado.

```typescript
export function useAuth() {
  // Hook que provê acesso ao usuário autenticado e métodos de login/logout
}
```

#### 11. `client/src/lib/cities-data.ts`

Base de dados de cidades e estados brasileiros para o componente de autocompletar.

**Importância**: Fornece dados locais para melhorar a experiência de busca por localização sem depender de APIs externas.

```typescript
export const estadosBrasileiros: EstadoData[] = [
  {
    nome: "São Paulo",
    sigla: "SP",
    cidades: ["São Paulo", "Campinas", "Guarulhos", /* etc. */]
  },
  // outros estados
];

export function pesquisarLocais(query: string): { estados: EstadoData[], cidades: Array<{cidade: string, estado: string, sigla: string}> } {
  // Lógica de busca
}
```

#### 12. `client/src/components/ui/city-autocomplete.tsx`

Componente de autocompletar para cidades e estados.

**Importância**: Melhora a experiência do usuário na busca por localização, sugerindo cidades conforme o usuário digita.

```typescript
export function CityAutocomplete({
  value,
  onChange,
  placeholder = "Digite uma cidade",
  className = "",
}: CityAutocompleteProps) {
  // Lógica e interface para autocompletar
}
```

#### 13. `client/src/pages/map-page-new.tsx`

Página que exibe freelancers em um formato de lista com filtros avançados.

**Importância**: Substitui a integração com Google Maps por uma abordagem mais simples e eficiente de filtro por cidade/estado.

```typescript
export default function MapPage() {
  // Lógica para filtrar e exibir freelancers
  return (
    <div>
      <!-- Interface com filtros e resultados -->
    </div>
  );
}
```

#### 14. `client/src/pages/auth-page.tsx`

Página de autenticação com formulários de login e registro.

**Importância**: Ponto de entrada para novos usuários e autenticação de usuários existentes.

```typescript
export default function AuthPage() {
  // Lógica de autenticação
  return (
    <div>
      <!-- Formulários de login e registro -->
    </div>
  );
}
```

## Fluxos Principais

### 1. Registro e Login

1. Usuário acessa a página de autenticação
2. Preenche o formulário de registro ou login
3. Servidor valida os dados e cria uma sessão
4. Frontend armazena o estado de autenticação
5. Usuário é redirecionado para a página inicial

### 2. Busca de Freelancers

1. Usuário acessa a página de mapa
2. Seleciona filtros (categoria, localização, avaliação, etc.)
3. Frontend envia requisição à API com os filtros
4. Servidor consulta o banco de dados aplicando os filtros
5. Frontend exibe os resultados em formato de lista
6. Usuário pode clicar em um freelancer para ver detalhes

### 3. Agendamento de Serviços

1. Usuário visualiza o perfil de um freelancer
2. Seleciona um serviço e data/horário
3. Confirma o agendamento
4. Servidor registra o agendamento no banco de dados
5. Ambos recebem confirmação por email

## Componentes Personalizados Importantes

### 1. CityAutocomplete

Substituiu a dependência do Google Maps com uma solução mais leve e eficiente. Sugere cidades brasileiras à medida que o usuário digita, melhorando a experiência de busca por localização.

### 2. FreelancerProfileModal

Exibe detalhes completos de um freelancer em um modal, incluindo avaliações, serviços e informações de contato.

### 3. ProtectedRoute

Componente de rota que verifica se o usuário está autenticado antes de permitir o acesso a páginas restritas.

## Conclusão

O FreelanceHub é uma aplicação completa que conecta freelancers e clientes de forma eficiente. Sua arquitetura modular e bem organizada facilita manutenção e expansão futuras. A substituição do Google Maps por um sistema de autocompletar com base de dados local melhora a performance e reduz dependências externas.

A separação clara entre frontend, backend e lógica compartilhada segue as melhores práticas de desenvolvimento, resultando em um código mais limpo e de fácil manutenção.