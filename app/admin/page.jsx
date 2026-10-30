'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STATUSES = ['received', 'in_review', 'approved', 'declined', 'payment_submitted', 'completed'];

export default function Admin() {
  const [area, setArea] = useState('staff');
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');
  const [note, setNote] = useState({});

  async function load() {
    const res = await fetch('/api/admin');
    if (res.ok) {
      const data = await res.json();
      setRows(data.applicants || []);
      setAuthed(true);
    }
  }

  useEffect(() => { load(); }, []);

  async function login(e) {
    e.preventDefault();
    setMsg('');
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area, password }),
    });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error || 'Login failed.'); return; }
    setPassword('');
    load();
  }

  async function setStatus(id, status) {
    const res = await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, note: note[id] || '' }),
    });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error || 'Update failed.'); return; }
    setMsg(`Updated to ${status}. Applicant notified by email.`);
    load();
  }

  if (!authed) {
    return (
      <main>
        <div className="top"><Link className="brand" href="/"><span className="dot">LX</span> LUX PORTAL</Link></div>
        <div className="wrap">
          <section>
            <h2>Staff sign in</h2>
            <form onSubmit={login}>
              <div>
                <label htmlFor="area">Area</label>
                <select id="area" value={area} onChange={(e) => setArea(e.target.value)}>
                  <option value="staff">Back office (admin and viewers)</option>
                  <option value="hr">Human resources review desk</option>
                </select>
              </div>
              <div>
                <label htmlFor="pw">Password</label>
                <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {msg ? <p className="err">{msg}</p> : null}
              <button className="btn btn-solid" type="submit">Sign in</button>
            </form>
            <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
              Default password for both areas is change-me. Change it in your environment variables before going live.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="top">
        <Link className="brand" href="/"><span className="dot">LX</span> LUX PORTAL</Link>
        <span className="tag">Back office</span>
      </div>
      <div className="wrap">
        <section>
          <h2>Applications ({rows.length})</h2>
          {msg ? <p className="ok" style={{ marginBottom: 10 }}>{msg}</p> : null}
          <table>
            <thead>
              <tr>
                <th>Ref</th><th>Applicant</th><th>Service</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.ref}</td>
                  <td>
                    {r.full_name}
                    <div className="muted" style={{ fontSize: 12 }}>{r.email}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{r.country || ''} {r.phone || ''}</div>
                  </td>
                  <td className="muted" style={{ fontSize: 12 }}>{r.service}</td>
                  <td><span className="pill">{r.status.replace(/_/g, ' ')}</span></td>
                  <td>
                    <input placeholder="Note to applicant" value={note[r.id] || ''}
                      onChange={(e) => setNote((n) => ({ ...n, [r.id]: e.target.value }))}
                      style={{ marginBottom: 6, fontSize: 13, padding: '8px 10px' }} />
                    <select defaultValue="" onChange={(e) => { if (e.target.value) setStatus(r.id, e.target.value); }}>
                      <option value="">Set status</option>
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr><td colSpan={5} className="muted">No applications yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </section>
        <div className="foot">
          Reviewers can change statuses. Approving an application sends the applicant an email and opens the
          service fee step on their status page. Only uploads and statuses are stored, never card details.
        </div>
      </div>
    </main>
  );
}
