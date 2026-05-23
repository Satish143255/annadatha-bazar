const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

const request = async (path, options = {}) => {
  const token = localStorage.getItem("agri_auth_token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (response.status === 401) return null;
  if (!response.ok) {
    const errorBody = await response.text();
    let message = `Marketplace API returned ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.error) message = parsed.error;
    } catch {}
    throw new Error(message);
  }
  const body = await response.text();
  return body ? JSON.parse(body) : null;
};

export const DEMO_MODE = import.meta.env.VITE_ENABLE_DEMO_DATA !== "false";

export const fetchIdentity = async () => {
  const token = localStorage.getItem("agri_auth_token");
  if (token) {
    try {
      const profile = await request("/auth/me");
      if (profile) {
        return {
          userId: profile.id,
          userDetails: profile.name || "Farmer",
          userRoles: [],
          customAuth: true,
          profile,
        };
      }
    } catch (e) {
      localStorage.removeItem("agri_auth_token");
    }
  }

  // Fallback to built-in SWA identity
  try {
    const response = await fetch("/.auth/me", { credentials: "same-origin" });
    if (response.ok) {
      const body = await response.json();
      if (body.clientPrincipal) return body.clientPrincipal;
    }
  } catch (e) {}
  
  return null;
};

export const apiSignup = async (name, email, password) => {
  const data = await request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  if (data?.token) {
    localStorage.setItem("agri_auth_token", data.token);
  }
  return data;
};

export const apiLogin = async (email, password) => {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data?.token) {
    localStorage.setItem("agri_auth_token", data.token);
  }
  return data;
};

export const apiForgotPasswordRequest = (email) => request("/auth/forgot-password/request", {
  method: "POST",
  body: JSON.stringify({ email }),
});

export const apiForgotPasswordVerify = (email, code) => request("/auth/forgot-password/verify", {
  method: "POST",
  body: JSON.stringify({ email, code }),
});

export const apiForgotPasswordReset = (resetToken, password) => request("/auth/forgot-password/reset", {
  method: "POST",
  body: JSON.stringify({ resetToken, password }),
});

export const apiClearToken = () => {
  localStorage.removeItem("agri_auth_token");
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

export const fetchLiveWeather = ({ latitude, longitude, location }) => {
  const params = new URLSearchParams();
  if (latitude != null) params.append("latitude", latitude);
  if (longitude != null) params.append("longitude", longitude);
  if (location) params.append("location", location);
  return request(`/weather?${params.toString()}`);
};
