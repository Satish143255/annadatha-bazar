import { XMLParser } from "fast-xml-parser";

const MARKET_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const TEST_DATA_GOV_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";
const PIB_RSS_URL = "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3";

const AGRICULTURE_TERMS = [
  "agri", "crop", "farmer", "farm", "kisan", "mandi", "horticulture",
  "soil", "livestock", "fisher", "food grain", "पशु", "किसान", "कृषि", "फसल"
];

// Helper to calculate relative time from RSS pubDate
const getRelativeTime = (dateStr) => {
  try {
    const ms = Date.parse(dateStr);
    if (isNaN(ms)) return "Latest";
    const delta = Date.now() - ms;
    const minutes = Math.floor(delta / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  } catch {
    return "Latest";
  }
};

// Helper to strip HTML and truncate text
const cleanDescription = (desc) => {
  const plain = String(desc || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= 150) return plain || "Click read more to view full release.";
  return plain.slice(0, 147) + "...";
};

const ensureOk = async (response, source) => {
  if (!response.ok) {
    throw new Error(`${source} returned ${response.status}`);
  }
  return response;
};

export const getMarketPrices = async ({ district, limit = 40, apiKey } = {}) => {
  const params = new URLSearchParams({
    "api-key": apiKey || process.env.DATA_GOV_IN_API_KEY || TEST_DATA_GOV_KEY,
    format: "json",
    limit: String(Math.min(Math.max(Number(limit) || 40, 1), 100)),
  });

  if (district) params.set("filters[district]", district);

  const response = await ensureOk(
    await fetch(`https://api.data.gov.in/resource/${MARKET_RESOURCE_ID}?${params.toString()}`),
    "data.gov.in",
  );
  const result = await response.json();

  return {
    source: "AGMARKNET via data.gov.in",
    updatedAt: result.updated_date || null,
    records: result.records || [],
  };
};

// Curated central schemes database with verified proof links
const CENTRAL_SCHEMES = [
  {
    id: "scheme-pmkisan",
    kind: "scheme",
    title: "PM-KISAN: ₹6,000 Direct Support",
    body: "Provides ₹6,000 per year in three equal instalments directly into the bank accounts of farmers. Check your beneficiary status and register online.",
    date: "Active Scheme",
    source: "Ministry of Agriculture & FW",
    link: "https://pmkisan.gov.in/",
    tag: "PM-KISAN",
    accent: "#1F5A3A"
  },
  {
    id: "scheme-pmfby",
    kind: "scheme",
    title: "PMFBY: Crop Loss Insurance",
    body: "Government crop insurance protecting against loss due to natural calamities, pests, or disease. Premium is capped at just 2% for Kharif and 1.5% for Rabi.",
    date: "Active Scheme",
    source: "Ministry of Agriculture & FW",
    link: "https://pmfby.gov.in/",
    tag: "PMFBY Insurance",
    accent: "#2E4A7F"
  },
  {
    id: "scheme-kcc",
    kind: "scheme",
    title: "Kisan Credit Card (KCC) Loans",
    body: "Affordable credit for crop cultivation, farm maintenance, and allied agricultural needs. Access low-interest loans up to ₹3 Lakh at subvention rates.",
    date: "Active Scheme",
    source: "NABARD & RBI",
    link: "https://www.myscheme.gov.in/schemes/kcc",
    tag: "Credit & Loans",
    accent: "#7A4F9E"
  },
  {
    id: "scheme-soil",
    kind: "scheme",
    title: "Soil Health Card Subsidies",
    body: "Get crop-wise nutrient recommendations based on soil test reports for your farm, assisting in optimizing fertilizer application and saving cost.",
    date: "Active Scheme",
    source: "Department of Agriculture",
    link: "https://www.soilhealth.dac.gov.in/",
    tag: "Soil Health",
    accent: "#1F5A3A"
  }
];

// Curated state schemes database with verified proof links
const STATE_SCHEMES = {
  "Telangana": [
    {
      id: "scheme-ts-rythubharosa",
      kind: "scheme",
      title: "Rythu Bharosa Input Assistance",
      body: "Season-wise financial investment support per acre to farmers for purchasing seeds, fertilizer, and farm inputs.",
      date: "State Active",
      source: "Govt of Telangana",
      link: "https://rythubandhu.telangana.gov.in/",
      tag: "Telangana Input Support",
      accent: "#1F5A3A"
    },
    {
      id: "scheme-ts-loanwaiver",
      kind: "scheme",
      title: "Crop Loan Waiver Scheme",
      body: "Debt relief scheme waivers up to ₹2 Lakh for eligible agricultural crop loans. Verify your eligibility and status at the portal.",
      date: "State Active",
      source: "Department of Agriculture, TS",
      link: "https://clw.telangana.gov.in/",
      tag: "Telangana Debt Relief",
      accent: "#B05E2E"
    }
  ],
  "Maharashtra": [
    {
      id: "scheme-mh-namo",
      kind: "scheme",
      title: "Namo Shetkari Mahasanman Nidhi",
      body: "State matches the Central PM-KISAN scheme, providing an additional ₹6,000 per year directly to Maharashtra farmers, totaling ₹12,000 annually.",
      date: "State Active",
      source: "Govt of Maharashtra",
      link: "https://nsmny.maharashtra.gov.in/",
      tag: "Maharashtra Scheme",
      accent: "#1F5A3A"
    },
    {
      id: "scheme-mh-pond",
      kind: "scheme",
      title: "Magel Tyala Shetale (Farm Pond)",
      body: "Financial subsidy up to ₹50,000 for constructing dry-land farm ponds on your fields to secure irrigation water during dry spells.",
      date: "State Active",
      source: "Dept of Agriculture, MH",
      link: "https://krishi.maharashtra.gov.in/",
      tag: "Maharashtra Water Scheme",
      accent: "#2E4A7F"
    }
  ],
  "Karnataka": [
    {
      id: "scheme-ka-bhagya",
      kind: "scheme",
      title: "Krishi Bhagya Rainwater Harvesting",
      body: "Rainwater conservation and dry-land farming subsidies for building farm ponds, purchasing diesel pumpsets, and micro-irrigation systems.",
      date: "State Active",
      source: "Dept of Agriculture, Karnataka",
      link: "https://krishibhagya.karnataka.gov.in/",
      tag: "Karnataka Scheme",
      accent: "#1F5A3A"
    },
    {
      id: "scheme-ka-ganga",
      kind: "scheme",
      title: "Ganga Kalyana Borewell Subsidies",
      body: "Provides financial aid and boring subsidies to construct borewells or open wells with electrical pump sets for small/marginal farmers.",
      date: "State Active",
      source: "Ganga Kalyana KMDC",
      link: "https://kalyanakendra.karnataka.gov.in/",
      tag: "Karnataka Irrigation",
      accent: "#7A4F9E"
    }
  ],
  "Punjab": [
    {
      id: "scheme-pb-power",
      kind: "scheme",
      title: "Punjab Free Agriculture Power",
      body: "Subsidized free electricity supply for agricultural tube-wells across the state, minimizing irrigation costs.",
      date: "State Active",
      source: "PSPCL Punjab",
      link: "https://www.pspcl.in/",
      tag: "Punjab Power Scheme",
      accent: "#2E4A7F"
    },
    {
      id: "scheme-pb-crm",
      kind: "scheme",
      title: "Crop Residue Management (CRM)",
      body: "Get 50% to 80% subsidy on crop residue management machines (Happy Seeder, Mulcher) to recycle paddy straw without burning.",
      date: "State Active",
      source: "Punjab Agriculture Dept",
      link: "https://agri.punjab.gov.in/",
      tag: "Punjab Stubble Subsidy",
      accent: "#B05E2E"
    }
  ],
  "Uttar Pradesh": [
    {
      id: "scheme-up-kalyan",
      kind: "scheme",
      title: "Krishak Durghatna Kalyan Yojana",
      body: "Accidental insurance scheme offering financial compensation up to ₹5 Lakh to families in the event of accidental death or disability.",
      date: "State Active",
      source: "Govt of Uttar Pradesh",
      link: "https://upkrishi.up.gov.in/",
      tag: "UP Farmer Welfare",
      accent: "#7A4F9E"
    },
    {
      id: "scheme-up-borewell",
      kind: "scheme",
      title: "UP Free Borewell boring Scheme",
      body: "Assists small and marginal farmers with boring facilities and financial support for pump installations.",
      date: "State Active",
      source: "UP Minor Irrigation",
      link: "https://upkrishi.up.gov.in/",
      tag: "UP Irrigation",
      accent: "#1F5A3A"
    }
  ],
  "Gujarat": [
    {
      id: "scheme-gj-sahay",
      kind: "scheme",
      title: "Mukhya Mantri Kisan Sahay Yojana",
      body: "Crop assistance relief providing up to ₹25,000 per hectare for crop losses due to unseasonal rain, drought, or excess rainfall.",
      date: "State Active",
      source: "Gujarat Agriculture Dept",
      link: "https://agri.gujarat.gov.in/",
      tag: "Gujarat Crop Relief",
      accent: "#B05E2E"
    },
    {
      id: "scheme-gj-solar",
      kind: "scheme",
      title: "Suryashakti Kisan Yojana (SKY)",
      body: "Get solar panels to power agricultural irrigation, and sell excess generated electricity back to the grid for extra income.",
      date: "State Active",
      source: "GUVNL Gujarat",
      link: "https://sky.guvnl.com/",
      tag: "Gujarat Solar Scheme",
      accent: "#1F5A3A"
    }
  ]
};

const STATE_PIB_REGIDS = {
  "Telangana": 3,      // Hyderabad
  "Maharashtra": 2,    // Mumbai
  "Karnataka": 7,      // Bengaluru
  "Punjab": 5,         // Chandigarh
  "Uttar Pradesh": 19, // Lucknow
  "Gujarat": 9,        // Ahmedabad
};

export const getAgricultureUpdates = async ({ state } = {}) => {
  const feedsToFetch = [{ regId: 1, type: "central", tag: "Central News" }];
  if (state && STATE_PIB_REGIDS[state]) {
    feedsToFetch.push({ regId: STATE_PIB_REGIDS[state], type: "state", tag: `${state} PIB News` });
  }

  const fetchPromises = feedsToFetch.map(async (feedInfo) => {
    try {
      const url = `https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=${feedInfo.regId}`;
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`PIB feed for Regid ${feedInfo.regId} failed: ${response.status}`);
        return [];
      }
      const xml = await response.text();
      const feed = new XMLParser({ ignoreAttributes: false }).parse(xml);
      const rawItems = feed?.rss?.channel?.item || [];
      const items = Array.isArray(rawItems) ? rawItems : [rawItems];
      return items
        .filter((item) => {
          if (!item) return false;
          const title = String(item.title || "").toLowerCase();
          const desc = String(item.description || item.summary || "").toLowerCase();
          return AGRICULTURE_TERMS.some((term) => title.includes(term) || desc.includes(term));
        })
        .slice(0, 5)
        .map((item, index) => ({
          id: `pib-${feedInfo.type}-${index}-${item.link || Math.random()}`,
          kind: "news",
          title: String(item.title || "PIB agriculture update").trim(),
          body: cleanDescription(item.description || item.summary),
          date: getRelativeTime(item.pubDate),
          source: feedInfo.type === "central" ? "Press Information Bureau (Delhi)" : `PIB (${state} Office)`,
          link: item.link || "https://pib.gov.in",
          tag: feedInfo.tag,
          accent: feedInfo.type === "central" ? "#2E4A7F" : "#B05E2E"
        }));
    } catch (error) {
      console.error(`Error fetching PIB feed for Regid ${feedInfo.regId}:`, error);
      return [];
    }
  });

  let pibItems = [];
  try {
    const pibResults = await Promise.all(fetchPromises);
    pibItems = pibResults.flat();
  } catch (error) {
    console.error("PIB RSS feed fetch failed. Using curated schemes only.", error);
  }

  // Fetch state-specific schemes
  const stateList = STATE_SCHEMES[state] || [];

  // Combine: Live PIB News + Curated State-specific schemes + Curated Central schemes
  const combinedItems = [
    ...pibItems,
    ...stateList,
    ...CENTRAL_SCHEMES
  ];

  return { source: "Live PIB RSS & Localized Schemes", items: combinedItems };
};

