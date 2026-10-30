import Link from 'next/link';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <section className="hero-big">
          <span className="accent" />
          <p className="kicker">Applications open</p>
          <h1>Apply once. Upload once. Track everything.</h1>
          <p className="sub">
            Send your details and documents, get a reference number straight away, and follow every step from review to
            decision. No queues, no chasing anyone on WhatsApp.
          </p>
          <div className="actions">
            <Link className="btn btn-lime" href="/apply">Start application</Link>
            <Link className="btn btn-ghost" href="/status">Track my application</Link>
          </div>
        </section>

        <section>
          <h2>How it works</h2>
          <div className="cards">
            <div className="card">
              <h3><span className="lime">01</span> Apply and upload</h3>
              <p>Fill the form once and attach your passport, CV and certificates. You get a reference number by email.</p>
            </div>
            <div className="card">
              <h3><span className="lime">02</span> Document review</h3>
              <p>Our review desk checks every document. If something is missing or unclear, we message you directly.</p>
            </div>
            <div className="card">
              <h3><span className="lime">03</span> Decision and next steps</h3>
              <p>You are approved or declined in writing. Approved cases see the fee step and upload proof of payment.</p>
            </div>
          </div>
        </section>

        <section>
          <h2>Fees and refunds</h2>
          <div className="note-lime">
            <p>
              The service fee covers document checking, preparation and submission assistance. It is shown to you in
              writing before you pay, and it is <span className="lime">refundable</span> if we do not deliver the agreed
              service.
            </p>
            <p className="muted small" style={{ marginTop: 10 }}>
              We never charge for a job offer, and no visa or placement is guaranteed. We are not a government body.
            </p>
          </div>
        </section>

        <section>
          <h2>What to prepare</h2>
          <div className="cards">
            <div className="card"><h3>Passport</h3><p className="small">Photo page, valid for at least two years.</p></div>
            <div className="card"><h3>CV</h3><p className="small">One or two pages, with your contact details.</p></div>
            <div className="card"><h3>Certificates</h3><p className="small">Academic results and any language test.</p></div>
          </div>
        </section>

        <section className="actions" style={{ paddingBottom: 40 }}>
          <Link className="btn btn-lime" href="/apply">Start application</Link>
          <Link className="btn btn-ghost" href="/status">Where is my application?</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
