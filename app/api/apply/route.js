import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createApplicant, addDocument, mode } from '../../../lib/store';
import { sendMail, applicantReceived } from '../../../lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function decodeUpload(doc) {
  const name = String(doc?.filename || 'file');
  const dataUrl = String(doc?.data || '');
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : '';
  return { name, buffer: Buffer.from(b64, 'base64') };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const full_name = String(body.full_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    if (!full_name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }
    if (!body.fee_ack) {
      return NextResponse.json({ error: 'Please confirm you have read the fee and refund terms.' }, { status: 400 });
    }

    const applicant = await createApplicant({
      full_name,
      email,
      phone: body.phone || null,
      country: body.country || null,
      service: body.service || null,
      notes: body.notes || null,
      fee_ack: true,
    });

    const docs = Array.isArray(body.documents) ? body.documents : [];
    for (const doc of docs.slice(0, 4)) {
      if (!doc?.data) continue;
      const { name, buffer } = decodeUpload(doc);
      let url = null;
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const blob = await put(`applicants/${applicant.ref}/${doc.kind || 'doc'}-${name}`, buffer, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          url = blob.url;
        } catch (err) {
          console.error('[blob upload failed]', err?.message || err);
        }
      }
      await addDocument(applicant.id, { kind: doc.kind || 'document', filename: name, url });
    }

    const mail = applicantReceived({ name: full_name, ref: applicant.ref });
    await sendMail({ to: email, subject: mail.subject, html: mail.html });
    if (process.env.STAFF_INBOX) {
      await sendMail({
        to: process.env.STAFF_INBOX,
        subject: `New application ${applicant.ref} - ${full_name}`,
        html: `<p>New application received.</p><p>Reference: <strong>${applicant.ref}</strong><br/>Name: ${full_name}<br/>Email: ${email}<br/>Service: ${body.service || '-'}</p>`,
      });
    }

    return NextResponse.json({ ok: true, ref: applicant.ref, mode: mode() });
  } catch (err) {
    return NextResponse.json({ error: 'Could not save the application.', detail: String(err?.message || err) }, { status: 500 });
  }
}
