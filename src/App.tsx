import { useState, useMemo, useEffect } from "react";
import { 
  Building2, 
  TrendingUp, 
  Handshake, 
  History, 
  Play, 
  Award, 
  Check, 
  X, 
  Sparkles, 
  TrendingDown, 
  AlertCircle
} from "lucide-react";
import { Stock, MergerTarget, MarketNews, TransactionHistory, NegotiationMood } from "./types";
import { initialStocks, initialMergers, newsList } from "./game/GameData";

// Helper function to format millions
const formatMillions = (amountMillions: number): string => {
  if (amountMillions >= 1000.0) {
    return `$${(amountMillions / 1000.0).toFixed(2)}B`;
  } else {
    return `$${amountMillions.toFixed(1)}M`;
  }
};

// Helper function to format stock price
const formatStockPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

export default function App() {
  // Game state
  const [cashMillions, setCashMillions] = useState<number>(150.0);
  const [day, setDay] = useState<number>(1);
  const [stocks, setStocks] = useState<Stock[]>(initialStocks);
  const [mergers, setMergers] = useState<MergerTarget[]>(initialMergers);
  const [selectedTab, setSelectedTab] = useState<"HQ" | "FLOOR" | "DEALS" | "STATS">("HQ");
  const [activeNews, setActiveNews] = useState<MarketNews | null>(newsList[0]);
  const [transactions, setTransactions] = useState<TransactionHistory[]>([
    { day: 1, type: "DIVIDEND", subject: "Fund Seed Capital", amount: 150.0, isPositive: true }
  ]);

  // Trading floor UI state
  const [selectedStockTicker, setSelectedStockTicker] = useState<string>("NVDA");
  const [tradeAmountInput, setTradeAmountInput] = useState<string>("1000");

  // M&A UI state
  const [selectedMergerId, setSelectedMergerId] = useState<string>("solaris");
  const [draftOfferMillions, setDraftOfferMillions] = useState<number>(450.0);

  // Modals / notifications
  const [morningBriefOpen, setMorningBriefOpen] = useState<boolean>(true);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successDealClosed, setSuccessDealClosed] = useState<string | null>(null);
  const [walkedOutOpen, setWalkedOutOpen] = useState<boolean>(false);

  // Helper selectors
  const activeStock = useMemo(() => {
    return stocks.find(s => s.ticker === selectedStockTicker) || stocks[0];
  }, [stocks, selectedStockTicker]);

  const activeMerger = useMemo(() => {
    return mergers.find(m => m.id === selectedMergerId) || mergers[0];
  }, [mergers, selectedMergerId]);

  // Calculate Portfolio Value and Net Worth
  const portfolioValueMillions = useMemo(() => {
    return stocks.reduce((sum, stock) => sum + (stock.sharesOwned * stock.currentPrice) / 1000000.0, 0);
  }, [stocks]);

  const netWorthMillions = useMemo(() => {
    return cashMillions + portfolioValueMillions;
  }, [cashMillions, portfolioValueMillions]);

  const netWorthChangePercent = useMemo(() => {
    const prevCash = cashMillions;
    const prevStockVal = stocks.reduce((sum, stock) => {
      const prevPrice = stock.priceHistory[stock.priceHistory.length - 2] ?? stock.currentPrice;
      return sum + (stock.sharesOwned * prevPrice) / 1000000.0;
    }, 0);
    const prevNetWorth = prevCash + prevStockVal;
    
    return prevNetWorth > 0 ? ((netWorthMillions - prevNetWorth) / prevNetWorth) * 100.0 : 0.0;
  }, [cashMillions, stocks, netWorthMillions]);

  // Sync draft offer when active merger changes
  useEffect(() => {
    if (activeMerger) {
      setDraftOfferMillions(Math.round(activeMerger.currentAskingPrice * 10) / 10);
    }
  }, [selectedMergerId, activeMerger]);

  // Auto-clear notification after delay, except deal success or walkout
  useEffect(() => {
    if (infoMessage || errorMessage) {
      const timer = setTimeout(() => {
        setInfoMessage(null);
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [infoMessage, errorMessage]);

  // ADVANCE NEXT DAY
  const nextDay = () => {
    const nextDayNumber = day + 1;
    setDay(nextDayNumber);

    // 1. Passive income from completed mergers
    const dailyIncomeAccrued = mergers.filter(m => m.isCompleted).reduce((sum, m) => sum + m.dailyIncome, 0);

    // 2. Set next news update
    const newsIdx = (nextDayNumber - 1) % newsList.length;
    const todayNews = newsList[newsIdx];
    setActiveNews(todayNews);

    // 3. Fluctuate Stocks
    setStocks(prevStocks => {
      return prevStocks.map(stock => {
        let newsMultiplier = 1.0;
        if (todayNews.affectedTicker === "ALL" || todayNews.affectedTicker === stock.ticker) {
          newsMultiplier = todayNews.priceMultiplier;
        }

        // Random fluctuation based on volatility: from -volatility to +volatility
        const randSeed = (Math.random() * 2) - 1; // -1 to 1
        const fluctuationFactor = 1.0 + (randSeed * stock.volatility);
        
        let nextPrice = stock.currentPrice * fluctuationFactor * newsMultiplier;
        
        // Clamp bounds to prevent bankruptcy or insane numbers
        if (nextPrice < 1.0) nextPrice = 1.0 + Math.random() * 2;
        if (nextPrice > 10000.0) nextPrice = 10000.0;

        const newHistory = [...stock.priceHistory, nextPrice];
        if (newHistory.length > 15) {
          newHistory.shift();
        }

        return {
          ...stock,
          currentPrice: Math.round(nextPrice * 100) / 100,
          priceHistory: newHistory
        };
      });
    });

    // 4. Update Cash and Transaction log
    setCashMillions(prevCash => prevCash + dailyIncomeAccrued);
    if (dailyIncomeAccrued > 0) {
      setTransactions(prev => [
        ...prev,
        { day: nextDayNumber, type: "DIVIDEND", subject: "M&A Passive Yield Portfolio", amount: dailyIncomeAccrued, isPositive: true }
      ]);
    }

    setMorningBriefOpen(true);
    // Auto scroll view back to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // BUY SHARE ROUTINE
  const buyStock = (ticker: string, quantity: number) => {
    if (quantity <= 0 || isNaN(quantity)) {
      setErrorMessage("Please enter a valid positive quantity of shares.");
      return;
    }

    const stock = stocks.find(s => s.ticker === ticker);
    if (!stock) return;

    const totalCost = (stock.currentPrice * quantity) / 1000000.0;

    if (cashMillions < totalCost) {
      setErrorMessage(`Inadequate Cash! Required: $${totalCost.toFixed(2)}M, Cash Balance: $${cashMillions.toFixed(2)}M.`);
      return;
    }

    setCashMillions(prev => prev - totalCost);
    setStocks(prev => prev.map(s => {
      if (s.ticker === ticker) {
        const nextShares = s.sharesOwned + quantity;
        const nextAvg = ((s.avgBuyPrice * s.sharesOwned) + (stock.currentPrice * quantity)) / nextShares;
        return {
          ...s,
          sharesOwned: nextShares,
          avgBuyPrice: Math.round(nextAvg * 100) / 100
        };
      }
      return s;
    }));

    setTransactions(prev => [
      ...prev,
      { day, type: "BUY", subject: `Bought ${quantity.toLocaleString()} shares of ${ticker}`, amount: totalCost, isPositive: false }
    ]);
    setInfoMessage(`Successfully bought ${quantity.toLocaleString()} shares of ${ticker} for $${totalCost.toFixed(2)}M.`);
  };

  // SELL SHARE ROUTINE
  const sellStock = (ticker: string, quantity: number) => {
    if (quantity <= 0 || isNaN(quantity)) {
      setErrorMessage("Please enter a valid positive quantity of shares.");
      return;
    }

    const stock = stocks.find(s => s.ticker === ticker);
    if (!stock) return;

    if (stock.sharesOwned < quantity) {
      setErrorMessage(`Not enough shares owned in ${ticker}! Max available: ${stock.sharesOwned}.`);
      return;
    }

    const totalCredit = (stock.currentPrice * quantity) / 1000000.0;

    setCashMillions(prev => prev + totalCredit);
    setStocks(prev => prev.map(s => {
      if (s.ticker === ticker) {
        const nextShares = s.sharesOwned - quantity;
        const nextAvg = nextShares === 0 ? 0 : s.avgBuyPrice;
        return { ...s, sharesOwned: nextShares, avgBuyPrice: nextAvg };
      }
      return s;
    }));

    setTransactions(prev => [
      ...prev,
      { day, type: "SELL", subject: `Sold ${quantity.toLocaleString()} shares of ${ticker}`, amount: totalCredit, isPositive: true }
    ]);
    setInfoMessage(`Successfully sold ${quantity.toLocaleString()} shares of ${ticker} for $${totalCredit.toFixed(2)}M.`);
  };

  // RECALCULATE TRUST MOOD FOR M&A CEOs
  const recalculateMoodAndWalkout = (id: string, updatedList: MergerTarget[]) => {
    return updatedList.map(item => {
      if (item.id === id) {
        let mood: NegotiationMood = "Reasonable";
        let isWalkedOut = item.isWalkedOut;
        let dialogueQuote = item.dialogueQuote;

        if (item.trust <= 0) {
          mood = "Walked Out";
          isWalkedOut = true;
          dialogueQuote = "“Enough of this. Your numbers do not set with our expectations, and your arguments are insulting. This board is leaving the conference room immediately. No deal.”";
          setWalkedOutOpen(true);
        } else if (item.trust < 25) {
          mood = "Defensive";
        } else if (item.trust < 45) {
          mood = "Greedy";
        } else if (item.trust < 75) {
          mood = "Reasonable";
        } else {
          mood = "Thrilled";
        }

        return { ...item, mood, isWalkedOut, dialogueQuote };
      }
      return item;
    });
  };

  // board seat knocks off 10% from minAcceptableThreshold
  // equity share knocks off 15% from minAcceptableThreshold
  // retaining CEO knocks off 8% from minAcceptableThreshold
  const getAdjustedMinimumThreshold = (target: MergerTarget): number => {
    let min = target.minAcceptableThreshold;
    if (target.termBoardSeat) min -= target.baseValuation * 0.10;
    if (target.termEquityShare) min -= target.baseValuation * 0.15;
    if (target.termRetainCEO) min -= target.baseValuation * 0.08;
    return Math.max(min, target.baseValuation * 0.5); // can never go below 50%
  };

  // M&A SWEETENERS TOGGLE
  const toggleTermBoardSeat = (targetId: string) => {
    setMergers(prev => {
      const list = prev.map(m => {
        if (m.id === targetId) {
          const active = !m.termBoardSeat;
          const trustBonus = active ? 10 : -5;
          const quote = active 
            ? `${m.ceoName}’s demanding tone softens slightly. “Granting our board representation demonstrates your strategic loyalty. We can lower our cash requirement.”`
            : `${m.ceoName} frowns. “Retracting the board seat means we require higher cash compensation to hedge our loss of governance.”`;
          return {
            ...m,
            termBoardSeat: active,
            dialogueQuote: quote,
            trust: Math.min(100, Math.max(0, m.trust + trustBonus))
          };
        }
        return m;
      });
      return recalculateMoodAndWalkout(targetId, list);
    });
  };

  const toggleTermEquityShare = (targetId: string) => {
    setMergers(prev => {
      const list = prev.map(m => {
        if (m.id === targetId) {
          const active = !m.termEquityShare;
          const trustBonus = active ? 15 : -8;
          const quote = active 
            ? `${m.ceoName} nods as her finance partners take notes. “15% equity inside the parent Apex Fund matches our interests perfectly. This lowers our liquid cash payout.”`
            : `${m.ceoName} sighs. “An all-cash reliant transaction restricts our ongoing share in your fund’s upside. Prepare to shell out more raw liquidity.”`;
          return {
            ...m,
            termEquityShare: active,
            dialogueQuote: quote,
            trust: Math.min(100, Math.max(0, m.trust + trustBonus))
          };
        }
        return m;
      });
      return recalculateMoodAndWalkout(targetId, list);
    });
  };

  const toggleTermRetainCEO = (targetId: string) => {
    setMergers(prev => {
      const list = prev.map(m => {
        if (m.id === targetId) {
          const active = !m.termRetainCEO;
          const trustBonus = active ? 8 : -10;
          const quote = active 
            ? `${m.ceoName} breathes a sigh of relief. “Allowing me to retain creative and operating leadership means my vision remains authentic. Equity values aligned.”`
            : `${m.ceoName} alerts. “Exiling me from my own startup? Highly suspicious. Our valuation is firm; expect no discounts on clean buyouts.”`;
          return {
            ...m,
            termRetainCEO: active,
            dialogueQuote: quote,
            trust: Math.min(100, Math.max(0, m.trust + trustBonus))
          };
        }
        return m;
      });
      return recalculateMoodAndWalkout(targetId, list);
    });
  };

  // HIGHLIGHT SYNERGIES EXEC
  const highlightSynergy = (targetId: string) => {
    const target = mergers.find(m => m.id === targetId);
    if (!target || target.isCompleted || target.isWalkedOut) return;

    if (target.highlightedSynergiesCount >= 3) {
      setErrorMessage("You have exhausted clean synergy representations. Drastically pushing this will look desperate.");
      return;
    }

    setMergers(prev => {
      const list = prev.map(m => {
        if (m.id === targetId) {
          const nextCount = m.highlightedSynergiesCount + 1;
          const askPriceDrop = m.baseValuation * 0.04; // 4% off asking price
          const nextPrice = Math.max(getAdjustedMinimumThreshold(m), m.currentAskingPrice - askPriceDrop);
          
          let quote = "";
          if (targetId === "solaris") {
            quote = `“Apex's high capacity server arrays combined with Solaris green lithium extraction grid? Brilliant synergy, Mr. Director. This reduces our required valuation to $${nextPrice.toFixed(1)}M.”`;
          } else if (targetId === "nova") {
            quote = `“I admit, combining Apex Capital's microchip logistics with Nova's bipedal robotics lines opens up massive markets. I can shave some millions off our asking price. Asking price drops to $${nextPrice.toFixed(1)}M.”`;
          } else if (targetId === "biogen") {
            quote = `“Dr. Clara Wu smiles. “Integrating your medical insurance networks with our therapeutic rollout schedule will save lives. Together we accelerate healthcare. Letting go for $${nextPrice.toFixed(1)}M.”`;
          } else {
            quote = `“I see how your capital injections scale our core utility generation capability. I am receptive. Asking price drops to $${nextPrice.toFixed(1)}M.”`;
          }

          return {
            ...m,
            highlightedSynergiesCount: nextCount,
            currentAskingPrice: Number(nextPrice.toFixed(1)),
            trust: Math.min(100, m.trust + 12),
            dialogueQuote: quote
          };
        }
        return m;
      });
      return recalculateMoodAndWalkout(targetId, list);
    });
    setInfoMessage("Synergies highlighted! Trust gained and asking price reduced.");
  };

  // ARGUE VALUATIONS EXEC
  const argueValuation = (targetId: string) => {
    const target = mergers.find(m => m.id === targetId);
    if (!target || target.isCompleted || target.isWalkedOut) return;

    if (target.arguedValuationCount >= 3) {
      setErrorMessage("The CEO is completely fed up with your budget audits and spreadsheet arguments!");
      return;
    }

    setMergers(prev => {
      const list = prev.map(m => {
        if (m.id === targetId) {
          const nextCount = m.arguedValuationCount + 1;
          
          // Deduct 7% of base value, but drop trust by 15. If trust was already critical (< 20), price actually INCREASES!
          let askPriceDrop = m.baseValuation * 0.07;
          let trustLoss = 15;
          let quote = "";

          if (m.trust < 20) {
            askPriceDrop = -m.baseValuation * 0.05; // increases price!
            trustLoss = 20;
            const updatedPrice = m.currentAskingPrice - askPriceDrop;
            quote = `“You dare suggest our intellectual intellectual property is a bubble? This is insulting! In fact, we are raising our buyout demand to $${updatedPrice.toFixed(1)}M for the disruption.”`;
            
            return {
              ...m,
              arguedValuationCount: nextCount,
              currentAskingPrice: Number(updatedPrice.toFixed(1)),
              trust: Math.max(0, m.trust - trustLoss),
              dialogueQuote: quote
            };
          } else {
            const nextPrice = Math.max(getAdjustedMinimumThreshold(m), m.currentAskingPrice - askPriceDrop);
            if (targetId === "solaris") {
              quote = `“You raise a fair point about solar storage degradation trends,” Elena concedes coldly. “Our patent margin has slight vulnerabilities. Alright, we lower our valuation requirements to $${nextPrice.toFixed(1)}M.”`;
            } else if (targetId === "nova") {
              quote = `“Harrumph.” Victor folds his arms. “So our robotic servo suppliers have slightly lower margins... Fine, I'll discount our price by a fraction. New asking price is $${nextPrice.toFixed(1)}M. Don't press your luck.”`;
            } else if (targetId === "biogen") {
              quote = `“Dr. Clara Wu sounds disappointed. “Scientific discovery requires a buffer for failure, Director. But if you insist on squeezing our clinical phase metrics, fine... $${nextPrice.toFixed(1)}M. But don't treat us like generic factories.”`;
            } else {
              quote = `“Marcus growls. “You talk big about green transitions. I have survived 4 oil crashes. Fine, I'll shave off a little. Buy us out for $${nextPrice.toFixed(1)}M or shut up.”`;
            }

            return {
              ...m,
              arguedValuationCount: nextCount,
              currentAskingPrice: Number(nextPrice.toFixed(1)),
              trust: Math.max(0, m.trust - trustLoss),
              dialogueQuote: quote
            };
          }
        }
        return m;
      });
      return recalculateMoodAndWalkout(targetId, list);
    });
    setInfoMessage("Argued valuation! Drastically lowered target's asking price but damaged professional trust.");
  };

  // SUBMIT PROPOSAL / TEST COUNTER OFFER
  const submitProposal = (targetId: string, offer: number) => {
    const target = mergers.find(m => m.id === targetId);
    if (!target || target.isCompleted || target.isWalkedOut) return;

    if (isNaN(offer) || offer <= 0) {
      setErrorMessage("Please enter a valid cash proposal.");
      return;
    }

    const minAllowed = getAdjustedMinimumThreshold(target);
    let quote = "";
    let trustDiff = 0;

    if (offer < minAllowed * 0.82) {
      // Insultingly low
      trustDiff = -18;
      quote = `“$${offer.toFixed(1)}M? Are you joking? An offer this insulting makes me wonder why we wastes our board's valuable time. This is absurd.”`;
    } else if (offer < minAllowed) {
      // Respectable but below the board's standard threshold
      trustDiff = -5;
      quote = `“Your cash offer of $${offer.toFixed(1)}M is respectable but insufficient. With our operational overhead, our board simply cannot authorize a deal at these numbers.”`;
    } else if (offer >= target.currentAskingPrice) {
      // Asking price matched or surpassed
      trustDiff = 15;
      quote = `“Excellent! $${offer.toFixed(1)}M is highly generous. Our board is thrilled. Press 'Seal Deal' to finalize legal paperwork and transfer capital!”`;
    } else {
      // Negotiable range
      trustDiff = 6;
      quote = `“$${offer.toFixed(1)}M is inside our negotiable range. If you seal this, our partners will likely vote yes. Ready to put signatures on the paper.”`;
    }

    setMergers(prev => {
      const list = prev.map(m => {
        if (m.id === targetId) {
          return {
            ...m,
            trust: Math.min(100, Math.max(0, m.trust + trustDiff)),
            dialogueQuote: quote
          };
        }
        return m;
      });
      return recalculateMoodAndWalkout(targetId, list);
    });

    setInfoMessage(`Proposal of $${offer.toFixed(1)}M submitted for CEO evaluation!`);
  };

  // SEAL MERGER DEAL
  const sealDeal = (targetId: string, offer: number) => {
    const target = mergers.find(m => m.id === targetId);
    if (!target) return;

    if (target.isCompleted) {
      setErrorMessage("We have already acquired and integrated this firm.");
      return;
    }

    if (target.isWalkedOut) {
      setErrorMessage("The CEO has walked out. You must first pay professional break-up fee to bring them back.");
      return;
    }

    if (cashMillions < offer) {
      setErrorMessage(`Insufficient Cash Reserves! This buyout requires $${offer.toFixed(1)}M, while we currently yield $${cashMillions.toFixed(2)}M.`);
      return;
    }

    const minThreshold = getAdjustedMinimumThreshold(target);

    if (offer >= minThreshold) {
      // MERGER SUCCESS!
      setMergers(prev => prev.map(m => {
        if (m.id === targetId) {
          return {
            ...m,
            isCompleted: true,
            dialogueQuote: `“Deal sealed! The wires have cleared. Solaris GreenTech is proud to join Apex Capital. Let's conquer the market.”`
          };
        }
        return m;
      }));

      // Apply Sector stock boost (multiplies previous stock values of this merger's sector!)
      setStocks(prev => prev.map(stock => {
        if (stock.sector === target.sector) {
          const priceBoost = stock.currentPrice * (target.techStockBoost - 1.0);
          const nextPrice = Math.round((stock.currentPrice + priceBoost) * 100) / 100;
          return {
            ...stock,
            currentPrice: nextPrice,
            priceHistory: [...stock.priceHistory, nextPrice]
          };
        }
        return stock;
      }));

      setCashMillions(prev => prev - offer);
      setTransactions(prev => [
        ...prev,
        { day, type: "M&A", subject: `ACQUIRED ${target.name} for $${offer.toFixed(1)}M`, amount: offer, isPositive: true }
      ]);

      setSuccessDealClosed(
        `SUCCESS! Acquired ${target.name} for $${offer.toFixed(1)}M!\nThis firm now spawns a stable passive income of +$${target.dailyIncome}M every morning! It has also increased all local ${target.sector} stock prices due to trade synergies.`
      );
    } else {
      // REJECTED PROPOSAL
      setMergers(prev => {
        const list = prev.map(m => {
          if (m.id === targetId) {
            return {
              ...m,
              trust: Math.max(0, m.trust - 15),
              dialogueQuote: `“We put your motion to the board, and it was REJECTED. Your final buyout numbers ($${offer.toFixed(1)}M) don't set correctly! We need higher payout, board terms, or equity shares.”`
            };
          }
          return m;
        });
        return recalculateMoodAndWalkout(targetId, list);
      });
      setErrorMessage("The acquisition attempt collapsed! The board refused the offer. Trust fell significantly.");
    }
  };

  // PAY BREAKUP FEE / RESET NEGOTIATIONS
  const payBreakUpFee = (targetId: string) => {
    const target = mergers.find(m => m.id === targetId);
    if (!target) return;

    const fee = target.baseValuation * 0.05; // 5% fee

    if (cashMillions < fee) {
      setErrorMessage(`Insufficient Cash to pay the $${fee.toFixed(1)}M advisory break-up fee! Required: $${fee.toFixed(1)}M, Cash: $${cashMillions.toFixed(2)}M.`);
      return;
    }

    setCashMillions(prev => prev - fee);
    setMergers(prev => prev.map(m => {
      if (m.id === targetId) {
        return {
          ...m,
          isWalkedOut: false,
          trust: 40,
          mood: "Reasonable",
          currentAskingPrice: m.baseValuation,
          arguedValuationCount: 0,
          highlightedSynergiesCount: 0,
          termBoardSeat: false,
          termEquityShare: false,
          termRetainCEO: false,
          dialogueQuote: "“Our legal advisors convinced us to re-enter the conference table. But our price resets, and our patience is limited.”"
        };
      }
      return m;
    }));

    setTransactions(prev => [
      ...prev,
      { day, type: "M&A", subject: `Paid Break-Up Advisor Penalty for ${target.name}`, amount: fee, isPositive: false }
    ]);
    setInfoMessage(`Paid $${fee.toFixed(1)}M legal penalties. Negotiations have completely reset.`);
    setWalkedOutOpen(false);
  };

  // RESTART GAME ROUTINE
  const restartGame = () => {
    setCashMillions(150.0);
    setDay(1);
    
    // Hard clone
    setStocks(initialStocks.map(s => ({ ...s, sharesOwned: 0, avgBuyPrice: 0 })));
    setMergers(initialMergers.map(m => ({
      ...m,
      trust: m.id === "solaris" ? 50 : m.id === "nova" ? 45 : m.id === "biogen" ? 60 : 30,
      mood: m.id === "solaris" ? "Reasonable" : m.id === "nova" ? "Defensive" : m.id === "biogen" ? "Reasonable" : "Greedy",
      currentAskingPrice: m.baseValuation,
      isCompleted: false,
      isWalkedOut: false,
      termBoardSeat: false,
      termEquityShare: false,
      termRetainCEO: false,
      arguedValuationCount: 0,
      highlightedSynergiesCount: 0
    })));
    setSelectedTab("HQ");
    setActiveNews(newsList[0]);
    setTransactions([
      { day: 1, type: "DIVIDEND", subject: "Fund Seed Capital Initialized", amount: 150.0, isPositive: true }
    ]);
    setSelectedStockTicker("NVDA");
    setTradeAmountInput("1000");
    setSelectedMergerId("solaris");
    setMorningBriefOpen(true);
    setInfoMessage("Apex Capital game simulation has restarted!");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-200">
      
      {/* GLOBAL TOAST OVERLAYS */}
      {infoMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg bg-orange-50 border border-amber-300 text-stone-800 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3 transition-all animate-bounce">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="text-sm font-medium flex-1">{infoMessage}</span>
          <button onClick={() => setInfoMessage(null)} className="text-stone-400 hover:text-stone-600 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg bg-rose-50 border border-red-300 text-stone-800 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3 transition-all animate-pulse">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span className="text-sm font-medium flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-stone-400 hover:text-stone-700 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successDealClosed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-emerald-100 text-center relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500" />
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 leading-tight">ACQUISITION SUCCESSFUL!</h3>
            <p className="text-sm text-slate-500 mt-1 uppercase tracking-wider font-extrabold text-emerald-600">Company Acquired &amp; Integrated</p>
            <div className="bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl p-4 my-4 text-left text-sm leading-relaxed whitespace-pre-line">
              {successDealClosed}
            </div>
            <button 
              onClick={() => {
                setSuccessDealClosed(null);
                setSelectedTab("HQ");
              }} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-emerald-600/20 transition-all uppercase tracking-wider text-sm mt-2"
            >
              Examine Passive Yields
            </button>
          </div>
        </div>
      )}

      {/* WALKED OUT NEGOTIATION RESET OVERLAY */}
      {walkedOutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-red-100 relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800">CEO Negotiation Retreated</h4>
                <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Acquisition Blocked</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Negotiation breakdown completed. {activeMerger?.ceoName} walked out of our executive boardroom due to disrespectful terms, aggressive audits, or insultingly low capital proposals.
            </p>
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 my-4">
              <div className="flex justify-between items-center text-xs text-amber-800 font-bold mb-1">
                <span>RE-ENGAGEMENT FEE</span>
                <span>5% OF VALUATIONS</span>
              </div>
              <p className="text-2xl font-black text-amber-900">
                {activeMerger ? formatMillions(activeMerger.baseValuation * 0.05) : "$0.0M"}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Apex Capital must deploy a strategic legal/advisor re-initiation packet to recover board trust and reopen mergers.
              </p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setWalkedOutOpen(false)}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 py-3 rounded-xl font-bold text-sm transition"
              >
                Dismiss
              </button>
              <button 
                onClick={() => activeMerger && payBreakUpFee(activeMerger.id)}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-3 rounded-xl font-extrabold text-sm shadow-md transition"
              >
                Wire Advisory Fee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DAILY MORNING BRIEFING DIALOG */}
      {morningBriefOpen && activeNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-zinc-900 text-white rounded-3xl p-6 shadow-2xl border border-zinc-800 relative ring-1 ring-white/10">
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => setMorningBriefOpen(false)} 
                className="p-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2 text-blue-400 font-mono text-xs tracking-widest uppercase font-black mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Apex Capital Dispatch • Day {day}</span>
            </div>

            <h3 className="text-2xl font-black leading-tight tracking-tight text-white mb-4">
              {activeNews.headline}
            </h3>

            <p className="text-zinc-300 text-sm leading-relaxed mb-5 bg-zinc-800/40 border border-zinc-800 rounded-2xl p-4">
              {activeNews.description}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-zinc-800/60 rounded-xl p-3 border border-zinc-800">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500">AFFECTED ASSET</span>
                <span className="font-extrabold text-white text-sm">{activeNews.affectedTicker === "ALL" ? "Global Market Funds" : activeNews.affectedTicker}</span>
              </div>
              <div className="bg-zinc-800/60 rounded-xl p-3 border border-zinc-800">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500">IMPACT FORECAST</span>
                <span className={`font-extrabold text-sm flex items-center mt-0.5 ${activeNews.isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                  {activeNews.isPositive ? (
                    <>
                      <TrendingUp className="w-4 h-4 mr-1 shrink-0" />
                      <span>+{Math.round((activeNews.priceMultiplier - 1.0) * 100)}% Momentum</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 mr-1 shrink-0" />
                      <span>-{Math.round((1.0 - activeNews.priceMultiplier) * 100)}% Pressure</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setMorningBriefOpen(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 px-6 rounded-xl text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all font-mono"
            >
              Acknowledge Briefing
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL HEADER BAR */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-950/20">
              AC
            </div>
            <div>
              <span className="block text-[10px] font-extrabold text-blue-950 uppercase tracking-widest">APEX CAPITAL</span>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black text-slate-800 tracking-tight">{formatMillions(netWorthMillions)}</span>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${netWorthChangePercent >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-red-600"}`}>
                  {netWorthChangePercent >= 0 ? "+" : ""}{netWorthChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-4 py-2 text-xs font-extrabold tracking-widest transition">
              DAY {day}
            </div>
            
            <button 
              onClick={nextDay}
              className="bg-blue-800 hover:bg-blue-900 active:bg-blue-950 text-white rounded-xl px-4 py-2 text-xs font-bold tracking-wider flex items-center space-x-2 shadow-sm uppercase transition"
            >
              <span>Next Day</span>
              <Play className="w-3.5 h-3.5" />
            </button>

            <button 
              onClick={restartGame}
              className="border border-slate-200 hover:bg-slate-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition"
              title="Reset Simulation"
            >
              Reset
            </button>
          </div>

        </div>

        {/* HORIZONTAL MINI TICKER BANNER */}
        <div className="bg-slate-900 py-2 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 overflow-x-auto whitespace-nowrap flex items-center space-x-4">
            <span className="text-zinc-500 font-extrabold text-[9px] tracking-widest uppercase mr-2 border-r border-zinc-800 pr-4 shrink-0">MARKET TICKERS</span>
            <div className="flex items-center space-x-5">
              {stocks.map(stock => {
                const prevPrice = stock.priceHistory[stock.priceHistory.length - 2] ?? stock.currentPrice;
                const changeP = ((stock.currentPrice - prevPrice) / prevPrice) * 100.0;
                const isPos = changeP >= 0;
                return (
                  <button 
                    key={stock.ticker}
                    onClick={() => {
                      setSelectedStockTicker(stock.ticker);
                      setSelectedTab("FLOOR");
                    }}
                    className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700/80 transition-all border border-zinc-800 hover:border-zinc-700 rounded-lg px-2.5 py-1 text-xs shrink-0"
                  >
                    <span className="font-extrabold text-zinc-300">{stock.ticker}</span>
                    <span className="font-mono text-zinc-400">{formatStockPrice(stock.currentPrice)}</span>
                    <span className={`font-mono font-bold text-[11px] ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
                      {isPos ? "▲" : "▼"}{changeP.toFixed(1)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* CORE WRAP SCREEN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col md:flex-row gap-6">
        
        {/* TAB NAVIGATION PANEL */}
        <aside className="md:w-64 shrink-0 flex flex-row md:flex-col gap-2 p-1 bg-white border border-slate-200 rounded-2xl md:self-start">
          <button 
            onClick={() => setSelectedTab("HQ")} 
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start space-x-3 px-4 py-3 rounded-xl transition text-xs font-black tracking-wider uppercase ${selectedTab === "HQ" ? "bg-blue-50 text-blue-900 font-black border-l-0 md:border-l-4 border-blue-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Headquarters</span>
          </button>
          
          <button 
            onClick={() => setSelectedTab("FLOOR")} 
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start space-x-3 px-4 py-3 rounded-xl transition text-xs font-black tracking-wider uppercase ${selectedTab === "FLOOR" ? "bg-blue-50 text-blue-900 font-black border-l-0 md:border-l-4 border-blue-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Trading Floor</span>
          </button>
          
          <button 
            onClick={() => setSelectedTab("DEALS")} 
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start space-x-3 px-4 py-3 rounded-xl transition text-xs font-black tracking-wider uppercase ${selectedTab === "DEALS" ? "bg-blue-50 text-blue-900 font-black border-l-0 md:border-l-4 border-blue-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <Handshake className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">M&amp;A Room</span>
          </button>
          
          <button 
            onClick={() => setSelectedTab("STATS")} 
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start space-x-3 px-4 py-3 rounded-xl transition text-xs font-black tracking-wider uppercase ${selectedTab === "STATS" ? "bg-blue-50 text-blue-900 font-black border-l-0 md:border-l-4 border-blue-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Deal Ledger</span>
          </button>
        </aside>

        {/* TAB VIEWPORTS */}
        <section className="flex-1 min-w-0">
          
          {/* TAB 1: HEADQUARTERS */}
          {selectedTab === "HQ" && (
            <div className="space-y-6">
              
              {/* PRIMARY BALANCE LEDGER */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/40 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                <h2 className="text-slate-500 font-black text-xs tracking-wider uppercase">PORTFOLIO EXECUTIVE LEDGER</h2>
                <div className="text-4xl font-extrabold text-slate-800 mt-2 mb-6">
                  {formatMillions(netWorthMillions)}
                </div>
                
                <hr className="border-slate-100 my-4" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Liquid Capital Reserves</span>
                    <div className="text-2xl font-black text-blue-800 mt-1 font-mono">
                      {formatMillions(cashMillions)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Stock Assets Holding</span>
                    <div className="text-2xl font-black text-slate-800 mt-1 font-mono">
                      {formatMillions(portfolioValueMillions)}
                    </div>
                  </div>
                </div>

                {/* PASSIVE INCOME MODULE */}
                {mergers.some(m => m.isCompleted) && (
                  <div className="mt-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Award className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-emerald-800 uppercase tracking-wide">Acquisition Passive Yield</span>
                        <p className="text-[11px] text-emerald-600">Passive dividends accrued automatically every turn advances.</p>
                      </div>
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-600">
                      +${mergers.filter(m => m.isCompleted).reduce((sum, m) => sum + m.dailyIncome, 0).toFixed(1)}M/turn
                    </div>
                  </div>
                )}
              </div>

              {/* SECTOR HOLDINGS */}
              <div>
                <h3 className="font-extrabold text-slate-800 mb-3 text-lg leading-tight">Strategic Corporate Portfolio</h3>
                {stocks.filter(s => s.sharesOwned > 0).length === 0 ? (
                  <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-8 text-center">
                    <p className="font-bold text-slate-700 mb-1">Your trading desks remain silent.</p>
                    <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">Explore the Trading Floor to acquire equity shares in major tech, renewable energy, and pharmaceutical industries.</p>
                    <button 
                      onClick={() => setSelectedTab("FLOOR")}
                      className="bg-blue-900 text-white rounded-xl px-4 py-2.5 text-xs font-extrabold uppercase shadow-sm hover:bg-blue-950 transition"
                    >
                      Browse Stocks
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stocks.filter(s => s.sharesOwned > 0).map(stock => {
                      const stockValue = (stock.sharesOwned * stock.currentPrice) / 1000000.0;
                      const prevPrice = stock.priceHistory[stock.priceHistory.length - 2] ?? stock.currentPrice;
                      const todayChange = ((stock.currentPrice - prevPrice) / prevPrice) * 100.0;
                      return (
                        <div 
                          key={stock.ticker}
                          onClick={() => {
                            setSelectedStockTicker(stock.ticker);
                            setSelectedTab("FLOOR");
                          }}
                          className="bg-white hover:bg-slate-50/50 cursor-pointer border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition shadow-sm"
                        >
                          <div className="flex-1 min-w-[120px]">
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-slate-800 text-base">{stock.ticker}</span>
                              <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                                {stock.sector}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">{stock.name}</span>
                          </div>

                          <div className="text-center sm:text-left min-w-[100px]">
                            <div className="text-xs font-extrabold text-slate-700">{stock.sharesOwned.toLocaleString()} Shares</div>
                            <span className="text-[10px] text-slate-400 font-mono">Avg: ${stock.avgBuyPrice.toFixed(2)}</span>
                          </div>

                          <div className="text-right min-w-[120px]">
                            <div className="text-sm font-black text-slate-800 font-mono">{formatMillions(stockValue)}</div>
                            <span className={`text-[11px] font-bold font-mono ${todayChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {todayChange >= 0 ? "▲" : "▼"} {Math.abs(todayChange).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RECENT TRANSACTIONS QUICK PREVIEW */}
              <div>
                <h3 className="font-extrabold text-slate-800 mb-3 text-lg leading-tight">M&amp;A Assets Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mergers.map(m => {
                    return (
                      <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
                        <div>
                          <span className="text-2xl">{m.ceoAvatar}</span>
                          <div className="font-extrabold text-slate-800 text-sm mt-1">{m.name}</div>
                          <p className="text-[11px] text-slate-500">CEO: {m.ceoName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {m.isCompleted ? (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-100">
                              Integrated
                            </span>
                          ) : m.isWalkedOut ? (
                            <button 
                              onClick={() => {
                                setSelectedMergerId(m.id);
                                setWalkedOutOpen(true);
                              }}
                              className="bg-rose-50 text-red-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-rose-100 hover:bg-rose-100 transition"
                            >
                              Walked Out
                            </button>
                          ) : (
                            <button 
                              onClick={() => {
                                setSelectedMergerId(m.id);
                                setSelectedTab("DEALS");
                              }}
                              className="bg-blue-50 text-blue-900 hover:bg-blue-100 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-blue-100 transition"
                            >
                              Negotiating
                            </button>
                          )}
                          <div className="text-xs font-mono text-slate-400 mt-1">Val: {formatMillions(m.baseValuation)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ADVANCE DAY HERO ACTION BUTTON */}
              <div className="bg-blue-900 text-white rounded-3xl p-6 shadow-lg shadow-blue-950/20 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-extrabold tracking-tight">Advance Executive Cycle</h3>
                  <p className="text-xs text-blue-100/80 leading-relaxed mt-1">
                    Advance to tomorrow. This recalculates market stock tickers, triggers daily business news briefs, deposits active merger cash revenues, and updates target startup values.
                  </p>
                </div>
                <button 
                  onClick={nextDay}
                  className="w-full md:w-auto bg-white hover:bg-slate-100 text-blue-900 font-extrabold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow shadow-blue-950/30 shrink-0 text-sm tracking-wide transition-all uppercase"
                >
                  <span>Advance to Day {day + 1}</span>
                  <Play className="w-4 h-4 shrink-0 fill-current" />
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: TRADING FLOOR */}
          {selectedTab === "FLOOR" && (
            <div className="space-y-6">
              
              {/* STOCK PICKER SELECTORS */}
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
                <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Select Active Ledger to Trade</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {stocks.map(item => {
                    const isSelected = item.ticker === selectedStockTicker;
                    const prevPrice = item.priceHistory[item.priceHistory.length - 2] ?? item.currentPrice;
                    const changeVal = ((item.currentPrice - prevPrice) / prevPrice) * 100;
                    return (
                      <button 
                        key={item.ticker}
                        onClick={() => setSelectedStockTicker(item.ticker)}
                        className={`p-3 rounded-2xl border text-center transition-all ${isSelected ? "bg-blue-900 border-blue-900 text-white shadow-md shadow-blue-950/25" : "bg-slate-50 border-slate-100 text-slate-800 hover:bg-slate-100"}`}
                      >
                        <span className="block font-black tracking-tight text-sm">{item.ticker}</span>
                        <span className={`block text-[11px] font-bold font-mono mt-0.5 ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                          ${item.currentPrice.toFixed(1)}
                        </span>
                        <span className={`block text-[10px] font-black font-mono leading-none mt-1 ${isSelected ? "text-emerald-300" : changeVal >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {changeVal >= 0 ? "+" : ""}{changeVal.toFixed(1)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ACTIVE STOCK CANVAS CHART DISPLAY */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">{activeStock.ticker}</h3>
                      <span className="bg-blue-50 text-blue-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-blue-100">
                        {activeStock.sector} Sector
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{activeStock.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-slate-800 font-mono">
                      {formatStockPrice(activeStock.currentPrice)}
                    </div>
                    <span className={`text-xs font-bold font-mono ${((activeStock.currentPrice - (activeStock.priceHistory[activeStock.priceHistory.length - 2] ?? activeStock.currentPrice)) >= 0) ? "text-emerald-600" : "text-red-500"}`}>
                      {((activeStock.currentPrice - (activeStock.priceHistory[activeStock.priceHistory.length - 2] ?? activeStock.currentPrice)) >= 0) ? "▲" : "▼"}{" "}
                      {Math.abs(((activeStock.currentPrice - (activeStock.priceHistory[activeStock.priceHistory.length - 2] ?? activeStock.currentPrice)) / (activeStock.priceHistory[activeStock.priceHistory.length - 2] ?? activeStock.currentPrice)) * 100).toFixed(1)}% today
                    </span>
                  </div>
                </div>

                {/* GRAPH CANVAS WITH REACT GENERATED SVG */}
                <div className="w-full h-44 bg-slate-50 border border-slate-100 rounded-2xl relative p-2 overflow-hidden my-6">
                  {activeStock.priceHistory.length >= 2 ? (
                    <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Generate points */}
                      {(() => {
                        const prices = activeStock.priceHistory;
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        const range = Math.max(1, maxPrice - minPrice);
                        const widthStep = 500 / (prices.length - 1);
                        
                        const points = prices.map((price, i) => {
                          const x = i * widthStep;
                          // Leave padding top and bottom
                          const y = 180 - ((price - minPrice) / range) * 140;
                          return { x, y };
                        });

                        // Draw path line
                        let dPath = `M ${points[0].x} ${points[0].y}`;
                        for (let idx = 1; idx < points.length; idx++) {
                          const cpX = (points[idx - 1].x + points[idx].x) / 2;
                          dPath += ` C ${cpX} ${points[idx - 1].y}, ${cpX} ${points[idx].y}, ${points[idx].x} ${points[idx].y}`;
                        }

                        // Area path
                        const dArea = `${dPath} L 500 200 L 0 200 Z`;

                        return (
                          <>
                            <path d={dArea} fill="url(#chartGlow)" />
                            <path d={dPath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
                            {points.map((p, i) => (
                              <circle 
                                key={i} 
                                cx={p.x} 
                                cy={p.y} 
                                r="4" 
                                fill={i === points.length - 1 ? "#2563eb" : "#ffffff"} 
                                stroke="#2563eb" 
                                strokeWidth="2" 
                              />
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400 font-mono text-xs">Accumulating index datasets...</div>
                  )}
                  
                  {/* Grid Labels */}
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[9px] font-extrabold text-slate-400 font-mono uppercase">
                    <span>10 Turns Ago</span>
                    <span>Recent History Index</span>
                    <span>Today</span>
                  </div>
                </div>

                {/* CURRENT LEDGER STATUS */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Shares Held</span>
                    <span className="text-xl font-extrabold text-slate-800">{activeStock.sharesOwned.toLocaleString()} Units</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Average Hold Cost</span>
                    <span className="text-xl font-extrabold text-slate-800 font-mono">${activeStock.avgBuyPrice.toFixed(2)}</span>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Invested Assets Value</span>
                    <span className="text-xl font-black text-blue-900 font-mono">
                      {formatMillions((activeStock.sharesOwned * activeStock.currentPrice) / 1000000.0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* TRANSACTION PANEL */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">EXECUTE ORDER SPECIFICATION</span>
                
                {/* QUANTITY INPUT */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={tradeAmountInput} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^[0-9]+$/.test(val)) {
                          setTradeAmountInput(val);
                        }
                      }}
                      className="w-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-800 rounded-xl px-4 py-3.5 text-base font-bold text-slate-800 placeholder-slate-300"
                      placeholder="Specify unit quantity"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold uppercase pointer-events-none">Shares</span>
                  </div>
                </div>

                {/* FAST MULTIPLIERS */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {[100, 1000, 10000, 50000].map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setTradeAmountInput(amt.toString())}
                      className="flex-1 min-w-[70px] bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg border border-slate-100 transition"
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* CALCULATED VALUE BARS */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 mb-6 text-sm">
                  <div>
                    <span className="text-slate-400 font-semibold text-xs uppercase block tracking-wider">Estimated Order Volume</span>
                    <span className="font-extrabold text-slate-800 text-base font-mono">
                      {((Number(tradeAmountInput) || 0) * activeStock.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold text-xs uppercase block tracking-wider">Required Assets Funding</span>
                    <span className="font-black text-blue-900 text-lg font-mono">
                      {formatMillions(((Number(tradeAmountInput) || 0) * activeStock.currentPrice) / 1000000.0)}
                    </span>
                  </div>
                </div>

                {/* EXECUTE ACTIONS */}
                <div className="flex space-x-3">
                  <button 
                    onClick={() => buyStock(activeStock.ticker, Number(tradeAmountInput) || 0)}
                    className="flex-1 bg-blue-900 hover:bg-blue-950 active:bg-blue-950/90 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-md transition-all uppercase tracking-wider"
                  >
                    Authorize Buy Order
                  </button>
                  <button 
                    onClick={() => sellStock(activeStock.ticker, Number(tradeAmountInput) || 0)}
                    disabled={activeStock.sharesOwned === 0}
                    className="flex-1 border-2 border-slate-200 hover:border-slate-300 active:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-extrabold py-3.5 rounded-xl text-sm transition-all uppercase tracking-wider"
                  >
                    Authorize Sell Order
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: M&A ROOM */}
          {selectedTab === "DEALS" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT STARTUPS GRID SELECTION - 5 Cols */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="font-extrabold text-slate-800 text-base flex items-center mb-3">
                  <span className="mr-2">Corporate Merger Targets</span>
                </h3>
                
                {mergers.map(m => {
                  const isSelected = m.id === selectedMergerId;
                  return (
                    <div 
                      key={m.id}
                      onClick={() => setSelectedMergerId(m.id)}
                      className={`cursor-pointer border p-4 rounded-3xl transition-all relative overflow-hidden ${isSelected ? "bg-white border-blue-900 ring-2 ring-blue-900 shadow-sm" : "bg-white hover:bg-slate-50/50 border-slate-200 shadow-sm"}`}
                    >
                      {m.isCompleted && (
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white font-extrabold text-[8px] uppercase tracking-widest py-1 px-4 rotate-45 translate-x-3 translate-y-1">
                          Merged
                        </div>
                      )}
                      {m.isWalkedOut && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white font-extrabold text-[8px] uppercase tracking-widest py-1 px-4 rotate-45 translate-x-3 translate-y-1">
                          Escaped
                        </div>
                      )}

                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl">
                          {m.ceoAvatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[10px] font-extrabold text-blue-900 uppercase tracking-widest">{m.sector}</span>
                          <h4 className="font-extrabold text-slate-800 text-[14px] leading-tight truncate">{m.name}</h4>
                          <span className="text-[11px] text-slate-500 block truncate">CEO: {m.ceoName}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Corporate Valuation</span>
                          <span className="font-extrabold text-slate-700 font-mono">{formatMillions(m.baseValuation)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Board Status</span>
                          <span className={`font-mono font-bold uppercase text-[10px] ${m.isCompleted ? "text-emerald-600" : m.isWalkedOut ? "text-rose-500" : "text-blue-900"}`}>
                            {m.isCompleted ? "Integrated" : m.isWalkedOut ? "CEO Escape" : m.mood}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RIGHT DEAL DETAILED BOARD - 7 Cols */}
              <div className="lg:col-span-7">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                  
                  {/* DETAIL HEAD */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-3xl">{activeMerger.ceoAvatar}</span>
                        <div>
                          <h3 className="text-xl font-extrabold text-slate-800 leading-tight">{activeMerger.name}</h3>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                              {activeMerger.sector} Sector
                            </span>
                            <span className="text-xs text-slate-400">Led by {activeMerger.ceoName}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Required Base</span>
                      <span className="text-xl font-mono font-black text-slate-800">{formatMillions(activeMerger.baseValuation)}</span>
                    </div>
                  </div>

                  {/* STARTUP DESCRIPTION */}
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-2xl border border-slate-100 p-4">
                    {activeMerger.description}
                  </p>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 rounded-2xl p-4">
                    <span className="text-blue-950/80 font-black text-[10px] uppercase tracking-wider block mb-1">PROPOSED SYNERGY DIVIDENDS</span>
                    <p className="text-xs text-blue-900 leading-normal">{activeMerger.synergyText}</p>
                  </div>

                  {/* STATUS / DIALOGUE PANEL */}
                  <div className="bg-zinc-900 text-white rounded-2xl p-4 relative">
                    <div className="absolute top-2 left-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      BOARD MEETING ROOM DIALOGUE
                    </div>
                    <div className="mt-4 flex items-start space-x-3">
                      <span className="text-2xl pt-1 shrink-0">{activeMerger.ceoAvatar}</span>
                      <p className="text-xs italic leading-relaxed text-zinc-200 font-medium">
                        {activeMerger.dialogueQuote}
                      </p>
                    </div>
                    
                    {/* TRUST STATUS PROGRESS BAR */}
                    <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-1">
                          <span>Professional Trust</span>
                          <span>{activeMerger.trust}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${activeMerger.trust >= 75 ? "bg-emerald-400" : activeMerger.trust >= 45 ? "bg-blue-400" : activeMerger.trust >= 25 ? "bg-amber-400" : "bg-red-500"}`}
                            style={{ width: `${activeMerger.trust}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-[9px] text-zinc-500 font-bold uppercase tracking-wider">CEO Mood</span>
                        <span className={`text-xs font-black uppercase ${activeMerger.trust >= 75 ? "text-emerald-400" : activeMerger.trust >= 45 ? "text-zinc-300" : activeMerger.trust >= 25 ? "text-amber-400" : "text-rose-400"}`}>
                          {activeMerger.isWalkedOut ? "WALKED OUT" : activeMerger.mood}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE GAME BUTTON OPTIONS AND MODIFIERS */}
                  {!activeMerger.isCompleted && !activeMerger.isWalkedOut && (
                    <div className="space-y-4">
                      
                      {/* SWEETENER CLAUSES */}
                      <div>
                        <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Configure Board Sweetener Clauses</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button 
                            onClick={() => toggleTermBoardSeat(activeMerger.id)}
                            className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${activeMerger.termBoardSeat ? "bg-blue-50 border-blue-900 text-blue-900 font-extrabold" : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700"}`}
                          >
                            <span className="text-xs font-extrabold block">Board Seat Representation</span>
                            <span className="text-[10px] text-slate-500 font-medium block mt-1 leading-normal">-10% Valuation Required (+10 Trust)</span>
                          </button>

                          <button 
                            onClick={() => toggleTermEquityShare(activeMerger.id)}
                            className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${activeMerger.termEquityShare ? "bg-blue-50 border-blue-900 text-blue-900 font-extrabold" : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700"}`}
                          >
                            <span className="text-xs font-extrabold block">15% Equity Dividend Stake</span>
                            <span className="text-[10px] text-slate-500 font-medium block mt-1 leading-normal">-15% Valuation Required (+15 Trust)</span>
                          </button>

                          <button 
                            onClick={() => toggleTermRetainCEO(activeMerger.id)}
                            className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${activeMerger.termRetainCEO ? "bg-blue-50 border-blue-900 text-blue-900 font-extrabold" : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700"}`}
                          >
                            <span className="text-xs font-extrabold block">Retain Creative CEO Role</span>
                            <span className="text-[10px] text-slate-500 font-medium block mt-1 leading-normal">-8% Valuation Required (+8 Trust)</span>
                          </button>
                        </div>
                      </div>

                      {/* NEGOTIATING CONVERSATION ACTIONS */}
                      <div>
                        <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Tactical Board Debates</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => highlightSynergy(activeMerger.id)}
                            disabled={activeMerger.highlightedSynergiesCount >= 3}
                            className="bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black py-3 rounded-xl border border-slate-100 transition uppercase tracking-wider"
                          >
                            Represent Synergies ({activeMerger.highlightedSynergiesCount}/3)
                          </button>
                          
                          <button 
                            onClick={() => argueValuation(activeMerger.id)}
                            disabled={activeMerger.arguedValuationCount >= 3}
                            className="bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black py-3 rounded-xl border border-slate-100 transition uppercase tracking-wider"
                          >
                            Audit Budget Valuations ({activeMerger.arguedValuationCount}/3)
                          </button>
                        </div>
                      </div>

                      {/* PROPOSAL SLIDER TRIGGER */}
                      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Adjust Funding Proposal</span>
                          <span className="font-extrabold text-blue-950 font-mono">{formatMillions(draftOfferMillions)}</span>
                        </div>
                        <input 
                          type="range" 
                          min={Math.round(activeMerger.baseValuation * 0.4)}
                          max={Math.round(activeMerger.baseValuation * 1.5)}
                          value={draftOfferMillions}
                          onChange={(e) => setDraftOfferMillions(Number(e.target.value))}
                          className="w-full accent-blue-900 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-bold">
                          <span>Low Ball Threshold</span>
                          <span>Adjust Offer Slider</span>
                          <span>High Buyout</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs font-extrabold mt-4 pt-3 border-t border-slate-100 text-slate-500">
                          <span>Minimal Acceptable Price:</span>
                          <span className="font-mono text-slate-800">{formatMillions(getAdjustedMinimumThreshold(activeMerger))}</span>
                        </div>
                      </div>

                      {/* ACTIONS SUBMISSION */}
                      <div className="flex space-x-3 pt-2">
                        <button 
                          onClick={() => submitProposal(activeMerger.id, draftOfferMillions)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-widest transition"
                        >
                          Submit Offer Proposal
                        </button>
                        
                        <button 
                          onClick={() => sealDeal(activeMerger.id, draftOfferMillions)}
                          className="flex-1 bg-gradient-to-r from-blue-900 to-indigo-950 hover:from-blue-950 hover:to-indigo-950 text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-950/20 transition-all"
                        >
                          Seal Acquisition Deal
                        </button>
                      </div>

                    </div>
                  )}

                  {/* ACTIVE MERGER HAS BEEN COMPLETED */}
                  {activeMerger.isCompleted && (
                    <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 text-center animate-fade-in">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Check className="w-6 h-6" />
                      </div>
                      <h4 className="font-extrabold text-emerald-900">Merger Complete and Integrated</h4>
                      <p className="text-xs text-emerald-700 max-w-sm mx-auto leading-relaxed mt-1">
                        Elena Vance and the board of directors have signed off on all capital assets transfers. Apex Capital holds absolute equity representation. passive revenue flows automatically.
                      </p>
                    </div>
                  )}

                  {/* ACTIVE MERGER WALKED OUT RESET */}
                  {activeMerger.isWalkedOut && (
                    <div className="bg-rose-50 rounded-2xl border border-rose-200 p-6 text-center animate-pulse">
                      <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <h4 className="font-black text-rose-900 uppercase text-sm tracking-wider">CEO Negotiation Adjourned</h4>
                      <p className="text-xs text-rose-700 max-w-sm mx-auto leading-relaxed mt-1 mb-4">
                        Professional relationships broken down completely. Pay advisory penalties to reset parameters.
                      </p>
                      <button 
                        onClick={() => setWalkedOutOpen(true)}
                        className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wide shadow"
                      >
                        Acknowledge Advisor Fees
                      </button>
                    </div>
                  )}

                </div>
              </div>

            </div>
          )}

          {/* TAB 4: HISTORICAL LEDGER */}
          {selectedTab === "STATS" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Financial Transaction Logs</h3>
                  <p className="text-xs text-slate-400 mt-1">Authorized transaction logs and dividend history for Apex Capital.</p>
                </div>
                <div className="text-xs text-zinc-400 font-bold border rounded-lg px-3 py-1 font-mono uppercase bg-slate-50">
                  {transactions.length} Total Logs
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-mono text-xs">Ledger stands unwritten.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        <th className="py-3 px-4">Cycle Turn</th>
                        <th className="py-3 px-4">Class</th>
                        <th className="py-3 px-4">Ledger Specification</th>
                        <th className="py-3 px-4 text-right">Fractions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {transactions.slice().reverse().map((log, index) => {
                        return (
                          <tr key={index} className="hover:bg-slate-50/50 font-medium text-slate-700">
                            <td className="py-3 px-4 text-slate-400 font-mono">Day {log.day}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-block text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md ${log.type === "DIVIDEND" ? "bg-emerald-50 text-emerald-700" : log.type === "BUY" ? "bg-blue-50 text-blue-900" : log.type === "SELL" ? "bg-amber-50 text-amber-700" : "bg-purple-50 text-purple-700"}`}>
                                {log.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">{log.subject}</td>
                            <td className={`py-3 px-4 text-right font-mono font-bold ${log.isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                              {log.isPositive ? "+" : "-"}{log.amount.toFixed(2)}M
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </section>

      </main>

      {/* FOOTER BAR */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4">
          Apex Capital Merger Tycon Simulator - Built with React &amp; Tailwind CSS
        </div>
      </footer>

    </div>
  );
}
