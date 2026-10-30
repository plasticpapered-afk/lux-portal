'use client';

import { useState } from 'react';

export default function AdminLogin({ onSignedIn }) {
  const [area, setArea] = useState('staff');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Sign in failed.');
        return;
      }
      setPassword('');
      onSignedIn(area);
    } catch (err) {
      setError('Could not reach the server. Check the deployment logs.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>Staff sign in</h2>
      <form onSubmit={submit}>
        <div className="row">
          <div>
            <label htmlFor="area">Desk</label>
            <select id="area" value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="staff">Admin and viewer desk</option>
              <option value="hr">HR review desk</option>
            </select>
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="change-me"
              autoComplete="current-password"
            />
          </div>
        </div>
        <button className="btn btn-lime" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Enter back office'}
        </button>
        {error && <p className="err">{error}</p>}
      </form>
      <p className="note">
        Default passwords are change-me for both desks. The HR desk is the only one that can approve or decline
        an application and see uploaded documents.
      </p>
    </section>
  );
}
