import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.OTP_HASH_SECRET || "default-fallback-secret-key-for-local-dev";

export const generateToken = (payload) => {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
};

export const verifyToken = (token) => {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expectedSignature = createHmac("sha256", SECRET).update(data).digest("base64url");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

const decodePrincipal = (header) => {
  if (!header) return null;
  try {
    return JSON.parse(Buffer.from(header, "base64").toString("utf8"));
  } catch {
    return null;
  }
};

export const currentUser = (request) => {
  // 1. Try built-in Azure Static Web Apps principal header
  const principal = decodePrincipal(request.headers.get("x-ms-client-principal"));
  if (principal?.userId) {
    return {
      id: principal.userId,
      identityProvider: principal.identityProvider,
      name: principal.userDetails || "Farmer",
      roles: principal.userRoles || [],
    };
  }

  // 2. Try custom authorization header
  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload) {
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name || "Farmer",
        roles: [],
      };
    }
  }

  return null;
};

export const requireUser = (request) => {
  const user = currentUser(request);
  if (!user) {
    return {
      response: {
        status: 401,
        jsonBody: { error: "Sign in required." },
      },
    };
  }
  return { user };
};
