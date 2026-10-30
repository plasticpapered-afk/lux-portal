'use client';

import { useState } from 'react';
import Link from 'next/link';

const FIELDS = [
  ['full_name', 'Full name'],
  ['email', 'Email address'],
  ['phone', 'Phone number'],
  ['country', 'Country'],
];

export default function Apply() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', country: '', service: 'Document review and submission', notes: '', fee_ack: false });
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function readFiles(fileList) {
    const out = [];
    for (const file of Array.from(fileList).slice(0, 5)) {
      if (file.size > 1_500_000) {
        setError(`${file.name} is larger than 1.5 MB. Please compress it.`);
        continue;
      }
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      out.push({ kind: file.name.toLowerCase().includes('passport') ? 'passport' : 'document', filename: file.name, dataUrl });
    }
    setDocs(out);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.fee_ack) {
      setError('Please confirm you understand the fee and refund terms.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, docs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed.');
      setDone(data.ref);
      setForm({ full_name: '', email: '', phone: '', country: '', service: 'Document review and submission', notes: '', fee_ack: false });
      setDocs([]);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main>
        <div className="top"><Link className="brand" href="/"><span className="dot">LX</span> LUX PORTAL</Link></div>
        <div className="wrap">
          <section>
            <h2>Application received</h2>
            <p>Your reference is <strong>{done}</strong>. Keep it safe, you will need it with your email to check status.</p>
            <p className="muted" style={{ marginTop: 10 }}>A confirmation has been sent to your email address.</p>
          </section>
          <div className="actions">
            <Link className="btn btn-solid" href="/status">Check my status</Link>
            <Link className="btn" href="/">Back to home</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="top"><Link className="brand" href="/"><span className="dot">LX</span> LUX PORTAL</Link></div>
      <div className="wrap">
        <section>
          <h2>New application</h2>
          <form onSubmit={submit}>
            {FIELDS.map(([key, label]) => (
              <div key={key}>
                <label htmlFor={key}>{label}</label>
                <input id={key} value={form[key]} onChange={(e) => update(key, e.target.value)}
                  required={key !== 'phone'} placeholder={label} />
              </div>
            ))}

            <div>
              <label htmlFor="service">What do you need help with</label>
              <select id="service" value={form.service} onChange={(e) => update('service', e.target.value)}>
                <option>Document review and submission</option>
                <option>Study application support</option>
                <option>Work application support</option>
                <option>General enquiry</option>
              </select>
            </div>

            <div>
              <label htmlFor="notes">Anything we should know</label>
              <textarea id="notes" value={form.notes} onChange={(e) => update('notes', e.target.value)} />
            </div>

            <div>
              <label htmlFor="docs">Documents (passport, CV, certificates)</label>
              <input id="docs" type="file" multiple accept="image/*,application/pdf" onChange={(e) => readFiles(e.target.files)} />
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Max 1.5 MB per file for the demo. Files are stored privately and only visible to review staff.
              </p>
            </div>

            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', textTransform: 'none', letterSpacing: 0, fontSize: 13.5, color: '#9a9a9a' }}>
              <input type="checkbox" style={{ width: 18, height: 18, marginTop: 2 }} checked={form.fee_ack}
                onChange={(e) => update('fee_ack', e.target.checked)} />
              <span>
                I understand the service fee is only charged after my case is accepted, is shown in my service
                agreement, and is refundable if the agreed service is not delivered. No visa or job is guaranteed.
              </span>
            </label>

            {error ? <p className="err">{error}</p> : null}
            <button className="btn btn-solid" type="submit" disabled={busy}>{busy ? 'Sending...' : 'Submit application'}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
