import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ChickenRoad.css";

const LANE_COUNT = 5; // number of road lanes the chicken must cross
const TICK_MS = 50; // game loop tick

const ROUND_STATES = {
  IDLE: "IDLE",
  RUNNING: "RUNNING",
  BUST: "BUST",
  CASHED_OUT: "CASHED_OUT",
};

const ChickenRoad = () => {
  const navigate = useNavigate();

  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);

  const [roundState, setRoundState] = useState(ROUND_STATES.IDLE);
  const [currentLane, setCurrentLane] = useState(0); // 0 = roadside, 1..LANE_COUNT = lanes; LANE_COUNT+1 = finish
  const [multiplier, setMultiplier] = useState(1.0);
  const [lastResult, setLastResult] = useState(null);

  const [riskLevel, setRiskLevel] = useState("medium"); // affects car speed/density
  const [autoCashLane, setAutoCashLane] = useState(0); // 0 = off, else lane index to auto-cash

  const [lanes, setLanes] = useState([]);
  const [isCrossing, setIsCrossing] = useState(false); // chicken crossing animation
  const [isHit, setIsHit] = useState(false);

  // modal popup for win / lose
  const [showModal, setShowModal] = useState(false);

  const tickRef = useRef(null);

  const createInitialLanes = () => {
    // Each lane is an array of cars, each car: { x, speed, width, type }
    const base = [];

    for (let lane = 1; lane <= LANE_COUNT; lane += 1) {
      const cars = [];
      const carCount = riskLevel === "high" ? 4 : riskLevel === "low" ? 2 : 3;

      for (let i = 0; i < carCount; i += 1) {
        const randomType =
          Math.random() < 0.2 ? "bus" : Math.random() < 0.5 ? "car" : "van";
        const width =
          randomType === "bus" ? 0.22 : randomType === "van" ? 0.16 : 0.12;
        const baseSpeed =
          riskLevel === "high" ? 0.018 : riskLevel === "low" ? 0.009 : 0.013;
        const variance = Math.random() * 0.006 - 0.003;
        const speed = baseSpeed + variance;

        cars.push({
          x: Math.random(), // 0..1, position along lane
          speed,
          width,
          type: randomType,
        });
      }

      base.push({
        id: lane,
        cars,
      });
    }

    setLanes(base);
  };

  const computeMultiplier = (laneIndex) => {
    if (laneIndex <= 0) return 1.0;
    const r =
      riskLevel === "high"
        ? 0.4
        : riskLevel === "low"
        ? 0.2
        : 0.3;
    const base = 1 + laneIndex * r;
    return +(base + laneIndex * laneIndex * 0.05 * (r / 0.3)).toFixed(2);
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
      title: "You Lost",
      message: "The chicken got hit on the road.",
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
      title: "Cashed Out",
      message: "Nice timing! You cashed out safely.",
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
    createInitialLanes();
  };

  const moveChickenForward = () => {
    if (roundState !== ROUND_STATES.RUNNING) return;
    if (isCrossing) return;

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
        title: "You Won",
        message: "Perfect run! The chicken crossed the road.",
      };
      setRoundState(ROUND_STATES.CASHED_OUT);
      setLastResult(result);
      setShowModal(true);
      return;
    }

    setIsCrossing(true);
    setTimeout(() => {
      setCurrentLane(nextLane);
      const m = computeMultiplier(nextLane);
      setMultiplier(m);
      setIsCrossing(false);

      if (autoCashLane > 0 && nextLane >= autoCashLane) {
        cashOut();
      }
    }, 220);
  };

  // main game loop: move cars
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
          const updatedCars = lane.cars.map((car) => {
            let nextX = car.x + car.speed;
            if (nextX > 1.15) nextX = -0.2 - Math.random() * 0.2;
            return {
              ...car,
              x: nextX,
            };
          });
          return { ...lane, cars: updatedCars };
        })
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

    const chickenX = 0.5;

    const hit = lane.cars.some((car) => {
      const left = car.x;
      const right = car.x + car.width;
      return chickenX > left && chickenX < right;
    });

    if (hit) {
      endRoundBust();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanes, currentLane, roundState]);

  // clean up on unmount
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
      <div className="game-card chicken-road-card">
        <header className="game-header chicken-road-header">
          <button
            type="button"
            className="chickenroad-back-btn"
            onClick={() => navigate("/")}
          >
            ⬅ Back
          </button>

          <div className="game-header-text">
            <h1>Chicken Road</h1>
            <p>
              Guide the chicken across busy lanes, dodge traffic, and cash out
              before getting hit. Each lane crossed boosts your multiplier.
            </p>
          </div>
        </header>

        <div className="cr-layout">
          {/* LEFT: road + chicken */}
          <section className="cr-road-panel">
            <div className="cr-road-info">
              <div className="info-line">
                <span className="label">Risk</span>
                <span className="value cr-risk-tag">{riskLevel}</span>
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
                    "value cr-mult " +
                    (multiplier > 1 ? "cr-mult--active" : "")
                  }
                >
                  {multiplier.toFixed(2)}x
                </span>
              </div>
            </div>

            <div
              className={
                "cr-road " +
                (isRunning ? "cr-road--live" : "") +
                (isHit ? " cr-road--hit" : "")
              }
            >
              {/* top safe side (finish) */}
              <div className="cr-safe-zone cr-safe-zone--top">
                <span>Safe Side</span>
              </div>

              {/* dynamic lanes */}
              {Array.from({ length: LANE_COUNT }).map((_, idx) => {
                const laneIndex = LANE_COUNT - idx; // render from top to bottom
                const laneData = lanes.find((l) => l.id === laneIndex);

                return (
                  <div key={laneIndex} className="cr-lane">
                    <div className="cr-lane-road">
                      {/* lane prize label */}
                      <div className="cr-lane-prize">
                        +{computeMultiplier(laneIndex).toFixed(2)}x
                      </div>

                      {/* cars */}
                      <div className="cr-lane-cars">
                        {laneData?.cars.map((car, carIdx) => (
                          <div
                            key={carIdx}
                            className={"cr-car cr-car--" + car.type}
                            style={{
                              left: `${car.x * 100}%`,
                              width: `${car.width * 100}%`,
                            }}
                          />
                        ))}
                      </div>

                      {/* chicken */}
                      {currentLane === laneIndex && (
                        <div
                          className={
                            "cr-chicken " +
                            (isCrossing ? "cr-chicken--moving" : "")
                          }
                        >
                          <div className="cr-chicken-body">
                            <span className="cr-chicken-emoji">🐔</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* bottom safe side (start) */}
              <div className="cr-safe-zone cr-safe-zone--bottom">
                <span>Start</span>
              </div>

              {/* chicken at start roadside */}
              {currentLane === 0 && (
                <div
                  className={
                    "cr-chicken cr-chicken--start " +
                    (isRunning ? "cr-chicken--idle-bounce" : "")
                  }
                >
                  <div className="cr-chicken-body">
                    <span className="cr-chicken-emoji">🐔</span>
                  </div>
                </div>
              )}
            </div>

            {roundState === ROUND_STATES.BUST && (
              <div className="cr-banner cr-banner--bust">
                <span>Roadkill!</span>
                <span>You lost your stake.</span>
              </div>
            )}

            {roundState === ROUND_STATES.CASHED_OUT && lastResult && (
              <div className="cr-banner cr-banner--win">
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
          <section className="cr-sidebar">
            <div className="cr-balance-card">
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

            <div className="cr-panel">
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

              {/* risk level */}
              <div className="panel-group">
                <div className="panel-header">
                  <span>Traffic risk</span>
                </div>
                <div className="cr-risk-buttons">
                  {["low", "medium", "high"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={
                        "cr-risk-btn " +
                        (riskLevel === level ? "cr-risk-btn--active" : "")
                      }
                      disabled={roundState !== ROUND_STATES.IDLE}
                      onClick={() => setRiskLevel(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="panel-text">
                  Higher risk = faster and denser traffic, but higher multipliers
                  per lane.
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
                          Math.min(Number(e.target.value) || 0, LANE_COUNT)
                        )
                      )
                    }
                  />
                  <span className="panel-suffix">
                    {autoCashLane === 0 ? "Off" : `Lane ${autoCashLane}`}
                  </span>
                </div>
              </div>

              {/* actions */}
              <div className="cr-actions">
                {roundState === ROUND_STATES.IDLE && (
                  <button
                    type="button"
                    className="btn btn-primary cr-main-btn"
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
                      className="btn btn-secondary cr-main-btn"
                      onClick={moveChickenForward}
                    >
                      Step Forward
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger cr-main-btn"
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
                    className="btn btn-outline cr-main-btn"
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

      {/* WIN / LOSE POPUP */}
      {showModal && lastResult && (
        <div className="cr-modal-backdrop">
          <div className="cr-modal">
            <div className="cr-modal-header">
              <h2>{lastResult.title}</h2>
            </div>
            <div className="cr-modal-body">
              <p>{lastResult.message}</p>
              {lastResult.multiplier > 0 && (
                <p className="cr-modal-highlight">
                  {lastResult.multiplier.toFixed(2)}x ·{" "}
                  {lastResult.amount >= 0 ? "+" : ""}
                  {lastResult.amount.toLocaleString("en-GB", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>
            <div className="cr-modal-actions">
              <button
                type="button"
                className="btn btn-primary cr-main-btn"
                onClick={newRound}
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

export default ChickenRoad;
