import { useState, useEffect, useMemo } from "react";
import { 
  Handshake, 
  History, 
  Play, 
  Check, 
  AlertCircle,
  Flame,
  Briefcase,
  TrendingUp,
  Users,
  Home,
  Newspaper
} from "lucide-react";
import { Stock, MergerTarget, MarketNews, TransactionHistory, NegotiationMood } from "./types";
import { initialStocks, initialMergers, initialStaff, officeTiers, newsList } from "./game/GameData";
import { 
  saveGameToCloud, 
  initFirebase, 
  isFirebaseConnected
} from "./firebase";

export default function App() {
  // Onboarding & user profile state
  const [userName, setUserName] = useState<string>("");
  const [startType, setStartType] = useState<"Easier" | "Hard" | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);

  // Core Game State
  const [cash, setCash] = useState<number>(25000);
  const [day, setDay] = useState<number>(1);
  const [stocks, setStocks] = useState<Stock[]>(initialStocks);
  const [mergers, setMergers] = useState<MergerTarget[]>(initialMergers);
  const [selectedTab, setSelectedTab] = useState<"HQ" | "FLOOR" | "DEALS" | "STAFF" | "OFFICE" | "STATS" | "NEWS">("HQ");
  const [activeNews, setActiveNews] = useState<MarketNews | null>(newsList[0]);
  const [newsFeed, setNewsFeed] = useState<MarketNews[]>([newsList[0]]);
  const [pendingWeeklyDeal, setPendingWeeklyDeal] = useState<MergerTarget | null>(null);
  const [transactions, setTransactions] = useState<TransactionHistory[]>([
    { day: 1, type: "DIVIDEND", subject: "Initial Fund Injection", amount: 25000, isPositive: true }
  ]);

  // Office & Staff hires
  const [officeId, setOfficeId] = useState<string>("desk");
  const [hiredStaffIds, setHiredStaffIds] = useState<string[]>([]);
  const [lastCashCallDay, setLastCashCallDay] = useState<number>(0);
  const [marketingBlitzCount, setMarketingBlitzCount] = useState<number>(0);

  // Sub-UI state
  const [selectedStockTicker, setSelectedStockTicker] = useState<string>("AETH");
  const [tradeAmountInput, setTradeAmountInput] = useState<string>("10");
  const [selectedMergerId, setSelectedMergerId] = useState<string>("cafe");
  const [draftOffer, setDraftOffer] = useState<number>(32000);
  const [boardroomSubTab, setBoardroomSubTab] = useState<"negotiate" | "subsidiaries">("negotiate");

  // Notifications / Modal displays
  const [morningBriefOpen, setMorningBriefOpen] = useState<boolean>(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successDealClosed, setSuccessDealClosed] = useState<string | null>(null);

  // Toast notifications State
  interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "info";
  }
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Show Toast notification popup helper
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Intercept the legacy infoMessage and errorMessage triggers
  useEffect(() => {
    if (infoMessage) {
      showToast(infoMessage, "success");
      setInfoMessage(null);
    }
  }, [infoMessage]);

  useEffect(() => {
    if (errorMessage) {
      showToast(errorMessage, "error");
      setErrorMessage(null);
    }
  }, [errorMessage]);

  // Attempt to initialize Firebase silently from stored config or env on mount
  useEffect(() => {
    const configData = localStorage.getItem("apex_firebase_config");
    if (configData) {
      try {
        const parsed = JSON.parse(configData);
        initFirebase(parsed);
      } catch (e) {
        console.error("Failed to parse stored Firebase config", e);
      }
    } else {
      initFirebase();
    }
  }, []);

  // Load game from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("apex_capital_v2_savegame");
      if (savedData) {
        const state = JSON.parse(savedData);
        if (state.userName && state.startType) {
          setUserName(state.userName);
          setStartType(state.startType);
          setCash(state.cash ?? 25000);
          setDay(state.day ?? 1);

          // Safe backfill for stocks
          let loadedStocks = state.stocks ?? initialStocks;
          if (loadedStocks.length < 100) {
            const extraStocks = initialStocks.slice(loadedStocks.length);
            loadedStocks = [...loadedStocks, ...extraStocks];
          }
          setStocks(loadedStocks);

          // Safe backfill for boardroom mergers
          let loadedMergers = state.mergers ?? initialMergers;
          const firstFiveIds = new Set(["cafe", "solaris", "biogen", "nova", "shld"]);
          if (loadedMergers.length < 105) {
            const existingIds = new Set(loadedMergers.map((m: any) => m.id));
            const extraMergers = initialMergers.filter(m => !existingIds.has(m.id));
            loadedMergers = [...loadedMergers, ...extraMergers];
          }
          // Guarantee modern corporate metadata defaults on loaded entities
          loadedMergers = loadedMergers.map((m: any) => {
            const initialMatch = initialMergers.find(im => im.id === m.id);
            const dailyIncome = initialMatch ? initialMatch.dailyIncome : m.dailyIncome;
            const synergyText = initialMatch ? initialMatch.synergyText : m.synergyText;
            return {
              ...m,
              dailyIncome,
              synergyText,
              stakeOwned: m.stakeOwned !== undefined ? m.stakeOwned : (m.isCompleted ? 100 : 0),
              ceoType: m.ceoType ?? "original",
              staffType: m.staffType ?? "standard",
              isIPOed: m.isIPOed ?? false,
              reinvestInvestmentAmount: m.reinvestInvestmentAmount ?? 0,
              growthRateCompound: m.growthRateCompound ?? 0.04,
              isOpenToNegotiate: m.isOpenToNegotiate !== undefined ? m.isOpenToNegotiate : firstFiveIds.has(m.id)
            };
          });
          setMergers(loadedMergers);

          setSelectedTab(state.selectedTab ?? "HQ");
          setActiveNews(state.activeNews ?? newsList[0]);
          setNewsFeed(state.newsFeed ?? [state.activeNews ?? newsList[0]]);
          setTransactions(state.transactions ?? []);
          setOfficeId(state.officeId ?? "desk");
          setHiredStaffIds(state.hiredStaffIds ?? []);
          setLastCashCallDay(state.lastCashCallDay ?? 0);
          setMarketingBlitzCount(state.marketingBlitzCount ?? 0);
          setIsOnboarded(true);
        }
      }
    } catch (e) {
      console.error("Failed loading savegame:", e);
    }
  }, []);

  // Save game state to local and cloud
  const saveGame = (updatedState: any) => {
    try {
      const stateToSave = {
        ...updatedState,
        lastCashCallDay,
        marketingBlitzCount
      };
      localStorage.setItem("apex_capital_v2_savegame", JSON.stringify(stateToSave));
      
      // Save to Firebase Cloud as well if connected
      if (isFirebaseConnected()) {
        saveGameToCloud(updatedState.userName, stateToSave)
          .then(success => {
            if (success) {
              console.log("Uploaded game save stably to Firebase Firestore!");
            }
          })
          .catch(err => {
            console.error("Firebase cloud save error:", err);
          });
      }
    } catch (e) {
      console.error("Savegame sync fail:", e);
    }
  };

  // Helper getters
  const currentOffice = useMemo(() => {
    return officeTiers.find(o => o.id === officeId) || officeTiers[0];
  }, [officeId]);

  const activeStock = useMemo(() => {
    return stocks.find(s => s.ticker === selectedStockTicker) || stocks[0];
  }, [stocks, selectedStockTicker]);

  const activeMerger = useMemo(() => {
    return mergers.find(m => m.id === selectedMergerId) || mergers[0];
  }, [mergers, selectedMergerId]);

  const portfolioValue = useMemo(() => {
    return stocks.reduce((sum, stock) => sum + (stock.sharesOwned * stock.currentPrice), 0);
  }, [stocks]);

  const netWorth = useMemo(() => {
    return cash + portfolioValue;
  }, [cash, portfolioValue]);

  // Sync draft proposal valuation
  useEffect(() => {
    if (activeMerger) {
      setDraftOffer(Math.round(activeMerger.currentAskingPrice));
    }
  }, [selectedMergerId, activeMerger]);

  // Quick helper to format currency professionally
  const formatCurrency = (val: number): string => {
    if (val >= 1_000_000) {
      return `$${(val / 1_000_000).toFixed(2)}M`;
    }
    return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Display daily earnings
  const dailyPassiveEarnings = useMemo(() => {
    let sum = 0;
    mergers.filter(m => m.isCompleted).forEach((m, idx) => {
      let income = m.dailyIncome;
      
      // Apply CEO Strategy
      if (m.ceoType === "risky") {
        const isLucky = (day + idx) % 2 === 0;
        income = isLucky ? Math.round(income * 1.9) : Math.round(income * 0.45);
      } else if (m.ceoType === "synergy") {
        income = Math.round(income * 1.15);
      } else if (m.ceoType === "ai") {
        income = Math.round(income * 1.05);
      }
      
      // Apply Staff Headcount multiplier
      if (m.staffType === "lean") {
        income = Math.round(income * 0.8);
      } else if (m.staffType === "high") {
        income = Math.round(income * 1.50);
      }
      
      sum += income;
    });

    // Carter boosts passive yields by 25%
    if (hiredStaffIds.includes("carter")) {
      sum = Math.round(sum * 1.25);
    }
    return sum;
  }, [mergers, day, hiredStaffIds]);

  const dailyDeductions = useMemo(() => {
    let rent = currentOffice.dailyRent;
    let salaries = initialStaff
      .filter(s => hiredStaffIds.includes(s.id))
      .reduce((sum, curr) => sum + curr.dailySalary, 0);

    // Extra subsidiary wages for high-performance staffing
    let subUpkeeps = 0;
    mergers.filter(m => m.isCompleted).forEach(m => {
      if (m.staffType === "high") {
        subUpkeeps += 400;
      }
    });

    return rent + salaries + subUpkeeps;
  }, [officeId, hiredStaffIds, currentOffice, mergers]);

  // 1. UPDATE SUBSIDIARY CEO GOVERNANCE STRATEGY
  const updateSubsidiaryCEO = (id: string, ceoType: "original" | "risky" | "synergy" | "ai") => {
    if (ceoType === "ai") {
      if (cash < 15000) {
        showToast("Insufficient capital to install AI Operations Agent ($15,000 required).", "error");
        return;
      }
      setCash(prev => prev - 15000);
      showToast("AI Operations Agent deployed successfully! Passive compounding grew +3%.", "success");
    } else {
      showToast(`CEO Governance updated to ${ceoType.toUpperCase()} plan.`, "success");
    }

    setMergers(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, ceoType };
      }
      return m;
    }));
  };

  // 2. UPDATE SUBSIDIARY STAFFING MODEL
  const updateSubsidiaryStaff = (id: string, staffType: "lean" | "standard" | "high") => {
    setMergers(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, staffType };
      }
      return m;
    }));
    showToast(`Subsidiary staffing set to ${staffType.toUpperCase()} mode.`, "info");
  };

  // 3. REINVEST AND EXPAND SUBSIDIARY
  const reinvestInSubsidiary = (id: string) => {
    const m = mergers.find(item => item.id === id);
    if (!m) return;
    
    let cost = 10000;
    if (m.baseValuation < 100000) cost = 5000;
    else if (m.baseValuation < 500000) cost = 25000;
    else if (m.baseValuation < 2000000) cost = 100000;
    else cost = 500000;

    if (cash < cost) {
      showToast(`Insufficient liquid cash. Required: ${formatCurrency(cost)}`, "error");
      return;
    }

    setCash(prev => prev - cost);

    setMergers(prev => prev.map(item => {
      if (item.id === id) {
        const yieldBoost = Math.round(item.dailyIncome * 0.20);
        const valBoost = Math.round(cost * 1.30);
        return {
          ...item,
          dailyIncome: item.dailyIncome + yieldBoost,
          baseValuation: item.baseValuation + valBoost,
          currentAskingPrice: item.baseValuation + valBoost
        };
      }
      return item;
    }));

    showToast(`Reinvestment successful! Income increased by +20% and company valuation expanded.`, "success");
  };

  // 4. LAUNCH SUBSIDIARY INITIAL PUBLIC OFFERING (IPO)
  const launchSubsidiaryIPO = (id: string) => {
    const m = mergers.find(item => item.id === id);
    if (!m) return;

    if (m.isIPOed) {
      showToast("Company is already listed on the public exchange.", "error");
      return;
    }

    let ticker = "M_" + m.name.split(" ")[0].substring(0, 3).toUpperCase();
    ticker = ticker.replace(/[^A-Z]/g, "X");
    while (ticker.length < 3) ticker += "X";
    if (ticker.length > 5) ticker = ticker.substring(0, 5);

    const instantCash = Math.round(m.baseValuation * 0.30);
    setCash(prev => prev + instantCash);

    setMergers(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          isIPOed: true,
          ipoTicker: ticker,
          stakeOwned: 70
        };
      }
      return item;
    }));

    const ipoPrice = Math.round((m.baseValuation / 1150) * 10) / 10;
    const newStock: Stock = {
      ticker,
      name: `${m.name} (Acquired)`,
      currentPrice: ipoPrice,
      priceHistory: [
        Math.round(ipoPrice * 0.9 * 10) / 10,
        Math.round(ipoPrice * 1.05 * 10) / 10,
        Math.round(ipoPrice * 0.95 * 10) / 10,
        ipoPrice
      ],
      sharesOwned: 0,
      avgBuyPrice: 0,
      volatility: m.ceoType === "risky" ? 0.55 : 0.18,
      sector: m.sector,
      dailyTrendFactor: 1.0
    };

    setStocks(prev => [newStock, ...prev]);

    setTransactions(prev => [
      ...prev,
      {
        day,
        type: "DIVIDEND",
        subject: `IPO Underwriting: ${m.name} [30% sold]`,
        amount: instantCash,
        isPositive: true
      }
    ]);

    showToast(`🎉 SEC Approved IPO! Sold 30% equity for ${formatCurrency(instantCash)} cash. Listed as Ticker: ${ticker}`, "success");
  };

  // NEW ATTRACTIVE FEATURE: BOARDROOM MARKETING BLITZ
  const executeMarketingBlitz = () => {
    const cost = 75000;
    const completedCount = mergers.filter(m => m.isCompleted).length;
    if (completedCount === 0) {
      showToast("Requires at least 1 acquired subsidiary to run a marketing campaign.", "error");
      return;
    }
    if (cash < cost) {
      showToast(`Insufficient corporate capital. Need ${formatCurrency(cost)}`, "error");
      return;
    }

    setCash(prev => prev - cost);
    setMarketingBlitzCount(prev => prev + 1);

    const updatedMergers = mergers.map(m => {
      if (m.isCompleted) {
        const yieldBoost = Math.round(m.dailyIncome * 0.15);
        return {
          ...m,
          dailyIncome: m.dailyIncome + yieldBoost,
          baseValuation: Math.round(m.baseValuation * 1.15),
          currentAskingPrice: Math.round(m.baseValuation * 1.15)
        };
      }
      return m;
    });

    setMergers(updatedMergers);
    
    const logs: TransactionHistory[] = [
      ...transactions,
      {
        day,
        type: "SALARY",
        subject: "Marketing Campaign Blitz Campaign",
        amount: cost,
        isPositive: false
      }
    ];
    setTransactions(logs);

    showToast(`🚀 Global Campaign Launched! All subsidiaries received permanent +15% passive dividend yields.`, "success");

    saveGame({
      userName,
      startType,
      cash: cash - cost,
      day,
      stocks,
      mergers: updatedMergers,
      selectedTab,
      activeNews,
      newsFeed,
      transactions: logs,
      officeId,
      hiredStaffIds
    });
  };

  // NEW ATTRACTIVE FEATURE: GLOBAL EXECUTIVE MASTERMIND SUMMIT
  const executeCEOSummit = () => {
    const cost = 40000;
    if (cash < cost) {
      showToast(`Insufficient corporate capital. Need ${formatCurrency(cost)}`, "error");
      return;
    }

    setCash(prev => prev - cost);

    const updatedMergers = mergers.map(m => {
      if (!m.isCompleted && !m.isWalkedOut) {
        const newTrust = Math.min(100, m.trust + 20);
        let mood = m.mood;
        if (newTrust < 25) mood = "Defensive";
        else if (newTrust < 45) mood = "Greedy";
        else if (newTrust < 75) mood = "Reasonable";
        else mood = "Thrilled";

        return {
          ...m,
          trust: newTrust,
          mood
        };
      }
      return m;
    });

    setMergers(updatedMergers);

    const logs: TransactionHistory[] = [
      ...transactions,
      {
        day,
        type: "SALARY",
        subject: "CEO Mastermind Summit",
        amount: cost,
        isPositive: false
      }
    ];
    setTransactions(logs);

    showToast(`🤝 Hosted Mastermind Summit! +20 Trust gained with all pipeline negotiation targets.`, "success");

    saveGame({
      userName,
      startType,
      cash: cash - cost,
      day,
      stocks,
      mergers: updatedMergers,
      selectedTab,
      activeNews,
      newsFeed,
      transactions: logs,
      officeId,
      hiredStaffIds
    });
  };

  // NEW ATTRACTIVE FEATURE: EMERGENCY BOARD CASH CALL (DIVIDEND DISTRIBUTION DRAW)
  const executeEmergencyCashCall = () => {
    const completedCount = mergers.filter(m => m.isCompleted).length;
    if (completedCount === 0) {
      showToast("Requires at least 1 acquired subsidiary to execute a board cash call.", "error");
      return;
    }

    const daysElapsed = day - lastCashCallDay;
    if (lastCashCallDay > 0 && daysElapsed < 15) {
      showToast(`Emergency cash call is on cooldown. Available in ${15 - daysElapsed} days.`, "error");
      return;
    }

    const dividendPayout = completedCount * 150000;
    setCash(prev => prev + dividendPayout);
    setLastCashCallDay(day);

    const logs: TransactionHistory[] = [
      ...transactions,
      {
        day,
        type: "DIVIDEND",
        subject: "Emergency Board Cash Call Dividend Draw",
        amount: dividendPayout,
        isPositive: true
      }
    ];
    setTransactions(logs);

    showToast(`💰 Boardroom Approved! Drew emergency dividends of ${formatCurrency(dividendPayout)} from control assets.`, "success");

    saveGame({
      userName,
      startType,
      cash: cash + dividendPayout,
      day,
      stocks,
      mergers,
      selectedTab,
      activeNews,
      newsFeed,
      transactions: logs,
      officeId,
      hiredStaffIds
    });
  };

  // Toast auto-clear
  useEffect(() => {
    if (infoMessage || errorMessage) {
      const timer = setTimeout(() => {
        setInfoMessage(null);
        setErrorMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [infoMessage, errorMessage]);

  // ADVANCE NEXT DAY CORE ROUTINE
  const advanceDay = () => {
    const nextDayNum = day + 1;
    const rent = currentOffice.dailyRent;
    const salaries = initialStaff
      .filter(s => hiredStaffIds.includes(s.id))
      .reduce((sum, curr) => sum + curr.dailySalary, 0);
    const totalOutflow = rent + salaries;

    const netCashFlow = dailyPassiveEarnings - totalOutflow;
    const nextCash = cash + netCashFlow;

    // Set next news update
    const newsIdx = (nextDayNum - 1) % newsList.length;
    const todayNews = newsList[newsIdx];

    // Fluctuate Stocks
    const updatedStocks = stocks.map(stock => {
      let newsMultiplier = 1.0;
      if (todayNews.affectedTicker === "ALL" || todayNews.affectedTicker === stock.ticker) {
        newsMultiplier = todayNews.priceMultiplier;
      }

      // Volatility logic
      const randSeed = (Math.random() * 2) - 1;
      const fluctuationFactor = 1.0 + (randSeed * stock.volatility);
      let nextPrice = stock.currentPrice * fluctuationFactor * newsMultiplier;

      // Clamp limits
      if (nextPrice < 1.0) nextPrice = 1.0 + Math.random() * 2;
      if (nextPrice > 10000.0) nextPrice = 10000.0;

      const newHistory = [...stock.priceHistory, nextPrice];
      if (newHistory.length > 8) newHistory.shift();

      return {
        ...stock,
        currentPrice: Math.round(nextPrice * 100) / 100,
        priceHistory: newHistory
      };
    });

    // PR Director Maximilian Drake restores +3 trust to all target CEOs
    let mergersCompounded = 0;
    const updatedMergers = mergers.map((m) => {
      let updatedM = { ...m };
      
      if (!updatedM.isCompleted && !updatedM.isWalkedOut) {
        const trustGain = hiredStaffIds.includes("drake") ? 3 : 0;
        const nextTrust = Math.min(100, updatedM.trust + trustGain);
        
        let mood: NegotiationMood = "Reasonable";
        if (nextTrust < 25) mood = "Defensive";
        else if (nextTrust < 45) mood = "Greedy";
        else if (nextTrust < 75) mood = "Reasonable";
        else mood = "Thrilled";
        
        updatedM.trust = nextTrust;
        updatedM.mood = mood;
      }

      // Weekly compounding logic (runs at the start of a week, i.e. Day 8, 15, 22...)
      if (updatedM.isCompleted && nextDayNum % 7 === 1) {
        let baseRate = updatedM.growthRateCompound ?? 0.04;
        
        // CEO strategy influences compounding yields
        if (updatedM.ceoType === "risky") {
          baseRate = Math.random() > 0.45 ? baseRate * 2.2 : -0.01;
        } else if (updatedM.ceoType === "ai") {
          baseRate += 0.03;
        }

        const multiplier = 1 + baseRate;
        updatedM.dailyIncome = Math.round(updatedM.dailyIncome * multiplier);
        updatedM.baseValuation = Math.round(updatedM.baseValuation * multiplier);
        updatedM.currentAskingPrice = updatedM.baseValuation;
        
        mergersCompounded++;
      }
      
      return updatedM;
    });

    // IPO Public Stock prices react dynamically to company management quality!
    const finalStocks = updatedStocks.map(stock => {
      const correspondingMerger = mergers.find(m => m.isCompleted && m.isIPOed && m.ipoTicker === stock.ticker);
      if (correspondingMerger) {
        let dailyMovement = 1.0;
        
        if (correspondingMerger.staffType === "high") {
          dailyMovement = 1.012; 
        } else if (correspondingMerger.staffType === "lean") {
          dailyMovement = 0.988; 
        } else {
          dailyMovement = 1.002; 
        }
        
        let weeklyBoost = 1.0;
        if (nextDayNum % 7 === 1) {
          const compRate = correspondingMerger.growthRateCompound ?? 0.04;
          weeklyBoost = 1.0 + compRate;
        }
        
        let nextPrice = stock.currentPrice * dailyMovement * weeklyBoost;
        const randSeed = (Math.random() * 1) - 0.5;
        nextPrice = nextPrice * (1.0 + (randSeed * 0.04));
        
        if (nextPrice < 1.0) nextPrice = 1.0;
        if (nextPrice > 10000.0) nextPrice = 10000.0;
        
        const newHistory = [...stock.priceHistory, nextPrice];
        if (newHistory.length > 8) newHistory.shift();
        
        return {
          ...stock,
          currentPrice: Math.round(nextPrice * 100) / 100,
          priceHistory: newHistory
        };
      }
      return stock;
    });

    // Feed new daily news to Global Newsroom
    const nextNewsFeed = [todayNews, ...newsFeed];
    if (nextNewsFeed.length > 50) nextNewsFeed.pop();
    setNewsFeed(nextNewsFeed);

    // Trigger Weekly Deal Alert popup modal!
    if (nextDayNum % 7 === 1 && nextDayNum > 1) {
      const lockedDeals = updatedMergers.filter(m => !m.isOpenToNegotiate && !m.isCompleted && !m.isWalkedOut);
      if (lockedDeals.length > 0) {
        const randomDeal = lockedDeals[Math.floor(Math.random() * lockedDeals.length)];
        setPendingWeeklyDeal(randomDeal);
        showToast("📢 Multi-Million Dollar Investment Opportunity lands! Check proposal.", "info");
      }
    }

    // Updated transaction logs
    const nextLogs: TransactionHistory[] = [
      ...transactions,
      ...(dailyPassiveEarnings > 0 ? [{
        day: nextDayNum,
        type: "DIVIDEND" as const,
        subject: "Dynamic Portfolio Passive Earnings",
        amount: dailyPassiveEarnings,
        isPositive: true
      }] : []),
      ...(totalOutflow > 0 ? [{
        day: nextDayNum,
        type: "SALARY" as const,
        subject: "HQ Upkeep & Exec Salaries",
        amount: totalOutflow,
        isPositive: false
      }] : [])
    ];

    setCash(nextCash);
    setDay(nextDayNum);
    setStocks(finalStocks);
    setMergers(updatedMergers);
    setActiveNews(todayNews);
    setTransactions(nextLogs);
    setMorningBriefOpen(false); // No daily intrusive popup

    if (mergersCompounded > 0) {
      showToast(`Compounding update: ${mergersCompounded} subsidiaries compounded weekly returns!`, "success");
    } else {
      showToast(`Advanced to Day ${nextDayNum}! Check newsroom for market changes.`, "success");
    }

    // Save game state
    saveGame({
      userName,
      startType,
      cash: nextCash,
      day: nextDayNum,
      stocks: finalStocks,
      mergers: updatedMergers,
      selectedTab,
      activeNews: todayNews,
      newsFeed: nextNewsFeed,
      transactions: nextLogs,
      officeId,
      hiredStaffIds
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // BUY STOCKS FUNCTION
  const purchaseStock = (quantity: number) => {
    if (quantity <= 0 || isNaN(quantity)) {
      setErrorMessage("Enter a valid share volume.");
      return;
    }

    const totalCost = activeStock.currentPrice * quantity;
    if (totalCost > currentOffice.maxTradeLimit) {
      setErrorMessage(`Trade Limit Exceeded! Your current office (${currentOffice.name}) limits individual trades to ${formatCurrency(currentOffice.maxTradeLimit)}.`);
      return;
    }

    if (cash < totalCost) {
      setErrorMessage(`Insufficient funds! Need ${formatCurrency(totalCost)}, available: ${formatCurrency(cash)}.`);
      return;
    }

    const nextCash = cash - totalCost;
    const nextStocks = stocks.map(s => {
      if (s.ticker === activeStock.ticker) {
        const nextVolume = s.sharesOwned + quantity;
        const nextAvg = ((s.avgBuyPrice * s.sharesOwned) + (activeStock.currentPrice * quantity)) / nextVolume;
        return {
          ...s,
          sharesOwned: nextVolume,
          avgBuyPrice: Math.round(nextAvg * 100) / 100
        };
      }
      return s;
    });

    const nextLogs: TransactionHistory[] = [
      ...transactions,
      {
        day,
        type: "BUY",
        subject: `Bought ${quantity} shares of ${activeStock.ticker}`,
        amount: totalCost,
        isPositive: false
      }
    ];

    setCash(nextCash);
    setStocks(nextStocks);
    setTransactions(nextLogs);
    setInfoMessage(`Purchased ${quantity} shares of ${activeStock.ticker}!`);

    saveGame({
      userName,
      startType,
      cash: nextCash,
      day,
      stocks: nextStocks,
      mergers,
      selectedTab,
      activeNews,
      transactions: nextLogs,
      officeId,
      hiredStaffIds
    });
  };

  // SELL STOCKS FUNCTION
  const sellShares = (quantity: number) => {
    if (quantity <= 0 || isNaN(quantity)) {
      setErrorMessage("Enter a valid volume to liquidate.");
      return;
    }

    if (activeStock.sharesOwned < quantity) {
      setErrorMessage(`Inadequate shares! You only hold ${activeStock.sharesOwned} of ${activeStock.ticker}.`);
      return;
    }

    // Elara Sterling boosts sale markup yields by +4%!
    const markupMultiplier = hiredStaffIds.includes("sterling") ? 1.04 : 1.0;
    const sellPrice = activeStock.currentPrice * markupMultiplier;
    const totalCredit = sellPrice * quantity;

    if (totalCredit > currentOffice.maxTradeLimit) {
      setErrorMessage(`Trade Limit Exceeded! Current office limits trades to ${formatCurrency(currentOffice.maxTradeLimit)}.`);
      return;
    }

    const nextCash = cash + totalCredit;
    const nextStocks = stocks.map(s => {
      if (s.ticker === activeStock.ticker) {
        const remainingShares = s.sharesOwned - quantity;
        return {
          ...s,
          sharesOwned: remainingShares,
          avgBuyPrice: remainingShares === 0 ? 0 : s.avgBuyPrice
        };
      }
      return s;
    });

    const nextLogs: TransactionHistory[] = [
      ...transactions,
      {
        day,
        type: "SELL",
        subject: `Sold ${quantity} shares of ${activeStock.ticker} ${hiredStaffIds.includes("sterling") ? "(+4% Bot Bonus)" : ""}`,
        amount: totalCredit,
        isPositive: true
      }
    ];

    setCash(nextCash);
    setStocks(nextStocks);
    setTransactions(nextLogs);
    setInfoMessage(`Sold ${quantity} shares of ${activeStock.ticker}!`);

    saveGame({
      userName,
      startType,
      cash: nextCash,
      day,
      stocks: nextStocks,
      mergers,
      selectedTab,
      activeNews,
      transactions: nextLogs,
      officeId,
      hiredStaffIds
    });
  };

  // BOARD SYSTEM ACQUISITION DEALS
  const getAdjustedMinimumThreshold = (m: MergerTarget): number => {
    let min = m.minAcceptableThreshold;
    // Board seat terms lower threshold
    if (m.termBoardSeat) min -= m.baseValuation * 0.08;
    if (m.termEquityShare) min -= m.baseValuation * 0.12;
    if (m.termRetainCEO) min -= m.baseValuation * 0.05;
    // Broker Clara Croft drops minimum buyout demands by 5%
    if (hiredStaffIds.includes("croft")) {
      min -= m.baseValuation * 0.05;
    }
    return Math.max(min, m.baseValuation * 0.45);
  };

  const recalculateMoodAndWalkout = (id: string, updatedList: MergerTarget[]) => {
    return updatedList.map(item => {
      if (item.id === id) {
        let mood = item.mood;
        let isWalkedOut = item.isWalkedOut;
        let quote = item.dialogueQuote;

        if (item.trust <= 0) {
          mood = "Walked Out";
          isWalkedOut = true;
          quote = `“This is an insult. I am taking our board, leaving this shared incubator, and locking our doors. We are terminating negotiations. Breakup details attached.”`;
        } else if (item.trust < 25) mood = "Defensive";
        else if (item.trust < 45) mood = "Greedy";
        else if (item.trust < 75) mood = "Reasonable";
        else mood = "Thrilled";

        return { ...item, mood, isWalkedOut, dialogueQuote: quote };
      }
      return item;
    });
  };

  // HIGHLIGHT DEALS SYNERGIES
  const executeHighlightSynergies = () => {
    if (activeMerger.highlightedSynergiesCount >= 3) {
      setErrorMessage("No clean synergies remaining! They are tired of hearing reports.");
      return;
    }

    const nextCount = activeMerger.highlightedSynergiesCount + 1;
    const dropAmount = activeMerger.baseValuation * 0.05;
    const adjustedMin = getAdjustedMinimumThreshold(activeMerger);
    const nextAsking = Math.max(adjustedMin, activeMerger.currentAskingPrice - dropAmount);

    const updatedMergers = mergers.map(m => {
      if (m.id === selectedMergerId) {
        return {
          ...m,
          highlightedSynergiesCount: nextCount,
          currentAskingPrice: Math.round(nextAsking),
          trust: Math.min(100, m.trust + 10),
          dialogueQuote: `“Splendid! Your staff's research about integrating our market pipelines makes sense. We will adjust our cash demand to ${formatCurrency(nextAsking)}.”`
        };
      }
      return m;
    });

    const refreshed = recalculateMoodAndWalkout(selectedMergerId, updatedMergers);
    setMergers(refreshed);
    setInfoMessage("Synergies highlighted successfully!");

    saveGame({
      userName,
      startType,
      cash,
      day,
      stocks,
      mergers: refreshed,
      selectedTab,
      activeNews,
      transactions,
      officeId,
      hiredStaffIds
    });
  };

  // AUDIT SHEET ARGUE VALUATION
  const executeArgueValuation = () => {
    if (activeMerger.arguedValuationCount >= 3) {
      setErrorMessage("The CEO is fully fed up with your audits!");
      return;
    }

    const nextCount = activeMerger.arguedValuationCount + 1;
    let askingValue = activeMerger.currentAskingPrice;
    let nextTrust = Math.max(0, activeMerger.trust - 15);
    let quote = "";

    if (activeMerger.trust < 20) {
      // Backfires!
      askingValue = Math.round(activeMerger.currentAskingPrice * 1.05);
      nextTrust = Math.max(0, nextTrust - 10);
      quote = `“You have the audacity to challenge our bookkeeping values in public? This is unprofessional. In fact, our price is rising to ${formatCurrency(askingValue)}!”`;
    } else {
      askingValue = Math.round(Math.max(getAdjustedMinimumThreshold(activeMerger), activeMerger.currentAskingPrice - (activeMerger.baseValuation * 0.06)));
      quote = `“Ugh. Your quantitative analysts exposed minor operating leaks in our secondary warehouse models. I'll agree to cut our valuation to ${formatCurrency(askingValue)}.”`;
    }

    const updated = mergers.map(m => {
      if (m.id === selectedMergerId) {
        return {
          ...m,
          arguedValuationCount: nextCount,
          currentAskingPrice: askingValue,
          trust: nextTrust,
          dialogueQuote: quote
        };
      }
      return m;
    });

    const refreshed = recalculateMoodAndWalkout(selectedMergerId, updated);
    setMergers(refreshed);
    setInfoMessage("Spreadsheet audited! Price reduced, trust damaged.");

    saveGame({
      userName,
      startType,
      cash,
      day,
      stocks,
      mergers: refreshed,
      selectedTab,
      activeNews,
      transactions,
      officeId,
      hiredStaffIds
    });
  };

  // TABS BOARD SYSTEM SWEETENERS
  const toggleSweetener = (field: "termBoardSeat" | "termEquityShare" | "termRetainCEO") => {
    const nextMergers = mergers.map(m => {
      if (m.id === selectedMergerId) {
        const nextVal = !m[field];
        const multiplier = nextVal ? 1 : -1;
        
        let trustBonus = 0;
        let quote = "";
        if (field === "termBoardSeat") {
          trustBonus = 8 * multiplier;
          quote = nextVal 
            ? `“An advisory board seat grants us strategic security, Mr. ${userName}. Minimum demands reduced.”`
            : `“Retracting governance board representation? Highly defensive. Cash payout demand goes back up.”`;
        } else if (field === "termEquityShare") {
          trustBonus = 12 * multiplier;
          quote = nextVal
            ? `“Sharing fund equity aligns our interests with Apex Capital's upside completely. Valuation cut!”`
            : `“So you prefer a hostile shell extraction buyout? Prepare to wire more physical liquidity.”`;
        } else {
          trustBonus = 5 * multiplier;
          quote = nextVal
            ? `“Retaining operational CEO head status allows me to manage my science team. Excellent!”`
            : `“Exiling me from my foundation? Unfair. Price is non-negotiable.”`;
        }

        return {
          ...m,
          [field]: nextVal,
          dialogueQuote: quote,
          trust: Math.min(100, Math.max(0, m.trust + trustBonus))
        };
      }
      return m;
    });

    const refreshed = recalculateMoodAndWalkout(selectedMergerId, nextMergers);
    setMergers(refreshed);

    saveGame({
      userName,
      startType,
      cash,
      day,
      stocks,
      mergers: refreshed,
      selectedTab,
      activeNews,
      transactions,
      officeId,
      hiredStaffIds
    });
  };

  // SEAL MERGER / ACQUISITION
  const finalizeVentureAcquisition = () => {
    if (activeMerger.isCompleted) return;

    if (cash < draftOffer) {
      setErrorMessage(`Insufficient Capital! Sealing this takeover buyout requires ${formatCurrency(draftOffer)}, but we only hold ${formatCurrency(cash)}.`);
      return;
    }

    const minAccept = getAdjustedMinimumThreshold(activeMerger);
    if (draftOffer >= minAccept) {
      // SUCCESS!
      const nextMergers = mergers.map(m => {
        if (m.id === selectedMergerId) {
          return {
            ...m,
            isCompleted: true,
            dialogueQuote: `“The wires cleared! We are fully integrated into the Apex Capital family. Passive daily dividends are flowing.”`
          };
        }
        return m;
      });

      // Boost Sector stock prices
      const nextStocks = stocks.map(s => {
        if (s.sector === activeMerger.sector) {
          const nextPrice = Math.round(s.currentPrice * activeMerger.techStockBoost * 100) / 100;
          return {
            ...s,
            currentPrice: nextPrice,
            priceHistory: [...s.priceHistory, nextPrice]
          };
        }
        return s;
      });

      const nextCash = cash - draftOffer;
      const nextLogs: TransactionHistory[] = [
        ...transactions,
        {
          day,
          type: "M&A",
          subject: `ACQUIRED ${activeMerger.name}`,
          amount: draftOffer,
          isPositive: true
        }
      ];

      setCash(nextCash);
      setMergers(nextMergers);
      setStocks(nextStocks);
      setTransactions(nextLogs);
      setSuccessDealClosed(
        `CONGRATULATIONS! You successfully negotiated and acquired ${activeMerger.name}.\nThis firm now sends ${formatCurrency(activeMerger.dailyIncome)} in clean passive earnings to your account every morning!`
      );

      saveGame({
        userName,
        startType,
        cash: nextCash,
        day,
        stocks: nextStocks,
        mergers: nextMergers,
        selectedTab,
        activeNews,
        transactions: nextLogs,
        officeId,
        hiredStaffIds
      });
    } else {
      // REJECTED Offer
      const nextMergers = mergers.map(m => {
        if (m.id === selectedMergerId) {
          return {
            ...m,
            trust: Math.max(0, m.trust - 12),
            dialogueQuote: `“The buyout proposal of ${formatCurrency(draftOffer)} was REJECTED by our shareholders. Your numbers are insufficient to buy our control!”`
          };
        }
        return m;
      });

      const refreshed = recalculateMoodAndWalkout(selectedMergerId, nextMergers);
      setMergers(refreshed);
      setErrorMessage("Acquisition offer was rejected! The CEO felt lowballed. Negotiation trust has fallen.");

      saveGame({
        userName,
        startType,
        cash,
        day,
        stocks,
        mergers: refreshed,
        selectedTab,
        activeNews,
        transactions,
        officeId,
        hiredStaffIds
      });
    }
  };

  // RESET CEO WALKOUTS (Clara Croft halves this cost!)
  const resetWalkedOutCEO = () => {
    const rawFee = activeMerger.baseValuation * 0.05;
    const actualFee = hiredStaffIds.includes("croft") ? Math.round(rawFee * 0.5) : Math.round(rawFee);

    if (cash < actualFee) {
      setErrorMessage(`Insufficient cash to pay the developer fee of ${formatCurrency(actualFee)}.`);
      return;
    }

    const nextCash = cash - actualFee;
    const nextMergers = mergers.map(m => {
      if (m.id === selectedMergerId) {
        return {
          ...m,
          isWalkedOut: false,
          trust: 40,
          mood: "Reasonable" as const,
          currentAskingPrice: m.baseValuation,
          arguedValuationCount: 0,
          highlightedSynergiesCount: 0,
          termBoardSeat: false,
          termEquityShare: false,
          termRetainCEO: false,
          dialogueQuote: "“Our law partners negotiated a restart. Our buyout price has reset back to full base values. Let's start clean.”"
        };
      }
      return m;
    });

    const nextLogs: TransactionHistory[] = [
      ...transactions,
      {
        day,
        type: "M&A",
        subject: `Paid Breakup Reset Fee: ${activeMerger.name}`,
        amount: actualFee,
        isPositive: false
      }
    ];

    setCash(nextCash);
    setMergers(nextMergers);
    setTransactions(nextLogs);
    setInfoMessage("CEO re-entered the boardroom. Negotiations reset.");

    saveGame({
      userName,
      startType,
      cash: nextCash,
      day,
      stocks,
      mergers: nextMergers,
      selectedTab,
      activeNews,
      transactions: nextLogs,
      officeId,
      hiredStaffIds
    });
  };

  // STAFF RECRUITMENT HANDLING
  const deployRecruit = (staffId: string) => {
    const target = initialStaff.find(s => s.id === staffId);
    if (!target) return;

    if (hiredStaffIds.includes(staffId)) {
      setErrorMessage("This director is already active in your fund!");
      return;
    }

    if (cash < target.hiringCost) {
      setErrorMessage(`Inadequate funds to pay the onboarding fee of ${formatCurrency(target.hiringCost)}.`);
      return;
    }

    const nextCash = cash - target.hiringCost;
    const nextStaff = [...hiredStaffIds, staffId];
    const nextLogs: TransactionHistory[] = [
      ...transactions,
      {
        day,
        type: "RECRUIT",
        subject: `Recruited Specialist Profile: ${target.name}`,
        amount: target.hiringCost,
        isPositive: false
      }
    ];

    setCash(nextCash);
    setHiredStaffIds(nextStaff);
    setTransactions(nextLogs);
    setInfoMessage(`Fantastic! ${target.name} has joined Apex Capital as ${target.role}.`);

    saveGame({
      userName,
      startType,
      cash: nextCash,
      day,
      stocks,
      mergers,
      selectedTab,
      activeNews,
      transactions: nextLogs,
      officeId,
      hiredStaffIds: nextStaff
    });
  };

  // OFFICE UPGRADE RUNTIME
  const signOfficeLease = (id: string) => {
    const tier = officeTiers.find(o => o.id === id);
    if (!tier) return;

    if (officeId === id) {
      setErrorMessage("We are currently renting this workspace.");
      return;
    }

    if (cash < tier.cost) {
      setErrorMessage(`Inadequate Capital! Signing this corporate lease requires upfront deposit of ${formatCurrency(tier.cost)}.`);
      return;
    }

    // Apply trust boost to all active deals
    const updatedMergers = mergers.map(m => {
      if (!m.isCompleted && !m.isWalkedOut) {
        const nextTrust = Math.min(100, m.trust + tier.trustBonus);
        return { ...m, trust: nextTrust };
      }
      return m;
    });

    const nextCash = cash - tier.cost;
    const nextLogs: TransactionHistory[] = [
      ...transactions,
      {
        day,
        type: "UPGRADE",
        subject: `Signed lease: ${tier.name}`,
        amount: tier.cost,
        isPositive: false
      }
    ];

    setCash(nextCash);
    setOfficeId(id);
    setMergers(updatedMergers);
    setTransactions(nextLogs);
    setInfoMessage(`Signed Lease! Welcome to your new headquarters at ${tier.name}.`);

    saveGame({
      userName,
      startType,
      cash: nextCash,
      day,
      stocks,
      mergers: updatedMergers,
      selectedTab,
      activeNews,
      transactions: nextLogs,
      officeId: id,
      hiredStaffIds
    });
  };

  // RESET FULL GAME LOGIC
  const resetEntireApplication = () => {
    localStorage.removeItem("apex_capital_v2_savegame");
    setUserName("");
    setStartType(null);
    setCash(25000);
    setDay(1);
    setStocks(initialStocks.map(s => ({ ...s, sharesOwned: 0, avgBuyPrice: 0 })));
    setMergers(initialMergers.map(m => ({ ...m, trust: m.id === "cafe" ? 60 : m.id === "solaris" ? 50 : m.id === "biogen" ? 55 : m.id === "nova" ? 45 : 30, isCompleted: false, isWalkedOut: false })));
    setHiredStaffIds([]);
    setOfficeId("desk");
    setSelectedTab("HQ");
    setActiveNews(newsList[0]);
    setTransactions([{ day: 1, type: "DIVIDEND", subject: "Initial Fund Injection", amount: 25000, isPositive: true }]);
    setIsOnboarded(false);
    setSuccessDealClosed(null);
    setInfoMessage("Application data completely wiped.");
  };

  // ONBOARDING SUBMITTER
  const executeOnboardingPlay = () => {
    if (!userName.trim()) {
      setErrorMessage("Enter a valid name to begin.");
      return;
    }
    if (!startType) {
      setErrorMessage("Choose your starter tier.");
      return;
    }

    const setupCash = startType === "Easier" ? 350000 : 100000;
    const initialLog: TransactionHistory[] = [
      { day: 1, type: "DIVIDEND", subject: `Fund Seed Capital (${startType})`, amount: setupCash, isPositive: true }
    ];

    setCash(setupCash);
    setDay(1);
    setTransactions(initialLog);
    setIsOnboarded(true);

    saveGame({
      userName,
      startType,
      cash: setupCash,
      day: 1,
      stocks: initialStocks,
      mergers: initialMergers,
      selectedTab: "HQ",
      activeNews: newsList[0],
      transactions: initialLog,
      officeId: "desk",
      hiredStaffIds: []
    });
  };

  // 1. RENDER ONBOARDING SCREEN IF NOT LOGGED
  if (!isOnboarded) {
    return (
      <div className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden font-sans select-none">
        {/* Gorgeous custom Sunset Skylines ambient gradient simulation from the user's crane screen! */}
        <div className="absolute inset-0 bg-gradient-to-t from-orange-600 via-rose-900 to-indigo-950 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-amber-500/20 via-slate-950/70 to-slate-950" />
        {/* Architectural Grid Simulation lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="relative z-10 w-11/12 max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl flex flex-col justify-between min-h-[580px] text-white">
          <div className="text-center space-y-2">
            <div className="text-amber-500 text-xs font-bold uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full inline-block">
              Apex Capital • Studio Build
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Tell us your first name</h1>
            <p className="text-slate-400 text-sm">We'll use this inside the investment game.</p>
          </div>

          <div className="my-6 space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">First name</label>
              <input 
                type="text" 
                placeholder="Type here..." 
                value={userName} 
                onChange={(e) => setUserName(e.target.value.slice(0, 16))}
                className="w-full bg-slate-950/80 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-base placeholder:text-slate-500 outline-none transition-colors"
                maxLength={16}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Choose your start</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setStartType("Easier")}
                  className={`relative p-4 rounded-2xl border text-left flex flex-col items-start space-y-2 transition-all ${
                    startType === "Easier" 
                      ? "bg-amber-500/20 border-amber-500 shadow-md ring-1 ring-amber-500" 
                      : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <TrendingUp className={`w-6 h-6 ${startType === "Easier" ? "text-amber-500" : "text-slate-400"}`} />
                  <div>
                    <div className="font-bold text-sm">Easier</div>
                    <div className="text-[11px] text-slate-400 mt-1 whitespace-pre-line">Start with $350,000 starting cash</div>
                  </div>
                </button>

                <button 
                  onClick={() => setStartType("Hard")}
                  className={`relative p-4 rounded-2xl border text-left flex flex-col items-start space-y-2 transition-all ${
                    startType === "Hard" 
                      ? "bg-amber-500/20 border-amber-500 shadow-md ring-1 ring-amber-500" 
                      : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <Flame className={`w-6 h-6 ${startType === "Hard" ? "text-amber-500" : "text-slate-400"}`} />
                  <div>
                    <div className="font-bold text-sm">Hard</div>
                    <div className="text-[11px] text-slate-400 mt-1 whitespace-pre-line">Start with only $100k</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <button 
            disabled={!userName.trim() || !startType}
            onClick={executeOnboardingPlay}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800/80 disabled:text-slate-600 disabled:cursor-not-allowed font-semibold py-4 px-6 rounded-2xl text-slate-950 flex items-center justify-center space-x-2 transition-all group shadow-lg shadow-amber-500/10 active:scale-98"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Play Game</span>
          </button>
        </div>

        {/* Dynamic Warning Notification */}
        {errorMessage && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-500 text-red-200 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-xs">{errorMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // 2. MAIN APPLICATION LANDING / IN-GAME LAYOUT
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 pb-20">
      
      {/* HEADER BAR */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800/60 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl">🤵</span>
            <div>
              <div className="text-xs text-slate-400 font-medium">Apex Managing Director</div>
              <div className="font-bold text-sm text-yellow-500 flex items-center space-x-2">
                <span>{userName}</span>
                <span className="text-[10px] bg-slate-800 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/20 uppercase tracking-widest">{startType}</span>
              </div>
            </div>
          </div>

          {/* Core financial display counter */}
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <span className="text-xs text-slate-500 block font-medium">Liquid Capital</span>
              <span className="text-base font-extrabold text-white">{formatCurrency(cash)}</span>
            </div>
            <div className="text-right border-l border-slate-800 pl-4">
              <span className="text-xs text-slate-500 block font-medium">Net Worth</span>
              <span className="text-base font-extrabold text-amber-500">{formatCurrency(netWorth)}</span>
            </div>
            <div className="text-right border-l border-slate-800 pl-4 hidden md:block">
              <span className="text-xs text-slate-500 block font-medium">Daily Outflow</span>
              <span className="text-xs font-bold text-red-400">-{formatCurrency(dailyDeductions)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* QUICK STATUS TICKER BANNER */}
      <div className="bg-slate-900 border-b border-slate-800/40 text-xs py-2 px-4 shadow-sm overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-amber-500 shrink-0 font-bold">📢 NEWS DAY {day}:</span>
            <span className="text-slate-300 line-clamp-1">{activeNews?.headline} • {activeNews?.description}</span>
          </div>
          <button 
            onClick={advanceDay}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-full flex items-center space-x-1 tracking-wider text-[11px] transition-all shadow-lg active:scale-98 shrink-0 animate-pulse"
          >
            Advance to Day {day + 1}
          </button>
        </div>
      </div>

      {/* PRIMARY CONTROLLERS TABS GRAPHIC */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex items-center space-x-1 overflow-x-auto bg-slate-900/50 p-1 rounded-2xl border border-slate-800/80 scrollbar-none mb-6">
          {[
            { id: "HQ", label: "Executive HQ", icon: Home },
            { id: "FLOOR", label: "Trade Floor", icon: TrendingUp },
            { id: "DEALS", label: "Boardroom M&A", icon: Handshake },
            { id: "STAFF", label: "Executive Staff", icon: Users },
            { id: "OFFICE", label: "Office Tiers", icon: Briefcase },
            { id: "NEWS", label: "Global Newsroom", icon: Newspaper },
            { id: "STATS", label: "Asset logs", icon: History }
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all whitespace-nowrap ${
                  isSelected 
                    ? "bg-amber-500 text-slate-950 shadow" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* INFO & ERROR NOTIFICATION BANNER */}
        {infoMessage && (
          <div className="mb-4 bg-emerald-900/20 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl flex items-center space-x-2 text-xs">
            <Check className="w-4 h-4 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 bg-red-950/20 border border-red-500/40 text-red-300 px-4 py-3 rounded-2xl flex items-center space-x-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: EXECUTIVE HQ PAGE */}
        {selectedTab === "HQ" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* PRIMARY PROFILE CARD */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Active Premises</div>
                  <h3 className="text-xl font-extrabold text-white">{currentOffice.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{currentOffice.description}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 bg-slate-950/30 -mx-6 -mb-6 p-4">
                  <span>Upgrade trust bonus:</span>
                  <span className="font-bold text-amber-500">+{currentOffice.trustBonus}%</span>
                </div>
              </div>

              {/* CORE METRICS CARD */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Global Cashflow</div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Passive Daily Dividends</span>
                    <span className="font-bold text-emerald-500">+{formatCurrency(dailyPassiveEarnings)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">HQ Upkeep Rent</span>
                    <span className="font-bold text-rose-500">-{formatCurrency(currentOffice.dailyRent)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Professional Salaries</span>
                    <span className="font-bold text-rose-400">-{formatCurrency(dailyDeductions - currentOffice.dailyRent)}</span>
                  </div>
                  <div className="border-t border-slate-800/80 pt-2 flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-300">Net Daily Change</span>
                    <span className={`font-extrabold ${dailyPassiveEarnings - dailyDeductions >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {dailyPassiveEarnings - dailyDeductions >= 0 ? "+" : ""}{formatCurrency(dailyPassiveEarnings - dailyDeductions)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-3 space-y-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Enterprise Projections</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 block uppercase">Weekly Net</span>
                      <span className={`font-mono font-bold block mt-0.5 ${(dailyPassiveEarnings - dailyDeductions) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {(dailyPassiveEarnings - dailyDeductions) >= 0 ? "+" : ""}{formatCurrency((dailyPassiveEarnings - dailyDeductions) * 7)}
                      </span>
                    </div>
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 block uppercase">Monthly Net (30d)</span>
                      <span className={`font-mono font-bold block mt-0.5 ${(dailyPassiveEarnings - dailyDeductions) >= 0 ? "text-amber-400" : "text-rose-400"}`}>
                        {(dailyPassiveEarnings - dailyDeductions) >= 0 ? "+" : ""}{formatCurrency((dailyPassiveEarnings - dailyDeductions) * 30)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CURRENT STAFF DIRECTORS */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Cabinet Staff ({hiredStaffIds.length}/5)</div>
                {hiredStaffIds.length === 0 ? (
                  <div className="text-center py-6">
                    <span className="text-2xl opacity-40 block mb-2">👤</span>
                    <span className="text-xs text-slate-500">No active directors. Go to Executive Staff to hire help.</span>
                  </div>
                ) : (
                  <div className="space-y-2 mt-2 max-h-[140px] overflow-y-auto pr-1">
                    {initialStaff.filter(s => hiredStaffIds.includes(s.id)).map(s => (
                      <div key={s.id} className="flex items-center space-x-2 bg-slate-950/40 p-2 rounded-xl border border-slate-800/40">
                        <span className="text-base">{s.avatar}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate">{s.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{s.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* ACQUIRED JOINT-VENTURES SECTION */}
            <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Acquired Subsidiaries Portfolio</h3>
              
              {mergers.filter(m => m.isCompleted).length === 0 ? (
                <div className="text-center py-10 bg-slate-950/30 rounded-xl border border-slate-800/40 border-dashed">
                  <span className="text-3xl block mb-2">🤝</span>
                  <h4 className="text-sm font-semibold text-slate-400">No Corporate Buyouts Finalized Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">Save up funding capitals to execute merger boardroom takeovers. Acquired ventures add giant passive dividend flows!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {mergers.filter(m => m.isCompleted).map(m => (
                    <div key={m.id} className="bg-slate-950/60 p-4 rounded-xl border border-emerald-500/20 relative">
                      <div className="absolute top-2 right-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full">
                        Acquired
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-2xl">{m.ceoAvatar}</span>
                        <div>
                          <div className="text-xs font-bold">{m.name}</div>
                          <div className="text-[10px] text-slate-400">{m.sector} • CEO {m.ceoName}</div>
                        </div>
                      </div>
                      <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Yield Multiplier:</span>
                        <span className="font-extrabold text-emerald-500">+{formatCurrency(m.dailyIncome)}/day</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TRADING FLOOR PAGE */}
        {selectedTab === "FLOOR" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* ASSET SELECTOR LIST */}
            <div className="bg-slate-900 border border-slate-800/85 rounded-2xl p-4 lg:col-span-1 space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Fictional Financial Tickers</h3>
              
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {stocks.map(stock => {
                  const isSelected = selectedStockTicker === stock.ticker;
                  const prevPrice = stock.priceHistory[stock.priceHistory.length - 2] ?? stock.currentPrice;
                  const isPositive = stock.currentPrice >= prevPrice;
                  const percentChange = ((stock.currentPrice - prevPrice) / prevPrice) * 100;
                  
                  return (
                    <button
                      key={stock.ticker}
                      onClick={() => setSelectedStockTicker(stock.ticker)}
                      className={`w-full p-3 rounded-xl flex items-center justify-between transition-colors border text-left ${
                        isSelected 
                          ? "bg-slate-800 border-slate-700/60" 
                          : "bg-slate-950/30 border-slate-800/40 hover:bg-slate-800/20"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] bg-slate-950 text-amber-500 px-2 py-1 rounded font-mono font-bold tracking-wider">
                          {stock.ticker}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate text-slate-200">{stock.name}</div>
                          <div className="text-[10px] text-slate-400">{stock.sector} • Volatility: {Math.round(stock.volatility * 100)}%</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold">{formatCurrency(stock.currentPrice)}</div>
                        <div className={`text-[10px] font-mono font-bold ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                          {isPositive ? "▲" : "▼"}{percentChange.toFixed(1)}%
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TRADING ACTIONS WORKSTATION */}
            <div className="bg-slate-900 border border-slate-800/85 rounded-2xl p-6 lg:col-span-2 space-y-6">
              
              {/* CURRENT TICKER TITLE */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">💹</div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">{activeStock.name}</h3>
                    <div className="text-xs text-slate-400">{activeStock.sector} Sector • Fictional Asset Security</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-amber-500">{formatCurrency(activeStock.currentPrice)}</div>
                  <div className="text-xs text-slate-400">Current Market Price</div>
                </div>
              </div>

              {/* DYNAMIC SVG CHART AREA */}
              <div className="relative h-44 bg-slate-950/80 rounded-xl border border-slate-800/70 p-2 overflow-hidden flex flex-col justify-between">
                <div className="absolute top-2 left-2 text-[10px] text-slate-500 uppercase tracking-widest font-mono">Historic Performance (Day Runs)</div>
                
                {/* SVG Line Generation */}
                <svg className="w-full h-full pt-6" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {activeStock.priceHistory && activeStock.priceHistory.length > 1 && (() => {
                    const minVal = Math.min(...activeStock.priceHistory);
                    const maxVal = Math.max(...activeStock.priceHistory);
                    const range = (maxVal - minVal) || 1;
                    const points = activeStock.priceHistory.map((val, idx) => {
                      const x = (idx / (activeStock.priceHistory.length - 1)) * 100;
                      const y = 90 - ((val - minVal) / range) * 75; // Map from top relative
                      return `${x},${y}`;
                    }).join(" ");

                    return (
                      <>
                        <polyline
                          fill="none"
                          stroke="rgba(245, 158, 11, 0.6)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          points={points}
                        />
                        {/* Shimmer Area gradient representation */}
                        <polygon
                          fill="rgba(245, 158, 11, 0.04)"
                          points={`0,100 ${points} 100,100`}
                        />
                      </>
                    );
                  })()}
                </svg>

                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2 pt-1 border-t border-slate-800/40">
                  <span>Day {Math.max(1, day - activeStock.priceHistory.length + 1)}</span>
                  <span>Day {day}</span>
                </div>
              </div>

              {/* ANALYST FORECAST INTEL MODULE */}
              {hiredStaffIds.includes("finch") && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center space-x-2 text-xs">
                  <span className="text-base">🕵️‍♂️</span>
                  <div className="flex-1 leading-normal">
                    <span className="font-bold text-amber-400 uppercase tracking-wider">Aiden Finch Intel Feed:</span> Tomorrow morning's market news forecast expects <span className="font-semibold text-white">{activeStock.ticker}</span> to hold a <span className="text-amber-300 font-bold">Volatility Ratio of {Math.round(activeStock.volatility * 100)}%</span>. Perfect window for calculated spreads.
                  </div>
                </div>
              )}

              {/* HOLDINGS AUDIT SUMMARY */}
              <div className="grid grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Shares Owned</div>
                  <div className="text-sm font-extrabold text-white mt-1">{activeStock.sharesOwned}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Average Buy Price</div>
                  <div className="text-sm font-extrabold text-white mt-1">{formatCurrency(activeStock.avgBuyPrice)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Liquidity Value</div>
                  <div className="text-sm font-extrabold text-amber-500 mt-1">{formatCurrency(activeStock.sharesOwned * activeStock.currentPrice)}</div>
                </div>
              </div>

              {/* ACTION TRANSACTION CONTROL BLOCKS */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-400">Trade Volume:</span>
                  <input 
                    type="number" 
                    value={tradeAmountInput} 
                    onChange={(e) => setTradeAmountInput(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-center font-mono w-24 text-white outline-none focus:border-amber-500"
                    min="1"
                  />
                  <div className="flex space-x-1.5 text-[10px]">
                    {[5, 10, 50, 100].map(v => (
                      <button 
                        key={v}
                        onClick={() => setTradeAmountInput(v.toString())}
                        className="bg-slate-800 hover:bg-slate-700 font-mono px-2 py-1 rounded"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => purchaseStock(parseInt(tradeAmountInput) || 0)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3 rounded-xl text-xs flex items-center justify-center space-x-1 shadow transition-all active:scale-98"
                  >
                    <span>BUY SHARES</span>
                  </button>
                  <button
                    onClick={() => sellShares(parseInt(tradeAmountInput) || 0)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-200 font-extrabold py-3 rounded-xl text-xs flex items-center justify-center space-x-1 shadow transition-all active:scale-98"
                  >
                    <span>SELL SHARES</span>
                  </button>
                </div>
                
                <div className="text-[10px] text-slate-500 text-center leading-normal">
                  *Your office tier limits single trades to <span className="font-semibold text-slate-400">{formatCurrency(currentOffice.maxTradeLimit)}</span> per transaction.
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: BOARDROOM CO-ACQUISITION PAGE */}
        {selectedTab === "DEALS" && (
          <div className="space-y-6">
            
            {/* Dual Sub-Tab Switcher */}
            <div className="flex bg-slate-950 p-1.5 rounded-2xl max-w-sm border border-slate-800/80">
              <button
                onClick={() => setBoardroomSubTab("negotiate")}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all ${
                  boardroomSubTab === "negotiate" 
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/5" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🤝 Boardroom Deals ({mergers.filter(m => m.isOpenToNegotiate && !m.isCompleted).length})
              </button>
              <button
                onClick={() => setBoardroomSubTab("subsidiaries")}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all ${
                  boardroomSubTab === "subsidiaries" 
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/5" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🏢 Subsidiaries ({mergers.filter(m => m.isCompleted).length})
              </button>
            </div>

            {boardroomSubTab === "negotiate" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* MERGER TARGET SELECTOR */}
                <div className="bg-slate-900 border border-slate-800/85 rounded-2xl p-4 lg:col-span-1 space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Venture Board Targets</h3>
                  
                  <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                    {mergers.filter(m => m.isOpenToNegotiate && !m.isCompleted).length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-xs font-medium">No open proposals. Wait for weekly dispatches to land!</div>
                    ) : (
                      mergers.filter(m => m.isOpenToNegotiate && !m.isCompleted).map(m => {
                        const isSelected = selectedMergerId === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => setSelectedMergerId(m.id)}
                            className={`w-full p-3 rounded-xl flex items-center justify-between transition-colors border text-left ${
                              isSelected 
                                ? "bg-slate-800 border-slate-700" 
                                : "bg-slate-950/30 border-slate-800/40 hover:bg-slate-800/20"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{m.ceoAvatar}</span>
                              <div>
                                <div className="text-xs font-bold text-slate-200">{m.name}</div>
                                <p className="text-[10px] text-slate-400">{m.sector} • Valuation: {formatCurrency(m.baseValuation)}</p>
                              </div>
                            </div>
                            
                            {m.isWalkedOut ? (
                              <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase font-bold font-sans">
                                Walked Out
                              </span>
                            ) : (
                              <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase font-bold font-sans">
                                Pitching
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* STRATEGIC NEGOTIATION SCREEN PANEL */}
                <div className="bg-slate-900 border border-slate-800/85 rounded-2xl p-6 lg:col-span-2 space-y-6">
                  {mergers.filter(m => m.isOpenToNegotiate && !m.isCompleted).length === 0 ? (
                    <div className="text-center py-24 text-slate-400 text-xs space-y-3">
                      <span className="text-4xl block">📈</span>
                      <h4 className="font-bold text-slate-300">All Negotiation Pipelines Integrated</h4>
                      <p className="max-w-xs mx-auto leading-relaxed text-slate-500">You have successfully bought out or resolved all active venture targets. Wait for multi-million dollar deals on weekly day increments!</p>
                    </div>
                  ) : (
                    <>
                      {/* TARGET CEO SUMMARY */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-4xl">{activeMerger.ceoAvatar}</span>
                          <div>
                            <h3 className="text-lg font-extrabold text-white">{activeMerger.name}</h3>
                            <div className="text-xs text-slate-400">Target CEO: <span className="font-bold text-slate-200">{activeMerger.ceoName}</span> • Mood: <span className="font-bold text-amber-400">{activeMerger.mood}</span></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500 font-bold uppercase">Negotiation Trust</div>
                          <div className="text-xl font-black text-emerald-400">{activeMerger.trust}%</div>
                        </div>
                      </div>

                      {/* TARGET COMPANY BIO */}
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/40">{activeMerger.description}</p>

                      {/* CEO QUOTE DIALOGUE */}
                      <div className="relative bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                        <div className="absolute top-2 left-2 text-[10px] text-slate-500 uppercase font-bold">Executive Boardroom Feedback</div>
                        <p className="text-xs italic text-amber-200/90 leading-normal mt-3">
                          {activeMerger.dialogueQuote}
                        </p>
                      </div>

                      {/* WALKED OUT DEBT ADVISORY BANNER */}
                      {activeMerger.isWalkedOut ? (
                        <div className="bg-red-950/30 border border-red-500/20 p-5 rounded-xl text-center space-y-3">
                          <p className="text-xs text-red-300">
                            The CEO has walked out of negotiations because of insultingly low financial offers or too many aggressive spreadsheet audits. You must pay legal/advisory break-up penalty to call them back to the table.
                          </p>
                          <button
                            onClick={resetWalkedOutCEO}
                            className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
                          >
                            PAY ADVISORY RESET FEE: {formatCurrency(hiredStaffIds.includes("croft") ? Math.round(activeMerger.baseValuation * 0.05 * 0.5) : Math.round(activeMerger.baseValuation * 0.05))}
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* SWEETENERS BOARD CHAIR TOGGLES */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Strategic Deal Sweeteners (Lowers asking threshold)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <button
                                onClick={() => toggleSweetener("termBoardSeat")}
                                className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-1 transition-all ${
                                  activeMerger.termBoardSeat 
                                    ? "bg-emerald-500/10 border-emerald-500" 
                                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                                }`}
                              >
                                <span className="font-bold text-xs">Board Seat Option</span>
                                <span className="text-[10px] text-slate-400">Drops Min threshold by 8%</span>
                              </button>

                              <button
                                onClick={() => toggleSweetener("termEquityShare")}
                                className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-1 transition-all ${
                                  activeMerger.termEquityShare 
                                    ? "bg-emerald-500/10 border-emerald-500" 
                                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                                }`}
                              >
                                <span className="font-bold text-xs">Fund Equity Share</span>
                                <span className="text-[10px] text-slate-400 font-sans">Drops Min threshold by 12%</span>
                              </button>

                              <button
                                onClick={() => toggleSweetener("termRetainCEO")}
                                className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-1 transition-all ${
                                  activeMerger.termRetainCEO 
                                    ? "bg-emerald-500/10 border-emerald-500" 
                                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                                }`}
                              >
                                <span className="font-bold text-xs">Retain CEO Position</span>
                                <span className="text-[10px] text-slate-400">Drops Min threshold by 5%</span>
                              </button>
                            </div>
                          </div>

                          {/* NEGOTIATION PLAY AUDIT ACTIONS */}
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={executeHighlightSynergies}
                              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold p-3 rounded-xl text-xs flex flex-col items-center justify-center space-y-1 transition-colors"
                            >
                              <span>Highlight Ventures Synergy ({activeMerger.highlightedSynergiesCount}/3)</span>
                              <span className="text-[9px] text-slate-400 text-center leading-normal">Boosts CEO trust +10 points & cuts pricing</span>
                            </button>

                            <button
                              onClick={executeArgueValuation}
                              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold p-3 rounded-xl text-xs flex flex-col items-center justify-center space-y-1 transition-colors"
                            >
                              <span>Argue Valuation Audit ({activeMerger.arguedValuationCount}/3)</span>
                              <span className="text-[9px] text-slate-400 text-center leading-normal">Reduces price -6% but harms CEO trust -15 points</span>
                            </button>
                          </div>

                          {/* FINAL BUYOUT VALUE PROPOSER */}
                          <div className="space-y-4 pt-4 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-slate-500">Draft Cash Proposal:</div>
                              <div className="text-xs text-slate-400">Estimated Target Demands: <span className="font-mono text-amber-500 font-bold">{formatCurrency(activeMerger.currentAskingPrice)}</span></div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <input 
                                type="number" 
                                value={draftOffer}
                                onChange={(e) => setDraftOffer(parseInt(e.target.value) || 0)}
                                className="bg-slate-950 border border-slate-800 w-full rounded-xl px-4 py-3 text-sm text-center font-mono text-white outline-none focus:border-amber-500"
                              />
                              <button
                                onClick={finalizeVentureAcquisition}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-xs shadow transition-all active:scale-98 whitespace-nowrap"
                              >
                                SEAL CORPORATE ACQUISITION
                              </button>
                            </div>

                            {hiredStaffIds.includes("croft") && (
                              <div className="bg-emerald-900/10 border border-emerald-500/20 p-2 rounded-xl text-[10px] text-emerald-300 text-center leading-normal">
                                ℹ️ Clara Croft active: CEO breakup fee penalties cut in half & minimum acceptable demands lowered -5%.
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6">
                  <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-1">Acquired Corporate Subsidiaries (Controlling Stakes)</h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    You have complete controlling stakes in these entities. Appoint custom operations executives, set corporate staffing tiers, reinvest dynamic expansion capital, or list IPO ticker shares under SEC registration to liquidate equity.
                  </p>
                </div>

                {/* ATTRACITIVE FEATURE: ENTERPRISE BOARD SPECIALS PANEL */}
                <div className="bg-slate-900 border border-slate-800/85 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                    <div>
                      <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">💼 Enterprise Venture Actions & Board Specials</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Deploy bulk corporate capital to optimize your entire pipeline operations or draw emergency dividends.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* ACTION 1: MARKETING BLITZ */}
                    <button 
                      onClick={executeMarketingBlitz}
                      className="bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 p-4 rounded-xl text-left flex flex-col justify-between transition-all group active:scale-98 relative overflow-hidden"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm">🚀</span>
                          <span className="text-xs font-bold text-slate-200">Global Marketing Blitz</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Permanently boost passive yields of all completed subsidiaries by +15% and expands their book valuations.
                        </p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-slate-850 w-full flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 uppercase font-bold">Campaign Cost</span>
                        <span className="text-xs font-mono font-bold text-amber-400">$75,000</span>
                      </div>
                    </button>

                    {/* ACTION 2: CEO MASTERMIND */}
                    <button 
                      onClick={executeCEOSummit}
                      className="bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 p-4 rounded-xl text-left flex flex-col justify-between transition-all group active:scale-98 relative overflow-hidden"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm">🤝</span>
                          <span className="text-xs font-bold text-slate-200">CEO Mastermind Summit</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Host target executives at an elite workshop, boosting their negotiation trust by +20 points across-the-board.
                        </p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-slate-850 w-full flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 uppercase font-bold">Summit Cost</span>
                        <span className="text-xs font-mono font-bold text-amber-400">$40,000</span>
                      </div>
                    </button>

                    {/* ACTION 3: EMERGENCY CASH CALL */}
                    <button 
                      onClick={executeEmergencyCashCall}
                      className="bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 p-4 rounded-xl text-left flex flex-col justify-between transition-all group active:scale-98 relative overflow-hidden"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm">💰</span>
                          <span className="text-xs font-bold text-slate-200">Boardroom Dividend Draw</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Levy an emergency dividend distribution of $150,000 per completed subsidiary straight into your treasury. (15d Cooldown)
                        </p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-slate-850 w-full flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 uppercase font-bold">STATUS</span>
                        {lastCashCallDay > 0 && day - lastCashCallDay < 15 ? (
                          <span className="text-[10px] text-rose-400 font-bold uppercase font-mono">Cd: {15 - (day - lastCashCallDay)}d</span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-bold uppercase font-mono">READY</span>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {mergers.filter(m => m.isCompleted).length === 0 ? (
                  <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
                    <span className="text-4xl block mb-3">💼</span>
                    <h4 className="text-sm font-black text-white">No Subsidiaries Acquired Yet</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Build your pasive portfolio! Pitch, sweeten term sheets, and close deals with target companies in the active Boardroom Negotiations catalog.
                    </p>
                    <button 
                      onClick={() => setBoardroomSubTab("negotiate")}
                      className="mt-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-3 rounded-xl transition-all"
                    >
                      Browse Deal proposals
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mergers.filter(m => m.isCompleted).map((m) => {
                      let reinvestCost = 10000;
                      if (m.baseValuation < 100000) reinvestCost = 5000;
                      else if (m.baseValuation < 500000) reinvestCost = 25000;
                      else if (m.baseValuation < 2000000) reinvestCost = 100000;
                      else reinvestCost = 500000;

                      return (
                        <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                          
                          {/* Banner Head */}
                          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-3xl">{m.ceoAvatar}</span>
                              <div>
                                <h4 className="text-xs font-black text-white font-sans uppercase tracking-tight">{m.name}</h4>
                                <span className="text-[9px] bg-slate-950 text-slate-400 px-2 py-0.5 mt-0.5 inline-block rounded uppercase font-bold tracking-wide border border-slate-850">
                                  {m.sector}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-slate-500 uppercase font-black">Controls Stake</div>
                              <div className="text-xs font-black text-amber-500">{m.stakeOwned ?? 100}% Held</div>
                            </div>
                          </div>

                          {/* Valuation and income panel */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                              <span className="text-[9px] text-slate-500 block font-bold uppercase">Dynamic Valuation</span>
                              <span className="text-xs font-mono font-bold text-slate-200 mt-0.5 block">{formatCurrency(m.baseValuation)}</span>
                            </div>
                            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                              <span className="text-[9px] text-slate-500 block font-bold uppercase">Weekly yields dividend</span>
                              <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block">+{formatCurrency(m.dailyIncome * 7)}/wk <span className="text-[10px] text-slate-400font-mono">(+{formatCurrency(m.dailyIncome)}/d)</span></span>
                            </div>
                          </div>

                          {/* Appointed CEO dropdown/choices */}
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Appointed Lead executive strategy Plan</label>
                            <div className="grid grid-cols-4 gap-1.5">
                              {[
                                { type: "original" as const, label: "Founder", desc: "Standard 1.0x baseline dividends" },
                                { type: "risky" as const, label: "Highflyer", desc: "Deterministic daily fluctuations (0.45x - 1.9x yields)" },
                                { type: "synergy" as const, label: "Synergy", desc: "+15% return yields" },
                                { type: "ai" as const, label: "AI Agent", desc: "+3% weekly compound returns ($15,000 setup)" }
                              ].map((item) => (
                                <button
                                  key={item.type}
                                  onClick={() => updateSubsidiaryCEO(m.id, item.type)}
                                  className={`py-1 px-1 rounded-lg border text-center transition-all flex flex-col justify-center items-center ${
                                    m.ceoType === item.type 
                                      ? "bg-amber-500 border-amber-500 text-slate-950 font-black" 
                                      : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400"
                                  }`}
                                  title={item.desc}
                                >
                                  <span className="text-[9px] font-black">{item.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Staff Headcount selector */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Operational Staffing Headcount level</label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {[
                                { type: "lean" as const, label: "Outsourced", desc: "No daily upkeep overhead. Output: 80% dividends focus" },
                                { type: "standard" as const, label: "Standard", desc: "Normal corporate upkeep. Output: 100% stable dividends" },
                                { type: "high" as const, label: "Elite Core", desc: "+$400/day salary upkeep. Output: 150% maximum returns!" }
                              ].map((item) => (
                                <button
                                  key={item.type}
                                  onClick={() => updateSubsidiaryStaff(m.id, item.type)}
                                  className={`py-1 px-1.5 rounded-lg border text-center transition-all flex flex-col justify-center items-center ${
                                    m.staffType === item.type 
                                      ? "bg-amber-500 border-amber-500 text-slate-950 font-black" 
                                      : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400"
                                  }`}
                                  title={item.desc}
                                >
                                  <span className="text-[9px] font-black">{item.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Subscriptions reinvestment & IPO controls */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-850">
                            <button
                              onClick={() => reinvestInSubsidiary(m.id)}
                              className="bg-slate-800 hover:bg-slate-750 border border-slate-750 p-2.5 rounded-xl flex flex-col items-center justify-center space-y-1 transition-all active:scale-98"
                            >
                              <span className="font-extrabold text-[10px] text-amber-400 uppercase">📥 REINVEST YIELD</span>
                              <span className="text-[8px] text-slate-400 text-center leading-tight">Cost: {formatCurrency(reinvestCost)} • Yields permanente +20%</span>
                            </button>

                            {!m.isIPOed ? (
                              <button
                                onClick={() => launchSubsidiaryIPO(m.id)}
                                className="bg-emerald-950 border border-emerald-500/40 hover:bg-emerald-900 text-emerald-200 p-2.5 rounded-xl flex flex-col items-center justify-center space-y-1 transition-all active:scale-98"
                              >
                                <span className="font-extrabold text-[10px] text-emerald-300 uppercase">📈 UNLEASH PUBLIC IPO</span>
                                <span className="text-[8px] text-slate-300 text-center leading-tight">Sell 30% for {formatCurrency(Math.round(m.baseValuation * 0.30))}</span>
                              </button>
                            ) : (
                              <div className="bg-slate-950 border border-slate-850 px-2 rounded-xl flex flex-col justify-center items-center text-center">
                                <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest">LISTED TICKER</span>
                                <span className="text-xs font-mono font-black text-amber-500">{m.ipoTicker}</span>
                                <span className="text-[8px] text-slate-500 mt-0.5">Control: 70% | Public: 30%</span>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* TAB 4: EXECUTIVE STAFF DIRECTORY */}
        {selectedTab === "STAFF" && (
          <div className="space-y-4">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Corporate Board & Specialists Hire Portal</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {initialStaff.map(staff => {
                const isHired = hiredStaffIds.includes(staff.id);
                return (
                  <div key={staff.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
                    {isHired && (
                      <div className="absolute top-2 right-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-bold px-2.5 py-0.5 rounded-full">
                        Active Staff
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-4xl">{staff.avatar}</span>
                        <div>
                          <h4 className="font-bold text-sm text-white">{staff.name}</h4>
                          <div className="text-xs text-amber-500">{staff.role}</div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{staff.description}</p>
                      
                      <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">Operational Advantage:</div>
                        <p className="text-[11px] text-slate-200 leading-normal">{staff.benefitText}</p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800/85 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] text-slate-500">Salary Upkeep:</div>
                        <div className="text-xs font-bold text-rose-400">-{formatCurrency(staff.dailySalary)}/day</div>
                      </div>
                      <button
                        disabled={isHired}
                        onClick={() => deployRecruit(staff.id)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                          isHired 
                            ? "bg-slate-800 text-slate-500 cursor-default" 
                            : "bg-amber-500 hover:bg-amber-300 text-slate-950 active:scale-98"
                        }`}
                      >
                        {isHired ? "Active Director" : `Recruit • ${formatCurrency(staff.hiringCost)}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: OFFICE HQ LEASES PROGRESSION */}
        {selectedTab === "OFFICE" && (
          <div className="space-y-4">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Office upgrades & Corporate HQ Progression</div>
            
            <div className="grid grid-cols-1 gap-4">
              {officeTiers.map(tier => {
                const isActive = officeId === tier.id;
                return (
                  <div 
                    key={tier.id} 
                    className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all relative ${
                      isActive 
                        ? "bg-amber-500/10 border-amber-500" 
                        : "bg-slate-900 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full">
                        Occupied Corporate Headquarters
                      </div>
                    )}
                    <div className="space-y-1.5 flex-1 max-w-xl">
                      <h4 className="font-extrabold text-sm text-white">{tier.name}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{tier.description}</p>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 pt-1.5">
                        <span>Trade Capsule Limit: <span className="font-semibold text-slate-300">{formatCurrency(tier.maxTradeLimit)}</span></span>
                        <span>M&A Target trust bonus: <span className="font-semibold text-amber-500">+{tier.trustBonus}%</span></span>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-end gap-x-4 justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
                      <div className="text-left md:text-right">
                        <div className="text-[9px] text-slate-500 uppercase">Upkeep Rent:</div>
                        <div className="text-xs font-bold text-rose-400">-{formatCurrency(tier.dailyRent)}/day</div>
                      </div>
                      
                      <button
                        disabled={isActive}
                        onClick={() => signOfficeLease(tier.id)}
                        className={`mt-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                          isActive 
                            ? "bg-slate-800 text-slate-500 cursor-default" 
                            : "bg-amber-500 hover:bg-amber-300 text-slate-950 active:scale-98"
                        }`}
                      >
                        {isActive ? "Occupied" : `Lease • ${formatCurrency(tier.cost)}`}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT HISTORIES LOG */}
        {selectedTab === "STATS" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Complete Audit Logs Ledger</h3>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {transactions.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">No transactions recorded yet.</div>
                ) : (
                  transactions.slice().reverse().map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-slate-500">D{t.day}</span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded font-sans inline-block ${
                          t.type === "BUY" ? "bg-rose-500/10 text-rose-400" :
                          t.type === "SELL" ? "bg-emerald-500/10 text-emerald-400" :
                          t.type === "M&A" ? "bg-purple-500/10 text-purple-400" :
                          t.type === "DIVIDEND" ? "bg-emerald-500/10 text-emerald-300" :
                          "bg-amber-500/10 text-amber-400"
                        }`}>
                          {t.type}
                        </span>
                        <span className="font-medium text-slate-300">{t.subject}</span>
                      </div>
                      <span className={`font-mono font-bold ${t.isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        {t.isPositive ? "+" : "-"}{formatCurrency(t.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* FULL SYSTEM RESET DISASTER CONTROL */}
            <div className="bg-rose-950/15 border border-rose-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-red-400">🚨 EMERGENCY SYSTEM WIPE: RESET FUND</h4>
                <p className="text-xs text-slate-400 leading-relaxed">This wipe clears all current day counts, local cashflows, owned shares, staff hirables, and office progression. Irreversible.</p>
              </div>
              <button
                onClick={resetEntireApplication}
                className="bg-red-950 border border-red-500 hover:bg-red-400 hover:text-slate-950 text-red-200 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shrink-0 active:scale-98"
              >
                Hard Reset Application
              </button>
            </div>
          </div>
        )}

        {/* TAB 7: GLOBAL NEWSROOM TAB */}
        {selectedTab === "NEWS" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-5 mb-6">
                <div>
                  <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest font-mono">📡 APEX Bloomberg Telegraph</h3>
                  <p className="text-xs text-slate-400 mt-1">Syndicated market intelligence, corporate listings, & macroeconomic volatility analysis.</p>
                </div>
                <div className="mt-3 md:mt-0 flex items-center bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-xs">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mr-2">Market Sentiment:</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
                    ACTIVE TRADING BULL CYCLE
                  </span>
                </div>
              </div>

              {/* LIST OF LOGGED NEWS ITEMS */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {newsFeed.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">No syndicated articles received yet. Advance the business day to receive new stories!</div>
                ) : (
                  newsFeed.map((news, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-xl border bg-slate-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                        idx === 0 ? "border-amber-500/40 shadow-lg shadow-amber-500/5 bg-slate-900/60" : "border-slate-800/60"
                      }`}
                    >
                      <div className="space-y-1 bg-transparent">
                        <div className="flex flex-wrap items-center gap-2">
                          {idx === 0 && (
                            <span className="bg-amber-500 text-slate-950 text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded">
                              LATEST DECREE
                            </span>
                          )}
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded font-sans ${
                            news.isPositive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                          }`}>
                            {news.isPositive ? "▲ POSITIVE IMPACT" : "▼ DEPRECIATE FLUID"}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            AFFECTS CO: <span className="text-slate-300 font-extrabold font-mono">{news.affectedTicker}</span>
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white mt-1">{news.headline}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans mt-0.5">{news.description}</p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 md:text-right">
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 w-full md:w-auto flex items-center md:flex-col justify-between md:justify-center">
                          <span className="text-[9px] text-slate-500 uppercase font-black md:mb-1 block">TICKER FLUX</span>
                          <span className={`font-mono text-xs font-black ${news.isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {news.isPositive ? "+" : ""}{(Math.round((news.priceMultiplier - 1) * 100))}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* FLOATING TOAST NOTIFICATIONS */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start space-x-3 transition-all duration-300 transform translate-y-0 animate-toast-in ${
              toast.type === "success" 
                ? "bg-slate-900 border-emerald-500/40 text-emerald-100" 
                : toast.type === "error"
                ? "bg-slate-900 border-red-500/40 text-red-100"
                : "bg-slate-900 border-amber-500/40 text-amber-100"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === "success" && <Check className="w-4 h-4 text-emerald-400" />}
              {toast.type === "error" && <AlertCircle className="w-4 h-4 text-red-400" />}
              {toast.type === "info" && <TrendingUp className="w-4 h-4 text-amber-500" />}
            </div>
            <div className="flex-1 text-xs leading-relaxed font-semibold">
              {toast.message}
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* MODAL 1: NEW MORNING DAY BRIEFING */}
      {morningBriefOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="text-center space-y-2">
              <span className="text-4xl block mb-2">📰</span>
              <div className="text-xs font-bold text-amber-500 uppercase tracking-widest uppercase">Apex Bloomberg Telegraph</div>
              <h3 className="text-lg font-black tracking-tight text-white">Morning Financial Briefing</h3>
              <p className="text-xs text-slate-400">Day {day} business operations briefing report</p>
            </div>

            <div className="my-5 border-t border-b border-slate-800 py-4 space-y-3 text-slate-300 leading-normal">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Major Daily Headline:</div>
                <h4 className="text-xs font-extrabold text-amber-400 mt-1">{activeNews?.headline}</h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">{activeNews?.description}</p>
              </div>

              {dailyDeductions > 0 && (
                <div className="border-t border-slate-800/50 pt-2 flex justify-between text-xs text-slate-400">
                  <span>HQ Rent & Specialist Salaries:</span>
                  <span className="font-semibold text-rose-400">-{formatCurrency(dailyDeductions)}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setMorningBriefOpen(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 font-bold py-3.5 px-6 rounded-xl text-xs text-slate-200 tracking-wide outline-none active:scale-98 transition-colors"
            >
              Authorize Operating Board
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: SUCCESS ACQUISITION DEAL SEALED */}
      {successDealClosed && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <span className="text-5xl block animate-bounce">🏆</span>
            <h3 className="text-xl font-black text-white">Deal Sealed Perfectly!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{successDealClosed}</p>
            <button
              onClick={() => setSuccessDealClosed(null)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl text-xs"
            >
              Sensational, Open Synergy Portfolio
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: WEEKLY DISPATCH NEW DEAL DISCOVERED POPUP */}
      {pendingWeeklyDeal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <span className="text-4xl block mb-2">📬</span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase font-black font-sans tracking-widest leading-none">
                Weekly Board Dispatch
              </span>
              <h3 className="text-lg font-black text-white mt-2 font-sans tracking-tight">New Corporate Deal Proposal!</h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">A fresh venture has landed on the Board-room desk. Review or archive it.</p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{pendingWeeklyDeal.ceoAvatar}</span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase">{pendingWeeklyDeal.name}</h4>
                  <span className="text-[10px] text-slate-500 font-bold font-sans uppercase">{pendingWeeklyDeal.sector} sector</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">"{pendingWeeklyDeal.description}"</p>
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-850 pt-2.5">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block uppercase">Est. Valuation</span>
                  <span className="font-mono text-slate-200 font-extrabold">{formatCurrency(pendingWeeklyDeal.baseValuation)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block uppercase">Initial Demands</span>
                  <span className="font-mono text-amber-500 font-extrabold">{formatCurrency(pendingWeeklyDeal.currentAskingPrice)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setMergers(prev => prev.map(m => {
                    if (m.id === pendingWeeklyDeal.id) {
                      return { ...m, isOpenToNegotiate: true };
                    }
                    return m;
                  }));
                  setSelectedMergerId(pendingWeeklyDeal.id);
                  setBoardroomSubTab("negotiate");
                  setSelectedTab("DEALS");
                  setPendingWeeklyDeal(null);
                  showToast(`Opening secure negotiation with ${pendingWeeklyDeal.name}!`, "success");
                }}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 rounded-xl text-xs shadow transition-all active:scale-98"
              >
                🤝 NEGOTIATE NOW
              </button>
              <button
                onClick={() => {
                  setMergers(prev => prev.map(m => {
                    if (m.id === pendingWeeklyDeal.id) {
                      return { ...m, isOpenToNegotiate: true };
                    }
                    return m;
                  }));
                  setPendingWeeklyDeal(null);
                  showToast("Proposal archived in the Boardroom Deals roster.", "info");
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-xl text-xs transition-colors"
              >
                📁 MOVE TO DEALS
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
