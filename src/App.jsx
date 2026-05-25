import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AGRI_DATA } from './data.js';
import { Icon } from './icons/Icon.jsx';
import { T, Toast } from './components/index.jsx';
import { TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakSelect } from './tweaks/TweaksPanel.jsx';
import { HostedAccountScreen, SplashScreen, SignupLoginScreen, ForgotPasswordScreen, ProfileSetupScreen } from './screens/AuthScreens.jsx';
import { HomeScreen } from './screens/HomeScreen.jsx';
import { BrowseScreen, ListingDetailScreen, PostListingScreen } from './screens/BrowseScreen.jsx';
import { PricesScreen, WeatherScreen, NearbyScreen, SchemesScreen } from './screens/DiscoverScreen.jsx';
import { ProfileScreen, MyListingsScreen, InquiriesScreen } from './screens/ProfileScreen.jsx';
import { DashboardScreen } from './screens/DashboardScreen.jsx';
import { NotificationsScreen, SettingsScreen, HelpScreen } from './screens/UtilityScreens.jsx';
import { fetchMarketPrices, fetchOfficialUpdates, OFFICIAL_SCHEMES } from './services/agricultureData.js';
import { createListing, DEMO_MODE, fetchIdentity, loadMarketplace, saveProfile, apiLogin, apiSignup, fetchLiveWeather, reverseGeocode, fetchIpLocation } from './services/marketplaceApi.js';

// localStorage helpers
const LS = {
  get: (k, def) => { try { const v = localStorage.getItem("agri_" + k); return v == null ? def : JSON.parse(v); } catch { return def; } },
  set: (k, v)   => { try { localStorage.setItem("agri_" + k, JSON.stringify(v)); } catch {} },
};

const TAB_ORDER = ["home", "browse", "discover", "profile"];

const cleanDemoText = (value) => value
  .replaceAll("â€”", "-")
  .replaceAll("â€“", "-")
  .replaceAll("Â·", "-")
  .replaceAll("â‚¹", "Rs ")
  .replaceAll("â†’", ">")
  .replaceAll("â€¦", "...");

const cleanDemoFixture = (value) => {
  if (typeof value === "string") return cleanDemoText(value);
  if (Array.isArray(value)) return value.map(cleanDemoFixture);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanDemoFixture(item)]));
  }
  return value;
};

const DEMO_DATA = DEMO_MODE ? cleanDemoFixture(AGRI_DATA) : null;

function App() {
  // ===== Tweaks =====
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme":   "default",
    "dark":    false,
    "lang":    "en",
    "density": "comfortable"
  }/*EDITMODE-END*/;

  const [tweaks, setTweaksState] = useState(() => ({
    theme:   LS.get("theme",   TWEAK_DEFAULTS.theme),
    dark:    LS.get("dark",    TWEAK_DEFAULTS.dark),
    lang:    LS.get("lang",    TWEAK_DEFAULTS.lang),
    density: LS.get("density", TWEAK_DEFAULTS.density),
  }));

  const setTweak = (k, v) => {
    const updates = typeof k === "object" ? k : { [k]: v };
    setTweaksState(t => ({ ...t, ...updates }));
    Object.entries(updates).forEach(([key, val]) => LS.set(key, val));
    if (window.parent !== window) {
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits: updates }, "*");
    }
  };
  const { theme, dark, lang, density } = tweaks;

  // ===== Edit mode wiring =====
  const [tweaksOpen, setTweaksOpen] = useState(false);
  useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "__activate_edit_mode")   setTweaksOpen(true);
      else if (e.data.type === "__deactivate_edit_mode") setTweaksOpen(false);
    };
    window.addEventListener("message", onMsg);
    if (window.parent !== window) window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const screenAttrs = useMemo(() => ({
    "data-theme":   theme,
    "data-mode":    dark ? "dark" : "light",
    "data-density": density,
  }), [dark, theme, density]);

  // ===== App state =====
  const [session, setSession]         = useState({ stage: "splash" });
  const [cachedIdentity, setCachedIdentity] = useState(null);
  const [authError, setAuthError]     = useState(null);

  const [user, setUser]               = useState(DEMO_MODE ? DEMO_DATA.USERS.find(u => u.isMe) : null);
  const [listings, setListings]       = useState(DEMO_MODE ? DEMO_DATA.LISTINGS : []);
  const [myListings, setMyListings]   = useState(DEMO_MODE ? DEMO_DATA.MY_LISTINGS : []);
  const [orders, setOrders]           = useState(DEMO_MODE ? DEMO_DATA.ORDERS : []);
  const [inquiries, setInquiries]     = useState(DEMO_MODE ? DEMO_DATA.INQUIRIES : []);
  const [notifications, setNotifications] = useState(DEMO_MODE ? DEMO_DATA.NOTIFICATIONS : []);
  const [marketPrices, setMarketPrices] = useState([]);
  const [marketPricesState, setMarketPricesState] = useState("loading");
  const [marketReloadToken, setMarketReloadToken] = useState(0);
  const retryMarketData = useCallback(() => {
    setMarketPricesState("loading");
    setOfficialUpdatesState("loading");
    setMarketReloadToken((t) => t + 1);
  }, []);
  const [officialUpdates, setOfficialUpdates] = useState([]);
  const [officialUpdatesState, setOfficialUpdatesState] = useState("loading");

  const unreadNotifs = notifications.filter(n => n.unread).length;
  const [weather, setWeather] = useState(null);
  const [profileEditing, setProfileEditing] = useState(false);

  // Background identity fetch during Splash
  useEffect(() => {
    let current = true;
    window.agriSetLang = (l) => setTweak("lang", l);

    if (DEMO_MODE) {
      const savedUser = LS.get("mock_user", null);
      if (current) {
        setCachedIdentity(savedUser);
      }
      return () => {
        current = false;
        delete window.agriSetLang;
      };
    }

    fetchIdentity()
      .then(async (identity) => {
        if (!current) return;
        if (!identity) return;
        let data = null;
        try {
          data = await loadMarketplace();
        } catch (e) {}
        if (!current) return;
        setCachedIdentity({ identity, data });
      })
      .catch(() => {});

    return () => {
      current = false;
      delete window.agriSetLang;
    };
  }, []);

  const [detectedLocation, setDetectedLocation] = useState(null);

  // Automatically detect location on startup if not already configured in user profile
  useEffect(() => {
    if (user?.latitude && user?.longitude) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          const lat = Number(coords.latitude.toFixed(6));
          const lon = Number(coords.longitude.toFixed(6));
          const resolved = await reverseGeocode(lat, lon);
          if (resolved) {
            setDetectedLocation({
              latitude: lat,
              longitude: lon,
              village: resolved.village,
              district: resolved.district,
              state: resolved.state,
            });
          }
        },
        async () => {
          const ipLoc = await fetchIpLocation();
          if (ipLoc) {
            setDetectedLocation(ipLoc);
          }
        },
        { timeout: 8000 }
      );
    } else {
      fetchIpLocation().then((ipLoc) => {
        if (ipLoc) {
          setDetectedLocation(ipLoc);
        }
      });
    }
  }, [user]);

  const userLat = user?.latitude || detectedLocation?.latitude;
  const userLon = user?.longitude || detectedLocation?.longitude;
  const userVillage = user?.village || detectedLocation?.village;
  const userDistrict = user?.district || detectedLocation?.district;
  const userState = user?.state || detectedLocation?.state;


  useEffect(() => {
    let current = true;
    const locationName = [userVillage, userDistrict].filter(Boolean).join(", ");
    
    fetchLiveWeather({
      latitude: userLat,
      longitude: userLon,
      location: locationName
    })
      .then((data) => {
        if (!current) return;
        if (data) {
          setWeather(data);
        } else if (DEMO_MODE) {
          setWeather(DEMO_DATA.WEATHER);
        }
      })
      .catch((err) => {
        console.error("Failed to load live weather:", err);
        if (current && DEMO_MODE) {
          setWeather(DEMO_DATA.WEATHER);
        }
      });

    return () => {
      current = false;
    };
  }, [userLat, userLon, userVillage, userDistrict]);

  useEffect(() => {
    const controller = new AbortController();

    // background = silent refresh: keep last good data on failure, no
    // loading/error flicker; only the value diff drives the live flash.
    const loadPrices = (background) => {
      fetchMarketPrices({ district: userDistrict, signal: controller.signal })
        .then((prices) => {
          setMarketPrices(prices);
          setMarketPricesState(prices.length ? "ready" : "empty");
        })
        .catch((error) => {
          if (error.name !== "AbortError" && !background) setMarketPricesState("error");
        });
    };

    loadPrices(false);

    fetchOfficialUpdates({ state: userState, signal: controller.signal })
      .then((updates) => {
        setOfficialUpdates(updates);
        setOfficialUpdatesState("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setOfficialUpdates(error.officialSchemes || OFFICIAL_SCHEMES);
          setOfficialUpdatesState("error");
        }
      });

    // Lightweight polling so a genuine upstream price change appears live.
    // Mandi data updates slowly, so this is intentionally infrequent and
    // pauses while the tab is hidden.
    const POLL_MS = 120000;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") loadPrices(true);
    }, POLL_MS);

    return () => { controller.abort(); clearInterval(id); };
  }, [userDistrict, userState, marketReloadToken]);

  // ===== Navigation =====
  const [tab, setTabRaw]  = useState("home");
  const [tabDir, setTabDir] = useState(1); // 1 = forward, -1 = backward
  const [tabKey, setTabKey] = useState(0); // increment to re-trigger animation
  const prevTabIdxRef = useRef(0);

  const setTab = useCallback((newTab) => {
    const newIdx  = TAB_ORDER.indexOf(newTab);
    const prevIdx = prevTabIdxRef.current;
    setTabDir(newIdx >= prevIdx ? 1 : -1);
    prevTabIdxRef.current = newIdx;
    setTabKey(k => k + 1);
    setTabRaw(newTab);
  }, []);

  const [discoverScreen, setDiscoverScreen]   = useState("prices");
  const [browseInitialCat, setBrowseInitialCat]   = useState("all");
  const [nearbyInitialCat, setNearbyInitialCat]   = useState("all");
  const [modalStack, setModalStack] = useState([]);
  const modal = modalStack[modalStack.length - 1] || null;
  const setModal = (m) => {
    if (m === null) {
      setModalStack([]);
    } else {
      setModalStack([m]);
    }
  };
  const pushModal = (m) => setModalStack(prev => [...prev, m]);
  const popModal = () => setModalStack(prev => prev.slice(0, -1));

  // ── OS / browser back button closes the top modal instead of leaving ──
  // Mirror modal-stack depth into browser history. suppressPopRef prevents a
  // programmatic rewind (UI-initiated close) from being re-handled as a back.
  const historyDepthRef = useRef(0);
  const suppressPopRef = useRef(false);
  const modalDepth = modalStack.length;

  useEffect(() => {
    const histDepth = historyDepthRef.current;
    if (modalDepth > histDepth) {
      for (let i = histDepth; i < modalDepth; i++) {
        window.history.pushState({ agriModalDepth: i + 1 }, "");
      }
      historyDepthRef.current = modalDepth;
    } else if (modalDepth < histDepth) {
      historyDepthRef.current = modalDepth;
      suppressPopRef.current = true;
      window.history.go(-(histDepth - modalDepth));
    }
  }, [modalDepth]);

  useEffect(() => {
    const onPop = () => {
      if (suppressPopRef.current) { suppressPopRef.current = false; return; }
      if (historyDepthRef.current > 0) {
        historyDepthRef.current -= 1;
        setModalStack(prev => prev.slice(0, -1));
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const [toasts, setToasts] = useState([]);

  const showToast = (msg, icon = "check") => {
    const id = Date.now();
    setToasts(ts => [...ts, { id, msg, icon }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 2600);
  };

  // Navigation helpers
  const openListing  = (l) => { const listing = typeof l === "string" ? [...listings, ...myListings].find(x => x.id === l) : l; if (listing) setModal({ kind: "detail", listing }); };
  const openPost     = (prefill) => {
    if (typeof prefill === "string") prefill = { mode: prefill };
    setModal({
      kind: "post",
      prefill: {
        village: user?.village,
        district: user?.district,
        state: user?.state,
        latitude: user?.latitude,
        longitude: user?.longitude,
        ...prefill,
      },
    });
  };
  const openNotifs   = () => setModal({ kind: "notifications" });
  const openSettings = () => setModal({ kind: "settings" });
  const openInquiries  = (which = "received", inquiryId = null) => setModal({ kind: "inquiries", which, inquiryId });
  const openMyListings = () => setModal({ kind: "my-listings" });
  const openDashboard  = () => setModal({ kind: "dashboard" });

  const handleMessageSeller = (listing) => {
    const existing = inquiries.find(i => i.listingId === listing.id && i.type === "sent");
    if (existing) {
      setModal({ kind: "inquiries", which: "sent", inquiryId: existing.id });
    } else {
      const newInq = {
        id: "i_new_" + Date.now(),
        listingId: listing.id, listingTitle: listing.title,
        toUser: listing.userId, fromName: DEMO_DATA?.USERS.find(u => u.id === listing.userId)?.name || "Seller",
        fromVillage: `${listing.village}, ${listing.district}`,
        type: "sent", unread: 0,
        lastMessage: "Hi, I am interested in your listing.",
        lastTime: "Just now",
        messages: [{ from: "me", body: "Hi, I am interested in your listing.", time: "Just now" }],
      };
      setInquiries([newInq, ...inquiries]);
      setModal({ kind: "inquiries", which: "sent", inquiryId: newInq.id });
    }
  };

  const handleNotifTap = (n) => {
    setNotifications(notifications.map(x => x.id === n.id ? { ...x, unread: false } : x));
    setModal(null);
    if (n.target.tab) setTab(n.target.tab);
    setTimeout(() => {
      if (n.target.screen === "inquiries") openInquiries("received", n.target.id);
      else if (n.target.screen === "detail") openListing(n.target.id);
      else if (n.target.screen === "listings") openMyListings();
      else if (n.target.screen === "prices")  { setTab("discover"); setDiscoverScreen("prices"); }
      else if (n.target.screen === "nearby")  { setTab("discover"); setDiscoverScreen("nearby"); }
      else if (n.target.screen === "weather") { setTab("discover"); setDiscoverScreen("weather"); }
    }, 50);
  };

  const handleNavTab = (newTab, sub, opts) => {
    setTab(newTab);
    if (sub && newTab === "discover") setDiscoverScreen(sub);
    if (sub === "settings") openSettings();
    if (opts?.category) {
      if (newTab === "browse") setBrowseInitialCat(opts.category);
      if (newTab === "discover" && sub === "nearby") setNearbyInitialCat(opts.category);
    } else {
      if (newTab === "browse") setBrowseInitialCat("all");
      if (newTab === "discover" && sub === "nearby") setNearbyInitialCat("all");
    }
  };

  const handlePost = async (data) => {
    if (!DEMO_MODE) {
      const created = await createListing({ kind: data.kind || "listing", ...data });
      if (created) setMyListings((items) => [created, ...items]);
      setModal(null);
      setTab("profile");
      showToast("Listing posted!", "check");
      return;
    }
    const newListing = {
      id: "m_new_" + Date.now(), userId: "me", ...data,
      photos: data.photos?.length ? data.photos : ["photo placeholder"],
      tags: [], distance: 0, views: 0, inquiries: 0, posted: "Just now",
      available: "Available now", status: "active",
    };
    setMyListings([newListing, ...myListings]);
    setModal(null);
    setTab("profile");
    setTimeout(() => openMyListings(), 60);
    setTimeout(() => showToast("Listing posted!", "check"), 200);
  };

  const handleGetStarted = () => {
    if (cachedIdentity) {
      if (DEMO_MODE) {
        setUser(cachedIdentity);
        if (!cachedIdentity.state || !cachedIdentity.district) {
          setSession({ stage: "profile-setup" });
        } else {
          setSession({ stage: "app" });
        }
      } else {
        const profile = cachedIdentity.profile || cachedIdentity.identity?.profile || cachedIdentity.identity;
        setUser(profile);
        if (cachedIdentity.data) {
          setListings(cachedIdentity.data.listings || []);
          setMyListings(cachedIdentity.data.myListings || []);
          setInquiries(cachedIdentity.data.inquiries || []);
          setNotifications(cachedIdentity.data.notifications || []);
        }
        if (!profile?.state || !profile?.district) {
          setSession({ stage: "profile-setup" });
        } else {
          setSession({ stage: "app" });
        }
      }
    } else {
      setSession({ stage: "login-signup" });
    }
  };

  const handleLogin = async (email, password) => {
    if (DEMO_MODE) {
      const usersList = LS.get("mock_users_list", []);
      const matched = usersList.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      const fallbackUser = DEMO_DATA.USERS.find(u => u.email?.toLowerCase() === email.toLowerCase());

      let userProfile = null;
      if (matched) {
        userProfile = matched.profile;
      } else if (fallbackUser) {
        userProfile = fallbackUser;
      } else {
        throw new Error("Invalid email or password. For demo, register a new account.");
      }

      LS.set("mock_user", userProfile);
      setUser(userProfile);
      setCachedIdentity(userProfile);

      if (!userProfile.state || !userProfile.district) {
        setSession({ stage: "profile-setup" });
      } else {
        setSession({ stage: "app" });
      }
      showToast("Logged in successfully", "check");
    } else {
      const response = await apiLogin(email, password);
      if (response && response.profile) {
        const profile = response.profile;
        setUser(profile);
        try {
          const data = await loadMarketplace();
          if (data) {
            setListings(data.listings || []);
            setMyListings(data.myListings || []);
            setInquiries(data.inquiries || []);
            setNotifications(data.notifications || []);
          }
        } catch (e) {}

        if (!profile.state || !profile.district) {
          setSession({ stage: "profile-setup" });
        } else {
          setSession({ stage: "app" });
        }
        showToast("Logged in successfully", "check");
      } else {
        throw new Error("Invalid email or password.");
      }
    }
  };

  const handleSignup = async (signupData) => {
    if (DEMO_MODE) {
      const usersList = LS.get("mock_users_list", []);
      if (usersList.some(u => u.email.toLowerCase() === signupData.email.toLowerCase())) {
        throw new Error("An account with this email already exists.");
      }

      const userId = "u_" + Date.now();
      const profile = {
        id: userId,
        userId: userId,
        email: signupData.email.toLowerCase(),
        name: signupData.name,
        village: signupData.village,
        district: signupData.district,
        state: signupData.state,
        crops: signupData.crops || [],
        latitude: signupData.latitude,
        longitude: signupData.longitude,
        joined: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        createdAt: new Date().toISOString(),
      };

      usersList.push({ email: signupData.email.toLowerCase(), password: signupData.password, profile });
      LS.set("mock_users_list", usersList);
      LS.set("mock_user", profile);
      
      setUser(profile);
      setCachedIdentity(profile);
      setSession({ stage: "app" });
      showToast("Welcome to AnnadathaBazar!", "check");
    } else {
      const response = await apiSignup(signupData);
      if (response && response.profile) {
        setUser(response.profile);
        setSession({ stage: "app" });
        showToast("Welcome to AnnadathaBazar!", "check");
      } else {
        throw new Error("Registration failed.");
      }
    }
  };

  const handleLogout = () => {
    setModal(null);
    if (DEMO_MODE) {
      LS.set("mock_user", null);
    } else {
      localStorage.removeItem("agri_auth_token");
    }
    setUser(null);
    setCachedIdentity(null);
    setSession({ stage: "login-signup" });
    showToast("Logged out successfully", "check");
  };

  const handleUpdateProfile = async (updates) => {
    let profile;
    const updatedUser = { ...user, ...updates };
    if (DEMO_MODE) {
      profile = updatedUser;
      const usersList = LS.get("mock_users_list", []);
      const idx = usersList.findIndex(u => u.email?.toLowerCase() === user?.email?.toLowerCase());
      if (idx !== -1) {
        usersList[idx].profile = profile;
        LS.set("mock_users_list", usersList);
      }
      LS.set("mock_user", profile);
    } else {
      profile = await saveProfile(updatedUser);
    }
    setUser(profile);
    showToast("Profile updated successfully", "check");
  };

  const resetDemo = () => {
    if (!DEMO_MODE) return;
    setMyListings(DEMO_DATA.MY_LISTINGS);
    setOrders(DEMO_DATA.ORDERS);
    setInquiries(DEMO_DATA.INQUIRIES);
    setNotifications(DEMO_DATA.NOTIFICATIONS);
    setModal(null);
    showToast("Demo reset", "refresh");
  };

  // ===== Auth flow =====
  if (session.stage !== "app") {
    return (
      <Stage screenAttrs={screenAttrs}>
        {session.stage === "loading" && <LoadingScreen />}
        {session.stage === "hosted-auth" && <HostedAccountScreen />}
        {session.stage === "splash" && (
          <SplashScreen onGetStarted={handleGetStarted} lang={lang} />
        )}
        {session.stage === "login-signup" && (
          <SignupLoginScreen
            onLogin={handleLogin}
            onSignup={handleSignup}
            showToast={showToast}
            onForgotPasswordClick={() => setSession({ stage: "forgot-password" })}
            onSkip={() => {
              setUser(DEMO_MODE ? DEMO_DATA.USERS.find(u => u.isMe) : null);
              setSession({ stage: "app" });
              showToast("Logged in as guest", "check");
            }}
            lang={lang}
            error={authError}
            setError={setAuthError}
          />
        )}
        {session.stage === "forgot-password" && (
          <ForgotPasswordScreen
            onBack={() => setSession({ stage: "login-signup" })}
            onSuccess={() => setSession({ stage: "login-signup" })}
            showToast={showToast}
            lang={lang}
          />
        )}
        {session.stage === "profile-setup" && (
          <ProfileSetupScreen
            onFinish={async (data) => {
              let profile;
              if (DEMO_MODE) {
                profile = { ...user, ...data, joined: user?.joined || "May 2026" };
                const usersList = LS.get("mock_users_list", []);
                const idx = usersList.findIndex(u => u.email.toLowerCase() === user?.email?.toLowerCase());
                if (idx !== -1) {
                  usersList[idx].profile = profile;
                  LS.set("mock_users_list", usersList);
                }
                LS.set("mock_user", profile);
              } else {
                profile = await saveProfile(data);
              }
              setUser(profile);
              setSession({ stage: "app" });
              showToast("Welcome to AnnadathaBazar!", "check");
            }}
            lang={lang}
          />
        )}
        {tweaksOpen && <TweaksUI tweaks={tweaks} setTweak={setTweak} onClose={() => setTweaksOpen(false)} />}
      </Stage>
    );
  }

  // ===== Main app =====
  const renderTab = () => {
    switch (tab) {
      case "home":    return <HomeScreen    user={user} listings={listings} prices={marketPrices} pricesState={marketPricesState} weather={weather} updates={officialUpdates} updatesState={officialUpdatesState} onOpenListing={openListing} onNavTab={handleNavTab} onOpenNotifs={openNotifs} unreadNotifs={unreadNotifs} onPostListing={(mode) => openPost(mode || "listing")} lang={lang} />;
      case "browse":  return <BrowseScreen  listings={listings} onOpenListing={openListing} onPostListing={() => openPost()} initialCategory={browseInitialCat} lang={lang} />;
      case "discover":return <DiscoverWrapper screen={discoverScreen} setScreen={setDiscoverScreen} user={user} listings={listings} marketPrices={marketPrices} marketPricesState={marketPricesState} weather={weather} updates={officialUpdates} updatesState={officialUpdatesState} onOpenListing={openListing} nearbyInitialCat={nearbyInitialCat} onRetryMarket={retryMarketData} onToast={showToast} lang={lang} />;
      case "profile": return <ProfileScreen  user={user} myListings={myListings} inquiries={inquiries} orders={orders} onOpenSettings={openSettings} onOpenListings={openMyListings} onOpenDashboard={openDashboard} onOpenInquiries={openInquiries} onLogout={handleLogout} onUpdateProfile={handleUpdateProfile} editing={profileEditing} setEditing={setProfileEditing} lang={lang} onToast={showToast} />;
      default: return null;
    }
  };

  const screenLabel = { home:"H1 Home", browse:"B1 Browse", discover: discoverScreen==="prices"?"D1 Prices":discoverScreen==="weather"?"D2 Weather":discoverScreen==="nearby"?"D3 Nearby":"D4 Schemes", profile:"P1 Profile" }[tab];
  const tabEnterClass = tabDir >= 0 ? "tab-enter-forward" : "tab-enter-backward";

  return (
    <Stage screenAttrs={screenAttrs}>
      <div className="app-body" data-screen-label={screenLabel}>
        {/* Tab content re-mounts on key change to trigger animation. */}
        <div key={tabKey} className={tabEnterClass} style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column" }}>
          {renderTab()}
        </div>

        {/* Modals */}
        {modal?.kind === "detail" && (
          <ModalScreen>
            <ListingDetailScreen listing={modal.listing} listings={listings} onBack={popModal} onMessage={() => { setModal(null); setTimeout(() => handleMessageSeller(modal.listing), 50); }} onOpenListing={(l) => pushModal({ kind: "detail", listing: l })} lang={lang} onToast={showToast} />
          </ModalScreen>
        )}
        {modal?.kind === "post" && (
          <ModalScreen>
            <PostListingScreen onBack={popModal} onPost={handlePost} prefill={modal.prefill} lang={lang} />
          </ModalScreen>
        )}
        {modal?.kind === "notifications" && (
          <ModalScreen>
            <NotificationsScreen notifications={notifications} onBack={popModal} onOpenNotif={handleNotifTap} lang={lang} />
          </ModalScreen>
        )}
        {modal?.kind === "settings" && (
          <ModalScreen>
            <SettingsScreen onBack={popModal} onEditProfile={() => { setModal(null); setTab("profile"); setProfileEditing(true); }} user={user} lang={lang} setLang={(l) => setTweak("lang", l)} theme={theme} setTheme={(t) => setTweak("theme", t)} dark={dark} setDark={(d) => setTweak("dark", d)} density={density} setDensity={(d) => setTweak("density", d)} onLogout={handleLogout} onOpenHelp={() => pushModal({ kind: "help" })} onResetDemo={resetDemo} />
          </ModalScreen>
        )}
        {modal?.kind === "help" && (
          <ModalScreen><HelpScreen onBack={popModal} lang={lang} /></ModalScreen>
        )}
        {modal?.kind === "my-listings" && (
          <ModalScreen>
            <MyListingsScreen myListings={myListings} onBack={popModal} onOpenListing={openListing} onPostListing={(prefill) => pushModal({ kind: "post", prefill })} lang={lang} />
          </ModalScreen>
        )}
        {modal?.kind === "dashboard" && (
          <ModalScreen>
            <DashboardScreen myListings={myListings} orders={orders} onBack={popModal} onOpenListing={openListing} onPostListing={(mode) => pushModal({ kind: "post", prefill: { mode: mode || "listing" } })} lang={lang} />
          </ModalScreen>
        )}
        {modal?.kind === "inquiries" && (
          <ModalScreen>
            <InquiriesScreen inquiries={inquiries} onBack={popModal} initialTab={modal.which} openInquiry={modal.inquiryId} onOpenListing={openListing} lang={lang} />
          </ModalScreen>
        )}

        {/* Toast stack */}
        {toasts.map((t, i) => (
          <div key={t.id} style={{ position:"absolute", top: 60 + i * 56, left:16, right:16, zIndex:80, pointerEvents:"none" }}>
            <Toast message={t.msg} icon={t.icon} onClose={() => setToasts(ts => ts.filter(x => x.id !== t.id))} />
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="relative grid grid-cols-4 bg-[var(--surface)] border-t border-[var(--border)] flex-shrink-0 pt-1 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        {/* Sliding indicator */}
        <div className="tab-indicator" style={{ left: `${TAB_ORDER.indexOf(tab) * 25}%` }} />

        {[
          { id: "home",     icon: "home",    label: T[lang]?.["tab.home"]     || "Home"     },
          { id: "browse",   icon: "grid",    label: T[lang]?.["tab.browse"]   || "Browse"   },
          { id: "discover", icon: "compass", label: T[lang]?.["tab.discover"] || "Discover" },
          { id: "profile",  icon: "user",    label: T[lang]?.["tab.profile"]  || "Profile"  },
        ].map(item => (
          <button 
            key={item.id} 
            className={`flex flex-col items-center justify-center gap-0.5 h-12 text-[10px] font-bold tracking-wide transition-colors cursor-pointer ${
              tab === item.id 
                ? "text-[var(--primary)]" 
                : "text-[var(--ink-3)] hover:text-[var(--ink-2)]"
            }`} 
            onClick={() => setTab(item.id)}
          >
            <div className="relative flex items-center justify-center">
              <Icon name={item.icon} size={22} stroke={tab === item.id ? 2 : 1.6} />
              {item.id === "profile" && unreadNotifs > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 bg-[var(--terra)] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--surface)]">
                  {unreadNotifs}
                </span>
              )}
            </div>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {tweaksOpen && <TweaksUI tweaks={tweaks} setTweak={setTweak} onClose={() => setTweaksOpen(false)} />}
    </Stage>
  );
}

// ===== Stage wrapper =====
const Stage = ({ children, screenAttrs }) => (
  <div id="stage">
    <div className="phone-frame">
      <div className="phone-screen" {...screenAttrs}>
        {children}
      </div>
    </div>
  </div>
);

// ===== Modal screen overlay =====
const ModalScreen = ({ children }) => (
  <div style={{ position:"absolute", inset:0, background:"var(--bg)", zIndex:40, display:"flex", flexDirection:"column" }} className="modal-enter">
    {children}
  </div>
);

const LoadingScreen = () => (
  <div style={{ height:"100%", display:"grid", placeItems:"center", padding:24, textAlign:"center" }}>
    <div>
      <div style={{ fontFamily:"var(--font-display)", fontSize:30 }}>AnnadathaBazar</div>
      <div style={{ color:"var(--ink-3)", fontSize:13, marginTop:8 }}>Loading your production account.</div>
    </div>
  </div>
);

// ===== Discover wrapper =====
const DiscoverWrapper = ({ screen, setScreen, user, listings, marketPrices, marketPricesState, weather, updates, updatesState, onOpenListing, nearbyInitialCat = "all", onRetryMarket, onToast, lang }) => (
  <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
    <div style={{ padding:"8px 16px 0", background:"var(--bg)", borderBottom:"1px solid var(--border)" }}>
      <div className="segmented" style={{ background:"var(--surface-2)" }}>
        <button className={screen==="prices"  ? "active" : ""} onClick={() => setScreen("prices")}>Prices</button>
        <button className={screen==="weather" ? "active" : ""} onClick={() => setScreen("weather")}>Weather</button>
        <button className={screen==="nearby"  ? "active" : ""} onClick={() => setScreen("nearby")}>Nearby</button>
        <button className={screen==="schemes" ? "active" : ""} onClick={() => setScreen("schemes")}>Schemes</button>
      </div>
    </div>
    <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
      {screen==="prices"  && <PricesScreen  user={user} prices={marketPrices} state={marketPricesState} onRetry={onRetryMarket} onToast={onToast} lang={lang} />}
      {screen==="weather" && <WeatherScreen weather={weather} lang={lang} />}
      {screen==="nearby"  && <NearbyScreen  user={user} listings={listings} onOpenListing={onOpenListing} initialCategory={nearbyInitialCat} lang={lang} />}
      {screen==="schemes" && <SchemesScreen user={user} initialUpdates={updates} initialState={updatesState} lang={lang} />}
    </div>
  </div>
);


// ===== Tweaks UI =====
const TweaksUI = ({ tweaks, setTweak, onClose }) => (
  <TweaksPanel onClose={onClose} title="Tweaks">
    <TweakSection title="Theme">
      <TweakRadio label="Mode" value={tweaks.dark ? "dark" : "light"} onChange={(v) => setTweak("dark", v === "dark")} options={[{ value:"light", label:"Light" }, { value:"dark", label:"Dark" }]} />
      <TweakColor label="Accent" value={tweaks.theme} onChange={(v) => setTweak("theme", v)} options={[{ value:"default", color:"#1F5A3A" }, { value:"terra", color:"#B05E2E" }, { value:"indigo", color:"#2E4A7F" }]} />
    </TweakSection>
    <TweakSection title="Language">
      <TweakSelect label="UI language" value={tweaks.lang} onChange={(v) => setTweak("lang", v)} options={[{ value:"en", label:"English" }, { value:"hi", label:"Hindi (translation pending)" }]} />
    </TweakSection>
    <TweakSection title="Layout">
      <TweakRadio label="Density" value={tweaks.density} onChange={(v) => setTweak("density", v)} options={[{ value:"comfortable", label:"Comfort" }, { value:"compact", label:"Compact" }]} />
    </TweakSection>
  </TweaksPanel>
);

export default App;

