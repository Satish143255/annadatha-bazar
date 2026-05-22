export const ok = (jsonBody, status = 200) => ({ status, jsonBody });

export const fail = (error, fallback = "Request failed.") => ({
  status: error.status || 500,
  jsonBody: {
    error: error.publicMessage || fallback,
    detail: process.env.NODE_ENV === "production" ? undefined : error.message,
  },
});

export const json = async (request) => {
  try {
    return await request.json();
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.status = 400;
    error.publicMessage = error.message;
    throw error;
  }
};
