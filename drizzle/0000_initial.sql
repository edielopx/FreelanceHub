-- Esquema inicial de migração

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "profile_image" TEXT,
  "user_type" TEXT NOT NULL,
  "bio" TEXT,
  "location" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Tabela de Perfis de Freelancers
CREATE TABLE IF NOT EXISTS "freelancer_profiles" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "hourly_rate" INTEGER NOT NULL,
  "skills" TEXT[] NOT NULL,
  "experience" TEXT,
  "education" TEXT
);

-- Tabela de Serviços
CREATE TABLE IF NOT EXISTS "services" (
  "id" SERIAL PRIMARY KEY,
  "freelancer_id" INTEGER NOT NULL REFERENCES "freelancer_profiles"("id"),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" INTEGER NOT NULL
);

-- Tabela de Avaliações
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" SERIAL PRIMARY KEY,
  "freelancer_id" INTEGER NOT NULL REFERENCES "freelancer_profiles"("id"),
  "client_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS "messages" (
  "id" SERIAL PRIMARY KEY,
  "sender_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "receiver_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "content" TEXT NOT NULL,
  "timestamp" TIMESTAMP DEFAULT NOW(),
  "read" BOOLEAN DEFAULT FALSE
);

-- Tabela de Sessões (para autenticação)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" TEXT NOT NULL PRIMARY KEY,
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP NOT NULL
);

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS "user_username_idx" ON "users"("username");
CREATE INDEX IF NOT EXISTS "user_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "freelancer_user_id_idx" ON "freelancer_profiles"("user_id");
CREATE INDEX IF NOT EXISTS "services_freelancer_id_idx" ON "services"("freelancer_id");
CREATE INDEX IF NOT EXISTS "reviews_freelancer_id_idx" ON "reviews"("freelancer_id");
CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages"("sender_id");
CREATE INDEX IF NOT EXISTS "messages_receiver_id_idx" ON "messages"("receiver_id");
CREATE INDEX IF NOT EXISTS "session_expire_idx" ON "session"("expire");