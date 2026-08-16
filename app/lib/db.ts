import { createPool } from '@vercel/postgres';

let pool: ReturnType<typeof createPool> | null = null;

export function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error(
        'Missing DATABASE_URL or POSTGRES_URL environment variable. ' +
        'Please configure your Vercel Postgres connection string.'
      );
    }
    pool = createPool({ connectionString });
  }
  return pool;
}
