import { createHash } from "node:crypto";
import { store } from "./store.js";

const publicError = (message, status) => {
  const error = new Error(message);
  error.publicMessage = message;
  error.status = status;
  return error;
};

const identityHash = (value) => createHash("sha256")
  .update(String(value || "unknown"))
  .digest("hex")
  .slice(0, 32);

const forwardedAddress = (request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  return String(forwarded || request.headers.get("x-client-ip") || "unknown")
    .split(",")[0]
    .trim()
    .slice(0, 80);
};

export const requestAddress = (request) => forwardedAddress(request);

export const assertRateLimit = async ({
  name,
  identity,
  limit,
  windowSeconds,
  message = "Too many requests. Try again later.",
}) => {
  const window = Math.floor(Date.now() / (windowSeconds * 1000));
  const id = `${name}:${identityHash(identity)}:${window}`;
  const ttl = windowSeconds * 2;
  let counter;

  try {
    counter = await store.create("rateLimits", {
      id,
      scope: name,
      count: 1,
      createdAt: new Date().toISOString(),
      ttl,
    });
  } catch (error) {
    if (error.code !== 409 && error.statusCode !== 409) throw error;
    counter = await store.patch("rateLimits", id, name, [
      { op: "incr", path: "/count", value: 1 },
    ]);
  }

  if (counter.count > limit) throw publicError(message, 429);
};
