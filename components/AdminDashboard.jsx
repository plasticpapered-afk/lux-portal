'use client';

import { useState } from 'react';

const STATUSES = ['received', 'in_review', 'approved', 'declined', 'payment_submitted', 'completed'];

export default function AdminDashboard({ rows, area, mode, onRefresh, onSignOut }) {
  const canReview = area === 'hr' || area === 'admin';
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState({});
  const [open, setOpen] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [viewer, setViewer] = useState(null);

  async function update(row, status) {
    setFlash('');
    setError('');
    if (status === 'approved') {
      const ok = window.confirm(
        `Approve ${row.full_name}?\n\nThis will email the applicant, unlock the fee step and ask them to upload proof of payment.\n\nOnly continue if every document has been checked. Are you sure?`
      );
      if (!ok) return;
    }
    if (status === 'declined') {
      const ok = window.confirm(`Decline ${row.full_name}?\n\nThey will be emailed. Are you sure?`);
      if (!ok) return;
    }
    const res = await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, status, note: notes[row.id] || '' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Update failed.');
      return;
    }
    setFlash(`${row.ref} moved to ${status.replace('_', ' ')}. Applicant emailed.`);
    onRefresh();
  }

  async function send(row) {
    setFlash('');
    setError('');
    if (!body.trim()) {
      setError('Write a message first.');
      return;
    }
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'message', id: row.id, subject, body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Message failed.');
      return;
    }
    setFlash(data.note || 'Message sent.');
    setBody('');
    setSubject('');
    setOpen(null);
    onRefresh();
  }

  function wa(row) {
    const digits = String(row.phone || '').replace(/[^\d]/g, '');
    const text = encodeURIComponent(body || `Hello ${row.full_name}, a message about your application ${row.ref}.`);
    return `https://wa.me/${digits}?text=${text}`;
  }

  return (
    <>
      <div className="spread">
        <h2>Applications ({rows.length})</h2>
        <div className="spread-right">
          {mode === 'demo' && <span className="pill pill-lime">demo data</span>}
          <span className="pill">{canReview ? 'HR desk' : 'staff desk'}</span>
          <button className="link" type="button" onClick={onSignOut}>Sign out</button>
        </div>
      </div>

      {flash && <p className="ok">{flash}</p>}
      {error && <p className="err">{error}</p>}

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Ref</th><th>Applicant</th><th>Service</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="mono">{row.ref}</td>
                <td>
                  <strong>{row.full_name}</strong>
                  <div className="muted small">{row.email}</div>
                  <div className="muted small">{row.phone} {row.country ? `- ${row.country}` : ''}</div>
                </td>
                <td className="small">{row.service || '-'}</td>
                <td><span className={`status status-${row.status}`}>{row.status.replace('_', ' ')}</span></td>
                <td>
                  {canReview ? (
                    <div className="review-cell">
                      <input
                        className="inp inp-sm"
                        placeholder="note for the applicant"
                        value={notes[row.id] || ''}
                        onChange={(e) => setNotes({ ...notes, [row.id]: e.target.value })}
                      />
                      <div className="row-btns">
                        <select className="inp inp-sm" defaultValue="" onChange={(e) => e.target.value && update(row, e.target.value)}>
                          <option value="">Change status</option>
                          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                        <button className="btn btn-sm btn-ghost" type="button" onClick={() => { setOpen(open === row.id ? null : row.id); }}>
                          Message
                        </button>
                        {(() => {
                          const doc = (row.documents || [])[0];
                          if (!doc) return <span className="muted small">no PDF yet</span>;
                          if (!doc.viewable) return <span className="muted small">PDF not stored</span>;
                          return (
                            <button className="btn btn-sm btn-lime" type="button" onClick={() => setViewer({ row, doc })}>
                              Review documents
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <span className="muted small">view only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewer && (
        <div className="modal-back" onClick={() => setViewer(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="spread">
              <h3>{viewer.row.full_name} - {viewer.row.ref}</h3>
              <button className="link" type="button" onClick={() => setViewer(null)}>Close</button>
            </div>
            <p className="muted small" style={{ marginBottom: 10 }}>{viewer.doc.filename}</p>
            <iframe className="pdf-frame" src={`/api/documents?id=${viewer.doc.id}`} title="Scanned documents" />
          </div>
        </div>
      )}

      {open && (() => {
        const row = rows.find((r) => r.id === open);
        if (!row) return null;
        return (
          <div className="panel">
            <h3>Message {row.full_name}</h3>
            <p className="muted small">Send by email, or open WhatsApp with the same text ready to go.</p>
            <input className="inp" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <textarea className="inp" rows={4} placeholder="Type your message" value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="row-btns">
              <button className="btn btn-lime btn-sm" type="button" onClick={() => send(row)}>Send email</button>
              <a className="btn btn-ghost btn-sm" href={wa(row)} target="_blank" rel="noreferrer">Open WhatsApp</a>
              <button className="link" type="button" onClick={() => setOpen(null)}>Cancel</button>
            </div>
          </div>
        );
      })()}
    </>
  );
}
