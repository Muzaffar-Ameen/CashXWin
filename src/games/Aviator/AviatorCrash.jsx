import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AviatorCrash.css";

const ROUND_STATES = {
  WAITING: "WAITING", // waiting to place bet
  COUNTDOWN: "COUNTDOWN", // 3..2..1
  FLYING: "FLYING", // multiplier increasing
  CRASHED: "CRASHED", // plane crashed
};

const AviatorCrash = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(10);
  const [activeBet, setActiveBet] = useState(0); // locked when round starts
  const [roundState, setRoundState] = useState(ROUND_STATES.WAITING);
  const [countdown, setCountdown] = useState(5); // seconds before takeoff
  const [multiplier, setMultiplier] = useState(1.0); // current live multiplier
  const [crashPoint, setCrashPoint] = useState(null); // hidden until reveal
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [cashoutMultiplier, setCashoutMultiplier] = useState(null);
  const [roundHistory, setRoundHistory] = useState([]); // [{multiplier, crashed}]
  const [autoCashout, setAutoCashout] = useState(2.0); // user setting
  // const [seedInfo] = useState({
  //   serverSeed: "demo-server-seed-123",
  //   clientSeed: "demo-client-seed-456",
  //   nonce: 1,
  // });

  const intervalRef = useRef(null);
  const planeRef = useRef(null);
  const trailRef = useRef(null);

  // Generate a random crash point – simplified demo:
  // most rounds crash between 1x–5x, some high spikes. [web:165][web:170]
  // const generateCrashPoint = () => {
  //   const r = Math.random();
  //   if (r < 0.05) return +(10 + Math.random() * 40).toFixed(2); // 10x–50x rare
  //   if (r < 0.3) return +(3 + Math.random() * 7).toFixed(2); // 3x–10x
  //   if (r < 0.8) return +(1.2 + Math.random() * 2.3).toFixed(2); // 1.2x–3.5x
  //   return +(1.0 + Math.random() * 1.0).toFixed(2); // 1x–2x
  // };
  const generateCrashPoint = () => 40.0; // always crash at 5x
  // Reset state for next round (but keep history and balance)
  const resetRound = () => {
    setRoundState(ROUND_STATES.WAITING);
    setCountdown(5);
    setMultiplier(1.0);
    setCrashPoint(null);
    setHasCashedOut(false);
    setCashoutMultiplier(null);
    setActiveBet(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Place bet before countdown
  const handlePlaceBet = () => {
    if (roundState !== ROUND_STATES.WAITING) return;
    if (betAmount <= 0 || betAmount > balance) return;

    setBalance((prev) => prev - betAmount);
    setActiveBet(betAmount);
    setRoundState(ROUND_STATES.COUNTDOWN);
    setCountdown(5);

    const newCrash = generateCrashPoint();
    setCrashPoint(newCrash);
  };

  // Cash out logic
  const handleCashout = () => {
    if (roundState !== ROUND_STATES.FLYING) return;
    if (hasCashedOut || activeBet <= 0) return;

    setHasCashedOut(true);
    setCashoutMultiplier(multiplier);
    const profit = +(activeBet * multiplier).toFixed(2);
    setBalance((prev) => prev + profit);
  };

  // Countdown effect
  useEffect(() => {
    if (roundState !== ROUND_STATES.COUNTDOWN) return;
    if (countdown <= 0) {
      // start flying
      setRoundState(ROUND_STATES.FLYING);
      return;
    }

    const id = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(id);
  }, [roundState, countdown]);

  // Flying loop – multiplier grows until crashPoint, with smooth segment wobble
  useEffect(() => {
    if (roundState !== ROUND_STATES.FLYING) return;

    const start = performance.now();
    const baseMultiplier = multiplier; // 1.0 at start

    // wobble segment state (direction persists for some time)
    let segmentStartMs = start;
    let segmentDir = 0; // -1 down, 0 straight, 1 up
    let segmentDurationMs = 800 + Math.random() * 1200; // 0.8–2.0s

    const pickNewSegment = (nowMs) => {
      const r = Math.random();
      if (r < 0.33) segmentDir = -1;
      else if (r < 0.66) segmentDir = 0;
      else segmentDir = 1;
      segmentStartMs = nowMs;
      segmentDurationMs = 800 + Math.random() * 1200;
    };

    intervalRef.current = setInterval(() => {
      const now = performance.now();
      const elapsedMs = now - start;
      const elapsedSec = elapsedMs / 1000;

      // base growth
      const growth = elapsedSec * elapsedSec * 0.6;
      let newMult = baseMultiplier + growth;

      // segment wobble logic
      const segElapsed = now - segmentStartMs;
      if (segElapsed > segmentDurationMs) {
        pickNewSegment(now);
      }

      // wobble strength grows a bit with time but stays small
      const wobbleStrength = 0.02 + elapsedSec * 0.01; // ~0.02–0.1
      const wobble = segmentDir * wobbleStrength;
      newMult += wobble;

      newMult = +newMult.toFixed(2);

      setMultiplier((prev) => {
        const m = Math.max(prev, newMult);

        if (!hasCashedOut && activeBet > 0 && autoCashout && m >= autoCashout) {
          handleCashout();
        }

        return m;
      });
    }, 60);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundState, activeBet, hasCashedOut, autoCashout]);

  // Crash watcher – when multiplier >= crashPoint, end round
  useEffect(() => {
    if (roundState !== ROUND_STATES.FLYING || crashPoint == null) return;

    if (multiplier >= crashPoint) {
      // crash
      setRoundState(ROUND_STATES.CRASHED);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // add to history
      setRoundHistory((prev) => {
        const entry = {
          multiplier: crashPoint,
          crashed: true,
          big: crashPoint >= 10,
        };
        const next = [entry, ...prev];
        return next.slice(0, 15);
      });

      // small delay before reset
      setTimeout(() => {
        resetRound();
      }, 3000);
    }
  }, [multiplier, crashPoint, roundState]);

  // Plane animation: plane + trail, with wobble and trail always behind

  useEffect(() => {
    const plane = planeRef.current;
    const trail = trailRef.current;
    if (!plane || !trail) return;

    if (roundState === ROUND_STATES.FLYING) {
      const t = Math.min(multiplier / 10, 2);

      // plane movement
      const x = t * 100;
      const y = -t * 90;

      const angle = 10;

      // ✅ plane transform
      plane.style.transform = `translate(${x}%, ${y}%) rotate(${angle}deg)`;

      /**
       * 🔥 REAL FIX
       * ===========
       * Trail must use SAME translate + rotate
       * and extend backwards using scaleX
       */

      const trailScale = Math.max(0, t);

      trail.style.transform = `translate(${x}%, ${y}%) rotate(${angle}deg)`;

      trail.style.opacity = "1";
    } else if (roundState === ROUND_STATES.CRASHED) {
      plane.style.transform += " translateY(40%)";
      trail.style.opacity = "0.2";
    } else {
      plane.style.transform = "translate(0%,0%) rotate(-20deg)";
      trail.style.transform = "translate(0%,0%) rotate(-20deg) scaleX(0)";
      trail.style.opacity = "0";
    }
  }, [roundState, multiplier]);

  const handleBetChange = (delta) => {
    setBetAmount((prev) => {
      const next = Math.max(1, prev + delta);
      return next > balance ? balance : next;
    });
  };

  const formatMultiplier = (m) => `${m.toFixed(2)}x`;

  const isBetLocked = roundState !== ROUND_STATES.WAITING;

  const lastRound = roundHistory[0];

  return (
    <div className="game-shell page">
      <div className="game-card aviator-card">
        <header className="game-header aviator-header">
          <button
            type="button"
            className="aviator-back-btn"
            onClick={() => navigate("/")}
          >
            ⬅ Back
          </button>
          <h1>Aviator Crash</h1>
          <p>
            Place a bet, watch the plane climb, and cash out before it flies
            away.
          </p>
        </header>

        <div className="aviator-layout">
          {/* LEFT: main canvas */}
          <section className="aviator-canvas">
            <div className="aviator-sky">
              <div className="aviator-grid" />

              {/* multiplier display */}
              <div className="aviator-multiplier">
                {roundState === ROUND_STATES.COUNTDOWN && (
                  <span className="aviator-countdown">
                    Round starting in {countdown}s
                  </span>
                )}
                {roundState === ROUND_STATES.WAITING && (
                  <span className="aviator-label">Waiting for bet</span>
                )}
                {roundState === ROUND_STATES.FLYING && (
                  <span className="aviator-live-mult">
                    {formatMultiplier(multiplier)}
                  </span>
                )}
                {roundState === ROUND_STATES.CRASHED && (
                  <span className="aviator-crashed-label">
                    Crashed at {formatMultiplier(crashPoint || multiplier)}
                  </span>
                )}
              </div>

              {/* plane track */}
              <div className="aviator-track">
                <div className="aviator-flight-glow" />
                <div className="aviator-trail" ref={trailRef} />
                <div className="aviator-plane-wrapper">
                  <div className="aviator-plane" ref={planeRef}>
                    <div className="plane-body">
                      <div className="plane-body-main">
                        <img
                          src="/assets/Plane.png"
                          alt="Plane"
                          className="plane-icon"
                        />
                      </div>

                      <div className="plane-wing plane-wing--top" />
                      <div className="plane-wing plane-wing--bottom" />
                      <div className="plane-tail" />
                    </div>
                    <div className="plane-fire" />
                  </div>
                </div>
              </div>

              {/* crash banner */}
              {roundState === ROUND_STATES.CRASHED && (
                <div className="aviator-crash-banner">
                  <span>CRASHED</span>
                  <span>{formatMultiplier(crashPoint || multiplier)}</span>
                </div>
              )}
            </div>

            {/* provably fair demo info */}
            {/* <div className="aviator-fair-box">
              <div className="fair-header">
                <span>Provably Fair (Demo)</span>
              </div>
              <div className="fair-content">
                <div>
                  <span className="fair-label">Server seed</span>
                  <span className="fair-value">{seedInfo.serverSeed}</span>
                </div>
                <div>
                  <span className="fair-label">Client seed</span>
                  <span className="fair-value">{seedInfo.clientSeed}</span>
                </div>
                <div>
                  <span className="fair-label">Nonce</span>
                  <span className="fair-value">{seedInfo.nonce}</span>
                </div>
              </div>
            </div> */}
          </section>

          {/* RIGHT: controls + history */}
          <section className="aviator-sidebar">
            <div className="aviator-balance-card">
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
                <span className="label">Current bet</span>
                <span className="value">
                  {activeBet.toLocaleString("en-GB", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {hasCashedOut && cashoutMultiplier && (
                <div className="balance-row balance-row--win">
                  <span className="label">Cashed out</span>
                  <span className="value">
                    {formatMultiplier(cashoutMultiplier)}
                  </span>
                </div>
              )}
            </div>

            {/* bet controls */}
            <div className="aviator-bet-panel">
              <div className="bet-header">
                <span>Bet</span>
                <span className="bet-edit">
                  <button
                    type="button"
                    onClick={() => handleBetChange(-5)}
                    disabled={isBetLocked}
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBetChange(5)}
                    disabled={isBetLocked}
                  >
                    +5
                  </button>
                </span>
              </div>

              <div className="bet-input-row">
                <input
                  type="number"
                  min="1"
                  max={balance}
                  value={betAmount}
                  disabled={isBetLocked}
                  onChange={(e) =>
                    setBetAmount(
                      Math.max(
                        1,
                        Math.min(Number(e.target.value) || 1, balance),
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  className="bet-max-btn"
                  disabled={isBetLocked}
                  onClick={() => setBetAmount(balance || 1)}
                >
                  MAX
                </button>
              </div>

              {/* auto cash out */}
              <div className="bet-header bet-header--secondary">
                <span>Auto cash out</span>
                <span className="bet-edit">
                  <button
                    type="button"
                    onClick={() =>
                      setAutoCashout((prev) => Math.max(1.1, prev - 0.5))
                    }
                    disabled={roundState === ROUND_STATES.FLYING}
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAutoCashout((prev) => Math.min(20, prev + 0.5))
                    }
                    disabled={roundState === ROUND_STATES.FLYING}
                  >
                    +0.5
                  </button>
                </span>
              </div>

              <div className="bet-input-row">
                <input
                  type="number"
                  step="0.1"
                  min="1.1"
                  max="100"
                  value={autoCashout}
                  disabled={roundState === ROUND_STATES.FLYING}
                  onChange={(e) =>
                    setAutoCashout(
                      Math.max(
                        1.1,
                        Math.min(Number(e.target.value) || 1.1, 100),
                      ),
                    )
                  }
                />
                <span className="bet-mult-label">x</span>
              </div>

              {/* main actions */}
              <div className="aviator-actions">
                {roundState === ROUND_STATES.WAITING && (
                  <button
                    type="button"
                    className="btn btn-primary aviator-main-btn"
                    onClick={handlePlaceBet}
                    disabled={betAmount <= 0 || betAmount > balance}
                  >
                    Place Bet
                  </button>
                )}

                {roundState === ROUND_STATES.COUNTDOWN && (
                  <button
                    type="button"
                    className="btn btn-outline aviator-main-btn"
                    disabled
                  >
                    Starting in {countdown}s
                  </button>
                )}

                {roundState === ROUND_STATES.FLYING && (
                  <button
                    type="button"
                    className={`btn aviator-main-btn ${
                      hasCashedOut ? "btn-disabled" : "btn-danger"
                    }`}
                    onClick={handleCashout}
                    disabled={hasCashedOut || activeBet <= 0}
                  >
                    {hasCashedOut
                      ? "Cashed Out"
                      : `Cash Out @ ${formatMultiplier(multiplier)}`}
                  </button>
                )}

                {roundState === ROUND_STATES.CRASHED && (
                  <button
                    type="button"
                    className="btn btn-outline aviator-main-btn"
                    disabled
                  >
                    Crashed @ {formatMultiplier(crashPoint || multiplier)}
                  </button>
                )}
              </div>
            </div>

            {/* round history */}
            <div className="aviator-history">
              <div className="history-header">
                <span>Round history</span>
              </div>
              <div className="history-pills">
                {roundHistory.map((r, idx) => (
                  <span
                    key={idx}
                    className={`history-pill ${
                      r.multiplier < 2
                        ? "history-pill--red"
                        : r.multiplier < 10
                          ? "history-pill--green"
                          : "history-pill--gold"
                    }`}
                  >
                    {r.multiplier.toFixed(2)}x
                  </span>
                ))}
              </div>
            </div>

            {/* last round summary */}
            {lastRound && (
              <div className="aviator-last-round">
                <span className="label">Last round</span>
                <span
                  className={`value ${
                    lastRound.multiplier < 2
                      ? "text-red"
                      : lastRound.multiplier < 10
                        ? "text-green"
                        : "text-gold"
                  }`}
                >
                  {lastRound.multiplier.toFixed(2)}x
                </span>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AviatorCrash;
