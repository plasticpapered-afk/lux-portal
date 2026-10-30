import Link from 'next/link';
import { WHATSAPP_DISPLAY, waLink, FEE_EUR } from '../lib/config';

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
          <a href={waLink()} target="_blank" rel="noreferrer">WhatsApp {WHATSAPP_DISPLAY}</a>
          <a href="mailto:hello@luxportal.example">Email</a>
          <span className="muted small">Service fee: €{FEE_EUR}</span>
        </div>
      </div>
      <p className="muted small" style={{ paddingBottom: 26, lineHeight: 1.6 }}>
        We prepare and submit applications on your behalf. No job, visa or placement is guaranteed, and we are not a
        government body. The €{FEE_EUR} service fee is charged only under a written agreement, is payable after your
        case is approved, and is refundable if we do not deliver the agreed service. Payment options are shared on
        WhatsApp.
      </p>
    </footer>
  );
}
