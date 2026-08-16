import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
const connectionString = databaseUrl
  ? (() => {
      const url = new URL(databaseUrl);
      if (!url.searchParams.has('sslmode')) {
        url.searchParams.set('sslmode', 'verify-full');
      }
      return url.toString();
    })()
  : undefined;

const pool = new Pool({
  connectionString,
  // Functions scale independently, so keep each instance's pool small.
  max: 2,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) {
    console.log('Slow query:', { text: text.substring(0, 100), duration, rows: res.rowCount });
  }
  return res;
}

export async function getOne(text: string, params?: any[]) {
  const res = await query(text, params);
  return res.rows[0] || null;
}

export async function getMany(text: string, params?: any[]) {
  const res = await query(text, params);
  return res.rows;
}
