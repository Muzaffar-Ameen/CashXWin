import "./About.css";

const About = () => {
  return (
    <section className="page page-about">
      <header className="page-heading">
        <span className="page-kicker">Our Story</span>
        <h1>About MyCasino</h1>
        <p>
          MyCasino is a modern web casino lobby built for players who care about
          smooth gameplay, transparent odds, and a beautiful interface.
        </p>
      </header>

      <div className="about-grid">
        <article className="about-card">
          <h2>From roulette wheels to real‑time UIs</h2>
          <p>
            Classic casino games like roulette and blackjack date back hundreds
            of years, but most online lobbies still feel clunky. MyCasino
            focuses on fluid motion, readable layouts, and instant feedback.
          </p>
          <p>
            Every spin, flip, and crash event is designed to feel physically
            believable while staying lightweight for the browser.
          </p>
        </article>

        <article className="about-card">
          <h2>Frontend‑first casino experience</h2>
          <ul>
            <li>Responsive layouts for desktop and mobile tables.</li>
            <li>Reusable components for chips, cards, wheels and timers.</li>
            <li>Non‑blocking animations using CSS transforms and opacity.</li>
          </ul>
          <p>
            This project gives developers a sandbox to experiment with game
            flows before connecting to real‑money backends.
          </p>
        </article>

        <article className="about-card about-card--highlight">
          <h2>Fair play mindset</h2>
          <p>
            We prototype games around clearly defined rules: visible bet ranges,
            transparent payouts, and predictable randomization using standard
            RNG libraries.
          </p>
          <p>
            While MyCasino is a demo and does not use real money, we design
            every screen with responsible gaming in mind.
          </p>
        </article>
      </div>

      <div className="about-timeline">
        <div className="about-timeline-line" />
        <div className="about-timeline-item">
          <span className="about-dot" />
          <div>
            <h3>Phase 1 — Roulette Lab</h3>
            <p>
              Building a fast, canvas‑free roulette table with chip stacking,
              wheel animation, and bet history.
            </p>
          </div>
        </div>
        <div className="about-timeline-item">
          <span className="about-dot" />
          <div>
            <h3>Phase 2 — Card Games</h3>
            <p>
              Blackjack and baccarat tables with smart bet zones and card
              dealing sequences that feel like real casinos.
            </p>
          </div>
        </div>
        <div className="about-timeline-item">
          <span className="about-dot" />
          <div>
            <h3>Phase 3 — Crash & Avatars</h3>
            <p>
              High‑tempo crash games and avatar‑based UX to simulate real‑time
              multiplayer lobbies.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
