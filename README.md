# LUX Portal

Applicant intake, document upload, staff back office with two passwords, status tracking, proof of payment, and emails.

## Why buttons failed before

If `DATABASE_URL` is missing the API returned an error and the back office stayed on the sign-in screen with no message. The app now runs in **demo mode** with sample applicants whenever `DATABASE_URL` is not set, so every button works immediately after deploy. Add a database later and it switches to Neon automatically.

## Structure

app/                 routes only, thin
components/          SiteHeader, SiteFooter, AdminLogin, AdminDashboard
lib/store.js         one data layer, Neon when configured, in-memory demo otherwise
lib/auth.js          signed cookie sessions, two desks
lib/mail.js          Resend, silently skipped when no key
sql/schema.sql       run once in Neon

## Go live

1. Neon: create a project, run `sql/schema.sql` in the SQL editor
2. Vercel: import the repo, add env vars, deploy

Env vars:

DATABASE_URL            Neon connection string (optional, demo mode without it)
RESEND_API_KEY          emails
MAIL_FROM               e.g. LUX Portal <hello@yourdomain.com>
STAFF_INBOX             where new applications are announced
STAFF_PASSWORD          admin/viewer desk password, default change-me
HR_PASSWORD             HR review desk password, default change-me
STAFF_SECRET            random string for cookie signing
BLOB_READ_WRITE_TOKEN   optional, Vercel Blob for real file storage

## Routes

/          public page with fee and refund wording
/apply     application form with document upload
/status    track by reference and email, upload proof of payment after approval
/admin     back office, both desks
