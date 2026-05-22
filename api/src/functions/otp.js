import { app } from "@azure/functions";
import { fail, json, ok } from "../http.js";
import { requestOtp, verifyOtp } from "../otpProvider.js";

app.http("otpRequest", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "otp/request",
  handler: async (request) => {
    try {
      const body = await json(request);
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
      return ok(await verifyOtp(body.phone, body.code));
    } catch (error) {
      return fail(error, "Unable to verify OTP.");
    }
  },
});
