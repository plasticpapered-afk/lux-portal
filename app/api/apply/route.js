import { NextResponse } from 'next/server';
import { db, ensureSchema } from '../../../lib/db';
import { sendMail, applicantReceived, staffAlert, STAFF_INBOX } from '../../../lib/mail';

export const runtime = 'nodejs';

function ref() {
  const s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'LUX-';
  for (let i = 0; i < 6; i += 1) out += s[Math.floor(Math.random() * s.length)];
  return out;
}

async function storeFile(kind, filename, dataUrl) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const { put } = await import('@vercel/blob');
    const base64 = (dataUrl.split(',')[1] || '');
    const buf = Buffer.from(base64, 'base64');
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const blob = await put(`applicants/${Date.now()}-${safe}`, buf, {
      access: 'public',
      token,
      contentType: dataUrl.slice(5).split(';')[0] || 'application/octet-stream',
    });
    return blob.url;
  }
  return dataUrl.length < 1_600_000 ? dataUrl : null;
}

export async function POST(req) {
  try {
    await ensureSchema();
    const sql = db();
    const body = await req.json();

    const fullName = String(body.full_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    if (fullName.length < 3) return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    if (!body.fee_ack) return NextResponse.json({ error: 'Please confirm you understand the fee terms.' }, { status: 400 });

    const reference = ref();
    const rows = await sql`
      INSERT INTO applicants (ref, full_name, email, phone, country, service, notes, fee_ack)
      VALUES (${reference}, ${fullName}, ${email}, ${body.phone || null}, ${body.country || null},
              ${body.service || null}, ${body.notes || null}, true)
      RETURNING id, ref`;

    const applicant = rows[0];

    const docs = Array.isArray(body.docs) ? body.docs.slice(0, 6) : [];
    for (const doc of docs) {
      if (!doc || !doc.dataUrl) continue;
      const url = await storeFile(doc.kind || 'document', doc.filename || 'file', doc.dataUrl);
      if (!url) continue;
      await sql`INSERT INTO documents (applicant_id, kind, filename, url)
                VALUES (${applicant.id}, ${doc.kind || 'document'}, ${doc.filename || null}, ${url})`;
    }

    await sql`INSERT INTO status_events (applicant_id, status, note, actor)
              VALUES (${applicant.id}, 'received', 'Application submitted', 'system')`;

    const mail = applicantReceived({ name: fullName, ref: reference });
    await sendMail({ to: email, subject: mail.subject, html: mail.html });
    if (STAFF_INBOX) {
      const alert = staffAlert({ name: fullName, ref: reference, email, service: body.service });
      await sendMail({ to: STAFF_INBOX, subject: alert.subject, html: alert.html });
    }

    return NextResponse.json({ ok: true, ref: reference });
  } catch (err) {
    return NextResponse.json({ error: 'Could not submit application.', detail: String(err?.message || err) }, { status: 500 });
  }
}
