import { Stock, MergerTarget, MarketNews, StaffMember, OfficeTier, NegotiationMood } from "../types";

const curatedStocks: Stock[] = [
  {
    ticker: "AETH",
    name: "Aether Cybernetics",
    currentPrice: 165.0,
    priceHistory: [154.0, 158.0, 150.0, 161.0, 165.0],
    sharesOwned: 0,
    avgBuyPrice: 0.0,
    volatility: 0.16,
    sector: "Tech",
    dailyTrendFactor: 1.0,
  },
  {
    ticker: "VTX",
    name: "Vortex Energy Grid",
    currentPrice: 88.5,
    priceHistory: [85.0, 89.0, 84.0, 86.5, 88.5],
    sharesOwned: 0,
    avgBuyPrice: 0.0,
    volatility: 0.12,
    sector: "Energy",
    dailyTrendFactor: 1.0,
  },
  {
    ticker: "NEXB",
    name: "Nexus Bio-molecule",
    currentPrice: 124.0,
    priceHistory: [131.0, 126.0, 118.0, 120.0, 124.0],
    sharesOwned: 0,
    avgBuyPrice: 0.0,
    volatility: 0.24,
    sector: "Biotech",
    dailyTrendFactor: 1.0,
  },
  {
    ticker: "SOLR",
    name: "Solaris Power Corp",
    currentPrice: 34.0,
    priceHistory: [29.0, 31.5, 30.0, 32.5, 34.0],
    sharesOwned: 0,
    avgBuyPrice: 0.0,
    volatility: 0.28,
    sector: "Energy",
    dailyTrendFactor: 1.0,
  },
  {
    ticker: "CLON",
    name: "Apex CloneLabs",
    currentPrice: 75.0,
    priceHistory: [82.0, 78.0, 71.0, 76.0, 75.0],
    sharesOwned: 0,
    avgBuyPrice: 0.0,
    volatility: 0.32,
    sector: "Biotech",
    dailyTrendFactor: 1.0,
  },
  {
    ticker: "MRE",
    name: "Mirage Entertainment",
    currentPrice: 14.5,
    priceHistory: [15.1, 13.8, 14.0, 14.2, 14.5],
    sharesOwned: 0,
    avgBuyPrice: 0.0,
    volatility: 0.42,
    sector: "Meme",
    dailyTrendFactor: 1.0,
  },
  {
    ticker: "SHLD",
    name: "Aegis planetary Defense",
    currentPrice: 198.0,
    priceHistory: [195.0, 192.0, 196.0, 194.5, 198.0],
    sharesOwned: 0,
    avgBuyPrice: 0.0,
    volatility: 0.10,
    sector: "Tech",
    dailyTrendFactor: 1.0,
  },
  {
    ticker: "MEME",
    name: "ShibaChain Protocol",
    currentPrice: 6.2,
    priceHistory: [3.1, 12.5, 2.0, 4.5, 6.2],
    sharesOwned: 0,
    avgBuyPrice: 0.0,
    volatility: 0.85,
    sector: "Meme",
    dailyTrendFactor: 1.0,
  }
];

const curatedMergers: MergerTarget[] = [
  {
    id: "cafe",
    name: "Aether Cafe Franchise",
    sector: "Meme",
    ceoName: "Mia Brew",
    ceoAvatar: "☕",
    description: "A popular downtown specialty coffee counter equipped with high-yield automated barista machinery and a massive app-based delivery list. Yields immediate and stable starter dividends.",
    baseValuation: 32000,
    minAcceptableThreshold: 28000,
    currentAskingPrice: 32000,
    trust: 60,
    mood: "Reasonable",
    synergyText: "Start from zero standard! Activates instant +$180 daily seed cash dividends. Boosts local Meme tech stock values by +5%.",
    dailyIncome: 180,
    techStockBoost: 1.05,
    dialogueQuote: "“Our organic bean supply chain has been optimized. We are receptive to active institutional backing but don't treat us like generic corporate factories.”",
    termBoardSeat: false,
    termEquityShare: false,
    termRetainCEO: false,
    arguedValuationCount: 0,
    highlightedSynergiesCount: 0,
    isCompleted: false,
    isWalkedOut: false
  },
  {
    id: "solaris",
    name: "Project Solaris HydroPower",
    sector: "Energy",
    ceoName: "Elena Vance",
    ceoAvatar: "👩‍💼",
    description: "Solaris owns premium water turbines with eco-safe hydro-extraction grids. Sustainable green growth margins, but current cash flow limits their global plant extensions.",
    baseValuation: 125000,
    minAcceptableThreshold: 105000,
    currentAskingPrice: 125000,
    trust: 50,
    mood: "Reasonable",
    synergyText: "Sustained green logistics. Generates high passive income of +$850/day. Boosts local Energy holdings by +12%.",
    dailyIncome: 850,
    techStockBoost: 1.12,
    dialogueQuote: "“We want to scale our regional turbine infrastructure. If your fund can commit respectable cash and governance alignment, we'll agree.”",
    termBoardSeat: false,
    termEquityShare: false,
    termRetainCEO: false,
    arguedValuationCount: 0,
    highlightedSynergiesCount: 0,
    isCompleted: false,
    isWalkedOut: false
  },
  {
    id: "biogen",
    name: "BioGen Phase-I Laboratories",
    sector: "Biotech",
    ceoName: "Dr. Clara Wu",
    ceoAvatar: "👩‍🔬",
    description: "Clinical lab developing specialized molecular vaccines. Currently out of developmental capital, they require a patient, long-term investor who understands biomedical pipelines.",
    baseValuation: 340000,
    minAcceptableThreshold: 290000,
    currentAskingPrice: 340000,
    trust: 55,
    mood: "Reasonable",
    synergyText: "Pioneering therapeutic diagnostics. Yields passive licensing royalty dividends of +$2,800/day. Boosts Biotech stocks by +18%.",
    dailyIncome: 2800,
    techStockBoost: 1.18,
    dialogueQuote: "“Scientific engineering demands a financial buffer for safety testing. This isn't just about spreadsheets; we want a genuine venture alliance.”",
    termBoardSeat: false,
    termEquityShare: false,
    termRetainCEO: false,
    arguedValuationCount: 0,
    highlightedSynergiesCount: 0,
    isCompleted: false,
    isWalkedOut: false
  },
  {
    id: "nova",
    name: "Nova Cybernetics Corp",
    sector: "Tech",
    ceoName: "Victor Sterling",
    ceoAvatar: "👨‍💻",
    description: "Hyper-scalable automated warehouses bipedal loaders. Highly requested in automated supply-chains, they are preparing for major public IPO but are open to deep private fund bids.",
    baseValuation: 1150000,
    minAcceptableThreshold: 980000,
    currentAskingPrice: 1150000,
    trust: 45,
    mood: "Defensive",
    synergyText: "Unlocks global chip design networks. Generates stellar automation cashflows of +$11,500/day. Boosts Tech sector values by +25%.",
    dailyIncome: 11500,
    techStockBoost: 1.25,
    dialogueQuote: "“Do you represent a serious fund or are you still working out of a street cafe? Give us solid financial leverage, or we'll bypass this boardroom and list publicly.”",
    termBoardSeat: false,
    termEquityShare: false,
    termRetainCEO: false,
    arguedValuationCount: 0,
    highlightedSynergiesCount: 0,
    isCompleted: false,
    isWalkedOut: false
  },
  {
    id: "shld",
    name: "Aegis planetary Defense",
    sector: "Tech",
    ceoName: "Marcus 'Bull' Hudson",
    ceoAvatar: "👨‍💼",
    description: "Skeptical, old-school defense manufacturing contractor. Demands massive liquid payouts to secure his generational trust funds before retirement.",
    baseValuation: 4200000,
    minAcceptableThreshold: 3600000,
    currentAskingPrice: 4200000,
    trust: 30,
    mood: "Greedy",
    synergyText: "Immediate defense empire supremacy. Delivers heavy sovereign government contract yields of +$48,000/day. Boosts Tech by +35%.",
    dailyIncome: 48000,
    techStockBoost: 1.35,
    dialogueQuote: "“My accountants tell me you want to purchase my entire titanium foundry. Well, talk is cheap. Put concrete cash on the table or get out of my sight.”",
    termBoardSeat: false,
    termEquityShare: false,
    termRetainCEO: false,
    arguedValuationCount: 0,
    highlightedSynergiesCount: 0,
    isCompleted: false,
    isWalkedOut: false
  }
];

// Suffix/prefix pools to create brilliant company names
const prefixes = ["Quantum", "Apex", "Vortex", "Aether", "Nebula", "Spectre", "Zenith", "Chronos", "Bio", "Synthetix", "Prism", "Sovereign", "Cyber", "Mega", "Micro", "Titan", "Helix", "Nova", "Hyper", "Omni", "Solaris", "Luna", "Astra", "Echo", "Vector", "Phantom", "Aegis", "Giga", "Pulse", "Stratum"];
const adjectives = ["Global", "Planetary", "Neural", "Atomic", "Kinetic", "Cognitive", "Bionic", "Sub-Zero", "Vapor", "Acoustic", "Stellar", "Cosmic", "Static", "Dynamic", "Autonomous", "Elastic", "Synthetic", "Genetic", "Liquid", "Adaptive"];
const suffixes = ["Cybernetics", "Grid", "Bio-molecule", "Power Corp", "CloneLabs", "Entertainment", "Defense", "Protocol", "Logistics", "Networks", "Foundries", "Solutions", "Dynamics", "Systems", "Ventures", "Syndicate", "Labs", "Industries", "Holdings", "Group", "Consortium", "Technologies", "Resources", "Visions"];

const sectors = ["Tech", "Energy", "Biotech", "Meme"];
const emojis = ["☕", "👩‍💼", "👩‍🔬", "👨‍💻", "👨‍💼", "🚀", "🔋", "🌱", "🌌", "🦾", "🧬", "🧠", "📱", "🛰️", "🛸", "💎", "⚡", "🔥"];

const generateMoreStocks = (): Stock[] => {
  const result: Stock[] = [...curatedStocks];
  let seed = 42; 
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  const createdTickers = new Set(result.map(s => s.ticker));

  while (result.length < 100) {
    const pref = prefixes[Math.floor(random() * prefixes.length)];
    const adj = random() > 0.5 ? adjectives[Math.floor(random() * adjectives.length)] : "";
    const suff = suffixes[Math.floor(random() * suffixes.length)];
    const name = `${pref} ${adj ? adj + ' ' : ''}${suff}`.trim();
    
    let ticker = (pref.substring(0, 2) + (adj ? adj.substring(0, 1) : "") + suff.substring(0, 2)).toUpperCase();
    ticker = ticker.replace(/[^A-Z]/g, "X");
    if (ticker.length < 3) ticker += "X";
    if (ticker.length > 5) ticker = ticker.substring(0, 5);
    
    if (createdTickers.has(ticker) || ticker.length < 3) {
      ticker = ticker + Math.floor(random() * 9);
      if (ticker.length > 5) ticker = ticker.substring(0, 5);
    }
    
    createdTickers.add(ticker);
    
    const basePrice = Math.round((5 + random() * 495) * 10) / 10;
    const volatility = Math.round((0.05 + random() * 0.8) * 100) / 100;
    const sector = sectors[Math.floor(random() * sectors.length)];
    
    result.push({
      ticker,
      name,
      currentPrice: basePrice,
      priceHistory: [
        Math.round(basePrice * 0.9 * 10) / 10,
        Math.round(basePrice * 1.05 * 10) / 10,
        Math.round(basePrice * 0.95 * 10) / 10,
        basePrice
      ],
      sharesOwned: 0,
      avgBuyPrice: 0,
      volatility,
      sector,
      dailyTrendFactor: 1.0
    });
  }
  
  return result;
};

const generateMoreMergers = (): MergerTarget[] => {
  // Set the original 5 deals as open to negotiate initially
  const result: MergerTarget[] = curatedMergers.map(m => ({
    ...m,
    isOpenToNegotiate: true,
    stakeOwned: 0,
    ceoType: "original",
    staffType: "standard",
    isIPOed: false,
    reinvestInvestmentAmount: 0,
    growthRateCompound: 0.04
  }));

  let seed = 999;
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const createdIds = new Set(result.map(m => m.id));
  const ceoFirstNames = ["John", "Sarah", "Xavier", "Aris", "Luna", "Gideon", "Talia", "Silas", "Freya", "Anya", "Draven", "Jax", "Elena", "Kaelen", "Nova", "Zane", "Orion", "Lyra"];
  const ceoLastNames = ["Sterling", "Vance", "Carter", "Finch", "Nakamoto", "Musk", "Galt", "Altman", "Bezos", "Lovelace", "Turing", "Gates", "Jobs", "Wozniak", "Thiel", "Kovacs"];
  
  const dealDescriptions = [
    "A provider of high-throughput orbital logic cores and solar-sail propulsion assemblies.",
    "Specializes in automated deep-sea mineral dredging and thermal energy extraction networks.",
    "A meme-centric holographic content network with deep demographic penetration and heavy subscription cash flows.",
    "Maintains genetic engineering patents for bioluminescent architectural vegetation and local tissue printers.",
    "Builds autonomous delivery airships and planetary drone logistics management tools with secure localized nodes.",
    "A legendary high-fashion virtual cosmetic brand dominating social-tier cyber spaces.",
    "Creates quantum cryptographic network keychains designed to resist planetary espionage interception.",
    "A luxury space-hotel developer with a solid reservation book of elite capital owners.",
    "An experimental automated crop vertical farming collective with high nutrient production density.",
    "An AI intelligence suite providing automated litigation advice and compliance verification sweeps."
  ];

  while (result.length < 105) {
    const pref = prefixes[Math.floor(random() * prefixes.length)];
    const adj = random() > 0.5 ? adjectives[Math.floor(random() * adjectives.length)] : "";
    const suff = suffixes[Math.floor(random() * suffixes.length)];
    const name = `${pref} ${adj ? adj + ' ' : ''}${suff}`.trim();
    
    const id = name.toLowerCase().replace(/[^a-z]/g, "").substring(0, 12) + result.length;
    
    if (createdIds.has(id)) {
      continue;
    }
    
    const ceoName = `${ceoFirstNames[Math.floor(random() * ceoFirstNames.length)]} ${ceoLastNames[Math.floor(random() * ceoLastNames.length)]}`;
    const baseValuation = Math.round((25000 + random() * 4800000) / 1000) * 1000;
    const minAcceptableThreshold = Math.round((baseValuation * (0.8 + random() * 0.15) / 1000)) * 1000;
    const sector = sectors[Math.floor(random() * sectors.length)];
    const dailyIncome = Math.round(baseValuation * (0.005 + random() * 0.015));
    const trust = Math.floor(30 + random() * 40);
    
    const moods: NegotiationMood[] = ["Greedy", "Defensive", "Reasonable", "Thrilled"];
    const mood = moods[Math.floor(random() * moods.length)];
    
    result.push({
      id,
      name,
      sector,
      ceoName,
      ceoAvatar: emojis[Math.floor(random() * emojis.length)],
      description: dealDescriptions[Math.round(random() * (dealDescriptions.length - 1))] + ` Operates on high-density capital optimization paradigms.`,
      baseValuation,
      minAcceptableThreshold,
      currentAskingPrice: baseValuation,
      trust,
      mood,
      synergyText: `Acquire high-performance industrial assets. Generates reliable daily yields of +${dailyIncome.toLocaleString()}/day. Boosts local ${sector} tickers by +${Math.round(5 + random() * 25)}%.`,
      dailyIncome,
      techStockBoost: Math.round((1.05 + random() * 0.3) * 100) / 100,
      dialogueQuote: `“We look forward to high-impact capital injections. Show us a respectful layout or we will file for public listing instead.”`,
      termBoardSeat: false,
      termEquityShare: false,
      termRetainCEO: false,
      arguedValuationCount: 0,
      highlightedSynergiesCount: 0,
      isCompleted: false,
      isWalkedOut: false,
      isOpenToNegotiate: false,
      stakeOwned: 0,
      ceoType: "original",
      staffType: "standard",
      isIPOed: false,
      reinvestInvestmentAmount: 0,
      growthRateCompound: 0.03 + (random() * 0.05)
    });
    
    createdIds.add(id);
  }
  
  return result;
};

export const initialStocks = generateMoreStocks();
export const initialMergers = generateMoreMergers();

export const initialStaff: StaffMember[] = [
  {
    id: "finch",
    name: "Aiden Finch",
    avatar: "🕵️‍♂️",
    role: "Financial Analyst",
    description: "A former hedge-fund quantitative analyst with a sharp eye for corporate news flows.",
    hiringCost: 3500,
    dailySalary: 35,
    benefitText: "Trend-Lens: Previews tomorrow's stock multipliers & reduces buy commission errors."
  },
  {
    id: "croft",
    name: "Clara Croft",
    avatar: "💼",
    role: "M&A Deal Broker",
    description: "An elite Ivy League graduate specializing in leveraged buyouts and hostile takeover mediation.",
    hiringCost: 6000,
    dailySalary: 60,
    benefitText: "Dealmaker: Cuts CEO walkout breakup fees by 50% & drops their minimum buyout threshold by 5%."
  },
  {
    id: "drake",
    name: "Maximilian Drake",
    avatar: "📣",
    role: "PR Director",
    description: "Ex-government press secretary turned corporate public relations strategist.",
    hiringCost: 11000,
    dailySalary: 90,
    benefitText: "Charm offensive: Restores +3 trust to all target CEOs every single morning."
  },
  {
    id: "sterling",
    name: "Elara Sterling",
    avatar: "🤖",
    role: "Quant Developer",
    description: "A high-frequency algorithmic systems engineer with multiple custom trading bots.",
    hiringCost: 21000,
    dailySalary: 180,
    benefitText: "Arbitrage Bot: Boosts stock sale markup prices by +4.0%."
  },
  {
    id: "carter",
    name: "Vance Carter",
    avatar: "🏦",
    role: "Asset Portfolio Director",
    description: "A seasoned real estate and venture capital executive with 25 years of institutional experience.",
    hiringCost: 45000,
    dailySalary: 400,
    benefitText: "Synergy Multiplier: Increases all passive cash flows (Venture & M&A firms) by +25%."
  }
];

export const officeTiers: OfficeTier[] = [
  {
    id: "desk",
    name: "Humble Co-working Desk",
    cost: 0,
    dailyRent: 0,
    maxTradeLimit: 25000,
    trustBonus: 0,
    description: "A single shared rental desk inside a local Tech & Coffee lounge. Free filter coffee, noisy calls, and spotty Wi-Fi. (Max trade $25k, CEO trust bonus 0%)"
  },
  {
    id: "suite",
    name: "Shared Creative Office",
    cost: 12500,
    dailyRent: 45,
    maxTradeLimit: 150000,
    trustBonus: 10,
    description: "A private corner room inside a corporate startup space. Features real glass windows and a whiteboard. (Max trade $150k, CEO trust +10% startup bonus)"
  },
  {
    id: "hub",
    name: "Downtown Commerce Hub",
    cost: 65000,
    dailyRent: 220,
    maxTradeLimit: 800000,
    trustBonus: 25,
    description: "A full executive level in the downtown financial district. Impress investors with luxury espresso bars. (Max trade $800k, CEO trust +25% corporate bonus)"
  },
  {
    id: "penthouse",
    name: "Apex Penthouse Suite",
    cost: 280000,
    dailyRent: 950,
    maxTradeLimit: 5000000,
    trustBonus: 45,
    description: "A glorious sky mansion above the city towers. Leather seating, vintage single-malt scotch, and helipad. (Max trade $5M, CEO trust +45% elite status)"
  },
  {
    id: "tower",
    name: "Apex Financial Tower",
    cost: 1250000,
    dailyRent: 3800,
    maxTradeLimit: 999999999,
    trustBonus: 75,
    description: "The crown jewel skyscraper of Wall Street. Own the skyscraper, dominate global finance. (Max trade Unlimited, CEO trust +75% sovereign power)"
  }
];

export const newsList: MarketNews[] = [
  {
    headline: "Venture Fund Setup Approved!",
    description: "Regulatory authorities and your board have authorized your brand new financial fund. Bring in the client lists, trade assets, hire executive staff, and scale from a shared desk up to a Wall Street empire.",
    affectedTicker: "ALL",
    priceMultiplier: 1.0,
    isPositive: true,
  },
  {
    headline: "Aether Cybernetics Announces Quantum Core Launch!",
    description: "Tech research institutes declare AETH's new hardware architecture the ultimate pinnacle of quantum computing. Retail and institution traders rush to purchase are record rates.",
    affectedTicker: "AETH",
    priceMultiplier: 1.25,
    isPositive: true,
  },
  {
    headline: "Solaris Power Secures Multi-State Ecological Refineries!",
    description: "Mia Brew and Elena Vance announce strategic lithium-extraction grid upgrades. Renewable energy sectors record immense buy volume.",
    affectedTicker: "SOLR",
    priceMultiplier: 1.30,
    isPositive: true,
  },
  {
    headline: "BioGen Molecule Test Scores 98% Clinical Breakthrough!",
    description: "Medical journals report that BioGen lab's genetic serum completely prevents cell decay. Biotech stocks rally aggressively globally.",
    affectedTicker: "NEXB",
    priceMultiplier: 1.35,
    isPositive: true,
  },
  {
    headline: "ShibaChain Squeezes Shorters in Massive Speculative Run!",
    description: "Internet forums coordinate ultra-high volume purchases of ShibaChain protocol. Brokerages limit trading to prevent immediate circuit-breaking.",
    affectedTicker: "MEME",
    priceMultiplier: 2.25,
    isPositive: true,
  },
  {
    headline: "Federal Bank Drops National Interest Rates!",
    description: "An unexpected regulatory update eases capital costs globally. Multi-tier funds prepare to channel trillions of dollars back to tech.",
    affectedTicker: "ALL",
    priceMultiplier: 1.10,
    isPositive: true,
  },
  {
    headline: "Vortex Energy Grid Probed over Compliance Audits!",
    description: "Federal compliance units cite possible reporting bugs in state-side grids. Vortex shares trade down on heavy safety warnings.",
    affectedTicker: "VTX",
    priceMultiplier: 0.85,
    isPositive: false,
  },
  {
    headline: "Aether Laboratories Sued Over Firmware Glitches!",
    description: "A software leak reveals potential vulnerabilities in cybernetic arm components. Competitors lock-in contracts while shares slide.",
    affectedTicker: "AETH",
    priceMultiplier: 0.82,
    isPositive: false,
  },
  {
    headline: "Apex CloneLabs Recalls Experimental Bio-synthetic Serum!",
    description: "Trial test subjects reported cosmetic side-effects, triggering clinical holds and regulatory reviews. Bio index falls dramatically.",
    affectedTicker: "CLON",
    priceMultiplier: 0.74,
    isPositive: false,
  },
  {
    headline: "Aegis Defense Exosuits Expose Serious Battery Weakness!",
    description: "An aerospace contractor cancels high-density order lists, creating a substantial supply backlog. Investors record selloffs.",
    affectedTicker: "SHLD",
    priceMultiplier: 0.86,
    isPositive: false,
  },
  {
    headline: "Mirage Entertainment Server Farm Struck by Flash Flood!",
    description: "A sudden flood burns server clusters and degrades digital subscription pipelines, lowering short-term output forecasts.",
    affectedTicker: "MRE",
    priceMultiplier: 0.80,
    isPositive: false,
  },
  {
    headline: "Solaris Power Corp Unveils Solar Panel Upgrade with 40% Gain!",
    description: "CEO Elena Vance demonstrates revolutionary silicon-based designs, cementing local eco-grid dominance ahead of main audits.",
    affectedTicker: "SOLR",
    priceMultiplier: 1.18,
    isPositive: true,
  },
  {
    headline: "Vortex Energy Grid Wins $500M State Offshore Infrastructure Deal!",
    description: "The offshore grant will support high-voltage cable extensions, promising massive quarterly yield boosts.",
    affectedTicker: "VTX",
    priceMultiplier: 1.22,
    isPositive: true,
  },
  {
    headline: "ShibaChain Protocol Slashed Due to Security Exploits!",
    description: "A decentralized database exploit drains millions in liquidity pools. Panic selling triggers massive price drops.",
    affectedTicker: "MEME",
    priceMultiplier: 0.65,
    isPositive: false,
  },
  {
    headline: "Apex CloneLabs Partners with National Health Services!",
    description: "Exclusive manufacturing contracts signed for genetic tissue replication, promising steady and massive cash horizons.",
    affectedTicker: "CLON",
    priceMultiplier: 1.26,
    isPositive: true,
  }
];
