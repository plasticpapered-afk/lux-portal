import { NextResponse } from 'next/server';
import { sign, session, STAFF_PASSWORD, HR_PASSWORD } from '../../../lib/auth';
import { listApplicants, updateStatus, getApplicantById, logEvent, mode, listDocumentsFor, deleteApplicant } from '../../../lib/store';
import { sendMail, applicantStatus } from '../../../lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function signIn(body) {
  const area = body.area === 'hr' ? 'hr' : 'staff';
  const password = String(body.password || '');
  const expected = area === 'hr' ? HR_PASSWORD : STAFF_PASSWORD;
  if (password !== expected) {
    return { error: 'Wrong password for this desk.', status: 401 };
  }
  const token = sign({ area, role: area === 'hr' ? 'hr' : 'viewer', exp: Date.now() + 8 * 60 * 60 * 1000 });
  return { token, area };
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (body.action === 'delete') {
      const s = session(req);
      if (!s) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
      if (s.area !== 'hr' && s.area !== 'admin') {
        return NextResponse.json({ error: 'Only the HR desk can delete applications.' }, { status: 403 });
      }
      const id = String(body.id || '');
      const applicant = await getApplicantById(id);
      if (!applicant) return NextResponse.json({ error: 'Applicant not found.' }, { status: 404 });
      await deleteApplicant(id);
      return NextResponse.json({ ok: true, deleted: applicant.ref });
    }

    if (body.action === 'message') {
      const s = session(req);
      if (!s) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
      if (s.area !== 'hr' && s.area !== 'admin') {
        return NextResponse.json({ error: 'Only the HR desk can message applicants.' }, { status: 403 });
      }

      const applicant = await getApplicantById(String(body.id || ''));
      if (!applicant) return NextResponse.json({ error: 'Applicant not found.' }, { status: 404 });

      const subject = String(body.subject || '').trim() || `Message about your application ${applicant.ref}`;
      const text = String(body.body || '').trim();
      if (!text) return NextResponse.json({ error: 'Write a message first.' }, { status: 400 });

      const html = `<p>Hello ${applicant.full_name},</p>
<p>${text.replace(/\n/g, '<br/>')}</p>
<p>Your reference is <strong>${applicant.ref}</strong>.</p>
<p>LUX Portal</p>`;

      const result = await sendMail({ to: applicant.email, subject, html });
      await logEvent(applicant.id, applicant.status, `Message sent to applicant: ${subject}`, 'hr');

      return NextResponse.json({
        ok: true,
        emailed: !result?.skipped && !result?.error,
        note: result?.skipped
          ? 'Email skipped: add RESEND_API_KEY in Vercel to send real emails. The message was logged.'
          : result?.error
          ? `Email failed: ${result.error}`
          : `Email sent to ${applicant.email}.`,
      });
    }

    const login = signIn(body);
    if (login.error) return NextResponse.json({ error: login.error }, { status: login.status });

    const res = NextResponse.json({ ok: true, area: login.area, mode: mode() });
    res.cookies.set('lux_staff', login.token, {
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
    const withDocs = await Promise.all(
      applicants.map(async (a) => ({
        ...a,
        documents: (await listDocumentsFor(a.id)).map((d) => ({
          id: d.id,
          kind: d.kind,
          filename: d.filename,
          viewable: Boolean(d.has_data ?? d.data ?? d.url),
        })),
      }))
    );
    return NextResponse.json({ ok: true, area: s.area, mode: mode(), applicants: withDocs });
  } catch (err) {
    return NextResponse.json({ error: 'Could not load applications.', detail: String(err?.message || err) }, { status: 500 });
  }
}

export async function PATCH(req) {
  const s = session(req);
  if (!s) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (s.area !== 'hr' && s.area !== 'admin') {
    return NextResponse.json({ error: 'Only the HR desk can change a status.' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const applicant = await getApplicantById(String(body.id || ''));
    if (!applicant) return NextResponse.json({ error: 'Applicant not found.' }, { status: 404 });

    const status = String(body.status || '');
    const note = String(body.note || '');
    const updated = await updateStatus(applicant.id, status, note, s.area);
    await sendMail({ to: applicant.email, ...applicantStatus({ name: applicant.full_name, ref: applicant.ref, status, note }) });
    return NextResponse.json({ ok: true, applicant: updated });
  } catch (err) {
    return NextResponse.json({ error: 'Update failed.', detail: String(err?.message || err) }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('lux_staff', '', { path: '/', maxAge: 0 });
  return res;
}
