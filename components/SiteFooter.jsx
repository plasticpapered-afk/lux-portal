import Link from 'next/link';

const WHATSAPP = 'https://wa.me/263787434880?text=Hello%20LUX%20Portal%2C%20I%20have%20a%20question%20about%20my%20application';

export default function SiteFooter() {
  return (
    <footer className="wrap">
      <div className="foot-grid">
        <div>
          <div className="brand"><span className="dot">LX</span> LUX PORTAL</div>
          <p className="muted small" style={{ marginTop: 10, maxWidth: '34ch' }}>
            Applications, document checks and status updates in one place.
          </p>
        </div>
        <div>
          <h4>Pages</h4>
          <Link href="/">Home</Link>
          <Link href="/apply">Apply</Link>
          <Link href="/status">Track status</Link>
          <Link href="/admin">Staff back office</Link>
        </div>
        <div>
          <h4>Talk to us</h4>
          <a href={WHATSAPP} target="_blank" rel="noreferrer">WhatsApp</a>
          <a href="mailto:hello@luxportal.example">Email</a>
        </div>
      </div>
      <p className="muted small" style={{ paddingBottom: 26, lineHeight: 1.6 }}>
        We prepare and submit applications on your behalf. No job, visa or placement is guaranteed, and we are not a
        government body. Our service fee is charged only under a written agreement and is refundable if we do not deliver
        the agreed service.
      </p>
    </footer>
  );
}
