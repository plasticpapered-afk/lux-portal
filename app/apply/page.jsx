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

const MAX_MB = 3;

export default function ApplyPage() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', country: '', service: 'Work placement', notes: '', fee_ack: false });
  const [scan, setScan] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState('');

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function pickFile(file) {
    setError('');
    if (!file) return setScan(null);
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      setError('Please upload one PDF containing all your documents.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`That PDF is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_MB} MB, please compress it.`);
      return;
    }
    setScan(file);
  }

  function readFile(file) {
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
    if (!scan) {
      setError('Attach one PDF with all your scanned documents before submitting.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          scan: { filename: scan.name, data: await readFile(scan) },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Application failed. Please try again.');
        return;
      }
      setRef(data.ref);
    } catch (err) {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (ref) {
    return (
      <>
        <SiteHeader />
        <main className="wrap">
          <section style={{ paddingTop: 40 }}>
            <h1 style={{ fontSize: 26, marginBottom: 8 }}>Application received</h1>
            <p className="muted">Your reference number is <span className="lime mono">{ref}</span>. Keep it safe.</p>
            <p style={{ marginTop: 14 }}>A confirmation email is on its way. Our review desk now checks your scanned documents.</p>
            <p className="muted small" style={{ marginTop: 10 }}>
              Track progress any time with your reference and email.
            </p>
            <div className="actions">
              <a className="btn btn-lime" href="/status">Track my application</a>
            </div>
          </section>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <section style={{ paddingTop: 32 }}>
          <h2>Apply</h2>
          <p className="muted small">Two minutes. One form, one PDF.</p>

          <form onSubmit={submit} style={{ marginTop: 18 }}>
            {FIELDS.map((f) => (
              <div key={f.name} style={{ marginBottom: 12 }}>
                <label htmlFor={f.name}>{f.label}</label>
                <input
                  id={f.name}
                  type={f.type || 'text'}
                  placeholder={f.placeholder}
                  value={form[f.name]}
                  onChange={(e) => update(f.name, e.target.value)}
                />
              </div>
            ))}

            <div style={{ marginBottom: 12 }}>
              <label htmlFor="service">What do you need</label>
              <select id="service" value={form.service} onChange={(e) => update('service', e.target.value)}>
                <option>Work placement</option>
                <option>Study application</option>
                <option>Document check</option>
                <option>Other</option>
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label htmlFor="notes">Anything we should know</label>
              <textarea id="notes" value={form.notes} onChange={(e) => update('notes', e.target.value)} />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label htmlFor="scan">Your documents as one PDF</label>
              <div className={`drop ${scan ? 'has' : ''}`}>
                <input
                  id="scan"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => pickFile(e.target.files?.[0])}
                />
                {scan ? (
                  <p style={{ marginTop: 8 }}>{scan.name} - {(scan.size / 1024 / 1024).toFixed(1)} MB ready</p>
                ) : (
                  <p style={{ marginTop: 8 }}>Attach one PDF with everything scanned</p>
                )}
              </div>
              <p className="hint">
                Scan in this order into a single PDF: passport photo page, CV, certificates. Max {MAX_MB} MB.
                On your phone use a scanner app like Google Drive Scan, then share it as a PDF.
              </p>
            </div>

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

            {error && <p className="err">{error}</p>}

            <div className="actions">
              <button className="btn btn-lime" type="submit" disabled={busy}>
                {busy ? 'Sending...' : 'Submit application'}
              </button>
            </div>
          </form>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
