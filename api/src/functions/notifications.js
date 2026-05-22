import { app } from "@azure/functions";
import { requireUser } from "../auth.js";
import { fail, ok } from "../http.js";
import { store } from "../store.js";

app.http("notifications", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "notifications",
  handler: async (request) => {
    try {
      const auth = requireUser(request);
      if (auth.response) return auth.response;
      return ok({
        items: await store.query("notifications", {
          query: "SELECT TOP 100 * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC",
          parameters: [{ name: "@userId", value: auth.user.id }],
        }),
      });
    } catch (error) {
      return fail(error, "Unable to load notifications.");
    }
  },
});

app.http("notificationRead", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "notifications/{id}/read",
  handler: async (request) => {
    try {
      const auth = requireUser(request);
      if (auth.response) return auth.response;
      return ok(await store.patch("notifications", request.params.id, auth.user.id, [
        { op: "replace", path: "/unread", value: false },
      ]));
    } catch (error) {
      return fail(error, "Unable to update notification.");
    }
  },
});
