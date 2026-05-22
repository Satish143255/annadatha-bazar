const decodePrincipal = (header) => {
  if (!header) return null;
  return JSON.parse(Buffer.from(header, "base64").toString("utf8"));
};

export const currentUser = (request) => {
  const principal = decodePrincipal(request.headers.get("x-ms-client-principal"));
  if (!principal?.userId) return null;

  return {
    id: principal.userId,
    identityProvider: principal.identityProvider,
    name: principal.userDetails || "Farmer",
    roles: principal.userRoles || [],
  };
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
