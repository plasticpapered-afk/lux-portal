# LUX Portal

Applicant intake and staff review portal. Next.js on Vercel, Neon Postgres, Resend email, Vercel Blob storage.

## Pages
- `/` public overview, fee and refund disclosure
- `/apply` application form with document upload, returns a reference number
- `/status` applicant tracking by reference + email; after approval it shows the service fee step and proof upload
- `/admin` staff sign in and back office: list applicants, add a note, change status

Two separate gates:
- Back office password: `STAFF_PASSWORD` (default `change-me`)
- HR review desk password: `HR_PASSWORD` (default `change-me`)

Both default to `change-me` as requested. Change them in Vercel before going live.

## Setup
1. Create a Neon project at https://neon.tech and copy the connection string.
2. Run `sql/schema.sql` in the Neon SQL editor.
3. Create a Resend account at https://resend.com, verify a sending domain, copy the API key.
4. In Vercel import this repo, then add environment variables:

```
DATABASE_URL=postgres://...
RESEND_API_KEY=re_...
MAIL_FROM=LUX Portal <no-reply@yourdomain.com>
STAFF_INBOX=you@yourdomain.com
STAFF_PASSWORD=change-me
HR_PASSWORD=change-me
STAFF_SECRET=any long random string
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

5. Deploy.

## Notes
- Without `RESEND_API_KEY` emails are logged and skipped, so the demo still works.
- Without `BLOB_READ_WRITE_TOKEN` files up to 1.5 MB are stored inline in Postgres. Connect Blob for production.
- Vercel Hobby is for non-commercial use. For a paying client, deploy to Vercel Pro or Cloudflare Pages.
- Store only what you need. Delete documents after a decision and keep a written retention policy.

## Compliance reminders
- Publish the fee in writing before work starts, and keep it refundable as described on the site.
- Never promise a visa, job offer or interview in exchange for money.
- Do not collect payment card details; only proof of payment.
- Register the agency where required: Zimbabwe Ministry of Labour for recruitment, and check local rules in the destination country.
- Handle passports and certificates as personal data: private storage, limited staff access, deletion on request.
