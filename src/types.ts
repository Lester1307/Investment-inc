export interface Stock {
  ticker: string;
  name: string;
  currentPrice: number;
  priceHistory: number[];
  sharesOwned: number;
  avgBuyPrice: number;
  volatility: number; // 0.0 to 1.0
  sector: string; // "Tech", "Energy", "Biotech", "Meme"
  dailyTrendFactor: number;
}

export type NegotiationMood = "Greedy" | "Defensive" | "Reasonable" | "Thrilled" | "Walked Out";

export interface MergerTarget {
  id: string;
  name: string;
  sector: string;
  ceoName: string;
  ceoAvatar: string; // Emoji
  description: string;
  baseValuation: number; // In millions
  minAcceptableThreshold: number; // Hidden minimum
  currentAskingPrice: number; // Current asking price
  trust: number; // 0 to 100
  mood: NegotiationMood;
  synergyText: string;
  dailyIncome: number; // Passive daily revenue
  techStockBoost: number; // Multiplier
  dialogueQuote: string;

  // Active board sweetners
  termBoardSeat: boolean;
  termEquityShare: boolean;
  termRetainCEO: boolean;

  // Negotiation counters
  arguedValuationCount: number;
  highlightedSynergiesCount: number;

  // Status flags
  isCompleted: boolean;
  isWalkedOut: boolean;
}

export interface MarketNews {
  headline: string;
  description: string;
  affectedTicker: string; // "ALL" or specific ticker
  priceMultiplier: number;
  isPositive: boolean;
}

export interface TransactionHistory {
  day: number;
  type: "BUY" | "SELL" | "M&A" | "DIVIDEND";
  subject: string;
  amount: number;
  isPositive: boolean;
}

export interface GameState {
  cashMillions: number;
  day: number;
  stocks: Stock[];
  mergers: MergerTarget[];
  selectedTab: "HQ" | "FLOOR" | "DEALS" | "STATS";
  activeNews: MarketNews | null;
  transactions: TransactionHistory[];

  // Trading Floor selection
  selectedStockTicker: string;
  tradeAmountInput: string;

  // M&A selection
  selectedMergerId: string;
  draftOfferMillions: number;

  // Modal display tags
  morningBriefOpen: boolean;
  infoMessage: string | null;
  errorMessage: string | null;
  successDealClosed: string | null;
  walkedOutOpen: boolean;
}
