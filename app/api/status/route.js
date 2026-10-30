import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const sql = db();
    const body = await req.json();
    const reference = String(body.ref || '').trim().toUpperCase();
    const email = String(body.email || '').trim().toLowerCase();
    if (!reference || !email) return NextResponse.json({ error: 'Reference and email are required.' }, { status: 400 });

    const rows = await sql`SELECT id, ref, full_name, status, service, created_at
                           FROM applicants WHERE upper(ref) = ${reference} AND lower(email) = ${email} LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: 'No application found for that reference and email.' }, { status: 404 });

    const applicant = rows[0];
    const events = await sql`SELECT status, note, created_at FROM status_events
                             WHERE applicant_id = ${applicant.id} ORDER BY created_at ASC`;
    const docs = await sql`SELECT kind, filename FROM documents
                           WHERE applicant_id = ${applicant.id} ORDER BY created_at ASC`;

    return NextResponse.json({
      ok: true,
      applicant: { ref: applicant.ref, name: applicant.full_name, status: applicant.status, service: applicant.service, created: applicant.created_at },
      events,
      documents: docs.map((d) => ({ kind: d.kind, filename: d.filename })),
      feeDue: applicant.status === 'approved' || applicant.status === 'payment_submitted',
    });
  } catch (err) {
    return NextResponse.json({ error: 'Lookup failed.', detail: String(err?.message || err) }, { status: 500 });
  }
}
