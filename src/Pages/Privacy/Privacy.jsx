import "./Privacy.css";

const Privacy = () => {
  return (
    <section className="page page-privacy">
      <header className="page-heading">
        <span className="page-kicker">Rules & Protection</span>
        <h1>Privacy & Casino Rules</h1>
        <p>
          CashXWin is a demo project. We treat your data carefully and design
          our games with responsible gambling principles in mind.
        </p>
      </header>

      <div className="privacy-grid">
        <article className="privacy-card">
          <h2>What we collect</h2>
          <ul>
            <li>Basic technical data like browser, screen size and country.</li>
            <li>Anonymous usage stats to understand which games are popular.</li>
            <li>No payment details, ID documents, or real‑money balances.</li>
          </ul>
          <p>
            This information is used only to improve the gaming experience and
            is never sold to third parties.
          </p>
        </article>

        <article className="privacy-card">
          <h2>Casino‑style rules</h2>
          <ul>
            <li>Games are 18+ and intended for training and entertainment.</li>
            <li>
              All game outcomes are powered by a random number generator
              designed to simulate fair casino odds.
            </li>
            <li>
              Demo chips and balances have no monetary value and cannot be
              withdrawn.
            </li>
          </ul>
          <p>
            When you build real money integrations, always follow local gambling
            law and licensing requirements.
          </p>
        </article>

        <article className="privacy-card privacy-card--emphasis">
          <h2>Responsible gaming</h2>
          <p>
            Real casinos promote time and deposit limits, cool‑off periods, and
            self‑exclusion tools. We mirror those ideas in our UX: clear bet
            ranges, visible odds, and optional session reminders.
          </p>
          <p>
            If you adapt CashXWin for production, add tools for players to pause
            play, limit risk, and quickly access support.
          </p>
        </article>
      </div>

      <section className="privacy-notes">
        <h2>Data retention</h2>
        <p>
          Demo logs such as recent game results and chip history are stored only
          for short periods to improve animations and UX. They can be wiped at
          any time without impacting your account.
        </p>

        <div className="privacy-badges">
          <span className="privacy-badge">No real cash</span>
          <span className="privacy-badge">No third‑party sale</span>
          <span className="privacy-badge">18+ only</span>
        </div>
      </section>
    </section>
  );
};

export default Privacy;
