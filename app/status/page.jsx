'use client';

import { useEffect, useState } from 'react';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import { FEE_EUR, waLink, WHATSAPP_DISPLAY } from '../../lib/config';

export default function StatusPage() {
  const [ref, setRef] = useState('');
  const [email, setEmail] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [proofMsg, setProofMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('ref');
    if (fromUrl) setRef(fromUrl);
  }, []);

  async function lookup(e) {
    if (e) e.preventDefault();
    setError('');
    setBusy(true);
    setData(null);
    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref, email }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(out.error || 'Lookup failed.');
        return;
      }
      setData(out);
    } catch (err) {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  }

  async function uploadProof(file) {
    if (!file) return;
    setProofMsg('Uploading…');
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const res = await fetch('/api/proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, email, document: { filename: file.name, data: dataUrl } }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) {
      setProofMsg(out.error || 'Upload failed.');
      return;
    }
    setProofMsg('Proof of payment received. Our team will confirm it shortly.');
    lookup();
  }

  return (
    <main>
      <SiteHeader />
      <div className="wrap">
        <section>
          <h2>Track your application</h2>
          <form onSubmit={lookup}>
            <div className="row">
              <div>
                <label htmlFor="ref">Reference</label>
                <input id="ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="LUX-ABC1234" required />
              </div>
              <div>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
            </div>
            <button className="btn btn-lime" type="submit" disabled={busy}>
              {busy ? 'Checking…' : 'Check status'}
            </button>
            {error && <p className="err">{error}</p>}
          </form>
        </section>

        {data && (
          <>
            <section>
              <div className="spread">
                <h2>{data.applicant.ref}</h2>
                <span className={`pill status-${data.applicant.status}`}>{data.applicant.status.replace('_', ' ')}</span>
              </div>
              <p>{data.applicant.name}</p>
              <p className="muted small">Service: {data.applicant.service || '-'}</p>
            </section>

            {data.events?.length > 0 && (
              <section>
                <h2>History</h2>
                <div className="cards">
                  {data.events.map((ev, i) => (
                    <div className="card" key={i}>
                      <strong className="small">{ev.status.replace('_', ' ')}</strong>
                      {ev.note && <p>{ev.note}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {data.feeDue && (
              <section>
                <h2>Service fee</h2>
                <div className="fee-box">
                  <div className="fee-amount">€{FEE_EUR}</div>
                  <p className="muted small">Or the equivalent in your currency. Refundable if we do not deliver.</p>
                  <p style={{ marginTop: 10 }}>
                    <a className="btn btn-lime btn-sm" href={waLink(`Hello, my reference is ${data.applicant.ref}. Please send me the payment options for the EUR ${FEE_EUR} service fee.`)} target="_blank" rel="noreferrer">
                      Get payment options on WhatsApp
                    </a>
                  </p>
                  <p className="muted small" style={{ marginTop: 8 }}>WhatsApp {WHATSAPP_DISPLAY}</p>
                </div>
                <p style={{ marginTop: 12 }}>
                  Your application was approved. The service fee covers document preparation and submission
                  assistance. It is <span className="lime">refundable</span> if we do not deliver the agreed
                  service, and it is not a payment for a job.
                </p>
                <div className="note" style={{ marginTop: 12 }}>
                  Upload your proof of payment and our team verifies it before anything else happens.
                </div>
                <div style={{ marginTop: 14 }}>
                  <label htmlFor="proof">Proof of payment</label>
                  <input id="proof" type="file" accept="image/*,application/pdf" onChange={(e) => uploadProof(e.target.files?.[0])} />
                </div>
                {proofMsg && <p className="ok">{proofMsg}</p>}
              </section>
            )}
          </>
        )}

        <SiteFooter />
      </div>
    </main>
  );
}
