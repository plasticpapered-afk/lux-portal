import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { findApplicant, addProof } from '../../../lib/store';
import { sendMail } from '../../../lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const ref = String(body.ref || '').trim();
    const email = String(body.email || '').trim();
    const doc = body.document || {};
    if (!ref || !email || !doc.data) {
      return NextResponse.json({ error: 'Reference, email and a payment proof file are required.' }, { status: 400 });
    }

    const applicant = await findApplicant(ref, email);
    if (!applicant) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });

    const allowed = ['approved', 'payment_submitted'];
    if (!allowed.includes(applicant.status)) {
      return NextResponse.json(
        { error: 'Proof of payment opens only after your application is approved.' },
        { status: 409 }
      );
    }

    const filename = String(doc.filename || 'payment-proof');
    const dataUrl = String(doc.data);
    const buffer = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');

    let url = null;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`applicants/${applicant.ref}/payment-${filename}`, buffer, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        url = blob.url;
      } catch (err) {
        console.error('[proof upload failed]', err?.message || err);
      }
    }

    await addProof(applicant.id, { filename, url });

    if (process.env.STAFF_INBOX) {
      await sendMail({
        to: process.env.STAFF_INBOX,
        subject: `Proof of payment - ${applicant.ref}`,
        html: `<p>${applicant.full_name} uploaded proof of payment for ${applicant.ref}.</p>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Upload failed.', detail: String(err?.message || err) }, { status: 500 });
  }
}
