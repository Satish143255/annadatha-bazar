import { app } from "@azure/functions";
import { getAgricultureUpdates } from "../agricultureSources.js";
import { store } from "../store.js";

app.http("agricultureUpdates", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "agriculture-updates",
  handler: async () => {
    try {
      try {
        const cached = await store.read("publicData", "agriculture-updates", "agriculture-updates");
        if (cached?.payload) return { jsonBody: { ...cached.payload, cachedAt: cached.refreshedAt } };
      } catch {}
      return { jsonBody: await getAgricultureUpdates() };
    } catch (error) {
      return {
        status: 502,
        jsonBody: { error: "Unable to load official agriculture updates.", detail: error.message },
      };
    }
  },
});
