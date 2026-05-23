import { app } from "@azure/functions";
import { getMarketPrices } from "../agricultureSources.js";
import { store } from "../store.js";

app.http("marketPrices", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "market-prices",
  handler: async (request) => {
    try {
      const district = request.query.get("district") || undefined;
      const limit = request.query.get("limit") || undefined;
      
      const cachedId = district
        ? `market-prices-${district.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
        : "market-prices";

      let cached = null;
      try {
        cached = await store.read("publicData", cachedId, "market-prices");
      } catch (err) {
        console.warn("Cosmos DB cache read failed:", err.message);
      }

      const sixHoursMs = 6 * 60 * 60 * 1000;
      if (cached?.payload && cached.refreshedAt) {
        const ageMs = Date.now() - Date.parse(cached.refreshedAt);
        if (ageMs < sixHoursMs) {
          return { jsonBody: { ...cached.payload, cachedAt: cached.refreshedAt } };
        }
      }

      try {
        const body = await getMarketPrices({ district, limit });
        try {
          await store.upsert("publicData", {
            id: cachedId,
            type: "market-prices",
            payload: body,
            refreshedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("Cosmos DB cache write failed:", err.message);
        }
        return { jsonBody: body };
      } catch (error) {
        if (cached?.payload) {
          return {
            jsonBody: {
              ...cached.payload,
              cachedAt: cached.refreshedAt,
              warning: "Using stale fallback due to upstream error",
            },
          };
        }
        throw error;
      }
    } catch (error) {
      return {
        status: 502,
        jsonBody: { error: "Unable to load official mandi prices.", detail: error.message },
      };
    }
  },
});
