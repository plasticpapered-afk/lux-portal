'use client';

import { useState } from 'react';

const STATUSES = ['received', 'in_review', 'approved', 'declined', 'payment_submitted', 'completed'];

export default function AdminDashboard({ rows, area, mode, onRefresh, onSignOut }) {
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState({});
  const canReview = area === 'hr';

  async function setStatus(id, status) {
    setMsg('');
    setError('');
    const res = await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, note: notes[id] || '' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Update failed.');
      return;
    }
    setMsg(`Updated to ${status}. The applicant was emailed.`);
    onRefresh();
  }

  return (
    <>
      <section>
        <div className="spread">
          <h2>Applications ({rows.length})</h2>
          <div className="spread-right">
            {mode === 'demo' && <span className="pill pill-lime">demo data</span>}
            <span className="pill">{area === 'hr' ? 'HR desk' : 'staff desk'}</span>
            <button className="link" type="button" onClick={onSignOut}>Sign out</button>
          </div>
        </div>
        {msg && <p className="ok">{msg}</p>}
        {error && <p className="err">{error}</p>}
        {rows.length === 0 && <p className="muted">No applications yet.</p>}
        {rows.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Applicant</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>{canReview ? 'Review' : 'Read only'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="mono">{row.ref}</td>
                    <td>
                      <strong>{row.full_name}</strong>
                      <div className="muted small">{row.email}</div>
                      <div className="muted small">{row.country || '-'}</div>
                    </td>
                    <td>{row.service || '-'}</td>
                    <td><span className={`pill status-${row.status}`}>{row.status.replace('_', ' ')}</span></td>
                    <td>
                      {canReview ? (
                        <div className="review-cell">
                          <select
                            value={row.status}
                            onChange={(e) => setStatus(row.id, e.target.value)}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                          <input
                            placeholder="Note to applicant"
                            value={notes[row.id] || ''}
                            onChange={(e) => setNotes({ ...notes, [row.id]: e.target.value })}
                          />
                        </div>
                      ) : (
                        <span className="muted small">Sign in on the HR desk to review</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
