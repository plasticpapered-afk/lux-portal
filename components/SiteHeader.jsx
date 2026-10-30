import Link from 'next/link';

export default function SiteHeader({ compact = false }) {
  return (
    <header className="top">
      <Link className="brand" href="/">
        <span className="dot">LX</span>
        LUX PORTAL
      </Link>
      {!compact && (
        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/apply">Apply</Link>
          <Link href="/status">Track status</Link>
        </nav>
      )}
    </header>
  );
}
