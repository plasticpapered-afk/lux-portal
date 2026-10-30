import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { sendMail } from '../../../lib/mail';
import { STAFF_INBOX } from '../../../lib/mail';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const sql = db();
    const body = await req.json();
    const reference = String(body.ref || '').trim().toUpperCase();
    const email = String(body.email || '').trim().toLowerCase();
    const dataUrl = body.dataUrl || '';
    if (!reference || !email || !dataUrl) return NextResponse.json({ error: 'Missing payment proof.' }, { status: 400 });

    const rows = await sql`SELECT id, full_name, status FROM applicants
                           WHERE upper(ref) = ${reference} AND lower(email) = ${email} LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });

    const applicant = rows[0];
    if (applicant.status !== 'approved' && applicant.status !== 'payment_submitted') {
      return NextResponse.json({ error: 'Payment proof is only requested after approval.' }, { status: 400 });
    }

    let url = null;
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token) {
      const { put } = await import('@vercel/blob');
      const buf = Buffer.from((dataUrl.split(',')[1] || ''), 'base64');
      const blob = await put(`payments/${Date.now()}-proof`, buf, {
        access: 'public',
        token,
        contentType: dataUrl.slice(5).split(';')[0] || 'image/jpeg',
      });
      url = blob.url;
    } else if (dataUrl.length < 1_600_000) {
      url = dataUrl;
    }
    if (!url) return NextResponse.json({ error: 'File too large for demo storage. Connect Vercel Blob.' }, { status: 400 });

    await sql`INSERT INTO documents (applicant_id, kind, filename, url)
              VALUES (${applicant.id}, 'payment_proof', 'proof of payment', ${url})`;
    await sql`INSERT INTO status_events (applicant_id, status, note, actor)
              VALUES (${applicant.id}, 'payment_submitted', 'Proof of payment uploaded', 'applicant')`;
    await sql`UPDATE applicants SET status = 'payment_submitted' WHERE id = ${applicant.id}`;

    if (STAFF_INBOX) {
      await sendMail({
        to: STAFF_INBOX,
        subject: `Proof of payment received - ${reference}`,
        html: `<p>${applicant.full_name} uploaded proof of payment for ${reference}.</p>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Upload failed.', detail: String(err?.message || err) }, { status: 500 });
  }
}
