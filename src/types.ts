export interface Stock {
  ticker: string;
  name: string;
  currentPrice: number;
  priceHistory: number[];
  sharesOwned: number;
  avgBuyPrice: number;
  volatility: number; // 0.0 to 1.0
  sector: string; // "Tech" | "Energy" | "Biotech" | "Meme"
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
  baseValuation: number; // In concrete dollars
  minAcceptableThreshold: number; // Hidden minimum
  currentAskingPrice: number; // Current asking price
  trust: number; // 0 to 100
  mood: NegotiationMood;
  synergyText: string;
  dailyIncome: number; // Passive daily revenue in dollars
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
  type: "BUY" | "SELL" | "M&A" | "DIVIDEND" | "UPGRADE" | "SALARY" | "RECRUIT";
  subject: string;
  amount: number;
  isPositive: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  description: string;
  hiringCost: number;
  dailySalary: number;
  benefitText: string;
}

export interface OfficeTier {
  id: string;
  name: string;
  cost: number;
  dailyRent: number;
  maxTradeLimit: number;
  trustBonus: number;
  description: string;
}
