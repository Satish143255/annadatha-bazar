const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const DATA_GOV_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const DATA_GOV_TEST_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";

const OFFICIAL_SCHEMES = [
  {
    id: "scheme-pmkisan",
    kind: "scheme",
    title: "PM-KISAN",
    body: "Income support scheme information and farmer status services from the Department of Agriculture and Farmers Welfare.",
    tag: "Farmer support",
    date: "Official portal",
    source: "PM-KISAN",
    accent: "#1F5A3A",
    link: "https://pmkisan.gov.in/",
  },
  {
    id: "scheme-pmfby",
    kind: "scheme",
    title: "Pradhan Mantri Fasal Bima Yojana",
    body: "Crop insurance scheme details, enrolment access, and claims information from the official PMFBY portal.",
    tag: "Crop insurance",
    date: "Official portal",
    source: "PMFBY",
    accent: "#2E4A7F",
    link: "https://pmfby.gov.in/",
  },
  {
    id: "scheme-soil-health",
    kind: "scheme",
    title: "Soil Health Card",
    body: "Soil nutrient testing and crop input advisory information from the official Soil Health Card portal.",
    tag: "Soil advisory",
    date: "Official portal",
    source: "Soil Health Card",
    accent: "#B05E2E",
    link: "https://soilhealth.dac.gov.in/",
  },
];

const getJson = async (path, signal) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Agriculture data request failed with ${response.status}`);
  }

  return response.json();
};

const withTimeout = async (run, milliseconds) => {
  let id;
  try {
    return await Promise.race([
      run(),
      new Promise((_, reject) => {
        id = setTimeout(() => reject(new Error("Official data request timed out.")), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(id);
  }
};

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizePrice = (record) => ({
  commodity: record.commodity,
  variety: record.variety || "All varieties",
  market: record.market,
  district: record.district,
  state: record.state,
  min: parseNumber(record.min_price),
  max: parseNumber(record.max_price),
  modal: parseNumber(record.modal_price),
  unit: "Quintal",
  date: record.arrival_date,
  source: "AGMARKNET via data.gov.in",
});

export const fetchMarketPrices = async ({ district, limit = 40, signal } = {}) => {
  const params = new URLSearchParams();
  if (district) params.set("district", district);
  params.set("limit", String(limit));

  let result;
  try {
    result = await withTimeout(() => getJson(`/market-prices?${params.toString()}`, signal), 6000);
  } catch {
    const directParams = new URLSearchParams({
      "api-key": import.meta.env.VITE_DATA_GOV_IN_API_KEY || DATA_GOV_TEST_KEY,
      format: "json",
      limit: String(limit),
    });
    if (district) directParams.set("filters[district]", district);

    const response = await withTimeout(() => fetch(
      `https://api.data.gov.in/resource/${DATA_GOV_RESOURCE_ID}?${directParams.toString()}`,
      { headers: { Accept: "application/json" }, signal },
    ), 12000);
    if (!response.ok) throw new Error(`data.gov.in returned ${response.status}`);
    result = await response.json();
  }

  return (result.records || [])
    .map(normalizePrice)
    .filter((price) => price.commodity && price.market && price.modal != null);
};

export const fetchOfficialUpdates = async ({ signal } = {}) => {
  try {
    const result = await getJson("/agriculture-updates", signal);
    const news = (result.items || []).map((item) => ({
      ...item,
      kind: "news",
      tag: item.tag || "PIB update",
      source: item.source || "Press Information Bureau",
      accent: item.accent || "#C8902C",
    }));

    return [...news, ...OFFICIAL_SCHEMES];
  } catch (error) {
    error.officialSchemes = OFFICIAL_SCHEMES;
    throw error;
  }
};

export { OFFICIAL_SCHEMES };
