import { XMLParser } from "fast-xml-parser";

const MARKET_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const TEST_DATA_GOV_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";
const PIB_RSS_URL = "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3";
const AGRICULTURE_TERMS = [
  "agri",
  "crop",
  "farmer",
  "farm",
  "kisan",
  "mandi",
  "horticulture",
  "soil",
  "livestock",
  "fisher",
  "food grain",
  "पशु",
  "किसान",
  "कृषि",
  "फसल",
];

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

export const getAgricultureUpdates = async () => {
  const response = await ensureOk(await fetch(PIB_RSS_URL), "PIB");
  const xml = await response.text();
  const feed = new XMLParser({ ignoreAttributes: false }).parse(xml);
  const rawItems = feed?.rss?.channel?.item || [];
  const items = (Array.isArray(rawItems) ? rawItems : [rawItems])
    .filter((item) => {
      const title = String(item.title || "").toLowerCase();
      return AGRICULTURE_TERMS.some((term) => title.includes(term.toLowerCase()));
    })
    .slice(0, 8)
    .map((item, index) => ({
      id: `pib-${index}-${item.link}`,
      title: String(item.title || "PIB agriculture update"),
      body: "Official Press Information Bureau release.",
      date: "Latest PIB feed",
      source: "Press Information Bureau",
      link: item.link,
      tag: "Government news",
    }));

  return { source: "Press Information Bureau RSS", items };
};
