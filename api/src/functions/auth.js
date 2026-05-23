import { createHmac, randomBytes, scryptSync, timingSafeEqual, randomInt, randomUUID } from "node:crypto";
import { app } from "@azure/functions";
import { fail, json, ok } from "../http.js";
import { store } from "../store.js";
import { generateToken, verifyToken, currentUser } from "../auth.js";
import { sendEmailOtp } from "../emailProvider.js";

// Secure PBKDF2/scrypt password hashing
const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
  try {
    const [salt, originalHash] = storedHash.split(":");
    if (!salt || !originalHash) return false;
    const testHash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
    return timingSafeEqual(Buffer.from(testHash, "hex"), Buffer.from(originalHash, "hex"));
  } catch {
    return false;
  }
};

// Validates credentials and upgrades legacy simple HMAC hashes to scrypt on successful logins
const verifyPasswordWithUpgrade = async (profile, password) => {
  const storedHash = profile.passwordHash;
  if (!storedHash) return false;

  // New secure format: "salt:hash"
  if (storedHash.includes(":")) {
    return verifyPassword(password, storedHash);
  }

  // Fallback to legacy HMAC-SHA256
  const SECRET = process.env.OTP_HASH_SECRET || "default-fallback-secret-key-for-local-dev";
  const oldHash = createHmac("sha256", SECRET).update(password).digest("hex");
  const isCorrect = timingSafeEqual(Buffer.from(storedHash), Buffer.from(oldHash));

  if (isCorrect) {
    // Upgrade database hash to scrypt
    try {
      profile.passwordHash = hashPassword(password);
      await store.upsert("profiles", profile);
      console.log(`Successfully upgraded password hash format to scrypt for profile: ${profile.email}`);
    } catch (e) {
      console.error("Failed to upgrade password hash format:", e);
    }
    return true;
  }

  return false;
};

// Secure OTP hashing helper
const hashOtp = (email, code) => {
  const SECRET = process.env.OTP_HASH_SECRET || "default-fallback-secret-key-for-local-dev";
  return createHmac("sha256", SECRET).update(`${email}:${code}`).digest("hex");
};

app.http("authSignup", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/signup",
  handler: async (request) => {
    try {
      const body = await json(request);
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const name = String(body.name || "Farmer").trim();

      if (!email || !password) {
        return ok({ error: "Email and password are required." }, 400);
      }
      if (password.length < 6) {
        return ok({ error: "Password must be at least 6 characters." }, 400);
      }

      // Check if user already exists
      const existing = await store.query("profiles", {
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: email }],
      });

      if (existing && existing.length > 0) {
        return ok({ error: "An account with this email already exists." }, 400);
      }

      const userId = randomUUID();
      const passwordHash = hashPassword(password);
      
      const profile = {
        id: userId,
        userId: userId,
        email: email,
        passwordHash: passwordHash,
        name: name,
        village: "",
        district: "",
        state: "",
        crops: [],
        joined: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        createdAt: new Date().toISOString(),
      };

      await store.upsert("profiles", profile);

      const token = generateToken({
        userId: userId,
        email: email,
        name: name,
        exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      // Hide hash
      const { passwordHash: _, ...cleanProfile } = profile;

      return ok({
        token,
        profile: cleanProfile,
      }, 201);
    } catch (error) {
      return fail(error, "Signup failed.");
    }
  },
});

app.http("authLogin", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/login",
  handler: async (request) => {
    try {
      const body = await json(request);
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");

      if (!email || !password) {
        return ok({ error: "Email and password are required." }, 400);
      }

      const existing = await store.query("profiles", {
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: email }],
      });

      if (!existing || existing.length === 0) {
        return ok({ error: "Invalid email or password." }, 400);
      }

      const profile = existing[0];
      const isPasswordValid = await verifyPasswordWithUpgrade(profile, password);

      if (!isPasswordValid) {
        return ok({ error: "Invalid email or password." }, 400);
      }

      const token = generateToken({
        userId: profile.id,
        email: profile.email,
        name: profile.name,
        exp: Date.now() + 30 * 24 * 60 * 60 * 1000
      });

      const { passwordHash: _, ...cleanProfile } = profile;

      return ok({
        token,
        profile: cleanProfile,
      });
    } catch (error) {
      return fail(error, "Login failed.");
    }
  },
});

app.http("authForgotRequest", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/forgot-password/request",
  handler: async (request) => {
    try {
      const body = await json(request);
      const email = String(body.email || "").trim().toLowerCase();

      if (!email) {
        return ok({ error: "Email is required." }, 400);
      }

      const existing = await store.query("profiles", {
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: email }],
      });

      if (!existing || existing.length === 0) {
        return ok({ error: "No account found with this email." }, 400);
      }

      // Check environment to allow 123456 code only in demo/dev builds
      const isDemoMode = process.env.VITE_ENABLE_DEMO_DATA !== "false" && process.env.NODE_ENV !== "production";
      const otp = isDemoMode ? "123456" : String(randomInt(100000, 999999));

      // Save OTP challenge to DB
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins
      await store.upsert("otpChallenges", {
        id: email, // use email as ID for direct lookup
        email,
        codeHash: hashOtp(email, otp),
        attempts: 0,
        expiresAt,
      });

      // Dispatch via configured email provider (SendGrid API or Console dev logs)
      await sendEmailOtp(email, otp, isDemoMode);

      return ok({
        message: "OTP sent to your email. Check inbox or server logs.",
        email,
        // Only return otp in dev builds for testing transparency
        ...(isDemoMode ? { otp } : {}),
      });
    } catch (error) {
      return fail(error, "Forgot password request failed.");
    }
  },
});

app.http("authForgotVerify", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/forgot-password/verify",
  handler: async (request) => {
    try {
      const body = await json(request);
      const email = String(body.email || "").trim().toLowerCase();
      const code = String(body.code || "").trim();

      if (!email || !code) {
        return ok({ error: "Email and OTP code are required." }, 400);
      }

      const challenge = await store.read("otpChallenges", email, email);

      if (!challenge || new Date(challenge.expiresAt) < new Date()) {
        return ok({ error: "Invalid or expired OTP code." }, 400);
      }

      if (challenge.attempts >= 5) {
        return ok({ error: "Too many verification attempts. Please request a new code." }, 429);
      }

      // Increment attempt counter on each attempt
      challenge.attempts = (challenge.attempts || 0) + 1;
      await store.upsert("otpChallenges", challenge);

      const expected = Buffer.from(challenge.codeHash, "hex");
      const actual = Buffer.from(hashOtp(email, code), "hex");

      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        return ok({ error: "Invalid or expired OTP code." }, 400);
      }

      // Generate a temporary reset token
      const resetToken = generateToken({
        email,
        purpose: "password-reset",
        exp: Date.now() + 15 * 60 * 1000 // 15 mins
      });

      return ok({
        verified: true,
        resetToken,
      });
    } catch (error) {
      return fail(error, "OTP verification failed.");
    }
  },
});

app.http("authForgotReset", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/forgot-password/reset",
  handler: async (request) => {
    try {
      const body = await json(request);
      const resetToken = String(body.resetToken || "");
      const newPassword = String(body.password || "");

      if (!resetToken || !newPassword) {
        return ok({ error: "Reset token and new password are required." }, 400);
      }

      if (newPassword.length < 6) {
        return ok({ error: "Password must be at least 6 characters." }, 400);
      }

      const payload = verifyToken(resetToken);
      if (!payload || payload.purpose !== "password-reset") {
        return ok({ error: "Invalid or expired reset token." }, 400);
      }

      const email = payload.email;

      const existing = await store.query("profiles", {
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: email }],
      });

      if (!existing || existing.length === 0) {
        return ok({ error: "User account not found." }, 400);
      }

      const profile = existing[0];
      profile.passwordHash = hashPassword(newPassword);

      await store.upsert("profiles", profile);
      
      // Clean up OTP challenge
      try {
        await store.upsert("otpChallenges", {
          id: email,
          email,
          codeHash: "",
          expiresAt: new Date(0).toISOString(),
        });
      } catch (e) {}

      return ok({
        success: true,
        message: "Password reset successful.",
      });
    } catch (error) {
      return fail(error, "Password reset failed.");
    }
  },
});

app.http("authMe", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "auth/me",
  handler: async (request) => {
    try {
      const user = currentUser(request);
      if (!user) {
        return ok(null);
      }
      const existing = await store.read("profiles", user.id, user.id);
      if (!existing) {
        return ok({ id: user.id, email: user.email, name: user.name || "Farmer" });
      }
      const { passwordHash: _, ...cleanProfile } = existing;
      return ok(cleanProfile);
    } catch (error) {
      return fail(error, "Failed to get current user.");
    }
  },
});
