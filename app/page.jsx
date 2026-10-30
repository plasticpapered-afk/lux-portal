import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <div className="top">
        <div className="brand"><span className="dot">LX</span> LUX PORTAL</div>
        <Link className="tag" href="/admin">Staff</Link>
      </div>

      <div className="hero">
        <div>
          <div className="kicker">Applications and document review</div>
          <h1>One place to apply, upload documents and follow every step.</h1>
        </div>
      </div>

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
            after we accept your case and you see the amount in writing in your service agreement.
          </p>
          <div className="note" style={{ marginTop: 12 }}>
            The fee is <strong>refundable</strong> if we do not deliver the service set out in your agreement, or if
            you cancel before we begin work. We do not sell jobs, and no visa, job offer or interview is guaranteed
            by paying any fee. Fees never include government or embassy charges.
          </div>
        </section>

        <div className="actions">
          <Link className="btn btn-solid" href="/apply">Start an application</Link>
          <Link className="btn btn-green" href="/status">Track my application</Link>
        </div>

        <div className="foot">
          We are not a government body and we are not affiliated with any embassy or immigration authority.
          Decisions on visas and jobs are made only by the relevant authorities and employers.
        </div>
      </div>
    </main>
  );
}
