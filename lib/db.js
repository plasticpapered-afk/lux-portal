import { neon } from '@neondatabase/serverless';

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

export async function ensureSchema() {
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS applicants (
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
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      applicant_id uuid NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
      kind text NOT NULL,
      filename text,
      url text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS status_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      applicant_id uuid NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
      status text NOT NULL,
      note text,
      actor text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS staff (
      email text PRIMARY KEY,
      role text NOT NULL DEFAULT 'viewer'
    )`;
}
