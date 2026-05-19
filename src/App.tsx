import React, { useEffect, useState } from "react";
import "./App.css";

type Transaction = {
  id: number;
  date: string;
  description: string;
  amount: number;
  currency: string;
};

type FxPair = {
  symbol: string;
  base: string;
  quote: string;
  mid: number;
  spreadPips: number;
  volatility: number;
};

type Position = {
  id: number;
  pair: string;
  side: "BUY" | "SELL";
  lots: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
};

const FX_API_URL = "https://open.er-api.com/v6/latest/USD";

const initialBalance = 1250.75;
const initialTransactions: Transaction[] = [
  { id: 1, date: "2026-04-20", description: "Coffee Shop", amount: -4.5, currency: "USD" },
  { id: 2, date: "2026-04-19", description: "Salary", amount: 1500, currency: "USD" },
  { id: 3, date: "2026-04-18", description: "Groceries", amount: -120.3, currency: "USD" },
];

const basePairsConfig: { symbol: string; spreadPips: number; volatility: number }[] = [
  { symbol: "EUR/USD", spreadPips: 1.2, volatility: 0.0008 },
  { symbol: "GBP/USD", spreadPips: 1.8, volatility: 0.0012 },
  { symbol: "USD/JPY", spreadPips: 2.5, volatility: 0.15 },
  { symbol: "USD/CHF", spreadPips: 1.0, volatility: 0.0007 },
  { symbol: "USD/CAD", spreadPips: 1.4, volatility: 0.0009 },
  { symbol: "AUD/USD", spreadPips: 1.3, volatility: 0.0009 },
  { symbol: "NZD/USD", spreadPips: 1.4, volatility: 0.001 },
  { symbol: "USD/MXN", spreadPips: 8, volatility: 0.25 },
  { symbol: "USD/BRL", spreadPips: 10, volatility: 0.03 },
  { symbol: "USD/ARS", spreadPips: 80, volatility: 4 },
  { symbol: "USD/CLP", spreadPips: 40, volatility: 3 },
  { symbol: "USD/COP", spreadPips: 60, volatility: 10 },
  { symbol: "USD/PEN", spreadPips: 8, volatility: 0.02 },
  { symbol: "USD/CNY", spreadPips: 5, volatility: 0.02 },
  { symbol: "USD/HKD", spreadPips: 4, volatility: 0.01 },
  { symbol: "USD/SGD", spreadPips: 2, volatility: 0.0008 },
  { symbol: "USD/KRW", spreadPips: 30, volatility: 5 },
  { symbol: "USD/INR", spreadPips: 10, volatility: 0.3 },
  { symbol: "USD/ZAR", spreadPips: 15, volatility: 0.2 },
  { symbol: "USD/TRY", spreadPips: 25, volatility: 0.4 },
];

const initialPortfolio = [
  { name: "AAPL", value: 3200, change: +4.2 },
  { name: "TSLA", value: 1800, change: -2.1 },
  { name: "BTC", value: 9000, change: +12.5 },
  { name: "ETH", value: 4200, change: +6.8 },
  { name: "BND", value: 2500, change: +1.2 },
];

const phaseLabels: Record<string, string> = {
  phase1: "Phase 1 — Wallet & Transfers",
  phase2: "Phase 2 — FX Trading Engine",
  phase3: "Phase 3 — Investments",
  phase4: "Phase 4 — Lending",
  phase5: "Phase 5 — Global Unified Finance",
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [balance, setBalance] = useState(initialBalance);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [fxRates, setFxRates] = useState<Record<string, number>>({});
  const [fxLoading, setFxLoading] = useState<boolean>(true);
  const [fxError, setFxError] = useState<string | null>(null);

  const [pairs, setPairs] = useState<FxPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>("EUR/USD");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT" | "STOP">("MARKET");
  const [orderLots, setOrderLots] = useState<string>("0.10");
  const [orderPrice, setOrderPrice] = useState<string>("");
  const [positions, setPositions] = useState<Position[]>([]);
  const [nextPositionId, setNextPositionId] = useState(1);
  const [fxLastUpdate, setFxLastUpdate] = useState<Date | null>(null);

  const [portfolio] = useState(initialPortfolio);

  const [loanAmount, setLoanAmount] = useState("10000");
  const [loanYears, setLoanYears] = useState("3");
  const [loanRate, setLoanRate] = useState("12");

  const [baseCurrency] = useState("USD");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState("phase1");
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const formattedTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }
    setError(null);
    setIsLoggedIn(true);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill all fields.");
      return;
    }
    setError(null);
    alert("Account created (demo only). You can now log in.");
    setIsCreatingAccount(false);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const numericAmount = parseFloat(amount);
    if (!toAccount || isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid destination and amount.");
      return;
    }
    if (numericAmount > balance) {
      setError("Insufficient funds.");
      return;
    }

    const newBalance = balance - numericAmount;
    const newTransaction: Transaction = {
      id: transactions.length + 1,
      date: new Date().toISOString().slice(0, 10),
      description: note || `Transfer to ${toAccount}`,
      amount: -numericAmount,
      currency: "USD",
    };

    setBalance(newBalance);
    setTransactions([newTransaction, ...transactions]);
    setSuccess(`Transfer of $${numericAmount.toFixed(2)} sent.`);
    setToAccount("");
    setAmount("");
    setNote("");
  };

  useEffect(() => {
    let cancelled = false;

    async function loadRates() {
      try {
        setFxLoading(true);
        setFxError(null);
        const res = await fetch(FX_API_URL);
        const data = await res.json();
        if (!cancelled && data && data.rates) {
          setFxRates(data.rates);
          setFxLastUpdate(new Date());
        }
      } catch (err) {
        if (!cancelled) {
          console.error("FX API error:", err);
          setFxError("Error loading FX rates (demo continues with last known data).");
        }
      } finally {
        if (!cancelled) setFxLoading(false);
      }
    }

    loadRates();
    const interval = setInterval(loadRates, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!fxRates || Object.keys(fxRates).length === 0) return;

    const usdTo = fxRates;
    const newPairs: FxPair[] = [];

    basePairsConfig.forEach((cfg) => {
      const [base, quote] = cfg.symbol.split("/");
      let mid = 1;

      if (base === "USD" && usdTo[quote]) {
        mid = usdTo[quote];
      } else if (quote === "USD" && usdTo[base]) {
        mid = 1 / usdTo[base];
      } else if (usdTo[base] && usdTo[quote]) {
        mid = usdTo[quote] / usdTo[base];
      }

      newPairs.push({
        symbol: cfg.symbol,
        base,
        quote,
        mid,
        spreadPips: cfg.spreadPips,
        volatility: cfg.volatility,
      });
    });

    setPairs((prev) => {
      if (prev.length === 0) return newPairs;
      return prev.map((old) => {
        const updated = newPairs.find((p) => p.symbol === old.symbol);
        return updated ? { ...old, mid: updated.mid } : old;
      });
    });
  }, [fxRates]);

  useEffect(() => {
    if (pairs.length === 0) return;

    const interval = setInterval(() => {
      setPairs((prev) =>
        prev.map((p) => {
          const direction = Math.random() > 0.5 ? 1 : -1;
          const magnitude = p.volatility * (0.5 + Math.random());
          let newMid = p.mid + direction * magnitude;
          if (newMid <= 0) newMid = p.mid;
          return { ...p, mid: newMid };
        })
      );
      setFxLastUpdate(new Date());
    }, 900);

    return () => clearInterval(interval);
  }, [pairs.length]);

  const getPair = (symbol: string) => pairs.find((p) => p.symbol === symbol)!;

  const getBidAsk = (p: FxPair) => {
    const pipFactor = p.symbol.includes("JPY") ? 0.01 : 0.0001;
    const spread = p.spreadPips * pipFactor;
    const bid = p.mid - spread / 2;
    const ask = p.mid + spread / 2;
    return { bid, ask, spread };
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (pairs.length === 0) {
      setError("FX prices not available yet.");
      return;
    }

    const lots = parseFloat(orderLots);
    if (isNaN(lots) || lots <= 0) {
      setError("Invalid lot size.");
      return;
    }

    const pair = getPair(selectedPair);
    const { bid, ask } = getBidAsk(pair);

    let executionPrice = orderSide === "BUY" ? ask : bid;

    if (orderType !== "MARKET") {
      const limitPrice = parseFloat(orderPrice);
      if (isNaN(limitPrice) || limitPrice <= 0) {
        setError("Enter a valid price for limit/stop orders (simulated as instant fill).");
        return;
      }
      executionPrice = limitPrice;
    }

    const newPos: Position = {
      id: nextPositionId,
      pair: pair.symbol,
      side: orderSide,
      lots,
      entryPrice: executionPrice,
      currentPrice: executionPrice,
      pnl: 0,
    };

    setNextPositionId((id) => id + 1);
    setPositions((prev) => [...prev, newPos]);
    setSuccess(`Order filled: ${orderSide} ${lots} lot(s) ${pair.symbol} @ ${executionPrice.toFixed(5)}`);
    setOrderPrice("");
  };

  useEffect(() => {
    if (pairs.length === 0) return;

    setPositions((prev) =>
      prev.map((pos) => {
        const pair = getPair(pos.pair);
        const { bid, ask } = getBidAsk(pair);
        const current = pos.side === "BUY" ? bid : ask;
        const pipFactor = pair.symbol.includes("JPY") ? 0.01 : 0.0001;
        const pips = ((current - pos.entryPrice) / pipFactor) * (pos.side === "BUY" ? 1 : -1);
        const pipValuePerLot = 10;
        const pnl = pips * pipValuePerLot * pos.lots;
        return { ...pos, currentPrice: current, pnl };
      })
    );
  }, [pairs]);

  const handleClosePosition = (id: number) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  };

  const totalPnl = positions.reduce((acc, p) => acc + p.pnl, 0);

  const totalPortfolio = portfolio.reduce((acc, p) => acc + p.value, 0);
  const totalChange = portfolio.reduce((acc, p) => acc + (p.value * p.change) / 100, 0);
  const totalReturnPct = (totalChange / totalPortfolio) * 100;

  const loanAmountNum = parseFloat(loanAmount) || 0;
  const yearsNum = parseInt(loanYears) || 1;
  const rateNum = parseFloat(loanRate) / 100 || 0.12;

  const monthlyRate = rateNum / 12;
  const nPayments = yearsNum * 12;

  const monthlyPayment =
    loanAmountNum > 0 && monthlyRate > 0
      ? (loanAmountNum * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -nPayments))
      : loanAmountNum / nPayments || 0;

  const amortization = Array.from({ length: nPayments }, (_, i) => {
    const month = i + 1;
    let balanceRemaining = loanAmountNum;
    for (let k = 1; k < month; k++) {
      const interestK = balanceRemaining * monthlyRate;
      const principalK = monthlyPayment - interestK;
      balanceRemaining -= principalK;
    }
    const interest = balanceRemaining * monthlyRate;
    const principal = monthlyPayment - interest;
    const newBalance = balanceRemaining - principal;
    return {
      month,
      interest,
      principal,
      balance: newBalance < 0 ? 0 : newBalance,
    };
  });

  const totalPaid = monthlyPayment * nPayments;
  const totalInterest = totalPaid - loanAmountNum;

  const globalList = Object.entries(fxRates).map(([currency, rate]) => {
    const amount = 1000;
    const usdValue = amount * rate;
    return { currency, amount, rate, usdValue };
  });

  const totalGlobalUSD = globalList.reduce((acc, g) => acc + g.usdValue, 0);

  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="logo-row">
            <img src="/src/assets/qelvyra-logo.png" className="logo-large" />
            <h1 className="brand-large">QELVYRA</h1>
          </div>

          {!isCreatingAccount && (
            <>
              <p className="subtitle">Unified multi-currency finance, reimagined.</p>

              <form onSubmit={handleLogin} className="form">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

                {error && <div className="error">{error}</div>}

                <button className="primary">Sign in</button>
              </form>

              <button className="link" onClick={() => setIsCreatingAccount(true)}>
                Create new account
              </button>
            </>
          )}

          {isCreatingAccount && (
            <>
              <h2>Create Account</h2>

              <form onSubmit={handleCreateAccount} className="form">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

                {error && <div className="error">{error}</div>}

                <button className="primary">Create account</button>
              </form>

              <button className="link" onClick={() => setIsCreatingAccount(false)}>
                Back to login
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <img src="/src/assets/qelvyra-logo.png" className="logo-sidebar" />
        <h2 className="brand-sidebar">QELVYRA</h2>

        <h3 className="menu-title">Phases</h3>

        <button
          className={`menu-btn ${selectedPhase === "phase1" ? "active" : ""}`}
          onClick={() => setSelectedPhase("phase1")}
        >
          Phase 1 — Wallet & Transfers
        </button>

        <button
          className={`menu-btn ${selectedPhase === "phase2" ? "active" : ""}`}
          onClick={() => setSelectedPhase("phase2")}
        >
          Phase 2 — FX Trading Engine
        </button>

        <button
          className={`menu-btn ${selectedPhase === "phase3" ? "active" : ""}`}
          onClick={() => setSelectedPhase("phase3")}
        >
          Phase 3 — Investments
        </button>

        <button
          className={`menu-btn ${selectedPhase === "phase4" ? "active" : ""}`}
          onClick={() => setSelectedPhase("phase4")}
        >
          Phase 4 — Lending
        </button>

        <button
          className={`menu-btn ${selectedPhase === "phase5" ? "active" : ""}`}
          onClick={() => setSelectedPhase("phase5")}
        >
          Phase 5 — Global Unified Finance
        </button>
      </aside>

      <main className="content">
        <div className="top-bar">
          <div>
            <div className="label">Current phase</div>
            <div className="value">{phaseLabels[selectedPhase]}</div>
          </div>
          <div>
            <div className="label">Local time</div>
            <div className="value">{formattedTime}</div>
          </div>
          <div>
            <div className="label">FX status</div>
            <div className="value">
              {fxLoading && "Loading FX rates…"}
              {!fxLoading && fxLastUpdate && `Updated: ${fxLastUpdate.toLocaleTimeString()}`}
              {fxError && <span className="error-inline"> ({fxError})</span>}
            </div>
          </div>
        </div>

        {selectedPhase === "phase1" && (
          <>
            <div className="card">
              <h2>Account overview</h2>
              <p className="balance-label">Current balance</p>
              <p className="balance-value">${balance.toFixed(2)} USD</p>
              <p className="helper">This is a demo view. All data is simulated.</p>
            </div>

            <div className="card">
              <h2>Send money</h2>

              <form onSubmit={handleTransfer} className="form">
                <label>To account / email</label>
                <input value={toAccount} onChange={(e) => setToAccount(e.target.value)} />

                <label>Amount (USD)</label>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} />

                <label>Note (optional)</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} />

                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}

                <button className="primary">Send</button>
              </form>
            </div>

            <div className="card">
              <h2>Recent activity</h2>

              <ul className="tx-list">
                {transactions.map((tx) => (
                  <li key={tx.id} className="tx-item">
                    <div>
                      <div className="tx-desc">{tx.description}</div>
                      <div className="tx-meta">{tx.date}</div>
                    </div>
                    <div className={`tx-amount ${tx.amount < 0 ? "neg" : "pos"}`}>
                      {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount).toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {selectedPhase === "phase2" && (
          <div className="card">
            <h2>FX Trading Engine</h2>
            <p className="helper">
              High-volatility FX engine with real FX rates (ER-API), bid/ask, spreads, lots and floating P&amp;L.
            </p>

            {pairs.length === 0 && (
              <p className="helper">
                Waiting for FX rates from ER-API… If this takes too long, check your internet connection.
              </p>
            )}

            {pairs.length > 0 && (
              <div className="fx-layout">
                <div className="fx-left">
                  <label>Pair</label>
                  <select value={selectedPair} onChange={(e) => setSelectedPair(e.target.value)}>
                    {pairs.map((p) => (
                      <option key={p.symbol}>{p.symbol}</option>
                    ))}
                  </select>

                  {(() => {
                    const pair = getPair(selectedPair);
                    const { bid, ask, spread } = getBidAsk(pair);
                    return (
                      <div className="fx-prices">
                        <div>
                          <div className="fx-label">Bid</div>
                          <div className="fx-bid">{bid.toFixed(pair.symbol.includes("JPY") ? 3 : 5)}</div>
                        </div>
                        <div>
                          <div className="fx-label">Ask</div>
                          <div className="fx-ask">{ask.toFixed(pair.symbol.includes("JPY") ? 3 : 5)}</div>
                        </div>
                        <div>
                          <div className="fx-label">Spread</div>
                          <div className="fx-spread">{spread.toFixed(pair.symbol.includes("JPY") ? 3 : 5)}</div>
                        </div>
                      </div>
                    );
                  })()}

                  <form onSubmit={handlePlaceOrder} className="form fx-form">
                    <label>Side</label>
                    <div className="fx-side">
                      <button
                        type="button"
                        className={`side-btn ${orderSide === "BUY" ? "active" : ""}`}
                        onClick={() => setOrderSide("BUY")}
                      >
                        BUY
                      </button>
                      <button
                        type="button"
                        className={`side-btn ${orderSide === "SELL" ? "active" : ""}`}
                        onClick={() => setOrderSide("SELL")}
                      >
                        SELL
                      </button>
                    </div>

                    <label>Order type</label>
                    <select value={orderType} onChange={(e) => setOrderType(e.target.value as any)}>
                      <option value="MARKET">Market</option>
                      <option value="LIMIT">Limit</option>
                      <option value="STOP">Stop</option>
                    </select>

                    {orderType !== "MARKET" && (
                      <>
                        <label>Price (simulated instant fill)</label>
                        <input value={orderPrice} onChange={(e) => setOrderPrice(e.target.value)} />
                      </>
                    )}

                    <label>Lot size</label>
                    <select value={orderLots} onChange={(e) => setOrderLots(e.target.value)}>
                      <option value="0.01">0.01</option>
                      <option value="0.10">0.10</option>
                      <option value="0.50">0.50</option>
                      <option value="1.00">1.00</option>
                    </select>

                    <button className="primary">Place order</button>
                  </form>
                </div>

                <div className="fx-right">
                  <h3>Open positions</h3>
                  <p className="helper">Floating P&amp;L updates with every price tick.</p>

                  {positions.length === 0 && <p className="helper">No open positions yet.</p>}

                  {positions.length > 0 && (
                    <>
                      <div className="pnl-total">
                        Total P&amp;L:{" "}
                        <span className={totalPnl >= 0 ? "pos" : "neg"}>
                          {totalPnl >= 0 ? "+" : ""}
                          {totalPnl.toFixed(2)} USD
                        </span>
                      </div>
                      <ul className="tx-list">
                        {positions.map((pos) => (
                          <li key={pos.id} className="tx-item">
                            <div>
                              <div className="tx-desc">
                                {pos.side} {pos.lots} lot(s) {pos.pair}
                              </div>
                              <div className="tx-meta">
                                Entry: {pos.entryPrice.toFixed(5)} | Now: {pos.currentPrice.toFixed(5)}
                              </div>
                            </div>
                            <div className="fx-pos-right">
                              <div className={`tx-amount ${pos.pnl >= 0 ? "pos" : "neg"}`}>
                                {pos.pnl >= 0 ? "+" : ""}
                                {pos.pnl.toFixed(2)}
                              </div>
                              <button className="close-btn" onClick={() => handleClosePosition(pos.id)}>
                                Close
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedPhase === "phase3" && (
          <div className="card">
            <h2>Investments</h2>
            <p className="helper">Simulated multi-asset portfolio with simple performance visualization.</p>

            <div className="portfolio-summary">
              <div>
                <div className="label">Total value</div>
                <div className="value">${totalPortfolio.toFixed(2)}</div>
              </div>
              <div>
                <div className="label">Total P&amp;L</div>
                <div className={`value ${totalChange >= 0 ? "pos" : "neg"}`}>
                  {totalChange >= 0 ? "+" : ""}
                  {totalChange.toFixed(2)} USD
                </div>
              </div>
              <div>
                <div className="label">Return</div>
                <div className={`value ${totalReturnPct >= 0 ? "pos" : "neg"}`}>
                  {totalReturnPct >= 0 ? "+" : ""}
                  {totalReturnPct.toFixed(2)}%
                </div>
              </div>
            </div>

            <ul className="tx-list">
              {portfolio.map((p) => (
                <li key={p.name} className="tx-item">
                  <div>
                    <div className="tx-desc">{p.name}</div>
                    <div className="tx-meta">${p.value.toFixed(2)}</div>
                  </div>
                  <div className={`tx-amount ${p.change < 0 ? "neg" : "pos"}`}>
                    {p.change > 0 ? "+" : ""}
                    {p.change}%
                  </div>
                </li>
              ))}
            </ul>

            <p className="helper">Simple bar chart (no external libraries):</p>
            <div className="graph">
              {portfolio.map((p) => (
                <div
                  key={p.name}
                  className="bar"
                  style={{
                    height: `${Math.abs(p.change) * 4 + 20}px`,
                    background: p.change >= 0 ? "#00ffb3" : "#ff6b6b",
                  }}
                >
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedPhase === "phase4" && (
          <div className="card">
            <h2>Lending Simulator</h2>
            <p className="helper">Amortization schedule with monthly payment, interest and principal breakdown.</p>

            <div className="lending-grid">
              <div>
                <label>Loan amount (USD)</label>
                <input value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />

                <label>Years</label>
                <select value={loanYears} onChange={(e) => setLoanYears(e.target.value)}>
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>5</option>
                  <option>10</option>
                </select>

                <label>Interest rate (APR %)</label>
                <input value={loanRate} onChange={(e) => setLoanRate(e.target.value)} />

                <div className="portfolio-summary">
                  <div>
                    <div className="label">Monthly payment</div>
                    <div className="value">${monthlyPayment.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="label">Total paid</div>
                    <div className="value">${totalPaid.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="label">Total interest</div>
                    <div className="value">${totalInterest.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="amort-table">
                <div className="amort-header">
                  <span>Month</span>
                  <span>Interest</span>
                  <span>Principal</span>
                  <span>Balance</span>
                </div>
                <div className="amort-body">
                  {amortization.slice(0, 36).map((row) => (
                    <div key={row.month} className="amort-row">
                      <span>{row.month}</span>
                      <span>${row.interest.toFixed(2)}</span>
                      <span>${row.principal.toFixed(2)}</span>
                      <span>${row.balance.toFixed(2)}</span>
                    </div>
                  ))}
                  {amortization.length > 36 && <div className="helper">… truncated for demo</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedPhase === "phase5" && (
          <div className="card">
            <h2>Global Unified Finance</h2>
            <p className="helper">
              Consolidated view of balances across all currencies from ER-API, converted to {baseCurrency} for a unified
              picture.
            </p>

            {Object.keys(fxRates).length === 0 && (
              <p className="helper">
                Waiting for FX rates from ER-API… If this takes too long, check your internet connection.
              </p>
            )}

            {Object.keys(fxRates).length > 0 && (
              <>
                <div className="portfolio-summary">
                  <div>
                    <div className="label">Global assets (demo)</div>
                    <div className="value">
                      ${totalGlobalUSD.toFixed(2)} {baseCurrency}
                    </div>
                  </div>
                  <div>
                    <div className="label">Currencies loaded</div>
                    <div className="value">{Object.keys(fxRates).length}</div>
                  </div>
                </div>

                <ul className="tx-list">
                  {globalList.slice(0, 80).map((g, idx) => (
                    <li key={idx} className="tx-item">
                      <div>
                        <div className="tx-desc">{g.currency}</div>
                        <div className="tx-meta">Rate vs {baseCurrency}: {g.rate.toFixed(6)}</div>
                      </div>
                      <div className="tx-amount pos">
                        {g.amount.toLocaleString()} {g.currency} ≈ ${g.usdValue.toFixed(2)} {baseCurrency}
                      </div>
                    </li>
                  ))}
                  {globalList.length > 80 && <div className="helper">… truncated for demo</div>}
                </ul>

                <p className="helper">
                  All values are simulated using 1,000 units per currency and converted using real FX rates from ER-API.
                </p>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
