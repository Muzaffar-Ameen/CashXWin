// src/games/three-patti/ThreePatti.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ThreePatti.css";

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

const ROUND_STATES = {
  IDLE: "IDLE",
  DEALT: "DEALT",
  BETTING: "BETTING",
  SHOW: "SHOW",
  FINISHED: "FINISHED",
};

const PLAYER_TYPES = {
  HUMAN: "HUMAN",
  BOT: "BOT",
};

// helpers
const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
};

const shuffle = (deck) => {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
};

const rankValue = (rank) => RANKS.indexOf(rank);

// hand evaluation based on Teen Patti rules [web:348][web:351]
const evaluateHand = (cards) => {
  const sorted = [...cards].sort(
    (a, b) => rankValue(a.rank) - rankValue(b.rank),
  );
  const r = sorted.map((c) => c.rank);
  const s = sorted.map((c) => c.suit);

  const allSameSuit = s[0] === s[1] && s[1] === s[2];

  const values = r.map(rankValue);
  const isConsecutive =
    (values[1] === values[0] + 1 && values[2] === values[1] + 1) ||
    // allow A-2-3 as lowest straight
    (r.includes("A") && r.includes("2") && r.includes("3"));

  const counts = {};
  for (const rank of r) counts[rank] = (counts[rank] || 0) + 1;
  const ranksByCount = Object.entries(counts).sort(
    (a, b) => b[1] - a[1] || rankValue(b[0]) - rankValue(a[0]),
  );

  // 6: Trail / Trio
  if (ranksByCount[0][1] === 3) {
    return {
      category: 6,
      name: "Trail",
      ranks: [rankValue(ranksByCount[0][0])],
    };
  }

  // 5: Pure sequence
  if (allSameSuit && isConsecutive) {
    return {
      category: 5,
      name: "Pure Sequence",
      ranks: [...values].sort((a, b) => b - a),
    };
  }

  // 4: Sequence
  if (isConsecutive) {
    return {
      category: 4,
      name: "Sequence",
      ranks: [...values].sort((a, b) => b - a),
    };
  }

  // 3: Color
  if (allSameSuit) {
    return {
      category: 3,
      name: "Color",
      ranks: [...values].sort((a, b) => b - a),
    };
  }

  // 2: Pair
  if (ranksByCount[0][1] === 2) {
    const pairRankVal = rankValue(ranksByCount[0][0]);
    const kickerRankVal = rankValue(ranksByCount[1][0]);
    return {
      category: 2,
      name: "Pair",
      ranks: [pairRankVal, kickerRankVal],
    };
  }

  // 1: High card
  return {
    category: 1,
    name: "High Card",
    ranks: [...values].sort((a, b) => b - a),
  };
};

const compareHands = (aCards, bCards) => {
  const a = evaluateHand(aCards);
  const b = evaluateHand(bCards);

  if (a.category !== b.category) {
    return a.category - b.category;
  }

  const len = Math.max(a.ranks.length, b.ranks.length);
  for (let i = 0; i < len; i += 1) {
    const av = a.ranks[i] ?? -1;
    const bv = b.ranks[i] ?? -1;
    if (av !== bv) return av - bv;
  }
  return 0; // exact tie
};

const ThreePatti = () => {
  const navigate = useNavigate();

  const [roundState, setRoundState] = useState(ROUND_STATES.IDLE);
  const [players, setPlayers] = useState(() => [
    {
      id: 0,
      name: "You",
      type: PLAYER_TYPES.HUMAN,
      chips: 1000,
      cards: [],
      isBlind: true,
      hasSeen: false,
      hasFolded: false,
      totalBet: 0,
    },
    {
      id: 1,
      name: "Bot 1",
      type: PLAYER_TYPES.BOT,
      chips: 1000,
      cards: [],
      isBlind: true,
      hasSeen: false,
      hasFolded: false,
      totalBet: 0,
    },
    {
      id: 2,
      name: "Bot 2",
      type: PLAYER_TYPES.BOT,
      chips: 1000,
      cards: [],
      isBlind: true,
      hasSeen: false,
      hasFolded: false,
      totalBet: 0,
    },
  ]);

  const [dealerIndex, setDealerIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(1); // left of dealer starts
  const [deck, setDeck] = useState([]);
  const [pot, setPot] = useState(0);
  const [bootAmount] = useState(5);
  const [currentStake, setCurrentStake] = useState(5);
  const [log, setLog] = useState([]);
  const [revealAll, setRevealAll] = useState(false);
  const [winnerIds, setWinnerIds] = useState([]);
  const [lastHandInfo, setLastHandInfo] = useState(null);

  // animation flags
  const [isDealing, setIsDealing] = useState(false);
  const [isPotAnimating, setIsPotAnimating] = useState(false);

  const human = players[0];

  const activePlayer = useMemo(
    () => players[activeIndex],
    [players, activeIndex],
  );

  const alivePlayersCount = useMemo(
    () => players.filter((p) => !p.hasFolded).length,
    [players],
  );

  const canShow =
    alivePlayersCount === 2 && roundState === ROUND_STATES.BETTING;

  const appendLog = (entry) => {
    setLog((prev) => [entry, ...prev].slice(0, 6));
  };

  const resetRound = () => {
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        cards: [],
        isBlind: true,
        hasSeen: false,
        hasFolded: false,
        totalBet: 0,
      })),
    );
    setPot(0);
    setCurrentStake(bootAmount);
    setWinnerIds([]);
    setLastHandInfo(null);
    setRevealAll(false);
    setRoundState(ROUND_STATES.IDLE);
    setIsDealing(false);
    setIsPotAnimating(false);
    setLog([]);
  };

  // full reset: like first time load (chips back to 1000 etc.)
  const hardResetGame = () => {
    setPlayers([
      {
        id: 0,
        name: "You",
        type: PLAYER_TYPES.HUMAN,
        chips: 1000,
        cards: [],
        isBlind: true,
        hasSeen: false,
        hasFolded: false,
        totalBet: 0,
      },
      {
        id: 1,
        name: "Bot 1",
        type: PLAYER_TYPES.BOT,
        chips: 1000,
        cards: [],
        isBlind: true,
        hasSeen: false,
        hasFolded: false,
        totalBet: 0,
      },
      {
        id: 2,
        name: "Bot 2",
        type: PLAYER_TYPES.BOT,
        chips: 1000,
        cards: [],
        isBlind: true,
        hasSeen: false,
        hasFolded: false,
        totalBet: 0,
      },
    ]);
    setDealerIndex(0);
    setActiveIndex(1);
    setDeck([]);
    setPot(0);
    setCurrentStake(bootAmount);
    setWinnerIds([]);
    setLastHandInfo(null);
    setRevealAll(false);
    setRoundState(ROUND_STATES.IDLE);
    setIsDealing(false);
    setIsPotAnimating(false);
    setLog([]);
  };

  const postBoot = (shuffled) => {
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        chips: p.chips - bootAmount,
        totalBet: bootAmount,
      })),
    );
    setPot(bootAmount * players.length);
    appendLog(`Boot posted: ${bootAmount} by each player`);
    setDeck(shuffled);
  };

  const dealCards = () => {
    const shuffled = shuffle(createDeck());
    postBoot(shuffled);

    const newPlayers = [...players].map((p) => ({ ...p }));
    let idx = 0;
    for (let round = 0; round < 3; round += 1) {
      for (let i = 0; i < newPlayers.length; i += 1) {
        newPlayers[i].cards.push(shuffled[idx]);
        idx += 1;
      }
    }
    setIsDealing(true);
    setTimeout(() => {
      setPlayers(newPlayers);
      setDeck(shuffled.slice(idx));
      setIsDealing(false);
      setRoundState(ROUND_STATES.BETTING);
    }, 600); // deal animation duration
  };

  const startRound = () => {
    if (
      roundState !== ROUND_STATES.IDLE &&
      roundState !== ROUND_STATES.FINISHED
    )
      return;
    resetRound();
    setRoundState(ROUND_STATES.DEALT);
    dealCards();

    const nextDealer = (dealerIndex + 1) % players.length;
    setDealerIndex(nextDealer);
    setActiveIndex((nextDealer + 1) % players.length);
  };

  const nextPlayerIndex = (current) => {
    let next = (current + 1) % players.length;
    let tries = 0;
    while (players[next].hasFolded && tries < players.length) {
      next = (next + 1) % players.length;
      tries += 1;
    }
    return next;
  };

  const updatePlayer = (id, updater) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
  };

  const placeBet = (player, amount, isRaise = false) => {
    const actual = Math.min(amount, player.chips);
    if (actual <= 0) return;
    setPot((prev) => prev + actual);
    setIsPotAnimating(true);
    setTimeout(() => setIsPotAnimating(false), 300);

    updatePlayer(player.id, (p) => ({
      ...p,
      chips: p.chips - actual,
      totalBet: p.totalBet + actual,
    }));

    if (isRaise) {
      setCurrentStake(actual);
    }
  };

  const finishByLastStanding = (foldingPlayerId) => {
    const remaining = players.filter(
      (p) => !p.hasFolded && p.id !== foldingPlayerId,
    );

    // if nobody left (all folded), just finish round
    if (remaining.length === 0) {
      setRoundState(ROUND_STATES.FINISHED);
      setLastHandInfo({
        title: "All Folded",
        text: "No active players. Start a new round.",
      });
      return;
    }

    if (remaining.length === 1) {
      const winner = remaining[0];
      setWinnerIds([winner.id]);
      setRevealAll(true);
      setRoundState(ROUND_STATES.FINISHED);
      appendLog(`${winner.name} wins pot by default`);

      // distribute pot
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === winner.id ? { ...p, chips: p.chips + pot } : p,
        ),
      );
    }
  };

  const handleFold = () => {
    if (activePlayer.type !== PLAYER_TYPES.HUMAN) return;
    if (roundState !== ROUND_STATES.BETTING) return;

    appendLog(`${activePlayer.name} folded`);
    updatePlayer(activePlayer.id, (p) => ({
      ...p,
      hasFolded: true,
    }));

    const remainingAfterFold = players.filter(
      (p) => !p.hasFolded && p.id !== activePlayer.id,
    );
    if (remainingAfterFold.length <= 1) {
      finishByLastStanding(activePlayer.id);
      return;
    }

    setActiveIndex(nextPlayerIndex(activeIndex));
  };

  const handleSeeCards = () => {
    if (activePlayer.type !== PLAYER_TYPES.HUMAN) return;
    if (activePlayer.hasSeen) return;
    if (
      roundState !== ROUND_STATES.BETTING &&
      roundState !== ROUND_STATES.DEALT
    )
      return;

    appendLog(`${activePlayer.name} sees cards`);
    updatePlayer(activePlayer.id, (p) => ({
      ...p,
      isBlind: false,
      hasSeen: true,
    }));
  };

  const handleCall = () => {
    if (activePlayer.type !== PLAYER_TYPES.HUMAN) return;
    if (roundState !== ROUND_STATES.BETTING) return;

    const isBlind = activePlayer.isBlind;
    const amount = isBlind ? currentStake : currentStake * 2;

    placeBet(activePlayer, amount, false);
    appendLog(`${activePlayer.name} calls ${amount}`);

    setActiveIndex(nextPlayerIndex(activeIndex));
  };

  const handleRaise = () => {
    if (activePlayer.type !== PLAYER_TYPES.HUMAN) return;
    if (roundState !== ROUND_STATES.BETTING) return;

    const isBlind = activePlayer.isBlind;
    const amount = isBlind ? currentStake * 2 : currentStake * 4;

    placeBet(activePlayer, amount, true);
    appendLog(`${activePlayer.name} raises to ${amount}`);

    setActiveIndex(nextPlayerIndex(activeIndex));
  };

  const handleShow = () => {
    if (!canShow) return;

    setRoundState(ROUND_STATES.SHOW);
    setRevealAll(true);

    const contenders = players.filter((p) => !p.hasFolded);
    if (contenders.length < 2) return;

    const [p1, p2] = contenders;

    const cmp = compareHands(p1.cards, p2.cards);
    let winner;
    let loser;
    if (cmp > 0) {
      winner = p1;
      loser = p2;
    } else if (cmp < 0) {
      winner = p2;
      loser = p1;
    } else {
      // exact tie: split pot
      setWinnerIds([p1.id, p2.id]);
      const half = Math.floor(pot / 2);
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === p1.id
            ? { ...p, chips: p.chips + half }
            : p.id === p2.id
            ? { ...p, chips: p.chips + (pot - half) }
            : p,
        ),
      );
      setLastHandInfo({
        title: "Split Pot",
        text: "Both players have equal hands.",
      });
      setRoundState(ROUND_STATES.FINISHED);
      return;
    }

    setWinnerIds([winner.id]);
    setLastHandInfo({
      title: `${winner.name} wins`,
      text: `${evaluateHand(winner.cards).name} beats ${evaluateHand(
        loser.cards,
      ).name}`,
    });

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === winner.id ? { ...p, chips: p.chips + pot } : p,
      ),
    );

    setRoundState(ROUND_STATES.FINISHED);
  };

  // simple bot behavior (call/raise/fold based on random & hand strength) [web:388][web:409]
  useEffect(() => {
    if (roundState !== ROUND_STATES.BETTING) return;
    if (activePlayer.type !== PLAYER_TYPES.BOT) return;

    const timeout = setTimeout(
      () => {
        const bot = activePlayer;
        if (bot.hasFolded) {
          setActiveIndex(nextPlayerIndex(activeIndex));
          return;
        }

        // If bot has not seen, random decide to see
        if (!bot.hasSeen && Math.random() < 0.4) {
          appendLog(`${bot.name} sees cards`);
          updatePlayer(bot.id, (p) => ({
            ...p,
            isBlind: false,
            hasSeen: true,
          }));
        }

        const evalHandResult = evaluateHand(bot.cards);
        const strengthScore = evalHandResult.category;

        // Very simple heuristic:
        let action = "CALL";
        if (strengthScore >= 4 && Math.random() < 0.6) {
          action = "RAISE";
        } else if (strengthScore <= 2 && Math.random() < 0.3) {
          action = "FOLD";
        }

        if (alivePlayersCount === 2 && Math.random() < 0.2 && canShow) {
          appendLog(`${bot.name} requests show`);
          handleShow();
          return;
        }

        if (action === "FOLD") {
          appendLog(`${bot.name} folded`);
          updatePlayer(bot.id, (p) => ({ ...p, hasFolded: true }));
          const remainingAfterFold = players.filter(
            (p) => !p.hasFolded && p.id !== bot.id,
          );
          if (remainingAfterFold.length <= 1) {
            finishByLastStanding(bot.id);
            return;
          }
        } else if (action === "CALL") {
          const isBlind = bot.isBlind;
          const amount = isBlind ? currentStake : currentStake * 2;
          appendLog(`${bot.name} calls ${amount}`);
          placeBet(bot, amount, false);
        } else if (action === "RAISE") {
          const isBlind = bot.isBlind;
          const amount = isBlind ? currentStake * 2 : currentStake * 4;
          appendLog(`${bot.name} raises to ${amount}`);
          placeBet(bot, amount, true);
        }

        setActiveIndex(nextPlayerIndex(activeIndex));
      },
      900 + Math.random() * 600,
    );

    return () => clearTimeout(timeout);
  }, [
    roundState,
    activeIndex,
    activePlayer,
    alivePlayersCount,
    currentStake,
    canShow,
    players,
  ]);

  const humanHandInfo =
    human.cards.length === 3 ? evaluateHand(human.cards) : null;

  return (
    <div className="game-shell page threepatti-page">
      <div className="game-card threepatti-card">
        {/* header */}
        <header className="game-header tp-header">
          <button
            type="button"
            className="tp-back-btn"
            onClick={() => navigate("/")}
          >
            ⬅ Back
          </button>
          <div className="tp-title-block">
            <h1>Teen Patti</h1>
            <p>
              Classic 3‑card game. Post boot, bet blind or seen, and win the pot
              with the strongest hand.
            </p>
          </div>
          <div className="tp-balance-pill">
            <span>Chips</span>
            <strong>{human.chips}</strong>
          </div>
        </header>

        <div className="tp-layout">
          {/* table area */}
          <section className="tp-table">
            <div className="tp-table-wrapper">
              {/* pot and table image */}
              <div className="tp-table-top">
                <div className="tp-pot-box">
                  <div className="tp-pot-label-row">
                    <span className="tp-pot-label">Pot</span>
                    <span
                      className={
                        "tp-pot-value " +
                        (isPotAnimating ? "tp-pot-value--pulse" : "")
                      }
                    >
                      {pot}
                    </span>
                  </div>
                  <span className="tp-boot-label">Boot: {bootAmount}</span>
                </div>
              </div>

              <div className="tp-table-felt-row">
                <div className="tp-table-felt-inner">
                  {/* table background / image */}
                  <div className="tp-table-image" />

                  {/* three fixed seats: left (Bot 1), center (You), right (Bot 2) */}
                  <div className="tp-seats-row">
                    {/* Bot 1 - left */}
                    {players[1] && (
                      <div
                        className={
                          "tp-seat-card " +
                          (winnerIds.includes(players[1].id)
                            ? "tp-seat-card--winner"
                            : "")
                        }
                      >
                        <div className="tp-player-header">
                          <span className="tp-player-name">
                            {players[1].name}
                          </span>
                          <span className="tp-player-chips">
                            {players[1].chips}
                          </span>
                        </div>
                        <div className="tp-player-cards">
                          {players[1].cards.map((card, idx) => (
                            <div
                              key={idx}
                              className={
                                "tp-card tp-card--small " +
                                (revealAll ? "tp-card--face" : "tp-card--back")
                              }
                            >
                              {revealAll && (
                                <span className="tp-card-text">
                                  {card.rank}
                                  <span className="tp-card-suit">
                                    {card.suit}
                                  </span>
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        {players[1].hasFolded && (
                          <div className="tp-status-badge">Folded</div>
                        )}
                      </div>
                    )}

                    {/* You - center */}
                    <div
                      className={
                        "tp-seat-card tp-seat-card--human " +
                        (winnerIds.includes(human.id)
                          ? "tp-seat-card--winner"
                          : "")
                      }
                    >
                      <div className="tp-player-header">
                        <span className="tp-player-name">{human.name}</span>
                        <span className="tp-player-chips">{human.chips}</span>
                      </div>
                      <div className="tp-player-cards tp-player-cards--human">
                        {human.cards.map((card, idx) => {
                          const showFace = !human.isBlind || revealAll;
                          return (
                            <div
                              key={idx}
                              className={
                                "tp-card tp-card--human " +
                                (showFace ? "tp-card--face" : "tp-card--back")
                              }
                            >
                              {showFace && (
                                <span className="tp-card-text">
                                  {card.rank}
                                  <span className="tp-card-suit">
                                    {card.suit}
                                  </span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="tp-player-footer">
                        {humanHandInfo && (
                          <span className="tp-hand-label">
                            {humanHandInfo.name}
                          </span>
                        )}
                        {human.isBlind ? (
                          <span className="tp-mode-pill">Blind</span>
                        ) : (
                          <span className="tp-mode-pill tp-mode-pill--seen">
                            Seen
                          </span>
                        )}
                        {human.hasFolded && (
                          <span className="tp-status-badge">Folded</span>
                        )}
                      </div>
                    </div>

                    {/* Bot 2 - right */}
                    {players[2] && (
                      <div
                        className={
                          "tp-seat-card " +
                          (winnerIds.includes(players[2].id)
                            ? "tp-seat-card--winner"
                            : "")
                        }
                      >
                        <div className="tp-player-header">
                          <span className="tp-player-name">
                            {players[2].name}
                          </span>
                          <span className="tp-player-chips">
                            {players[2].chips}
                          </span>
                        </div>
                        <div className="tp-player-cards">
                          {players[2].cards.map((card, idx) => (
                            <div
                              key={idx}
                              className={
                                "tp-card tp-card--small " +
                                (revealAll ? "tp-card--face" : "tp-card--back")
                              }
                            >
                              {revealAll && (
                                <span className="tp-card-text">
                                  {card.rank}
                                  <span className="tp-card-suit">
                                    {card.suit}
                                  </span>
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        {players[2].hasFolded && (
                          <div className="tp-status-badge">Folded</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* action log stays under table */}
            <div className="tp-log">
              {log.map((line, idx) => (
                <div key={idx} className="tp-log-line">
                  {line}
                </div>
              ))}
            </div>
          </section>

          {/* controls */}
          <section className="tp-sidebar">
            <div className="tp-info-card">
              <div className="tp-info-row">
                <span className="label">Dealer</span>
                <span className="value">{players[dealerIndex].name}</span>
              </div>
              <div className="tp-info-row">
                <span className="label">Turn</span>
                <span className="value">{activePlayer.name}</span>
              </div>
              <div className="tp-info-row">
                <span className="label">Stake</span>
                <span className="value">{currentStake}</span>
              </div>
            </div>

            <div className="tp-panel">
              {/* primary actions */}
              <div className="tp-actions">
                {roundState === ROUND_STATES.IDLE && (
                  <button
                    type="button"
                    className="btn btn-primary tp-main-btn"
                    onClick={startRound}
                  >
                    Start Round
                  </button>
                )}

                {roundState === ROUND_STATES.BETTING &&
                  activePlayer.id === human.id &&
                  !human.hasFolded && (
                    <>
                      <div className="tp-actions-row">
                        {human.isBlind && (
                          <button
                            type="button"
                            className="btn btn-secondary tp-btn-sm"
                            onClick={handleSeeCards}
                          >
                            See Cards
                          </button>
                        )}
                        {canShow && (
                          <button
                            type="button"
                            className="btn btn-outline tp-btn-sm"
                            onClick={handleShow}
                          >
                            Show
                          </button>
                        )}
                      </div>
                      <div className="tp-actions-row">
                        <button
                          type="button"
                          className="btn btn-danger tp-main-btn"
                          onClick={handleFold}
                        >
                          Fold
                        </button>
                      </div>
                      <div className="tp-actions-row tp-actions-row--split">
                        <button
                          type="button"
                          className="btn btn-primary tp-main-btn"
                          onClick={handleCall}
                        >
                          Call{" "}
                          {human.isBlind ? currentStake : currentStake * 2}
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary tp-main-btn tp-main-btn--alt"
                          onClick={handleRaise}
                        >
                          Raise{" "}
                          {human.isBlind ? currentStake * 2 : currentStake * 4}
                        </button>
                      </div>
                    </>
                  )}

                {roundState === ROUND_STATES.FINISHED && (
                  <button
                    type="button"
                    className="btn btn-primary tp-main-btn"
                    onClick={hardResetGame}
                  >
                    New Round
                  </button>
                )}
              </div>

              {/* small hand ranking helper */}
              <div className="tp-hand-help">
                <h3>Hand Ranking (High → Low)</h3>
                <ul>
                  <li>Trail (AAA, KKK,...)</li>
                  <li>Pure Sequence (3 in order, same suit)</li>
                  <li>Sequence (3 in order)</li>
                  <li>Color (same suit)</li>
                  <li>Pair</li>
                  <li>High Card</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* result modal */}
      {roundState === ROUND_STATES.FINISHED && lastHandInfo && (
        <div className="tp-modal-backdrop">
          <div className="tp-modal">
            <h2>{lastHandInfo.title}</h2>
            <p>{lastHandInfo.text}</p>
            <div className="tp-modal-actions">
              <button
                type="button"
                className="btn btn-primary tp-main-btn"
                onClick={startRound}
              >
                Play Again
              </button>
              <button
                type="button"
                className="btn btn-outline tp-main-btn"
                onClick={hardResetGame}
              >
                New Round
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreePatti;
