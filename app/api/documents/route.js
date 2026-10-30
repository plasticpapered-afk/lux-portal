import { NextResponse } from 'next/server';
import { session } from '../../../lib/auth';
import { getDocument } from '../../../lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Staff only. Streams the applicant's scanned PDF or redirects to the blob.
export async function GET(req) {
  const s = session(req);
  if (!s) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'Document id is required.' }, { status: 400 });

  const doc = await getDocument(id);
  if (!doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

  if (doc.data) {
    const buffer = Buffer.from(doc.data, 'base64');
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${doc.filename || 'documents.pdf'}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  if (doc.url) return NextResponse.redirect(doc.url);
  return NextResponse.json({ error: 'This document has no file attached.' }, { status: 404 });
}
