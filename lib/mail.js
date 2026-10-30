import { Resend } from 'resend';

const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.MAIL_FROM || 'LUX Portal <onboarding@resend.dev>';
const STAFF_INBOX = process.env.STAFF_INBOX || '';

function client() {
  if (!KEY) return null;
  return new Resend(KEY);
}

export async function sendMail({ to, subject, html }) {
  const resend = client();
  if (!resend) {
    console.log('[mail skipped - no RESEND_API_KEY]', subject, '->', to);
    return { skipped: true };
  }
  try {
    const out = await resend.emails.send({ from: FROM, to, subject, html });
    return out;
  } catch (err) {
    console.error('[mail failed]', err?.message || err);
    return { error: String(err?.message || err) };
  }
}

export function applicantReceived({ name, ref }) {
  return {
    subject: `Application received - ${ref}`,
    html: `<p>Hello ${name},</p>
<p>We have received your application. Your reference is <strong>${ref}</strong>.</p>
<p>Our staff will review your documents and update you by email. You can check your status at any time on our status page using this reference and your email address.</p>
<p>No visa or job placement is guaranteed. Any service fee is charged only under the written service agreement and is refundable if we do not deliver the agreed service.</p>
<p>LUX Portal</p>`,
  };
}

export function applicantStatus({ name, ref, status, note }) {
  return {
    subject: `Application update - ${ref}`,
    html: `<p>Hello ${name},</p>
<p>Your application <strong>${ref}</strong> is now: <strong>${status}</strong>.</p>
${note ? `<p>Note from our team: ${note}</p>` : ''}
<p>Log in to the status page with your reference and email to see details.</p>
<p>LUX Portal</p>`,
  };
}

export function staffAlert({ name, ref, email, service }) {
  return {
    subject: `New application - ${ref}`,
    html: `<p>New application from ${name} (${email}).</p>
<p>Service: ${service || 'not specified'}<br/>Reference: ${ref}</p>
<p>Open the back office to review the documents.</p>`,
  };
}

export { STAFF_INBOX };
