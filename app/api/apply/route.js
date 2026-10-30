import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createApplicant, addDocument, mode } from '../../../lib/store';
import { sendMail, applicantReceived } from '../../../lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 3 * 1024 * 1024;

function decode(dataUrl) {
  const comma = String(dataUrl || '').indexOf(',');
  const b64 = comma >= 0 ? String(dataUrl).slice(comma + 1) : '';
  return Buffer.from(b64, 'base64');
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

    const scan = body.scan || null;
    if (!scan?.data) {
      return NextResponse.json({ error: 'Please attach one PDF containing all your scanned documents.' }, { status: 400 });
    }

    const filename = String(scan.filename || 'documents.pdf');
    if (!/\.pdf$/i.test(filename)) {
      return NextResponse.json({ error: 'Your scanned documents must be a single PDF file.' }, { status: 400 });
    }

    const buffer = decode(scan.data);
    if (!buffer.length) return NextResponse.json({ error: 'The PDF arrived empty. Please try again.' }, { status: 400 });
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ error: 'That PDF is bigger than 3 MB. Please compress it and try again.' }, { status: 400 });
    }
    const isPdf = buffer.slice(0, 5).toString() === '%PDF-';
    if (!isPdf) return NextResponse.json({ error: 'That file is not a valid PDF.' }, { status: 400 });

    const applicant = await createApplicant({
      full_name,
      email,
      phone: body.phone || null,
      country: body.country || null,
      service: body.service || null,
      notes: body.notes || null,
      fee_ack: true,
    });

    // Keep the PDF where the HR desk can open it:
    // Vercel Blob when configured, otherwise inside the database.
    let url = null;
    let data = null;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`applicants/${applicant.ref}/${filename}`, buffer, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        url = blob.url;
      } catch (err) {
        console.error('[blob upload failed, using database]', err?.message || err);
      }
    }
    if (!url) data = buffer.toString('base64');

    await addDocument(applicant.id, { kind: 'documents_pdf', filename, url, data });

    const mail = applicantReceived({ name: applicant.full_name, ref: applicant.ref });
    await sendMail({ to: applicant.email, ...mail });

    return NextResponse.json({ ok: true, ref: applicant.ref, mode: mode(), stored: url ? 'blob' : 'database' });
  } catch (err) {
    return NextResponse.json({ error: 'Application failed.', detail: String(err?.message || err) }, { status: 500 });
  }
}
