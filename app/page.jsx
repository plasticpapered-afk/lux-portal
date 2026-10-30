import Link from 'next/link';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

export const metadata = {
  title: 'LUX Portal - apply and track your application',
};

export default function HomePage() {
  return (
    <main>
      <SiteHeader />

      <section className="hero">
        <div>
          <p className="kicker">Applications and document review</p>
          <h1>One place to apply, upload documents and follow every step.</h1>
        </div>
      </section>

      <div className="wrap">
        <section>
          <h2>How it works</h2>
          <div className="cards">
            <div className="card">
              <h3>1. Apply and upload</h3>
              <p>Send your details and documents once. You get a reference number immediately by email.</p>
            </div>
            <div className="card">
              <h3>2. Trained staff review</h3>
              <p>Every document is checked by a reviewer before anything is submitted on your behalf.</p>
            </div>
            <div className="card">
              <h3>3. Follow your status</h3>
              <p>Check progress any time with your reference and email. No need to chase anyone.</p>
            </div>
          </div>
        </section>

        <section>
          <h2>Fees and refunds</h2>
          <p>
            Our service fee covers document checking, preparation and submission assistance. It is charged only
            after we accept your case, and you see the amount in writing in your service agreement.
          </p>
          <div className="note" style={{ marginTop: 12 }}>
            The fee is <span className="lime">refundable</span> if we do not deliver the agreed service. It is
            never a payment for a job, and no employer has agreed to hire you until you hold a signed offer.
          </div>
        </section>

        <div className="actions">
          <Link className="btn btn-solid" href="/apply">Start an application</Link>
          <Link className="btn btn-lime" href="/status">Track my application</Link>
        </div>

        <SiteFooter />
      </div>
    </main>
  );
}
