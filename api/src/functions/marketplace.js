import { app } from "@azure/functions";
import { currentUser, requireUser } from "../auth.js";
import { fail, json, ok } from "../http.js";
import { store } from "../store.js";

const coordinate = (value, min, max) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max
    ? Number(number.toFixed(6))
    : null;
};

const allowedListing = (body, seller) => ({
  id: crypto.randomUUID(),
  sellerId: seller.id,
  sellerName: seller.name,
  kind: body.kind === "service" ? "service" : "listing",
  category: String(body.category || "other"),
  subcategory: body.subcategory ? String(body.subcategory) : null,
  title: String(body.title || "").trim(),
  description: String(body.description || "").trim(),
  price: Number(body.price) || null,
  priceUnit: String(body.priceUnit || "fixed"),
  quantity: String(body.quantity || "").trim(),
  village: String(body.village || "").trim(),
  district: String(body.district || "").trim(),
  state: String(body.state || "").trim(),
  latitude: coordinate(body.latitude, -90, 90),
  longitude: coordinate(body.longitude, -180, 180),
  photos: Array.isArray(body.photos) ? body.photos.slice(0, 6).map(String) : [],
  status: "active",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

app.http("listings", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "listings",
  handler: async (request) => {
    try {
      if (request.method === "GET") {
        return ok({
          items: await store.query("listings", {
            query: "SELECT TOP 100 * FROM c WHERE c.status = @status ORDER BY c.createdAt DESC",
            parameters: [{ name: "@status", value: "active" }],
          }),
        });
      }

      const auth = requireUser(request);
      if (auth.response) return auth.response;
      const listing = allowedListing(await json(request), auth.user);
      if (listing.title.length < 6) return ok({ error: "Listing title is too short." }, 400);
      return ok(await store.upsert("listings", listing), 201);
    } catch (error) {
      return fail(error, "Unable to load or save listings.");
    }
  },
});

app.http("myProfile", {
  methods: ["GET", "PUT"],
  authLevel: "anonymous",
  route: "me/profile",
  handler: async (request) => {
    try {
      const auth = requireUser(request);
      if (auth.response) return auth.response;
      if (request.method === "GET") return ok(await store.read("profiles", auth.user.id, auth.user.id));

      const body = await json(request);
      return ok(await store.upsert("profiles", {
        id: auth.user.id,
        userId: auth.user.id,
        name: String(body.name || auth.user.name).trim(),
        village: String(body.village || "").trim(),
        district: String(body.district || "").trim(),
        state: String(body.state || "").trim(),
        latitude: coordinate(body.latitude, -90, 90),
        longitude: coordinate(body.longitude, -180, 180),
        crops: Array.isArray(body.crops) ? body.crops.map(String).slice(0, 24) : [],
        updatedAt: new Date().toISOString(),
      }));
    } catch (error) {
      return fail(error, "Unable to load or save profile.");
    }
  },
});

app.http("myListings", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "me/listings",
  handler: async (request) => {
    try {
      const user = currentUser(request);
      if (!user) return { status: 401, jsonBody: { error: "Sign in required." } };
      return ok({
        items: await store.query("listings", {
          query: "SELECT TOP 100 * FROM c WHERE c.sellerId = @userId ORDER BY c.createdAt DESC",
          parameters: [{ name: "@userId", value: user.id }],
        }),
      });
    } catch (error) {
      return fail(error, "Unable to load your listings.");
    }
  },
});
