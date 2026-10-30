import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { sign, session, canReview, canManage, STAFF_PASSWORD, HR_PASSWORD } from '../../../lib/auth';
import { sendMail, applicantStatus } from '../../../lib/mail';

export const runtime = 'nodejs';

export async function POST(req) {
  const body = await req.json();
  const area = body.area === 'hr' ? 'hr' : 'staff';
  const password = String(body.password || '');
  const expected = area === 'hr' ? HR_PASSWORD : STAFF_PASSWORD;

  if (password !== expected) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
  }

  const token = sign({ area, role: area === 'hr' ? 'hr' : 'viewer', exp: Date.now() + 8 * 60 * 60 * 1000 });
  const res = NextResponse.json({ ok: true, area });
  res.cookies.set('lux_staff', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8 });
  return res;
}

export async function GET(req) {
  const s = session(req);
  if (!s) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  try {
    const sql = db();
    const rows = await sql`SELECT id, ref, full_name, email, phone, country, service, status, created_at
                           FROM applicants ORDER BY created_at DESC LIMIT 200`;
    return NextResponse.json({ ok: true, role: s.area, applicants: rows });
  } catch (err) {
    return NextResponse.json({ error: 'Could not load applications.', detail: String(err?.message || err) }, { status: 500 });
  }
}

export async function PATCH(req) {
  const s = session(req);
  if (!s) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const role = s.area === 'hr' ? 'hr' : s.role;
  if (!canReview(role)) return NextResponse.json({ error: 'Your role cannot review applications.' }, { status: 403 });

  try {
    const sql = db();
    const body = await req.json();
    const id = String(body.id || '');
    const status = String(body.status || '');
    const note = body.note ? String(body.note) : null;
    const allowed = ['received', 'in_review', 'approved', 'declined', 'payment_submitted', 'completed'];
    if (!id || !allowed.includes(status)) return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });

    const rows = await sql`UPDATE applicants SET status = ${status} WHERE id = ${id} RETURNING ref, full_name, email, status`;
    if (!rows.length) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });

    const row = rows[0];
    await sql`INSERT INTO status_events (applicant_id, status, note, actor) VALUES (${id}, ${status}, ${note}, ${role})`;

    const mail = applicantStatus({ name: row.full_name, ref: row.ref, status, note });
    await sendMail({ to: row.email, subject: mail.subject, html: mail.html });

    return NextResponse.json({ ok: true, applicant: row });
  } catch (err) {
    return NextResponse.json({ error: 'Update failed.', detail: String(err?.message || err) }, { status: 500 });
  }
}
