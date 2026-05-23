import { app } from "@azure/functions";
import { currentUser, requireUser } from "../auth.js";
import { fail, json, ok } from "../http.js";
import { assertRateLimit } from "../rateLimit.js";
import { store } from "../store.js";

const coordinate = (value, min, max) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max
    ? Number(number.toFixed(6))
    : null;
};

const text = (value, max) => String(value || "").trim().slice(0, max);
const price = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 100000000 ? number : null;
};

const allowedListing = (body, seller) => ({
  id: crypto.randomUUID(),
  sellerId: seller.id,
  sellerName: text(seller.name, 120) || "Farmer",
  kind: body.kind === "service" ? "service" : "listing",
  category: text(body.category || "other", 80),
  subcategory: body.subcategory ? text(body.subcategory, 80) : null,
  title: text(body.title, 140),
  description: text(body.description, 2400),
  price: price(body.price),
  priceUnit: text(body.priceUnit || "fixed", 40),
  quantity: text(body.quantity, 80),
  village: text(body.village, 120),
  district: text(body.district, 120),
  state: text(body.state, 120),
  latitude: coordinate(body.latitude, -90, 90),
  longitude: coordinate(body.longitude, -180, 180),
  photos: Array.isArray(body.photos) ? body.photos.slice(0, 6).map((photo) => text(photo, 2048)) : [],
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
      await assertRateLimit({
        name: "listing-create-user",
        identity: auth.user.id,
        limit: 10,
        windowSeconds: 60 * 60,
        message: "Listing creation limit reached. Try again later.",
      });
      const listing = allowedListing(await json(request), auth.user);
      if (listing.title.length < 6) return ok({ error: "Listing title is too short." }, 400);
      if (listing.latitude === null || listing.longitude === null) {
        return ok({ error: "Listing location is required." }, 400);
      }
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
      await assertRateLimit({
        name: "profile-write-user",
        identity: auth.user.id,
        limit: 30,
        windowSeconds: 60 * 60,
      });
      const existing = await store.read("profiles", auth.user.id, auth.user.id) || {};
      const updatedProfile = {
        ...existing,
        id: auth.user.id,
        userId: auth.user.id,
        name: text(body.name || existing.name || auth.user.name, 120),
        village: text(body.village, 120),
        district: text(body.district, 120),
        state: text(body.state, 120),
        latitude: coordinate(body.latitude, -90, 90),
        longitude: coordinate(body.longitude, -180, 180),
        crops: Array.isArray(body.crops) ? body.crops.map(String).slice(0, 24) : [],
        updatedAt: new Date().toISOString(),
      };

      if (existing.email) {
        updatedProfile.email = existing.email;
      } else if (auth.user.email) {
        updatedProfile.email = auth.user.email;
      }

      if (existing.passwordHash) {
        updatedProfile.passwordHash = existing.passwordHash;
      }

      return ok(await store.upsert("profiles", updatedProfile));
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
