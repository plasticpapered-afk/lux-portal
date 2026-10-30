import { neon } from '@neondatabase/serverless';

let schemaPromise = null;

function connectionString() {
  const names = ['DATABASE_URL', 'POSTGRES_URL', 'DATABASE_URL_UNPOOLED', 'POSTGRES_PRISMA_URL', 'NEON_DATABASE_URL'];
  for (const n of names) {
    const v = process.env[n];
    if (v && String(v).startsWith('postgres')) return v;
  }
  return null;
}

export function hasDatabase() {
  return !!connectionString();
}

function client() {
  const url = connectionString();
  if (!url) throw new Error('No database connection string found. Add DATABASE_URL in Vercel.');
  return neon(url);
}

// Every query waits for the tables to exist. Runs once per server process.
export function db() {
  const sql = client();
  return async function query(strings, ...values) {
    await ensureSchema();
    return sql(strings, ...values);
  };
}

export function ensureSchema() {
  if (!connectionString()) return Promise.resolve(false);
  if (!schemaPromise) {
    schemaPromise = build().catch((err) => {
      schemaPromise = null;
      throw err;
    });
  }
  return schemaPromise;
}

async function build() {
  const sql = client();
  const steps = [
    sql`CREATE TABLE IF NOT EXISTS applicants (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      ref text UNIQUE NOT NULL,
      full_name text NOT NULL,
      email text NOT NULL,
      phone text,
      country text,
      service text,
      notes text,
      status text NOT NULL DEFAULT 'received',
      fee_ack boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    sql`CREATE TABLE IF NOT EXISTS documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      applicant_id uuid NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
      kind text NOT NULL,
      filename text,
      url text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    sql`CREATE TABLE IF NOT EXISTS status_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      applicant_id uuid NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
      status text NOT NULL,
      note text,
      actor text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    sql`CREATE TABLE IF NOT EXISTS staff (
      email text PRIMARY KEY,
      role text NOT NULL DEFAULT 'viewer'
    )`,
    sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS data text`,
    sql`CREATE INDEX IF NOT EXISTS applicants_status_idx ON applicants (status)`,
    sql`CREATE INDEX IF NOT EXISTS documents_applicant_idx ON documents (applicant_id)`,
    sql`CREATE INDEX IF NOT EXISTS events_applicant_idx ON status_events (applicant_id)`,
  ];
  for (const step of steps) {
    try {
      await step;
    } catch (err) {
      const msg = String(err?.message || err);
      if (!msg.includes('already exists')) throw err;
    }
  }
  return true;
}
