import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
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
