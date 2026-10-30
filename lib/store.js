import { db, hasDatabase } from './db';

const demo = { applicants: [], docs: [], events: [], seeded: false };
const DEMO = !hasDatabase();

function uid() {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}${Date.now()}`;
}

export function mode() {
  return DEMO ? 'demo' : 'neon';
}

function makeRef() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < 3; i += 1) out += letters[Math.floor(Math.random() * letters.length)];
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `LUX-${out}${digits}`;
}

function seed() {
  if (!DEMO || demo.seeded) return;
  demo.seeded = true;
  const samples = [
    { full_name: 'Tendai Moyo', email: 'tendai@example.com', phone: '+263 77 000 0001', country: 'Zimbabwe', service: 'Work placement', status: 'in_review' },
    { full_name: 'Amina Diallo', email: 'amina@example.com', phone: '+221 77 000 0002', country: 'Senegal', service: 'Document check', status: 'approved' },
    { full_name: 'Joseph Otieno', email: 'joseph@example.com', phone: '+254 700 000 003', country: 'Kenya', service: 'Study application', status: 'received' },
  ];
  samples.forEach((s) => {
    const id = uid();
    demo.applicants.push({ id, ref: makeRef(), fee_ack: true, created_at: new Date().toISOString(), notes: '', ...s });
    demo.events.push({ id: uid(), applicant_id: id, status: 'received', note: 'Application received', actor: 'system', created_at: new Date().toISOString() });
    demo.docs.push({ id: uid(), applicant_id: id, kind: 'passport', filename: 'passport.pdf' });
  });
}

export async function createApplicant(data) {
  seed();
  const ref = makeRef();
  if (DEMO) {
    const row = { id: uid(), ref, status: 'received', created_at: new Date().toISOString(), ...data };
    demo.applicants.push(row);
    demo.events.push({ id: uid(), applicant_id: row.id, status: 'received', note: 'Application received', actor: 'system', created_at: new Date().toISOString() });
    return row;
  }
  const sql = db();
  const rows = await sql`
    INSERT INTO applicants (ref, full_name, email, phone, country, service, notes, fee_ack)
    VALUES (${ref}, ${data.full_name}, ${data.email}, ${data.phone || null}, ${data.country || null},
            ${data.service || null}, ${data.notes || null}, ${!!data.fee_ack})
    RETURNING id, ref, full_name, email, status, service, created_at`;
  return rows[0];
}

export async function addDocument(applicantId, doc) {
  seed();
  if (DEMO) {
    const row = { id: uid(), applicant_id: applicantId, kind: doc.kind, filename: doc.filename, url: doc.url || null, data: doc.data || null };
    demo.docs.push(row);
    return { ok: true, id: row.id };
  }
  const sql = db();
  const rows = await sql`INSERT INTO documents (applicant_id, kind, filename, url, data)
            VALUES (${applicantId}, ${doc.kind}, ${doc.filename || null}, ${doc.url || null}, ${doc.data || null})
            RETURNING id`;
  return { ok: true, id: rows[0]?.id };
}

export async function findApplicant(ref, email) {
  seed();
  if (DEMO) {
    return demo.applicants.find(
      (a) => a.ref.toUpperCase() === String(ref).toUpperCase() && a.email.toLowerCase() === String(email).toLowerCase()
    ) || null;
  }
  const sql = db();
  const rows = await sql`SELECT id, ref, full_name, email, status, service, created_at
                         FROM applicants
                         WHERE upper(ref) = ${String(ref).toUpperCase()} AND lower(email) = ${String(email).toLowerCase()}
                         LIMIT 1`;
  return rows[0] || null;
}

export async function listApplicants() {
  seed();
  if (DEMO) return [...demo.applicants].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const sql = db();
  return sql`SELECT id, ref, full_name, email, phone, country, service, status, created_at
             FROM applicants ORDER BY created_at DESC LIMIT 200`;
}

export async function listEvents(applicantId) {
  seed();
  if (DEMO) return demo.events.filter((e) => e.applicant_id === applicantId);
  const sql = db();
  return sql`SELECT status, note, created_at FROM status_events
             WHERE applicant_id = ${applicantId} ORDER BY created_at ASC`;
}

export async function listDocuments(applicantId) {
  seed();
  if (DEMO) return demo.docs.filter((d) => d.applicant_id === applicantId);
  const sql = db();
  return sql`SELECT kind, filename, url FROM documents
             WHERE applicant_id = ${applicantId} ORDER BY created_at ASC`;
}

export async function updateStatus(id, status, note, actor) {
  seed();
  if (DEMO) {
    const row = demo.applicants.find((a) => a.id === id);
    if (!row) return null;
    row.status = status;
    demo.events.push({ id: uid(), applicant_id: id, status, note: note || null, actor: actor || 'staff', created_at: new Date().toISOString() });
    return row;
  }
  const sql = db();
  const rows = await sql`UPDATE applicants SET status = ${status} WHERE id = ${id}
                         RETURNING id, ref, full_name, email, status`;
  if (!rows.length) return null;
  await sql`INSERT INTO status_events (applicant_id, status, note, actor)
            VALUES (${id}, ${status}, ${note || null}, ${actor || 'staff'})`;
  return rows[0];
}

export async function addProof(applicantId, doc) {
  seed();
  if (DEMO) {
    const row = demo.applicants.find((a) => a.id === applicantId);
    if (row) row.status = 'payment_submitted';
    demo.docs.push({ id: uid(), applicant_id: applicantId, kind: 'payment_proof', filename: doc.filename, url: doc.url || null });
    demo.events.push({ id: uid(), applicant_id: applicantId, status: 'payment_submitted', note: 'Proof of payment uploaded', actor: 'applicant', created_at: new Date().toISOString() });
    return row || null;
  }
  const sql = db();
  await sql`INSERT INTO documents (applicant_id, kind, filename, url)
            VALUES (${applicantId}, 'payment_proof', ${doc.filename || null}, ${doc.url || null})`;
  const rows = await sql`UPDATE applicants SET status = 'payment_submitted' WHERE id = ${applicantId}
                         RETURNING id, ref, full_name, email, status`;
  await sql`INSERT INTO status_events (applicant_id, status, note, actor)
            VALUES (${applicantId}, 'payment_submitted', 'Proof of payment uploaded', 'applicant')`;
  return rows[0] || null;
}

export async function getApplicantById(id) {
  seed();
  if (DEMO) return demo.applicants.find((a) => a.id === id) || null;
  const sql = db();
  const rows = await sql`SELECT * FROM applicants WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

export async function logEvent(applicantId, status, note, actor) {
  seed();
  if (DEMO) {
    demo.events.push({ id: uid(), applicant_id: applicantId, status, note, actor, created_at: new Date().toISOString() });
    return true;
  }
  const sql = db();
  await sql`INSERT INTO status_events (applicant_id, status, note, actor)
            VALUES (${applicantId}, ${status}, ${note}, ${actor})`;
  return true;
}

export async function getDocument(id) {
  seed();
  if (DEMO) return demo.docs.find((d) => d.id === id) || null;
  const sql = db();
  const rows = await sql`SELECT id, kind, filename, url, data FROM documents WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

export async function listDocumentsFor(applicantId) {
  seed();
  if (DEMO) return demo.docs.filter((d) => d.applicant_id === applicantId);
  const sql = db();
  return sql`SELECT id, kind, filename, url, (data IS NOT NULL) AS has_data
             FROM documents WHERE applicant_id = ${applicantId} ORDER BY created_at ASC`;
}

export async function deleteApplicant(id) {
  seed();
  if (DEMO) {
    demo.applicants = demo.applicants.filter((a) => a.id !== id);
    demo.docs = demo.docs.filter((d) => d.applicant_id !== id);
    demo.events = demo.events.filter((e) => e.applicant_id !== id);
    return true;
  }
  const sql = db();
  await sql`DELETE FROM status_events WHERE applicant_id = ${id}`;
  await sql`DELETE FROM documents WHERE applicant_id = ${id}`;
  await sql`DELETE FROM applicants WHERE id = ${id}`;
  return true;
}
