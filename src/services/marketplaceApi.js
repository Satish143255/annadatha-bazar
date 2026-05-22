const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Marketplace API returned ${response.status}`);
  return response.json();
};

export const DEMO_MODE = import.meta.env.VITE_ENABLE_DEMO_DATA !== "false";

export const fetchIdentity = async () => {
  const response = await fetch("/.auth/me", { credentials: "same-origin" });
  if (!response.ok) return null;
  const body = await response.json();
  return body.clientPrincipal || null;
};

export const loadMarketplace = async () => {
  const [profile, publicListings, myListings, inquiries, notifications] = await Promise.all([
    request("/me/profile"),
    request("/listings"),
    request("/me/listings"),
    request("/inquiries"),
    request("/notifications"),
  ]);

  return {
    profile,
    listings: publicListings?.items || [],
    myListings: myListings?.items || [],
    inquiries: inquiries?.items || [],
    notifications: notifications?.items || [],
    orders: [],
  };
};

export const saveProfile = (profile) => request("/me/profile", {
  method: "PUT",
  body: JSON.stringify(profile),
});

export const createListing = (listing) => request("/listings", {
  method: "POST",
  body: JSON.stringify(listing),
});
