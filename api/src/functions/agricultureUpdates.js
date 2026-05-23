import { app } from "@azure/functions";
import { getAgricultureUpdates } from "../agricultureSources.js";
import { store } from "../store.js";

app.http("agricultureUpdates", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "agriculture-updates",
  handler: async (request) => {
    try {
      const state = request.query.get("state") || undefined;
      const body = await getAgricultureUpdates({ state });
      return { jsonBody: body };
    } catch (error) {
      return {
        status: 502,
        jsonBody: { error: "Unable to load official agriculture updates.", detail: error.message },
      };
    }
  },
});
