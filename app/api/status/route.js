import { NextResponse } from 'next/server';
import { findApplicant, listEvents, listDocuments, mode } from '../../../lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const ref = String(body.ref || '').trim();
    const email = String(body.email || '').trim();
    if (!ref || !email) return NextResponse.json({ error: 'Reference and email are required.' }, { status: 400 });

    const applicant = await findApplicant(ref, email);
    if (!applicant) {
      return NextResponse.json({ error: 'No application found for that reference and email.' }, { status: 404 });
    }

    const events = await listEvents(applicant.id);
    const documents = await listDocuments(applicant.id);

    return NextResponse.json({
      ok: true,
      mode: mode(),
      applicant: {
        ref: applicant.ref,
        name: applicant.full_name,
        status: applicant.status,
        service: applicant.service,
        created: applicant.created_at,
      },
      events,
      documents: (documents || []).map((d) => ({ kind: d.kind, filename: d.filename })),
      feeDue: applicant.status === 'approved' || applicant.status === 'payment_submitted',
    });
  } catch (err) {
    return NextResponse.json({ error: 'Lookup failed.', detail: String(err?.message || err) }, { status: 500 });
  }
}
