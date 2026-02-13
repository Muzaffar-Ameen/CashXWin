import { NavLink } from "react-router-dom";
import "./Home.css";

const games = [
  { label: "Roulette", path: "/games/roulette", active: true },
  { label: "Aviator Crash", path: "/games/Aviator-crash", active: true },
  { label: "Lucky Dice", path: "/games/lucky-dice", active: true },
  { label: "Chicken Road", path: "/games/chicken-road", active: true },
  { label: "Frog Road", path: "/games/frog-road", active: true },
  { label: "Jack Pot777", path: "/games/jackpot-777", active: true },
  { label: "3 Patti", path: "/games/3-patti", active: true },
  { label: "Mines", path: "/games/mines", active: true },
];

const Home = () => {
  return (
    <div className="home-grid page">
      <aside className="sidebar">
        <h2 className="sidebar-title">Games</h2>
        <ul className="game-list">
          {games.map((game, index) => {
            const isDefaultActive = index === 0;
            const baseClass =
              "game-item" + (isDefaultActive ? " game-item--active" : "");

            if (!game.active) {
              return (
                <li
                  key={game.label}
                  className={baseClass + " game-item--disabled"}
                >
                  <span className="game-bullet" />
                  <span>{game.label}</span>
                </li>
              );
            }

            return (
              <li key={game.label} className="game-item-wrapper">
                <NavLink
                  to={game.path}
                  className={({ isActive }) =>
                    baseClass + (isActive ? " game-item--route-active" : "")
                  }
                >
                  <span className="game-bullet" />
                  <span>{game.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="home-content">
        <section className="hero">
          <div className="hero-main">
            <h1 className="hero-title">
              Welcome to <span className="hero-highlight">CashXWin</span>
            </h1>
            <p className="hero-text">
              A modern casino hub for roulette, cards and crash games. Designed
              for smooth gameplay and clean UI.
            </p>
            <div className="hero-actions">
              {/* <button className="btn btn-primary">Play Roulette</button> */}
              {/* <button className="btn btn-outline">View Games</button> */}
            </div>
          </div>

          <div className="hero-orbit">
            <div className="hero-orbit-grid">
              <NavLink
                to="/games/roulette"
                className="hero-game-icon hero-game-icon--roulette"
                title="Roulette"
              >
                🎲
                <span className="hero-game-tooltip">Roulette</span>
              </NavLink>

              <NavLink
                to="/games/Aviator-crash"
                className="hero-game-icon hero-game-icon--aviator"
                title="Aviator Crash"
              >
                ✈️
                <span className="hero-game-tooltip">Aviator Crash</span>
              </NavLink>

              <NavLink
                to="/games/lucky-dice"
                className="hero-game-icon hero-game-icon--dice"
                title="Lucky Dice"
              >
                🎯
                <span className="hero-game-tooltip">Lucky Dice</span>
              </NavLink>

              <NavLink
                to="/games/chicken-road"
                className="hero-game-icon hero-game-icon--chicken"
                title="Chicken Road"
              >
                🐔
                <span className="hero-game-tooltip">Chicken Road</span>
              </NavLink>

              <NavLink
                to="/games/frog-road"
                className="hero-game-icon hero-game-icon--frog"
                title="Frog Road"
              >
                🐸
                <span className="hero-game-tooltip">Frog Road</span>
              </NavLink>

              <NavLink
                to="/games/jackpot-777"
                className="hero-game-icon hero-game-icon--jackpot"
                title="Jack Pot777"
              >
                🎰
                <span className="hero-game-tooltip">Jack Pot777</span>
              </NavLink>

              <NavLink
                to="/games/3-patti"
                className="hero-game-icon hero-game-icon--patti"
                title="3 Patti"
              >
                ♠️
                <span className="hero-game-tooltip">3 Patti</span>
              </NavLink>

              <NavLink
                to="/games/mines"
                className="hero-game-icon hero-game-icon--mines"
                title="Mines"
              >
                💣
                <span className="hero-game-tooltip">Mines</span>
              </NavLink>
            </div>
          </div>
        </section>

        <section className="info-grid">
          <article className="info-card">
            <h2>About Us</h2>
            <p>
              CashXWin is a demo casino lobby focused on frontend craft: motion,
              layout and user experience for interactive games.
            </p>
          </article>
          <article className="info-card">
            <h2>Privacy</h2>
            <p>
              This project is for learning only. No real money, no tracking, and
              no personal data collection.
            </p>
          </article>
          <article className="info-card">
            <h2>Contact</h2>
            <p>
              Have feedback? Email{" "}
              <a href="mailto:support@CashXWin.example">
                support@CashXWin.example
              </a>
              .
            </p>
          </article>
        </section>
      </section>
    </div>
  );
};

export default Home;
