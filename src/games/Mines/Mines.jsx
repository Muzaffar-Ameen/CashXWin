// src/games/mines/Mines.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Mines.css";

const GRID_SIZE = 5; // 5x5 mines grid

const ROUND_STATES = {
  IDLE: "IDLE",
  RUNNING: "RUNNING",
  BUST: "BUST",
  CASHED_OUT: "CASHED_OUT",
};

const defaultBalance = 1000;

const Mines = () => {
  const navigate = useNavigate();

  const [balance, setBalance] = useState(defaultBalance);
  const [bet, setBet] = useState(10);
  const [mineCount, setMineCount] = useState(3);

  const [roundState, setRoundState] = useState(ROUND_STATES.IDLE);
  const [revealedCount, setRevealedCount] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);

  const [grid, setGrid] = useState([]); // [{id,row,col,isMine,revealed}]
  const [lastResult, setLastResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // simple deterministic multiplier curve for demo:
  // more mines & more safe picks = higher multiplier
  const computeMultiplier = (safeRevealed, mineCountInput) => {
    if (safeRevealed <= 0) return 1.0;
    const baseRisk = mineCountInput / (GRID_SIZE * GRID_SIZE);
    const base = 1 + safeRevealed * (0.25 + baseRisk * 0.8);
    const curveBoost = safeRevealed * safeRevealed * baseRisk * 0.15;
    return +(base + curveBoost).toFixed(2);
  };

  const canStartRound = () =>
    roundState === ROUND_STATES.IDLE &&
    bet > 0 &&
    bet <= balance &&
    mineCount >= 1 &&
    mineCount < GRID_SIZE * GRID_SIZE;

  const createGrid = () => {
    const totalCells = GRID_SIZE * GRID_SIZE;
    const allIndexes = Array.from({ length: totalCells }, (_, i) => i);

    // pick mine positions
    const mineIndexes = new Set();
    while (mineIndexes.size < mineCount) {
      const randomIndex =
        allIndexes[Math.floor(Math.random() * allIndexes.length)];
      mineIndexes.add(randomIndex);
    }

    const newGrid = allIndexes.map((index) => {
      const row = Math.floor(index / GRID_SIZE);
      const col = index % GRID_SIZE;
      return {
        id: index,
        row,
        col,
        isMine: mineIndexes.has(index),
        revealed: false,
      };
    });

    setGrid(newGrid);
  };

  const resetRoundState = () => {
    setRoundState(ROUND_STATES.IDLE);
    setRevealedCount(0);
    setMultiplier(1.0);
    setLastResult(null);
  };

  const startRound = () => {
    if (!canStartRound()) return;
    setBalance((prev) => prev - bet);
    resetRoundState();
    setRoundState(ROUND_STATES.RUNNING);
    setShowModal(false);
    createGrid();
  };

  const revealAll = () => {
    setGrid((prev) => prev.map((cell) => ({ ...cell, revealed: true })));
  };

  const handleCellClick = (cell) => {
    if (roundState !== ROUND_STATES.RUNNING) return;
    if (cell.revealed) return;

    if (cell.isMine) {
      // hit a bomb
      revealAll();
      const result = {
        outcome: "BUST",
        multiplier: 0,
        amount: -bet,
        title: "Boom!",
        message: "You hit a mine and lost your bet.",
      };
      setRoundState(ROUND_STATES.BUST);
      setLastResult(result);
      setShowModal(true);
      return;
    }

    // safe cell
    setGrid((prev) =>
      prev.map((c) =>
        c.id === cell.id ? { ...c, revealed: true } : c
      )
    );

    setRevealedCount((prevCount) => {
      const nextCount = prevCount + 1;
      const m = computeMultiplier(nextCount, mineCount);
      setMultiplier(m);
      return nextCount;
    });
  };

  const handleCashOut = () => {
    if (roundState !== ROUND_STATES.RUNNING) return;
    if (revealedCount <= 0) return;

    const payout = +(bet * multiplier).toFixed(2);
    setBalance((prev) => prev + payout);

    revealAll();

    const result = {
      outcome: "WIN",
      multiplier,
      amount: payout - bet,
      title: "Cashed Out",
      message: "You escaped the mines with a profit.",
    };

    setRoundState(ROUND_STATES.CASHED_OUT);
    setLastResult(result);
    setShowModal(true);
  };

  const handleNewRound = () => {
    resetRoundState();
    setShowModal(false);
    setGrid([]);
  };

  // keep mine count within reasonable bounds
  useEffect(() => {
    setMineCount((prev) => {
      let next = prev;
      if (next < 1) next = 1;
      if (next >= GRID_SIZE * GRID_SIZE) next = GRID_SIZE * GRID_SIZE - 1;
      return next;
    });
  }, []);

  const handleBetChange = (delta) => {
    setBet((prev) => {
      let next = prev + delta;
      if (next < 1) next = 1;
      if (next > balance) next = balance;
      return next;
    });
  };

  return (
    <div className="game-shell page">
      <div className="game-card mines-card">
        {/* top header with back button */}
        <header className="game-header mines-header">
          <button
            type="button"
            className="mines-back-btn"
            onClick={() => navigate("/")}
          >
            ⬅ Back
          </button>
          <div className="mines-title-block">
            <h1>Mines</h1>
            <p>
              Pick safe tiles, dodge hidden mines, and cash out whenever you like.
            </p>
          </div>
        </header>

        <div className="mines-layout">
          {/* LEFT: grid */}
          <section className="mines-grid-panel">
            <div className="mines-info-row">
              <div className="info-line">
                <span className="label">Grid</span>
                <span className="value">{GRID_SIZE}×{GRID_SIZE}</span>
              </div>
              <div className="info-line">
                <span className="label">Mines</span>
                <span className="value">{mineCount}</span>
              </div>
              <div className="info-line">
                <span className="label">Picks</span>
                <span className="value">{revealedCount}</span>
              </div>
              <div className="info-line">
                <span className="label">Multiplier</span>
                <span className="value mines-mult">
                  {multiplier.toFixed(2)}x
                </span>
              </div>
            </div>

            <div
              className={
                "mines-grid-wrapper " +
                (roundState === ROUND_STATES.RUNNING ? "mines-grid--live" : "")
              }
            >
              <div className="mines-grid">
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                  const cell = grid.find((c) => c.id === index);
                  const isRevealed = cell?.revealed;
                  const isMine = cell?.isMine;
                  const isSafe = isRevealed && !isMine;

                  let cellClass = "mines-cell";
                  if (isRevealed && isMine) cellClass += " mines-cell--mine";
                  if (isSafe) cellClass += " mines-cell--safe";

                  return (
                    <button
                      key={index}
                      type="button"
                      className={cellClass}
                      onClick={() => cell && handleCellClick(cell)}
                      disabled={
                        !cell ||
                        cell.revealed ||
                        roundState !== ROUND_STATES.RUNNING
                      }
                    >
                      {isRevealed && isMine && <span className="cell-icon">💣</span>}
                      {isSafe && <span className="cell-icon">💎</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {roundState === ROUND_STATES.BUST && (
              <div className="mines-banner mines-banner--bust">
                <span>Mine hit!</span>
                <span>You lost your stake.</span>
              </div>
            )}

            {roundState === ROUND_STATES.CASHED_OUT && lastResult && (
              <div className="mines-banner mines-banner--win">
                <span>Cashed Out</span>
                <span>
                  {lastResult.multiplier.toFixed(2)}x ·{" "}
                  {lastResult.amount >= 0 ? "+" : ""}
                  {lastResult.amount.toLocaleString("en-GB", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
          </section>

          {/* RIGHT: controls */}
          <section className="mines-sidebar">
            <div className="mines-balance-card">
              <div className="balance-row">
                <span className="label">Balance</span>
                <span className="value">
                  {balance.toLocaleString("en-GB", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="balance-row">
                <span className="label">Bet</span>
                <span className="value">
                  {bet.toLocaleString("en-GB", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="mines-panel">
              {/* bet controls */}
              <div className="panel-group">
                <div className="panel-header">
                  <span>Bet amount</span>
                  <span className="panel-actions">
                    <button
                      type="button"
                      onClick={() => handleBetChange(-5)}
                      disabled={roundState !== ROUND_STATES.IDLE}
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBetChange(5)}
                      disabled={roundState !== ROUND_STATES.IDLE}
                    >
                      +5
                    </button>
                  </span>
                </div>
                <div className="panel-input-row">
                  <input
                    type="number"
                    min="1"
                    max={balance}
                    value={bet}
                    disabled={roundState !== ROUND_STATES.IDLE}
                    onChange={(e) =>
                      setBet(
                        Math.max(
                          1,
                          Math.min(Number(e.target.value) || 1, balance)
                        )
                      )
                    }
                  />
                  <button
                    type="button"
                    className="panel-btn"
                    disabled={roundState !== ROUND_STATES.IDLE}
                    onClick={() => setBet(balance || 1)}
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* mine count */}
              <div className="panel-group">
                <div className="panel-header">
                  <span>Mines count</span>
                </div>
                <div className="panel-input-row panel-input-row--small">
                  <input
                    type="number"
                    min="1"
                    max={GRID_SIZE * GRID_SIZE - 1}
                    value={mineCount}
                    disabled={roundState !== ROUND_STATES.IDLE}
                    onChange={(e) =>
                      setMineCount(
                        Math.max(
                          1,
                          Math.min(
                            Number(e.target.value) || 1,
                            GRID_SIZE * GRID_SIZE - 1
                          )
                        )
                      )
                    }
                  />
                  <span className="panel-suffix">
                    More mines = higher risk & multipliers
                  </span>
                </div>
              </div>

              {/* actions */}
              <div className="mines-actions">
                {roundState === ROUND_STATES.IDLE && (
                  <button
                    type="button"
                    className="btn btn-primary mines-main-btn"
                    onClick={startRound}
                    disabled={!canStartRound()}
                  >
                    Start Round
                  </button>
                )}

                {roundState === ROUND_STATES.RUNNING && (
                  <button
                    type="button"
                    className="btn btn-danger mines-main-btn"
                    onClick={handleCashOut}
                    disabled={revealedCount === 0}
                  >
                    Cash Out @ {multiplier.toFixed(2)}x
                  </button>
                )}

                {(roundState === ROUND_STATES.BUST ||
                  roundState === ROUND_STATES.CASHED_OUT) && (
                  <button
                    type="button"
                    className="btn btn-outline mines-main-btn"
                    onClick={handleNewRound}
                  >
                    New Round
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* WIN / LOSE POPUP */}
      {showModal && lastResult && (
        <div className="mines-modal-backdrop">
          <div className="mines-modal">
            <div className="mines-modal-header">
              <h2>{lastResult.title}</h2>
            </div>
            <div className="mines-modal-body">
              <p>{lastResult.message}</p>
              {lastResult.multiplier > 0 && (
                <p className="mines-modal-highlight">
                  {lastResult.multiplier.toFixed(2)}x ·{" "}
                  {lastResult.amount >= 0 ? "+" : ""}
                  {lastResult.amount.toLocaleString("en-GB", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>
            <div className="mines-modal-actions">
              <button
                type="button"
                className="btn btn-primary mines-main-btn"
                onClick={handleNewRound}
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mines;
