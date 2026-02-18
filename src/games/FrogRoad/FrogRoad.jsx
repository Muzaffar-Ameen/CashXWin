import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./FrogRoad.css";

const LANE_COUNT = 5;
const TICK_MS = 50;

const ROUND_STATES = {
  IDLE: "IDLE",
  RUNNING: "RUNNING",
  BUST: "BUST",
  CASHED_OUT: "CASHED_OUT",
};

const FrogRoad = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);

  const [roundState, setRoundState] = useState(ROUND_STATES.IDLE);
  const [currentLane, setCurrentLane] = useState(0); // 0 = water edge, 1..LANE_COUNT = lanes
  const [multiplier, setMultiplier] = useState(1.0);
  const [lastResult, setLastResult] = useState(null);

  const [riskLevel, setRiskLevel] = useState("medium");
  const [autoCashLane, setAutoCashLane] = useState(0);

  const [lanes, setLanes] = useState([]);
  const [isJumping, setIsJumping] = useState(false);
  const [isHit, setIsHit] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const tickRef = useRef(null);

  // ordered, spaced logs/vehicles per lane (reuse car logic, but visually logs/rafts if you want)
  const createInitialLanes = () => {
    const base = [];

    for (let lane = 1; lane <= LANE_COUNT; lane += 1) {
      const types = ["car", "van", "bus"];
      const cars = [];

      const carCount = riskLevel === "high" ? 3 : riskLevel === "low" ? 2 : 3;

      const minSpacing = 0.25;
      const usedTypes = new Set();

      for (let i = 0; i < carCount; i += 1) {
        const availableTypes = types.filter((t) => !usedTypes.has(t));
        const randomType =
          availableTypes[Math.floor(Math.random() * availableTypes.length)];
        usedTypes.add(randomType);

        const width =
          randomType === "bus" ? 0.18 : randomType === "van" ? 0.14 : 0.12;

        const baseSpeed =
          riskLevel === "high" ? 0.016 : riskLevel === "low" ? 0.009 : 0.013;
        const variance = Math.random() * 0.004 - 0.002;
        const speed = baseSpeed + variance;

        const baseX = i * (minSpacing + width);

        cars.push({
          x: baseX,
          speed,
          width,
          type: randomType,
        });
      }

      base.push({
        id: lane,
        cars: cars.sort((a, b) => a.x - b.x),
      });
    }

    setLanes(base);
  };

  const computeMultiplier = (laneIndex) => {
    if (laneIndex <= 0) return 1.0;
    const r = riskLevel === "high" ? 0.45 : riskLevel === "low" ? 0.25 : 0.35;
    const base = 1 + laneIndex * r;
    return +(base + laneIndex * laneIndex * 0.06 * (r / 0.35)).toFixed(2);
  };

  const canStartRound = () =>
    roundState === ROUND_STATES.IDLE && bet > 0 && bet <= balance;

  const startRound = () => {
    if (!canStartRound()) return;
    setBalance((prev) => prev - bet);
    setRoundState(ROUND_STATES.RUNNING);
    setCurrentLane(0);
    setMultiplier(1.0);
    setLastResult(null);
    setIsHit(false);
    setShowModal(false);
    createInitialLanes();
  };

  const endRoundBust = () => {
    setRoundState(ROUND_STATES.BUST);
    setIsHit(true);
    const result = {
      outcome: "BUST",
      multiplier: 0,
      amount: -bet,
      message: "Oh no! The frog got hit on the road.",
    };
    setLastResult(result);
    setShowModal(true);
  };

  const cashOut = () => {
    if (roundState !== ROUND_STATES.RUNNING) return;
    if (currentLane <= 0) return;

    const m = multiplier;
    const payout = +(bet * m).toFixed(2);
    setBalance((prev) => prev + payout);
    const result = {
      outcome: "WIN",
      multiplier: m,
      amount: payout - bet,
      message: "Nice jump! You cashed out safely.",
    };
    setRoundState(ROUND_STATES.CASHED_OUT);
    setLastResult(result);
    setShowModal(true);
  };

  const newRound = () => {
    setRoundState(ROUND_STATES.IDLE);
    setCurrentLane(0);
    setMultiplier(1.0);
    setLastResult(null);
    setIsHit(false);
    setShowModal(false);
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const moveFrogForward = () => {
    if (roundState !== ROUND_STATES.RUNNING) return;
    if (isJumping) return;

    const nextLane = currentLane + 1;

    if (nextLane > LANE_COUNT) {
      const m = computeMultiplier(LANE_COUNT);
      setMultiplier(m);
      const payout = +(bet * m).toFixed(2);
      setBalance((prev) => prev + payout);
      const result = {
        outcome: "FINISH",
        multiplier: m,
        amount: payout - bet,
        message: "Perfect! The frog reached the lily pad.",
      };
      setRoundState(ROUND_STATES.CASHED_OUT);
      setLastResult(result);
      setShowModal(true);
      return;
    }

    setIsJumping(true);
    setTimeout(() => {
      setCurrentLane(nextLane);
      const m = computeMultiplier(nextLane);
      setMultiplier(m);
      setIsJumping(false);

      if (autoCashLane > 0 && nextLane >= autoCashLane) {
        cashOut();
      }
    }, 220);
  };

  // main loop: move vehicles with spacing
  useEffect(() => {
    if (roundState !== ROUND_STATES.RUNNING) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }

    if (tickRef.current) return;

    tickRef.current = setInterval(() => {
      setLanes((prev) =>
        prev.map((lane) => {
          if (!lane.cars.length) return lane;
          const sorted = [...lane.cars].sort((a, b) => a.x - b.x);
          const minGap = 0.06;

          const updated = sorted.map((car, idx, arr) => {
            let nextX = car.x + car.speed;

            if (nextX > 1.15) {
              const lastCar = arr[arr.length - 1];
              const resetBase = lastCar.x - lastCar.width - 0.25;
              nextX = resetBase < -0.4 ? resetBase : -0.4;
            }

            const front = arr[idx + 1];
            if (front) {
              const frontTail = front.x;
              const backHead = nextX + car.width;
              if (backHead > frontTail - minGap) {
                nextX = frontTail - minGap - car.width;
              }
            }

            return {
              ...car,
              x: nextX,
            };
          });

          return { ...lane, cars: updated };
        }),
      );
    }, TICK_MS);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [roundState]);

  // collision detection
  useEffect(() => {
    if (roundState !== ROUND_STATES.RUNNING) return;
    if (currentLane <= 0 || currentLane > LANE_COUNT) return;

    const lane = lanes.find((l) => l.id === currentLane);
    if (!lane) return;

    const frogX = 0.5;

    const hit = lane.cars.some((car) => {
      const left = car.x;
      const right = car.x + car.width;
      return frogX > left && frogX < right;
    });

    if (hit) {
      endRoundBust();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanes, currentLane, roundState]);

  useEffect(() => {
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
      }
    };
  }, []);

  const handleBetChange = (delta) => {
    setBet((prev) => {
      let next = prev + delta;
      if (next < 1) next = 1;
      if (next > balance) next = balance;
      return next;
    });
  };

  const isRunning = roundState === ROUND_STATES.RUNNING;

  return (
    <div className="game-shell page">
      <div className="game-card frog-road-card">
        <header className="game-header frog-road-header">
          <button
            type="button"
            className="frogroad-back-btn"
            onClick={() => navigate("/")}
          >
            ⬅ Back
          </button>

          <h1>Frog Road</h1>
          <p>
            Help the frog hop across busy traffic and reach the lily pad. Each
            lane crossed increases your multiplier—cash out before the frog is
            hit.
          </p>
        </header>

        <div className="fr-layout">
          {/* LEFT: road + frog */}
          <section className="fr-road-panel">
            <div className="fr-road-info">
              <div className="info-line">
                <span className="label">Risk</span>
                <span className="value fr-risk-tag">{riskLevel}</span>
              </div>
              <div className="info-line">
                <span className="label">Lane</span>
                <span className="value">
                  {currentLane}/{LANE_COUNT}
                </span>
              </div>
              <div className="info-line">
                <span className="label">Multiplier</span>
                <span
                  className={
                    "value fr-mult " + (multiplier > 1 ? "fr-mult--active" : "")
                  }
                >
                  {multiplier.toFixed(2)}x
                </span>
              </div>
            </div>

            <div
              className={
                "fr-road " +
                (isRunning ? "fr-road--live" : "") +
                (isHit ? " fr-road--hit" : "")
              }
            >
              {/* top safe side (finish) */}
              <div className="fr-safe-zone fr-safe-zone--top">
                <span>Frog Pond</span>
              </div>

              {/* lanes */}
              {Array.from({ length: LANE_COUNT }).map((_, idx) => {
                const laneIndex = LANE_COUNT - idx;
                const laneData = lanes.find((l) => l.id === laneIndex);

                return (
                  <div key={laneIndex} className="fr-lane">
                    <div className="fr-lane-road">
                      <div className="fr-lane-prize">
                        +{computeMultiplier(laneIndex).toFixed(2)}x
                      </div>

                      <div className="fr-lane-cars">
                        {laneData?.cars.map((car, carIdx) => (
                          <div
                            key={carIdx}
                            className={"fr-car fr-car--" + car.type}
                            style={{
                              left: `${car.x * 100}%`,
                              width: `${car.width * 100}%`,
                            }}
                          />
                        ))}
                      </div>

                      {currentLane === laneIndex && (
                        <div
                          className={
                            "fr-frog " + (isJumping ? "fr-frog--jump" : "")
                          }
                        >
                          <div className="fr-frog-body">
                            <span className="fr-frog-emoji">🐸</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* bottom safe side (start) */}
              <div className="fr-safe-zone fr-safe-zone--bottom">
                <span>River Bank</span>
              </div>

              {currentLane === 0 && (
                <div
                  className={
                    "fr-frog fr-frog--start " +
                    (isRunning ? "fr-frog--idle" : "")
                  }
                >
                  <div className="fr-frog-body">
                    <span className="fr-frog-emoji">🐸</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: controls */}
          <section className="fr-sidebar">
            <div className="fr-balance-card">
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

            <div className="fr-panel">
              {/* bet */}
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
                          Math.min(Number(e.target.value) || 1, balance),
                        ),
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

              {/* risk */}
              <div className="panel-group">
                <div className="panel-header">
                  <span>Traffic risk</span>
                </div>
                <div className="fr-risk-buttons">
                  {["low", "medium", "high"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={
                        "fr-risk-btn " +
                        (riskLevel === level ? "fr-risk-btn--active" : "")
                      }
                      disabled={roundState !== ROUND_STATES.IDLE}
                      onClick={() => setRiskLevel(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="panel-text">
                  Higher risk = faster traffic and higher lane multipliers.
                </div>
              </div>

              {/* auto cash lane */}
              <div className="panel-group">
                <div className="panel-header">
                  <span>Auto cash at lane</span>
                </div>
                <div className="panel-input-row panel-input-row--small">
                  <input
                    type="number"
                    min="0"
                    max={LANE_COUNT}
                    value={autoCashLane}
                    disabled={roundState === ROUND_STATES.RUNNING}
                    onChange={(e) =>
                      setAutoCashLane(
                        Math.max(
                          0,
                          Math.min(Number(e.target.value) || 0, LANE_COUNT),
                        ),
                      )
                    }
                  />
                  <span className="panel-suffix">
                    {autoCashLane === 0 ? "Off" : `Lane ${autoCashLane}`}
                  </span>
                </div>
              </div>

              {/* actions */}
              <div className="fr-actions">
                {roundState === ROUND_STATES.IDLE && (
                  <button
                    type="button"
                    className="btn btn-primary fr-main-btn"
                    onClick={startRound}
                    disabled={!canStartRound()}
                  >
                    Start Round
                  </button>
                )}

                {roundState === ROUND_STATES.RUNNING && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary fr-main-btn"
                      onClick={moveFrogForward}
                    >
                      Hop Forward
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger fr-main-btn"
                      onClick={cashOut}
                      disabled={currentLane === 0}
                    >
                      Cash Out @ {multiplier.toFixed(2)}x
                    </button>
                  </>
                )}

                {(roundState === ROUND_STATES.BUST ||
                  roundState === ROUND_STATES.CASHED_OUT) && (
                  <button
                    type="button"
                    className="btn btn-outline fr-main-btn"
                    onClick={newRound}
                  >
                    New Round
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Result modal */}
      {showModal && lastResult && (
        <div className="fr-modal-backdrop">
          <div className="fr-modal">
            <div className="fr-modal-header">
              <h2>
                {lastResult.outcome === "BUST" ? "Frog Lost" : "Frog Wins"}
              </h2>
            </div>
            <div className="fr-modal-body">
              <p>{lastResult.message}</p>
              {lastResult.multiplier > 0 && (
                <p className="fr-modal-highlight">
                  {lastResult.multiplier.toFixed(2)}x ·{" "}
                  {lastResult.amount >= 0 ? "+" : ""}
                  {lastResult.amount.toLocaleString("en-GB", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>
            <div className="fr-modal-actions">
              <button
                type="button"
                className="btn btn-primary fr-main-btn"
                onClick={() => {
                  setShowModal(false);
                  newRound();
                }}
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

export default FrogRoad;
