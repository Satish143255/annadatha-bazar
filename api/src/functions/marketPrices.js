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
      if (!district) {
        try {
          const cached = await store.read("publicData", "market-prices", "market-prices");
          if (cached?.payload) return { jsonBody: { ...cached.payload, cachedAt: cached.refreshedAt } };
        } catch {}
      }
      const body = await getMarketPrices({ district, limit });
      return { jsonBody: body };
    } catch (error) {
      return {
        status: 502,
        jsonBody: { error: "Unable to load official mandi prices.", detail: error.message },
      };
    }
  },
});
