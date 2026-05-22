import { app } from "@azure/functions";
import { fail, json, ok } from "../http.js";
import { requestOtp, verifyOtp } from "../otpProvider.js";
import { assertRateLimit, requestAddress } from "../rateLimit.js";

app.http("otpRequest", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "otp/request",
  handler: async (request) => {
    try {
      const body = await json(request);
      const address = requestAddress(request);
      await assertRateLimit({
        name: "otp-request-ip",
        identity: address,
        limit: 5,
        windowSeconds: 10 * 60,
        message: "Too many OTP requests from this network. Try again later.",
      });
      return ok(await requestOtp(body.phone), 202);
    } catch (error) {
      return fail(error, "Unable to send OTP.");
    }
  },
});

app.http("otpVerify", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "otp/verify",
  handler: async (request) => {
    try {
      const body = await json(request);
      await assertRateLimit({
        name: "otp-verify-ip",
        identity: requestAddress(request),
        limit: 30,
        windowSeconds: 5 * 60,
        message: "Too many OTP verification attempts. Try again later.",
      });
      return ok(await verifyOtp(body.phone, body.code));
    } catch (error) {
      return fail(error, "Unable to verify OTP.");
    }
  },
});
