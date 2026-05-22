import { app } from "@azure/functions";
import { requireUser } from "../auth.js";
import { fail, json, ok } from "../http.js";
import { assertRateLimit } from "../rateLimit.js";
import { store } from "../store.js";

const text = (value, max) => String(value || "").trim().slice(0, max);

const notify = (toUserId, type, title, body, target) => store.upsert("notifications", {
  id: crypto.randomUUID(),
  userId: toUserId,
  type,
  title,
  body,
  target,
  unread: true,
  createdAt: new Date().toISOString(),
});

app.http("inquiries", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "inquiries",
  handler: async (request) => {
    try {
      const auth = requireUser(request);
      if (auth.response) return auth.response;
      if (request.method === "GET") {
        return ok({
          items: await store.query("inquiries", {
            query: "SELECT TOP 100 * FROM c WHERE ARRAY_CONTAINS(c.participants, @userId) ORDER BY c.updatedAt DESC",
            parameters: [{ name: "@userId", value: auth.user.id }],
          }),
        });
      }

      const body = await json(request);
      await assertRateLimit({
        name: "inquiry-create-user",
        identity: auth.user.id,
        limit: 20,
        windowSeconds: 60 * 60,
        message: "Inquiry creation limit reached. Try again later.",
      });
      const sellerId = text(body.sellerId, 180);
      const listingId = text(body.listingId, 180);
      const listing = sellerId && listingId
        ? await store.read("listings", listingId, sellerId)
        : null;
      if (!listing || listing.status !== "active") return ok({ error: "Listing not found." }, 404);
      if (listing.sellerId === auth.user.id) return ok({ error: "You cannot inquire on your own listing." }, 400);
      const firstBody = text(body.body || "I am interested in this listing.", 1200);
      if (!firstBody) return ok({ error: "Message body is required." }, 400);
      const inquiry = {
        id: crypto.randomUUID(),
        listingId: listing.id,
        listingTitle: listing.title,
        sellerId: listing.sellerId,
        buyerId: auth.user.id,
        participants: [listing.sellerId, auth.user.id],
        messages: [{
          id: crypto.randomUUID(),
          from: auth.user.id,
          body: firstBody,
          createdAt: new Date().toISOString(),
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const saved = await store.upsert("inquiries", inquiry);
      await notify(inquiry.sellerId, "new_inquiry", "New inquiry", inquiry.listingTitle, { screen: "inquiries", id: inquiry.id });
      return ok(saved, 201);
    } catch (error) {
      return fail(error, "Unable to load or create inquiries.");
    }
  },
});

app.http("inquiryMessages", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "inquiries/{id}/messages",
  handler: async (request) => {
    try {
      const auth = requireUser(request);
      if (auth.response) return auth.response;
      await assertRateLimit({
        name: "inquiry-message-user",
        identity: auth.user.id,
        limit: 60,
        windowSeconds: 60 * 60,
        message: "Message limit reached. Try again later.",
      });
      const body = await json(request);
      const inquiry = await store.read("inquiries", request.params.id, request.params.id);
      if (!inquiry?.participants?.includes(auth.user.id)) return ok({ error: "Inquiry not found." }, 404);
      if (inquiry.messages.length >= 250) return ok({ error: "This inquiry has reached its message limit." }, 409);

      const message = {
        id: crypto.randomUUID(),
        from: auth.user.id,
        body: text(body.body, 1200),
        createdAt: new Date().toISOString(),
      };
      if (!message.body) return ok({ error: "Message body is required." }, 400);
      inquiry.messages.push(message);
      inquiry.updatedAt = message.createdAt;
      const saved = await store.upsert("inquiries", inquiry);
      const recipient = inquiry.participants.find((id) => id !== auth.user.id);
      if (recipient) await notify(recipient, "inquiry_reply", "Inquiry reply", inquiry.listingTitle, { screen: "inquiries", id: inquiry.id });
      return ok(saved, 201);
    } catch (error) {
      return fail(error, "Unable to send message.");
    }
  },
});
