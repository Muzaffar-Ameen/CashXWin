// src/games/jackpot-777/JackPot777.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./JackPot777.css";

const SYMBOLS = [
  { id: "CHERRY", label: "🍒", weight: 4, payout: 5 },
  { id: "LEMON", label: "🍋", weight: 4, payout: 8 },
  { id: "ORANGE", label: "🍊", weight: 4, payout: 10 },
  { id: "BAR", label: "BAR", weight: 3, payout: 20 },
  { id: "BELL", label: "🔔", weight: 2, payout: 40 },
  { id: "SEVEN", label: "7", weight: 1, payout: 100 }, // Jackpot symbol
];

// number of horizontal lines: 1 = center only, 3 = top+center+bottom
const NUM_LINES = 3;

// build weighted reel strip (for randomness)
const createReelStrip = () => {
  const strip = [];
  SYMBOLS.forEach((s) => {
    for (let i = 0; i < s.weight; i += 1) {
      strip.push(s.id);
    }
  });
  return strip;
};

const REEL_STRIP = createReelStrip();

const randomSymbolId = () => {
  const idx = Math.floor(Math.random() * REEL_STRIP.length);
  return REEL_STRIP[idx];
};

const getSymbol = (id) => SYMBOLS.find((s) => s.id === id);

// horizontal paylines for 3x3: top, middle, bottom
const ALL_PAYLINES = [
  [0, 0, 0], // top row
  [1, 1, 1], // middle row
  [2, 2, 2], // bottom row
];

const PAYLINES = ALL_PAYLINES.slice(0, NUM_LINES);

// evaluate single 3-symbol line
const evaluateLine = (symbols, bet) => {
  const [s1, s2, s3] = symbols;
  if (!s1 || !s2 || !s3) return { win: 0, label: "" };

  if (s1 === s2 && s2 === s3) {
    const sym = getSymbol(s1);
    const payoutMult = sym.payout;
    const win = bet * payoutMult;
    return {
      win,
      label:
        s1 === "SEVEN"
          ? `JACKPOT! 7-7-7 pays x${payoutMult}`
          : `${sym.label} ${sym.label} ${sym.label} pays x${payoutMult}`,
    };
  }

  // any two 7s on line → small win
  const sevenCount = symbols.filter((id) => id === "SEVEN").length;
  if (sevenCount === 2) {
    const win = bet * 3;
    return {
      win,
      label: "Lucky 7s! Any two 7s pay x3",
    };
  }

  return { win: 0, label: "No win" };
};

// evaluate all active lines
const evaluateAllLines = (reels, bet) => {
  const wins = [];

  PAYLINES.forEach((rows, lineIndex) => {
    const lineSymbols = rows.map((row, col) => reels[col][row]); // 3 reels
    const { win, label } = evaluateLine(lineSymbols, bet);
    if (win > 0) {
      wins.push({
        lineIndex,
        symbols: lineSymbols,
        amount: win,
        label,
      });
    }
  });

  return wins;
};

const MIN_BET = 5;
const MAX_BET = 100;
const INITIAL_BALANCE = 1000;

const JackPot777 = () => {
  const navigate = useNavigate();

  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState([
    ["CHERRY", "LEMON", "ORANGE"], // reel 0
    ["LEMON", "CHERRY", "ORANGE"], // reel 1
    ["ORANGE", "LEMON", "CHERRY"], // reel 2
  ]);

  const [isSpinning, setIsSpinning] = useState(false);
  const [message, setMessage] = useState("Press Spin to play");
  const [jackpotFlash, setJackpotFlash] = useState(false);

  // multi-line win sequence
  const [pendingWins, setPendingWins] = useState([]);
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [lastTotalWin, setLastTotalWin] = useState(0);

  const canSpin = useMemo(
    () => !isSpinning && bet > 0 && balance >= bet && pendingWins.length === 0,
    [isSpinning, bet, balance, pendingWins.length],
  );

  const handleBetChange = (delta) => {
    setBet((prev) => {
      let next = prev + delta;
      if (next < MIN_BET) next = MIN_BET;
      if (next > MAX_BET) next = MAX_BET;
      return next;
    });
  };

  const handleMaxBet = () => {
    const allowedMax = Math.min(MAX_BET, balance);
    setBet(allowedMax < MIN_BET ? MIN_BET : allowedMax);
  };

  const handleSpin = () => {
    if (!canSpin) {
      if (balance < bet) {
        setMessage("Not enough balance for this bet.");
      }
      return;
    }

    setIsSpinning(true);
    setPendingWins([]);
    setHighlightedLine(null);
    setLastTotalWin(0);
    setMessage("Spinning...");

    // deduct bet
    setBalance((prev) => prev - bet);

    const spinDuration = 1300;
    const reelDelays = [0, 200, 400]; // stagger stops

    const finalReels = [[], [], []];

    reelDelays.forEach((delay, reelIndex) => {
      setTimeout(() => {
        const center = randomSymbolId();
        const above = randomSymbolId();
        const below = randomSymbolId();
        finalReels[reelIndex] = [above, center, below];

        if (reelIndex === 2) {
          setTimeout(() => {
            setReels([
              finalReels[0],
              finalReels[1],
              finalReels[2],
            ]);

            const wins = evaluateAllLines(finalReels, bet);
            if (wins.length === 0) {
              setMessage("No win. Try again!");
              setIsSpinning(false);
              return;
            }

            const isAnyJackpot = wins.some(
              (w) => w.symbols.every((id) => id === "SEVEN"),
            );
            if (isAnyJackpot) {
              setJackpotFlash(true);
              setTimeout(() => setJackpotFlash(false), 2000);
            }

            setPendingWins(wins);
            setIsSpinning(false);
          }, 80);
        }
      }, delay);
    });

    // safety timeout
    setTimeout(() => {
      setIsSpinning(false);
    }, spinDuration + 600);
  };

  const handleAutoSpin = () => {
    if (canSpin) {
      handleSpin();
    }
  };

  const handleReset = () => {
    setBalance(INITIAL_BALANCE);
    setBet(10);
    setReels([
      ["CHERRY", "LEMON", "ORANGE"],
      ["LEMON", "CHERRY", "ORANGE"],
      ["ORANGE", "LEMON", "CHERRY"],
    ]);
    setIsSpinning(false);
    setPendingWins([]);
    setHighlightedLine(null);
    setLastTotalWin(0);
    setMessage("Press Spin to play");
    setJackpotFlash(false);
  };

  // handle multi-line win sequence (show each line one by one)
  useEffect(() => {
    if (!pendingWins.length) return;

    let index = 0;
    let total = 0;

    const showNext = () => {
      const w = pendingWins[index];
      if (!w) {
        setHighlightedLine(null);
        setPendingWins([]);
        setLastTotalWin(total);
        setBalance((prev) => prev + total);
        setMessage(`Total win: ${total}`);
        return;
      }

      setHighlightedLine(w.lineIndex);
      setMessage(`${w.label} • Win: ${w.amount}`);
      total += w.amount;

      index += 1;
      setTimeout(showNext, 800);
    };

    showNext();
  }, [pendingWins]);

  useEffect(() => {
    if (balance < MIN_BET && !isSpinning && pendingWins.length === 0) {
      setMessage("Balance too low. Press Reset to add more credits.");
    }
  }, [balance, isSpinning, pendingWins.length]);

  const centerLineSymbols = [
    reels[0][1],
    reels[1][1],
    reels[2][1],
  ];
  const isCenterJackpot =
    centerLineSymbols.length === 3 &&
    centerLineSymbols.every((id) => id === "SEVEN");

  const isRowHighlighted = (row) =>
    highlightedLine !== null &&
    PAYLINES[highlightedLine] &&
    PAYLINES[highlightedLine][0] === row;

  return (
    <div className="game-shell page JackPot777-page">
      <div className="game-card JackPot777-card">
        {/* header */}
        <header className="game-header jp-header">
          <button
            type="button"
            className="jp-back-btn"
            onClick={() => navigate("/")}
          >
            ⬅ Back
          </button>
          <div className="jp-title-block">
            <h1>Jackpot 777</h1>
            <p>
              Classic {NUM_LINES}-line 3-reel slot. Line up 7-7-7 on any active
              line to hit the jackpot.
            </p>
          </div>
          <div className="jp-balance-pill">
            <span>Balance</span>
            <strong>{balance}</strong>
          </div>
        </header>

        <div className="jp-layout">
          {/* reels + info */}
          <section className="jp-main">
            <div
              className={
                "jp-machine " +
                (isCenterJackpot || jackpotFlash ? "jp-machine--jackpot" : "")
              }
            >
              <div className="jp-machine-top">
                <div className="jp-logo">
                  <span className="jp-logo-777">777</span>
                  <span className="jp-logo-text">JACKPOT</span>
                </div>
                <div className="jp-jackpot-display">
                  <span className="label">Jackpot</span>
                  <span className="value">x100</span>
                </div>
              </div>

              <div className="jp-reels-shell">
                <div className="jp-reels-inner">
                  {reels.map((reel, reelIdx) => (
                    <div
                      key={reelIdx}
                      className={
                        "jp-reel " +
                        (isSpinning ? "jp-reel--spinning" : "")
                      }
                    >
                      {reel.map((symbolId, rowIdx) => {
                        const sym = getSymbol(symbolId);
                        const isCenter = rowIdx === 1;
                        const onHighlighted =
                          isRowHighlighted(rowIdx) && !isSpinning;
                        return (
                          <div
                            key={rowIdx}
                            className={
                              "jp-slot-cell " +
                              (isCenter ? "jp-slot-cell--center " : "") +
                              (onHighlighted ? "jp-slot-cell--win" : "")
                            }
                          >
                            <div className="jp-symbol">
                              <span
                                className={
                                  "jp-symbol-label " +
                                  (symbolId === "SEVEN"
                                    ? "jp-symbol-label--seven"
                                    : "")
                                }
                              >
                                {sym.label}
                              </span>
                              {symbolId === "BAR" && (
                                <span className="jp-symbol-bar-bg" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  {/* payline indicators for active lines */}
                  {PAYLINES.map((rows, idx) => (
                    <div
                      key={idx}
                      className={
                        "jp-payline jp-payline--" +
                        (rows[0] === 0
                          ? "top"
                          : rows[0] === 1
                          ? "mid"
                          : "bot") +
                        (highlightedLine === idx ? " jp-payline--active" : "")
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="jp-status">
              <div className="jp-message">{message}</div>
              {lastTotalWin > 0 && (
                <div className="jp-last-win">
                  Last Total Win: {lastTotalWin}
                </div>
              )}
            </div>

            <div className="jp-controls">
              <div className="jp-controls-row">
                <div className="jp-info-pill">
                  <span className="label">Bet / Line</span>
                  <span className="value">{bet}</span>
                </div>
                <div className="jp-info-pill">
                  <span className="label">Lines</span>
                  <span className="value">{NUM_LINES}</span>
                </div>
                <div className="jp-bet-buttons">
                  <button
                    type="button"
                    className="btn btn-outline jp-bet-btn"
                    onClick={() => handleBetChange(-5)}
                    disabled={isSpinning || pendingWins.length > 0}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline jp-bet-btn"
                    onClick={() => handleBetChange(5)}
                    disabled={isSpinning || pendingWins.length > 0}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary jp-bet-btn jp-bet-btn--max"
                    onClick={handleMaxBet}
                    disabled={
                      isSpinning || pendingWins.length > 0 || balance < MIN_BET
                    }
                  >
                    Max
                  </button>
                </div>
              </div>

              <div className="jp-controls-row jp-controls-row--main">
                <button
                  type="button"
                  className="btn btn-secondary jp-small-btn"
                  onClick={handleAutoSpin}
                  disabled={!canSpin}
                >
                  Auto
                </button>
                <button
                  type="button"
                  className="btn btn-primary jp-spin-btn"
                  onClick={handleSpin}
                  disabled={!canSpin}
                >
                  {isSpinning ? "Spinning..." : "Spin"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger jp-small-btn"
                  onClick={handleReset}
                  disabled={isSpinning}
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          {/* paytable / help */}
          <section className="jp-sidebar">
            <div className="jp-panel">
              <h3>Paytable (per active line)</h3>
              <ul className="jp-paytable-list">
                <li>
                  <span>7 7 7</span>
                  <span>x100</span>
                </li>
                <li>
                  <span>🔔 🔔 🔔</span>
                  <span>x40</span>
                </li>
                <li>
                  <span>BAR BAR BAR</span>
                  <span>x20</span>
                </li>
                <li>
                  <span>🍊 🍊 🍊</span>
                  <span>x10</span>
                </li>
                <li>
                  <span>🍋 🍋 🍋</span>
                  <span>x8</span>
                </li>
                <li>
                  <span>🍒 🍒 🍒</span>
                  <span>x5</span>
                </li>
                <li>
                  <span>Any two 7</span>
                  <span>x3</span>
                </li>
              </ul>
            </div>

            <div className="jp-panel jp-panel--small">
              <h3>How to Play</h3>
              <ul className="jp-help-list">
                <li>Set your bet per line using − / + or Max.</li>
                <li>Game uses {NUM_LINES} horizontal line(s) (top/mid/bottom).</li>
                <li>Press Spin to play all active lines.</li>
                <li>Line up 7-7-7 on any active line to hit the jackpot.</li>
                <li>Each winning line explodes and shows its win one by one.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default JackPot777;
