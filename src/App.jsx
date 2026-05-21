import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AGRI_DATA } from './data.js';
import { Icon } from './icons/Icon.jsx';
import { T, StatusBar, TopBar, Toast, useT } from './components/index.jsx';
import { TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakSelect } from './tweaks/TweaksPanel.jsx';
import { SignupScreen, OtpScreen, ProfileSetupScreen } from './screens/AuthScreens.jsx';
import { HomeScreen } from './screens/HomeScreen.jsx';
import { BrowseScreen, ListingDetailScreen, PostListingScreen } from './screens/BrowseScreen.jsx';
import { PricesScreen, WeatherScreen, NearbyScreen } from './screens/DiscoverScreen.jsx';
import { ProfileScreen, MyListingsScreen, InquiriesScreen } from './screens/ProfileScreen.jsx';
import { DashboardScreen } from './screens/DashboardScreen.jsx';
import { NotificationsScreen, SettingsScreen, HelpScreen } from './screens/UtilityScreens.jsx';
// â”€â”€ localStorage helpers â”€â”€
const LS = {
  get: (k, def) => { try { const v = localStorage.getItem("agri_" + k); return v == null ? def : JSON.parse(v); } catch { return def; } },
  set: (k, v)   => { try { localStorage.setItem("agri_" + k, JSON.stringify(v)); } catch {} },
};

const TAB_ORDER = ["home", "browse", "discover", "profile"];

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
    "data-theme":   dark ? "dark" : theme,
    "data-density": density,
  }), [dark, theme, density]);

  // ===== App state =====
  const [session, setSession]         = useState({ stage: "app", phone: "" });
  const [user, setUser]               = useState(AGRI_DATA.USERS.find(u => u.isMe));
  const [listings]                    = useState(AGRI_DATA.LISTINGS);
  const [myListings, setMyListings]   = useState(AGRI_DATA.MY_LISTINGS);
  const [orders, setOrders]           = useState(AGRI_DATA.ORDERS);
  const [inquiries, setInquiries]     = useState(AGRI_DATA.INQUIRIES);
  const [notifications, setNotifications] = useState(AGRI_DATA.NOTIFICATIONS);

  const unreadNotifs = notifications.filter(n => n.unread).length;

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
  const [modal, setModal]   = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = (msg, icon = "check") => {
    const id = Date.now();
    setToasts(ts => [...ts, { id, msg, icon }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 2600);
  };

  // â”€â”€ Navigation helpers â”€â”€
  const openListing  = (l) => { const listing = typeof l === "string" ? [...listings, ...myListings].find(x => x.id === l) : l; if (listing) setModal({ kind: "detail", listing }); };
  const openPost     = (prefill) => { if (typeof prefill === "string") prefill = { mode: prefill }; setModal({ kind: "post", prefill }); };
  const openNotifs   = () => setModal({ kind: "notifications" });
  const openSettings = () => setModal({ kind: "settings" });
  const openHelp     = () => setModal({ kind: "help" });
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
        toUser: listing.userId, fromName: AGRI_DATA.USERS.find(u => u.id === listing.userId)?.name || "Seller",
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

  const handlePost = (data) => {
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

  const handleLogout = () => { setModal(null); setSession({ stage: "signup", phone: "" }); };

  const resetDemo = () => {
    setMyListings(AGRI_DATA.MY_LISTINGS);
    setOrders(AGRI_DATA.ORDERS);
    setInquiries(AGRI_DATA.INQUIRIES);
    setNotifications(AGRI_DATA.NOTIFICATIONS);
    setModal(null);
    showToast("Demo reset", "refresh");
  };

  // ===== Auth flow =====
  if (session.stage !== "app") {
    return (
      <Stage screenAttrs={screenAttrs}>
        {session.stage === "signup" && (
          <SignupScreen onNext={(phone) => setSession({ stage: "otp", phone })} onSkip={() => setSession({ stage: "app" })} lang={lang} setLang={(l) => setTweak("lang", l)} />
        )}
        {session.stage === "otp" && (
          <OtpScreen phone={session.phone} onVerify={(phone, isNew) => setSession({ stage: isNew ? "profile-setup" : "app", phone })} onBack={() => setSession({ stage: "signup", phone: "" })} lang={lang} />
        )}
        {session.stage === "profile-setup" && (
          <ProfileSetupScreen onFinish={(data) => { setUser({ ...user, ...data, joined: "May 2026" }); setSession({ stage: "app" }); showToast("Welcome to AnnadathaBazar!", "check"); }} lang={lang} />
        )}
        {tweaksOpen && <TweaksUI tweaks={tweaks} setTweak={setTweak} onClose={() => setTweaksOpen(false)} />}
      </Stage>
    );
  }

  // ===== Main app =====
  const renderTab = () => {
    switch (tab) {
      case "home":    return <HomeScreen    user={user} listings={listings} onOpenListing={openListing} onNavTab={handleNavTab} onOpenNotifs={openNotifs} unreadNotifs={unreadNotifs} onPostListing={(mode) => openPost(mode || "listing")} lang={lang} />;
      case "browse":  return <BrowseScreen  listings={listings} onOpenListing={openListing} onPostListing={() => openPost()} initialCategory={browseInitialCat} lang={lang} />;
      case "discover":return <DiscoverWrapper screen={discoverScreen} setScreen={setDiscoverScreen} user={user} listings={listings} onOpenListing={openListing} nearbyInitialCat={nearbyInitialCat} lang={lang} />;
      case "profile": return <ProfileScreen  user={user} myListings={myListings} inquiries={inquiries} orders={orders} onOpenSettings={openSettings} onOpenListings={openMyListings} onOpenDashboard={openDashboard} onOpenInquiries={openInquiries} onLogout={handleLogout} lang={lang} />;
      default: return null;
    }
  };

  const screenLabel = { home:"H1 Home", browse:"B1 Browse", discover: discoverScreen==="prices"?"D1 Prices":discoverScreen==="weather"?"D2 Weather":"D3 Nearby", profile:"P1 Profile" }[tab];
  const tabEnterClass = tabDir >= 0 ? "tab-enter-forward" : "tab-enter-backward";

  return (
    <Stage screenAttrs={screenAttrs}>
      <div className="app-body" data-screen-label={screenLabel}>
        {/* Tab content â€” re-mounts on key change to trigger animation */}
        <div key={tabKey} className={tabEnterClass} style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column" }}>
          {renderTab()}
        </div>

        {/* Modals */}
        {modal?.kind === "detail" && (
          <ModalScreen>
            <ListingDetailScreen listing={modal.listing} listings={listings} onBack={() => setModal(null)} onMessage={() => { setModal(null); setTimeout(() => handleMessageSeller(modal.listing), 50); }} onOpenListing={(l) => setModal({ kind: "detail", listing: l })} lang={lang} onToast={showToast} />
          </ModalScreen>
        )}
        {modal?.kind === "post" && (
          <ModalScreen>
            <PostListingScreen onBack={() => setModal(null)} onPost={handlePost} prefill={modal.prefill} lang={lang} />
          </ModalScreen>
        )}
        {modal?.kind === "notifications" && (
          <ModalScreen>
            <NotificationsScreen notifications={notifications} onBack={() => setModal(null)} onOpenNotif={handleNotifTap} lang={lang} />
          </ModalScreen>
        )}
        {modal?.kind === "settings" && (
          <ModalScreen>
            <SettingsScreen onBack={() => setModal(null)} user={user} lang={lang} setLang={(l) => setTweak("lang", l)} theme={theme} setTheme={(t) => setTweak("theme", t)} dark={dark} setDark={(d) => setTweak("dark", d)} density={density} setDensity={(d) => setTweak("density", d)} onLogout={handleLogout} onOpenHelp={() => setModal({ kind: "help" })} onResetDemo={resetDemo} />
          </ModalScreen>
        )}
        {modal?.kind === "help" && (
          <ModalScreen><HelpScreen onBack={() => setModal(null)} lang={lang} /></ModalScreen>
        )}
        {modal?.kind === "my-listings" && (
          <ModalScreen>
            <MyListingsScreen myListings={myListings} onBack={() => setModal(null)} onOpenListing={openListing} onPostListing={(prefill) => setModal({ kind: "post", prefill })} lang={lang} />
          </ModalScreen>
        )}
        {modal?.kind === "dashboard" && (
          <ModalScreen>
            <DashboardScreen myListings={myListings} orders={orders} onBack={() => setModal(null)} onOpenListing={openListing} onPostListing={(mode) => setModal({ kind: "post", prefill: { mode: mode || "listing" } })} lang={lang} />
          </ModalScreen>
        )}
        {modal?.kind === "inquiries" && (
          <ModalScreen>
            <InquiriesScreen inquiries={inquiries} onBack={() => setModal(null)} initialTab={modal.which} openInquiry={modal.inquiryId} onOpenListing={openListing} lang={lang} />
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
      <div className="tabbar">
        {/* Sliding indicator */}
        <div className="tab-indicator" style={{ left: `${TAB_ORDER.indexOf(tab) * 25}%` }} />

        {[
          { id: "home",     icon: "home",    label: T[lang]?.["tab.home"]     || "Home"     },
          { id: "browse",   icon: "grid",    label: T[lang]?.["tab.browse"]   || "Browse"   },
          { id: "discover", icon: "compass", label: T[lang]?.["tab.discover"] || "Discover" },
          { id: "profile",  icon: "user",    label: T[lang]?.["tab.profile"]  || "Profile"  },
        ].map(item => (
          <button key={item.id} className={`tab${tab === item.id ? " active" : ""}`} onClick={() => setTab(item.id)}>
            <div className="tab-icon-wrap">
              <Icon name={item.icon} size={22} stroke={tab === item.id ? 2 : 1.6} />
              {item.id === "profile" && unreadNotifs > 0 && <span className="badge">{unreadNotifs}</span>}
            </div>
            {item.label}
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
      <div className="phone-notch" />
      <div className="phone-screen" {...screenAttrs}>
        <StatusBar />
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

// ===== Discover wrapper =====
const DiscoverWrapper = ({ screen, setScreen, user, listings, onOpenListing, nearbyInitialCat = "all", lang }) => (
  <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
    <div style={{ padding:"8px 16px 0", background:"var(--bg)", borderBottom:"1px solid var(--border)" }}>
      <div className="segmented" style={{ background:"var(--surface-2)" }}>
        <button className={screen==="prices"  ? "active" : ""} onClick={() => setScreen("prices")}>Prices</button>
        <button className={screen==="weather" ? "active" : ""} onClick={() => setScreen("weather")}>Weather</button>
        <button className={screen==="nearby"  ? "active" : ""} onClick={() => setScreen("nearby")}>Nearby</button>
      </div>
    </div>
    <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
      {screen==="prices"  && <PricesScreen  user={user} lang={lang} />}
      {screen==="weather" && <WeatherScreen user={user} lang={lang} />}
      {screen==="nearby"  && <NearbyScreen  listings={listings} onOpenListing={onOpenListing} initialCategory={nearbyInitialCat} lang={lang} />}
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
      <TweakSelect label="UI language" value={tweaks.lang} onChange={(v) => setTweak("lang", v)} options={[{ value:"en", label:"English" }, { value:"hi", label:"à¤¹à¤¿à¤¨à¥à¤¦à¥€ (Hindi)" }]} />
    </TweakSection>
    <TweakSection title="Layout">
      <TweakRadio label="Density" value={tweaks.density} onChange={(v) => setTweak("density", v)} options={[{ value:"comfortable", label:"Comfort" }, { value:"compact", label:"Compact" }]} />
    </TweakSection>
  </TweaksPanel>
);

export default App;

