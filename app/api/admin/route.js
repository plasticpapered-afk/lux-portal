import { NextResponse } from 'next/server';
import { sign, session, canReview, STAFF_PASSWORD, HR_PASSWORD } from '../../../lib/auth';
import { listApplicants, updateStatus, mode } from '../../../lib/store';
import { sendMail, applicantStatus } from '../../../lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const area = body.area === 'hr' ? 'hr' : 'staff';
    const password = String(body.password || '');
    const expected = area === 'hr' ? HR_PASSWORD : STAFF_PASSWORD;

    if (password !== expected) {
      return NextResponse.json({ error: 'Wrong password. The default is change-me.' }, { status: 401 });
    }

    const token = sign({ area, role: area === 'hr' ? 'hr' : 'viewer', exp: Date.now() + 8 * 60 * 60 * 1000 });
    const res = NextResponse.json({ ok: true, area, mode: mode() });
    res.cookies.set('lux_staff', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Sign in failed.', detail: String(err?.message || err) }, { status: 500 });
  }
}

export async function GET(req) {
  const s = session(req);
  if (!s) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  try {
    const applicants = await listApplicants();
    return NextResponse.json({ ok: true, area: s.area, mode: mode(), applicants });
  } catch (err) {
    return NextResponse.json({ error: 'Could not load applications.', detail: String(err?.message || err) }, { status: 500 });
  }
}

export async function PATCH(req) {
  const s = session(req);
  if (!s) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const role = s.area === 'hr' ? 'hr' : s.role || 'viewer';
  if (!canReview(role)) {
    return NextResponse.json({ error: 'The admin desk cannot change review outcomes. Use the HR desk password.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const id = String(body.id || '');
    const status = String(body.status || '');
    const note = body.note ? String(body.note) : null;
    const allowed = ['received', 'in_review', 'approved', 'declined', 'payment_submitted', 'completed'];
    if (!id || !allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });
    }

    const row = await updateStatus(id, status, note, role);
    if (!row) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });

    const mail = applicantStatus({ name: row.full_name, ref: row.ref, status, note });
    await sendMail({ to: row.email, subject: mail.subject, html: mail.html });

    return NextResponse.json({ ok: true, applicant: row });
  } catch (err) {
    return NextResponse.json({ error: 'Update failed.', detail: String(err?.message || err) }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('lux_staff', '', { path: '/', maxAge: 0 });
  return res;
}
