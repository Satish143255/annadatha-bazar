import { app } from "@azure/functions";
import { getAgricultureUpdates, getMarketPrices } from "../agricultureSources.js";
import { store } from "../store.js";

const cache = (id, payload) => store.upsert("publicData", {
  id,
  type: id,
  payload,
  refreshedAt: new Date().toISOString(),
});

app.timer("refreshMarketPrices", {
  schedule: process.env.MARKET_PRICE_REFRESH_SCHEDULE || "0 0 */6 * * *",
  handler: async (_timer, context) => {
    context.log("Refreshing market prices.");
    await cache("market-prices", await getMarketPrices({ limit: 100 }));
  },
});

app.timer("refreshAgricultureUpdates", {
  schedule: process.env.AGRICULTURE_UPDATES_REFRESH_SCHEDULE || "0 0 6 * * *",
  handler: async (_timer, context) => {
    context.log("Refreshing agriculture updates.");
    await cache("agriculture-updates", await getAgricultureUpdates());
  },
});
