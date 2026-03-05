const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const migration = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cached_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courtlistener_id text UNIQUE,
  case_name text,
  court_id text,
  court_name text,
  jurisdiction_type text,
  date_filed date,
  date_decided date,
  status text,
  opinion_text text,
  opinion_html text,
  citations jsonb DEFAULT '[]',
  judges text[] DEFAULT '{}',
  docket_number text,
  nature_of_suit text,
  source_url text,
  matched_keywords text[] DEFAULT '{}',
  category text,
  state text,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collection_cases (
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  case_id uuid REFERENCES cached_cases(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (collection_id, case_id)
);

CREATE TABLE IF NOT EXISTS annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  case_id uuid REFERENCES cached_cases(id) ON DELETE CASCADE,
  note text NOT NULL,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  query text NOT NULL,
  filters jsonb DEFAULT '{}',
  alert_enabled boolean DEFAULT false,
  last_run_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Summary column for AI-generated case summaries
ALTER TABLE cached_cases ADD COLUMN IF NOT EXISTS summary jsonb DEFAULT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cached_cases_category ON cached_cases(category);
CREATE INDEX IF NOT EXISTS idx_cached_cases_jurisdiction ON cached_cases(jurisdiction_type);
CREATE INDEX IF NOT EXISTS idx_cached_cases_state ON cached_cases(state);
CREATE INDEX IF NOT EXISTS idx_cached_cases_date_filed ON cached_cases(date_filed);
CREATE INDEX IF NOT EXISTS idx_cached_cases_courtlistener_id ON cached_cases(courtlistener_id);
CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user ON annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_annotations_case ON annotations(case_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_cached_cases_text_search ON cached_cases USING gin(to_tsvector('english', coalesce(case_name, '') || ' ' || coalesce(opinion_text, '')));
`;

async function migrate() {
  console.log('Running migration...');
  try {
    await pool.query(migration);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
