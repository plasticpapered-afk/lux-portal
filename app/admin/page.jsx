'use client';

import { useCallback, useEffect, useState } from 'react';
import SiteHeader from '../../components/SiteHeader';
import AdminLogin from '../../components/AdminLogin';
import AdminDashboard from '../../components/AdminDashboard';

export default function AdminPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [area, setArea] = useState('staff');
  const [mode, setMode] = useState('');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRows(data.applicants || []);
        setArea(data.area || 'staff');
        setMode(data.mode || '');
        setSignedIn(true);
        setError('');
      } else if (res.status !== 401) {
        setError(data.error || 'Could not load the back office.');
      }
    } catch (err) {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function signedInAs(nextArea) {
    setArea(nextArea);
    load();
  }

  async function signOut() {
    setSignedIn(false);
    setRows([]);
    try {
      await fetch('/api/admin?signout=1', { method: 'DELETE' });
    } catch (err) {
      /* ignore */
    }
  }

  return (
    <main>
      <SiteHeader />
      <div className="wrap">
        {error && <p className="err">{error}</p>}
        {!signedIn && <AdminLogin onSignedIn={signedInAs} />}
        {loading && <p className="muted small">Checking for an existing session…</p>}
        {signedIn && (
          <AdminDashboard
            rows={rows}
            area={area}
            mode={mode}
            onRefresh={load}
            onSignOut={signOut}
          />
        )}
      </div>
    </main>
  );
}
