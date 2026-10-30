'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Status() {
  const [ref, setRef] = useState('');
  const [email, setEmail] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [proofMsg, setProofMsg] = useState('');

  async function lookup(e) {
    e.preventDefault();
    setError('');
    setData(null);
    setBusy(true);
    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref, email }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || 'Lookup failed.');
      setData(out);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  async function uploadProof(file) {
    if (!file) return;
    if (file.size > 1_500_000) {
      setProofMsg('Please use a file smaller than 1.5 MB.');
      return;
    }
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    const res = await fetch('/api/proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, email, dataUrl }),
    });
    const out = await res.json();
    setProofMsg(res.ok ? 'Proof uploaded. Our team will confirm it shortly.' : (out.error || 'Upload failed.'));
  }

  return (
    <main>
      <div className="top"><Link className="brand" href="/"><span className="dot">LX</span> LUX PORTAL</Link></div>
      <div className="wrap">
        <section>
          <h2>Track my application</h2>
          <form onSubmit={lookup}>
            <div>
              <label htmlFor="ref">Reference number</label>
              <input id="ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="LUX-XXXXXX" required />
            </div>
            <div>
              <label htmlFor="email">Email used to apply</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {error ? <p className="err">{error}</p> : null}
            <button className="btn btn-solid" type="submit" disabled={busy}>{busy ? 'Checking...' : 'Check status'}</button>
          </form>
        </section>

        {data ? (
          <section>
            <h2>{data.applicant.ref}</h2>
            <p>Status: <strong>{data.applicant.status.replace(/_/g, ' ')}</strong></p>
            <p className="muted" style={{ marginTop: 6 }}>{data.applicant.service}</p>

            <h2 style={{ marginTop: 22 }}>History</h2>
            {data.events.map((ev, i) => (
              <div className="card" key={i} style={{ marginBottom: 8 }}>
                <h3>{ev.status.replace(/_/g, ' ')}</h3>
                {ev.note ? <p>{ev.note}</p> : null}
                <p className="muted" style={{ marginTop: 4, fontSize: 12 }}>{new Date(ev.created_at).toLocaleString()}</p>
              </div>
            ))}

            {data.documents.length ? (
              <>
                <h2 style={{ marginTop: 22 }}>Documents received</h2>
                {data.documents.map((d, i) => (
                  <p key={i} className="muted" style={{ fontSize: 13 }}>{d.kind.replace(/_/g, ' ')} {d.filename ? `- ${d.filename}` : ''}</p>
                ))}
              </>
            ) : null}

            {data.feeDue ? (
              <div style={{ marginTop: 22 }}>
                <h2>Next step: service fee</h2>
                <div className="note">
                  Your case was accepted. The service fee is set out in your written service agreement and is
                  refundable if the agreed service is not delivered. Upload your proof of payment below so our team
                  can confirm it. This fee is for document preparation and submission assistance only. It is not
                  payment for a job, and no visa or placement is guaranteed.
                </div>
                <div style={{ marginTop: 12 }}>
                  <input type="file" accept="image/*,application/pdf" onChange={(e) => uploadProof(e.target.files?.[0])} />
                  {proofMsg ? <p className={proofMsg.includes('uploaded') ? 'ok' : 'err'} style={{ marginTop: 8 }}>{proofMsg}</p> : null}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
