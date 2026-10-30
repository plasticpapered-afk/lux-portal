'use client';

import { useState } from 'react';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';

const FIELDS = [
  { name: 'full_name', label: 'Full name', placeholder: 'As written in your passport' },
  { name: 'email', label: 'Email', placeholder: 'you@example.com', type: 'email' },
  { name: 'phone', label: 'Phone', placeholder: '+263 ...' },
  { name: 'country', label: 'Country', placeholder: 'Zimbabwe' },
];

const DOCS = [
  { kind: 'passport', label: 'Passport photo page' },
  { kind: 'cv', label: 'CV' },
  { kind: 'certificate', label: 'Highest certificate' },
];

export default function ApplyPage() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', country: '', service: 'Work placement', notes: '', fee_ack: false });
  const [files, setFiles] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState('');

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const documents = [];
      for (const doc of DOCS) {
        const file = files[doc.kind];
        if (!file) continue;
        if (file.size > 2 * 1024 * 1024) {
          setError(`${doc.label} is larger than 2 MB. Please compress it and try again.`);
          setBusy(false);
          return;
        }
        documents.push({ kind: doc.kind, filename: file.name, data: await readFile(file) });
      }

      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, documents }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not submit the application.');
        return;
      }
      setRef(data.ref);
    } catch (err) {
      setError('Could not submit the application. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (ref) {
    return (
      <main>
        <SiteHeader />
        <div className="wrap">
          <section>
            <h2>Application received</h2>
            <p>Your reference is <strong className="lime mono">{ref}</strong>. Keep it safe, you need it to track progress.</p>
            <p className="muted">A confirmation email is on its way. Our staff now review your documents.</p>
            <div className="actions">
              <a className="btn btn-solid" href={`/status?ref=${ref}`}>Track this application</a>
            </div>
          </section>
          <SiteFooter />
        </div>
      </main>
    );
  }

  return (
    <main>
      <SiteHeader />
      <div className="wrap">
        <section>
          <h2>Start an application</h2>
          <form onSubmit={submit}>
            {FIELDS.map((f) => (
              <div key={f.name}>
                <label htmlFor={f.name}>{f.label}</label>
                <input
                  id={f.name}
                  type={f.type || 'text'}
                  placeholder={f.placeholder}
                  value={form[f.name]}
                  onChange={(e) => update(f.name, e.target.value)}
                  required={f.name === 'full_name' || f.name === 'email'}
                />
              </div>
            ))}

            <div>
              <label htmlFor="service">What do you need</label>
              <select id="service" value={form.service} onChange={(e) => update('service', e.target.value)}>
                <option>Work placement</option>
                <option>Study application</option>
                <option>Document check</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="notes">Anything we should know</label>
              <textarea id="notes" value={form.notes} onChange={(e) => update('notes', e.target.value)} />
            </div>

            {DOCS.map((doc) => (
              <div key={doc.kind}>
                <label htmlFor={doc.kind}>{doc.label}</label>
                <input
                  id={doc.kind}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFiles({ ...files, [doc.kind]: e.target.files?.[0] })}
                />
              </div>
            ))}

            <label className="check">
              <input
                type="checkbox"
                checked={form.fee_ack}
                onChange={(e) => update('fee_ack', e.target.checked)}
              />
              <span>
                I have read the fee and refund terms. The service fee is refundable if the agreed service is not
                delivered, and it is not a payment for a job.
              </span>
            </label>

            <button className="btn btn-lime" type="submit" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit application'}
            </button>
            {error && <p className="err">{error}</p>}
          </form>
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}
