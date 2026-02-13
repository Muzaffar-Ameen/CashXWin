import { useEffect, useRef, useState } from "react";
import "./Roulette.css";

const Roulette = () => {
  const [bank, setBank] = useState(1000);
  const [currentBet, setCurrentBet] = useState(0);
  const [wager, setWager] = useState(5);
  const [lastWager, setLastWager] = useState(0);
  const [bets, setBets] = useState([]); // {amt,type,odds,numbers}
  const [numbersBet, setNumbersBet] = useState([]);
  const [lastNumbers, setLastNumbers] = useState([]);
  const [spinResult, setSpinResult] = useState(null); // {number, winValue, betTotal}
  const [isSpinning, setIsSpinning] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [bankrupt, setBankrupt] = useState(false);

  const wheelRef = useRef(null);
  const ballTrackRef = useRef(null);

  const numRed = [
    1, 3, 5, 7, 9, 12, 14, 16, 18,
    19, 21, 23, 25, 27, 30, 32, 34, 36,
  ];

  const wheelNumbersAC = [
    0, 26, 3, 35, 12, 28, 7, 29, 18,
    22, 9, 31, 14, 20, 1, 33, 16,
    24, 5, 10, 23, 8, 30, 11, 36,
    13, 27, 6, 34, 17, 25, 2, 21,
    4, 19, 15, 32,
  ];

  const ringNumbers = [
    "0",
    "32",
    "15",
    "19",
    "4",
    "21",
    "2",
    "25",
    "17",
    "34",
    "6",
    "27",
    "13",
    "36",
    "11",
    "30",
    "8",
    "23",
    "10",
    "5",
    "24",
    "16",
    "33",
    "1",
    "20",
    "14",
    "31",
    "9",
    "22",
    "18",
    "29",
    "7",
    "28",
    "12",
    "35",
    "3",
    "26",
  ];

  const resetGame = () => {
    setBank(1000);
    setCurrentBet(0);
    setWager(5);
    setLastWager(0);
    setBets([]);
    setNumbersBet([]);
    setLastNumbers([]);
    setSpinResult(null);
    setShowNotification(false);
    setBankrupt(false);
    setIsSpinning(false);
    if (wheelRef.current) wheelRef.current.style.cssText = "";
    if (ballTrackRef.current) ballTrackRef.current.style.cssText = "";
  };

  const clearBets = () => {
    setBank((prev) => prev + currentBet);
    setCurrentBet(0);
    setBets([]);
    setNumbersBet([]);
  };

  const mergeNumbersBet = (nums) => {
    setNumbersBet((prev) => {
      const set = new Set(prev);
      nums.forEach((n) => set.add(n));
      return Array.from(set);
    });
  };

  const setBet = (numbersStr, type, odds) => {
    if (isSpinning || bankrupt) return;

    setLastWager(wager);
    let actualWager = wager;
    actualWager = Math.min(actualWager, bank);
    if (actualWager <= 0) return;

    setBank((prevBank) => prevBank - actualWager);
    setCurrentBet((prevBet) => prevBet + actualWager);

    setBets((prev) => {
      const existingIndex = prev.findIndex(
        (b) => b.numbers === numbersStr && b.type === type
      );
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          amt: updated[existingIndex].amt + actualWager,
        };
        return updated;
      }
      return [
        ...prev,
        {
          amt: actualWager,
          type,
          odds,
          numbers: numbersStr,
        },
      ];
    });

    const numsArr = numbersStr.split(",").map((n) => Number(n.trim()));
    mergeNumbersBet(numsArr);
  };

  const removeBet = (numbersStr, type) => {
    if (isSpinning || bankrupt) return;
    const removeAmount = wager || 100;

    setBets((prev) => {
      let refund = 0;
      const updated = prev
        .map((b) => {
          if (b.numbers === numbersStr && b.type === type && b.amt > 0) {
            const take = Math.min(removeAmount, b.amt);
            refund += take;
            return { ...b, amt: b.amt - take };
          }
          return b;
        })
        .filter((b) => b.amt > 0);

      if (refund > 0) {
        setBank((prevBank) => prevBank + refund);
        setCurrentBet((prevBet) => Math.max(prevBet - refund, 0));
      }

      return updated;
    });
  };

  const getNumberColor = (n) => {
    if (n === 0) return "green";
    return numRed.includes(n) ? "red" : "black";
  };

  const spin = () => {
    if (isSpinning || bankrupt) return;
    if (currentBet === 0) return;

    setIsSpinning(true);

    const winningSpin = Math.floor(Math.random() * 37);
    const wheel = wheelRef.current;
    const ballTrack = ballTrackRef.current;

    let degree = 0;
    for (let i = 0; i < wheelNumbersAC.length; i++) {
      if (wheelNumbersAC[i] === winningSpin) {
        degree = i * 9.73 + 362;
        break;
      }
    }

    if (wheel && ballTrack) {
      wheel.style.cssText = "animation: wheelRotate 5s linear infinite;";
      ballTrack.style.cssText = "animation: ballRotate 1s linear infinite;";

      setTimeout(() => {
        ballTrack.style.cssText = "animation: ballRotate 2s linear infinite;";
      }, 2000);

      setTimeout(() => {
        ballTrack.style.cssText = `animation: ballStop 3s linear; transform: rotate(-${degree}deg);`;
      }, 6000);

      setTimeout(() => {
        wheel.style.cssText = "";
      }, 10000);
    }

    setTimeout(() => {
      let winValue = 0;
      let betTotal = 0;
      let newBank = bank;

      if (numbersBet.includes(winningSpin)) {
        bets.forEach((b) => {
          const nums = b.numbers.split(",").map((n) => Number(n.trim()));
          if (nums.includes(winningSpin)) {
            newBank += b.amt + b.amt * b.odds;
            winValue += b.amt * b.odds;
            betTotal += b.amt;
          }
        });
      }

      setBank(newBank);
      setCurrentBet(0);
      setBets([]);
      setNumbersBet([]);
      setWager(lastWager || 5);
      setSpinResult({ number: winningSpin, winValue, betTotal });

      setLastNumbers((prev) => {
        const next = [{ n: winningSpin, color: getNumberColor(winningSpin) }, ...prev];
        return next.slice(0, 10);
      });

      setIsSpinning(false);

      if (winValue > 0) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 4000);
      }

      if (newBank === 0) {
        setBankrupt(true);
      }
    }, 10000);
  };

  const getPocketColorClass = (value) => {
    const n = Number(value);
    if (n === 0) return "roulette-pocket--green";
    if (numRed.includes(n)) return "roulette-pocket--red";
    return "roulette-pocket--black";
  };

  const handleBoardContext = (e) => {
    const target = e.target;
    if (target && target.closest && target.closest(".bet-cell")) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    document.addEventListener("contextmenu", handleBoardContext);
    return () => {
      document.removeEventListener("contextmenu", handleBoardContext);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="game-shell page">
      <div className="game-card roulette-card">
        <header className="game-header">
          <h1>Roulette</h1>
          <p>European wheel with full betting table, chips and smooth motion.</p>
        </header>

        <div className="roulette-layout">
          <div className="roulette-wheel">
            <div className="roulette-wheel-outer" />
            <div className="roulette-wheel-core" ref={wheelRef}>
              <div className="roulette-wheel-rim" />
              <div className="roulette-wheel-track">
                <div className="ballTrack" ref={ballTrackRef}>
                  <div className="roulette-ball" />
                </div>

                {ringNumbers.map((num, index) => (
                  <div
                    key={num + index}
                    className={`roulette-pocket ${getPocketColorClass(num)}`}
                    style={{
                      transform: `rotate(${(360 / 37) * index}deg) translateY(-46%)`,
                    }}
                  >
                    <span>{num}</span>
                  </div>
                ))}

                <div className="roulette-pockets-inner" />
                <div className="roulette-cone" />
                <div className="roulette-turret" />
                <div className="roulette-handle">
                  <div className="roulette-handle-cap" />
                  <div className="roulette-handle-cap" />
                </div>
              </div>
            </div>
          </div>

          <div className="roulette-panel">
            <div className="roulette-bank">
              <div>
                <span className="label">Balance</span>
                <span className="value">{bank.toLocaleString("en-GB")}</span>
              </div>
              <div>
                <span className="label">Current bet</span>
                <span className="value">{currentBet.toLocaleString("en-GB")}</span>
              </div>
            </div>

            <div className="roulette-chips">
              {[1, 5, 10, 100].map((chipVal) => (
                <button
                  key={chipVal}
                  className={`chip-button ${
                    wager === chipVal ? "chip-button--active" : ""
                  }`}
                  type="button"
                  onClick={() => setWager(chipVal)}
                >
                  <span className="chip-circle" />
                  <span className="chip-label">{chipVal}</span>
                </button>
              ))}
              <button
                type="button"
                className="chip-button chip-button--clear"
                onClick={clearBets}
              >
                <span className="chip-label">Clear</span>
              </button>
            </div>

            <div className="roulette-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  if (bank >= lastWager && lastWager > 0) {
                    setBet("0", "zero", 35);
                  }
                }}
              >
                Rebet
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={spin}
                disabled={isSpinning || currentBet === 0}
              >
                {isSpinning ? "Spinning..." : "Spin"}
              </button>
            </div>

            <div className="roulette-table">
              <div className="roulette-numbers-grid">
                <div
                  className="roulette-zero bet-cell"
                  onClick={() => setBet("0", "zero", 35)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    removeBet("0", "zero");
                  }}
                >
                  0
                </div>

                <div className="roulette-main-grid">
                  {Array.from({ length: 12 }).map((_, col) => (
                    <div key={col} className="roulette-column">
                      {[3, 2, 1].map((rowOffset) => {
                        const n = col * 3 + rowOffset;
                        const colorClass = numRed.includes(n)
                          ? "cell-red"
                          : "cell-black";
                        return (
                          <div
                            key={n}
                            className={`roulette-cell bet-cell ${colorClass}`}
                            onClick={() => setBet(String(n), "inside_whole", 35)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              removeBet(String(n), "inside_whole");
                            }}
                          >
                            <span>{n}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  <div className="roulette-column-side">
                    {[
                      "3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36",
                      "2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35",
                      "1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34",
                    ].map((nums, idx) => (
                      <div
                        key={idx}
                        className="roulette-cell bet-cell cell-column"
                        onClick={() => setBet(nums, "outside_column", 2)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          removeBet(nums, "outside_column");
                        }}
                      >
                        2 to 1
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="roulette-dozens-row">
                {[
                  {
                    label: "1 to 12",
                    nums: "1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12",
                  },
                  {
                    label: "13 to 24",
                    nums: "13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24",
                  },
                  {
                    label: "25 to 36",
                    nums: "25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36",
                  },
                ].map((d) => (
                  <div
                    key={d.label}
                    className="roulette-dozen bet-cell"
                    onClick={() => setBet(d.nums, "outside_dozen", 2)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      removeBet(d.nums, "outside_dozen");
                    }}
                  >
                    {d.label}
                  </div>
                ))}
              </div>

              <div className="roulette-oerb-row">
                {[
                  {
                    label: "EVEN",
                    nums:
                      "2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36",
                      extraClass: "cell-even-yellow",
                  },
                  {
                    label: "RED",
                    nums:
                      "1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36",
                    extraClass: "cell-red",
                  },
                  {
                    label: "BLACK",
                    nums:
                      "2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35",
                    extraClass: "cell-black",
                  },
                  {
                    label: "ODD",
                    nums:
                      "1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35",
                      extraClass: "cell-odd-yellow",
                  },
                ].map((b) => (
                  <div
                    key={b.label}
                    className={`roulette-oerb bet-cell ${b.extraClass || ""}`}
                    onClick={() => setBet(b.nums, "outside_oerb", 1)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      removeBet(b.nums, "outside_oerb");
                    }}
                  >
                    {b.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="roulette-history">
              <span className="history-title">Last numbers</span>
              <div className="history-row">
                {lastNumbers.map((item, idx) => (
                  <span
                    key={idx}
                    className={`history-pill history-pill--${item.color}`}
                  >
                    {item.n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showNotification && spinResult && spinResult.winValue > 0 && (
          <div className="roulette-notification">
            <div className="nSpan">
              <span
                className="nsnumber"
                style={{
                  color:
                    getNumberColor(spinResult.number) === "red"
                      ? "red"
                      : getNumberColor(spinResult.number) === "black"
                      ? "black"
                      : "green",
                }}
              >
                {spinResult.number}
              </span>
              <span> Win</span>
            </div>
            <div className="nsWin">
              <div className="nsWinBlock">Bet: {spinResult.betTotal}</div>
              <div className="nsWinBlock">Win: {spinResult.winValue}</div>
              <div className="nsWinBlock">
                Payout: {spinResult.winValue + spinResult.betTotal}
              </div>
            </div>
          </div>
        )}

        {bankrupt && (
          <div className="roulette-notification roulette-notification--bankrupt">
            <div className="nSpan">Bankrupt</div>
            <button type="button" className="nBtn" onClick={resetGame}>
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Roulette;
