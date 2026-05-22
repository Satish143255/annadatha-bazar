import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { SmsClient } from "@azure/communication-sms";
import { assertRateLimit } from "./rateLimit.js";
import { store } from "./store.js";

const OTP_TTL_SECONDS = 5 * 60;
const provider = process.env.OTP_PROVIDER || "disabled";

const publicError = (message, status) => {
  const error = new Error(message);
  error.publicMessage = message;
  error.status = status;
  return error;
};

const normalizedPhone = (phone) => {
  const value = String(phone || "").replace(/[^\d+]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(value)) {
    throw publicError("Use an E.164 phone number such as +919876543210.", 400);
  }
  return value;
};

const hash = (phone, code) => {
  if (!process.env.OTP_HASH_SECRET) {
    throw publicError("OTP service is not configured.", 503);
  }
  return createHmac("sha256", process.env.OTP_HASH_SECRET)
    .update(`${phone}:${code}`)
    .digest("hex");
};

const assertAzureSms = () => {
  if (provider !== "azure-communication-services") {
    throw publicError("Phone OTP is disabled for this environment.", 503);
  }
  if (!process.env.ACS_CONNECTION_STRING || !process.env.ACS_SMS_FROM) {
    throw publicError("Azure SMS settings are incomplete.", 503);
  }
};

export const requestOtp = async (rawPhone) => {
  assertAzureSms();
  const phone = normalizedPhone(rawPhone);
  await assertRateLimit({
    name: "otp-request-phone",
    identity: phone,
    limit: 3,
    windowSeconds: 10 * 60,
    message: "Wait before requesting another code for this phone number.",
  });
  const code = String(randomInt(100000, 1000000));
  const issuedAt = new Date();
  const challenge = {
    id: phone,
    phone,
    codeHash: hash(phone, code),
    attempts: 0,
    createdAt: issuedAt.toISOString(),
    expiresAt: new Date(issuedAt.getTime() + OTP_TTL_SECONDS * 1000).toISOString(),
    ttl: OTP_TTL_SECONDS,
  };

  await store.upsert("otpChallenges", challenge);
  const result = await new SmsClient(process.env.ACS_CONNECTION_STRING).send({
    from: process.env.ACS_SMS_FROM,
    to: [phone],
    message: `Your AnnadathaBazar verification code is ${code}. It expires in 5 minutes.`,
  });
  if (!result[0]?.successful) throw publicError("OTP SMS could not be sent.", 502);

  return { phone, expiresInSeconds: OTP_TTL_SECONDS };
};

export const verifyOtp = async (rawPhone, rawCode) => {
  const phone = normalizedPhone(rawPhone);
  const code = String(rawCode || "").trim();
  if (!/^\d{6}$/.test(code)) throw publicError("Enter the 6-digit code.", 400);

  const challenge = await store.read("otpChallenges", phone, phone);
  if (!challenge || Date.parse(challenge.expiresAt) <= Date.now()) {
    throw publicError("OTP code expired. Request a new code.", 400);
  }
  if (challenge.attempts >= 5) throw publicError("OTP attempt limit reached.", 429);

  challenge.attempts += 1;
  await store.upsert("otpChallenges", challenge);

  const expected = Buffer.from(challenge.codeHash, "hex");
  const actual = Buffer.from(hash(phone, code), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw publicError("OTP code is incorrect.", 400);
  }

  challenge.verifiedAt = new Date().toISOString();
  challenge.ttl = 60;
  await store.upsert("otpChallenges", challenge);
  return { verified: true, phone };
};
