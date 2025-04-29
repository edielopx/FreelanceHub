import { Pool } from 'pg';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize the PostgreSQL session store
const PostgresStore = connectPgSimple(session);

export const pgSessionStore = new PostgresStore({
  pool,
  tableName: 'session',
  createTableIfMissing: true,
});