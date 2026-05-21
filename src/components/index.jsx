import React from 'react';
import { Icon } from '../icons/Icon.jsx';

// ===== AnnadathaBazar â€” Shared Components =====

const { useState, useEffect, useRef, useMemo } = React;

// ---------- i18n ----------
const T = {
  en: {
    "app.name": "AnnadathaBazar",
    "greeting.morning": "Good morning",
    "greeting.day": "Good day",
    "greeting.evening": "Good evening",
    "tab.home": "Home", "tab.browse": "Browse", "tab.discover": "Discover", "tab.profile": "Profile",
    "home.weather": "Weather", "home.prices": "Mandi Prices", "home.actions.post": "Post Listing",
    "home.actions.browse": "Browse", "home.actions.nearby": "Nearby", "home.actions.prices": "Prices",
    "home.near": "Near You", "home.matching": "Matching Your Crops", "home.recent": "All Recent",
    "browse.title": "Browse", "browse.search": "Search crops, services, equipmentâ€¦",
    "browse.cat.all": "All", "browse.results": "listings",
    "sort.nearest": "Nearest", "sort.newest": "Newest", "sort.priceAsc": "Price â†‘", "sort.priceDesc": "Price â†“",
    "post.title": "Post a Listing", "post.submit": "Post Listing", "post.draft": "Saving draftâ€¦",
    "listing.message": "Message Seller", "listing.whatsapp": "WhatsApp", "listing.show": "Show Contact",
    "listing.similar": "Similar Listings", "listing.posted": "Posted",
    "prices.title": "Mandi Prices",
    "weather.title": "Weather",
    "nearby.title": "Nearby Services",
    "profile.title": "Profile", "profile.edit": "Edit Profile", "profile.share": "Share Profile",
    "profile.logout": "Logout",
    "myListings.title": "My Listings", "inquiries.title": "Inquiries",
    "notifs.title": "Notifications", "notifs.markAll": "Mark all read", "notifs.empty": "All caught up!",
    "settings.title": "Settings", "help.title": "Help",
    "common.back": "Back", "common.next": "Next", "common.cancel": "Cancel",
    "common.save": "Save", "common.send": "Send", "common.km": "km", "common.away": "away",
    "auth.signup": "Get Started", "auth.phone": "Phone Number",
    "auth.terms": "I agree to the Terms of Service and Privacy Policy",
    "auth.sendOtp": "Send OTP",
    "auth.otp.title": "Verify Phone",
    "auth.otp.sub": "Enter the 6-digit code sent to",
    "auth.otp.resend": "Resend code in", "auth.otp.voice": "Get code by voice call",
    "auth.profile.title": "Tell us about yourself",
    "auth.profile.name": "Your Name",
    "auth.profile.village": "Village / Town",
    "auth.profile.district": "District",
    "auth.profile.state": "State",
    "auth.profile.crops": "Crops you grow",
    "auth.profile.cropSub": "Pick what you grow. We'll show matching listings.",
    "auth.profile.finish": "Continue",
    "auth.profile.skip": "Fill later",
  },
  hi: {
    "app.name": "à¤…à¤¨à¥à¤¨à¤¦à¤¾à¤¤à¤¾ à¤¬à¤¾à¤œà¤¼à¤¾à¤°",
    "greeting.morning": "à¤¸à¥à¤ªà¥à¤°à¤­à¤¾à¤¤",
    "greeting.day": "à¤¨à¤®à¤¸à¥à¤¤à¥‡",
    "greeting.evening": "à¤¶à¥à¤­ à¤¸à¤‚à¤§à¥à¤¯à¤¾",
    "tab.home": "à¤¹à¥‹à¤®", "tab.browse": "à¤–à¥‹à¤œà¥‡à¤‚", "tab.discover": "à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€", "tab.profile": "à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤²",
    "home.weather": "à¤®à¥Œà¤¸à¤®", "home.prices": "à¤®à¤‚à¤¡à¥€ à¤­à¤¾à¤µ", "home.actions.post": "à¤²à¤¿à¤¸à¥à¤Ÿà¤¿à¤‚à¤— à¤¡à¤¾à¤²à¥‡à¤‚",
    "home.actions.browse": "à¤–à¥‹à¤œà¥‡à¤‚", "home.actions.nearby": "à¤†à¤¸-à¤ªà¤¾à¤¸", "home.actions.prices": "à¤­à¤¾à¤µ",
    "home.near": "à¤†à¤ªà¤•à¥‡ à¤ªà¤¾à¤¸", "home.matching": "à¤†à¤ªà¤•à¥€ à¤«à¤¼à¤¸à¤²à¥‡à¤‚", "home.recent": "à¤¨à¤ˆ à¤²à¤¿à¤¸à¥à¤Ÿà¤¿à¤‚à¤—",
    "browse.title": "à¤–à¥‹à¤œà¥‡à¤‚", "browse.search": "à¤«à¤¼à¤¸à¤², à¤¸à¥‡à¤µà¤¾, à¤‰à¤ªà¤•à¤°à¤£ à¤–à¥‹à¤œà¥‡à¤‚â€¦",
    "browse.cat.all": "à¤¸à¤­à¥€", "browse.results": "à¤²à¤¿à¤¸à¥à¤Ÿà¤¿à¤‚à¤—",
    "sort.nearest": "à¤¨à¤œà¤¼à¤¦à¥€à¤•à¥€", "sort.newest": "à¤¨à¤ˆ", "sort.priceAsc": "à¤­à¤¾à¤µ â†‘", "sort.priceDesc": "à¤­à¤¾à¤µ â†“",
    "post.title": "à¤¨à¤ˆ à¤²à¤¿à¤¸à¥à¤Ÿà¤¿à¤‚à¤—", "post.submit": "à¤ªà¥‹à¤¸à¥à¤Ÿ à¤•à¤°à¥‡à¤‚", "post.draft": "à¤¡à¥à¤°à¤¾à¤«à¥à¤Ÿ à¤¸à¤¹à¥‡à¤œà¤¾â€¦",
    "listing.message": "à¤¸à¤‚à¤¦à¥‡à¤¶ à¤­à¥‡à¤œà¥‡à¤‚", "listing.whatsapp": "à¤µà¥à¤¹à¤¾à¤Ÿà¥à¤¸à¤à¤ª", "listing.show": "à¤¨à¤‚à¤¬à¤° à¤¦à¥‡à¤–à¥‡à¤‚",
    "listing.similar": "à¤à¤¸à¥€ à¤¹à¥€ à¤²à¤¿à¤¸à¥à¤Ÿà¤¿à¤‚à¤—", "listing.posted": "à¤ªà¥‹à¤¸à¥à¤Ÿ à¤•à¤¿à¤¯à¤¾",
    "prices.title": "à¤®à¤‚à¤¡à¥€ à¤­à¤¾à¤µ",
    "weather.title": "à¤®à¥Œà¤¸à¤®",
    "nearby.title": "à¤†à¤¸-à¤ªà¤¾à¤¸ à¤¸à¥‡à¤µà¤¾à¤à¤",
    "profile.title": "à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤²", "profile.edit": "à¤¬à¤¦à¤²à¥‡à¤‚", "profile.share": "à¤¶à¥‡à¤¯à¤° à¤•à¤°à¥‡à¤‚",
    "profile.logout": "à¤²à¥‰à¤— à¤†à¤‰à¤Ÿ",
    "myListings.title": "à¤®à¥‡à¤°à¥€ à¤²à¤¿à¤¸à¥à¤Ÿà¤¿à¤‚à¤—", "inquiries.title": "à¤ªà¥‚à¤›à¤¤à¤¾à¤›",
    "notifs.title": "à¤¸à¥‚à¤šà¤¨à¤¾à¤à¤", "notifs.markAll": "à¤¸à¤­à¥€ à¤ªà¤¢à¤¼à¥‡", "notifs.empty": "à¤¸à¤¬ à¤¦à¥‡à¤– à¤²à¤¿à¤¯à¤¾!",
    "settings.title": "à¤¸à¥‡à¤Ÿà¤¿à¤‚à¤—à¥à¤¸", "help.title": "à¤®à¤¦à¤¦",
    "common.back": "à¤µà¤¾à¤ªà¤¸", "common.next": "à¤†à¤—à¥‡", "common.cancel": "à¤°à¤¦à¥à¤¦",
    "common.save": "à¤¸à¤¹à¥‡à¤œà¥‡à¤‚", "common.send": "à¤­à¥‡à¤œà¥‡à¤‚", "common.km": "à¤•à¤¿à¤®à¥€", "common.away": "à¤¦à¥‚à¤°",
    "auth.signup": "à¤¶à¥à¤°à¥‚ à¤•à¤°à¥‡à¤‚", "auth.phone": "à¤®à¥‹à¤¬à¤¾à¤‡à¤² à¤¨à¤‚à¤¬à¤°",
    "auth.terms": "à¤®à¥ˆà¤‚ à¤¨à¤¿à¤¯à¤®à¥‹à¤‚ à¤¸à¥‡ à¤¸à¤¹à¤®à¤¤ à¤¹à¥‚à¤",
    "auth.sendOtp": "OTP à¤­à¥‡à¤œà¥‡à¤‚",
    "auth.otp.title": "à¤¨à¤‚à¤¬à¤° à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤ à¤•à¤°à¥‡à¤‚",
    "auth.otp.sub": "6-à¤…à¤‚à¤•à¥€à¤¯ à¤•à¥‹à¤¡ à¤­à¥‡à¤œà¤¾ à¤—à¤¯à¤¾",
    "auth.otp.resend": "à¤¨à¤¯à¤¾ à¤•à¥‹à¤¡", "auth.otp.voice": "à¤•à¥‰à¤² à¤ªà¤° à¤•à¥‹à¤¡ à¤ªà¤¾à¤à¤",
    "auth.profile.title": "à¤…à¤ªà¤¨à¥‡ à¤¬à¤¾à¤°à¥‡ à¤®à¥‡à¤‚ à¤¬à¤¤à¤¾à¤à¤",
    "auth.profile.name": "à¤†à¤ªà¤•à¤¾ à¤¨à¤¾à¤®",
    "auth.profile.village": "à¤—à¤¾à¤à¤µ / à¤¶à¤¹à¤°",
    "auth.profile.district": "à¤œà¤¼à¤¿à¤²à¤¾",
    "auth.profile.state": "à¤°à¤¾à¤œà¥à¤¯",
    "auth.profile.crops": "à¤†à¤ª à¤•à¥à¤¯à¤¾ à¤‰à¤—à¤¾à¤¤à¥‡ à¤¹à¥ˆà¤‚",
    "auth.profile.cropSub": "à¤…à¤ªà¤¨à¥€ à¤«à¤¼à¤¸à¤²à¥‡à¤‚ à¤šà¥à¤¨à¥‡à¤‚à¥¤",
    "auth.profile.finish": "à¤œà¤¾à¤°à¥€ à¤°à¤–à¥‡à¤‚",
    "auth.profile.skip": "à¤¬à¤¾à¤¦ à¤®à¥‡à¤‚ à¤•à¤°à¥‡à¤‚",
  },
};

const useT = (lang = "en") => (key) => (T[lang] && T[lang][key]) || T.en[key] || key;

// ---------- format helpers ----------
const formatINR = (n) => {
  if (n == null) return "â€”";
  const s = Math.round(n).toString();
  if (s.length <= 3) return "â‚¹" + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const withCommas = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return "â‚¹" + withCommas + "," + last3;
};

const formatDistance = (km) => km === 0 ? "Your village" : `${km} km away`;

// ---------- StatusBar ----------
const StatusBar = () => {
  const [time, setTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setTime(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    }, 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="status-bar">
      <span>{time}</span>
      <div className="right">
        {/* signal */}
        <svg width="16" height="11" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2" width="3" height="10" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
        <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 2 }}>4G</span>
        {/* battery */}
        <svg width="26" height="12" viewBox="0 0 28 12" fill="none" style={{ marginLeft: 4 }}><rect x="0.5" y="0.5" width="23" height="11" rx="3" stroke="currentColor" /><rect x="2" y="2" width="18" height="8" rx="1.5" fill="currentColor" /><rect x="24" y="3.5" width="2" height="5" rx="1" fill="currentColor" /></svg>
      </div>
    </div>
  );
};

// ---------- Top Bar ----------
const TopBar = ({ title, onBack, right, brand, withBorder }) => (
  <div className={`topbar${withBorder ? " with-border" : ""}${brand ? " brand" : ""}`}>
    {onBack && (
      <button className="icon-btn" onClick={onBack} aria-label="back">
        <Icon name="back" size={22} />
      </button>
    )}
    {brand ? (
      <div className="brand-name" style={{ flex: 1 }}>
        Annadata<span className="leaf">Â·</span>Bazar
      </div>
    ) : (
      <div className="title">{title}</div>
    )}
    {right}
  </div>
);

// ---------- Buttons ----------
const Button = ({ children, variant = "primary", icon, onClick, full, size, disabled, style }) => {
  const cls = `btn${variant === "secondary" ? " secondary" : ""}${variant === "ghost" ? " ghost" : ""}${variant === "whatsapp" ? " whatsapp" : ""}${variant === "danger" ? " danger" : ""}${full ? " full" : ""}${size === "sm" ? " sm" : ""}`;
  return (
    <button className={cls} onClick={onClick} disabled={disabled} style={style}>
      {icon && <Icon name={icon} size={size === "sm" ? 16 : 18} />}
      {children}
    </button>
  );
};

// ---------- Avatar ----------
const Avatar = ({ name, size = "md", src }) => {
  const initials = name ? name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase() : "?";
  return <div className={`avatar ${size}`}>{src ? <img src={src} alt={name} /> : initials}</div>;
};

// ---------- Image placeholder ----------
const ImgPh = ({ category = "other", label, style, className }) => (
  <div className={`img-ph ${category} ${className || ""}`} style={style}>
    <span>{label}</span>
  </div>
);

// ---------- Listing Card ----------
const ListingCard = ({ listing, onClick, variant = "grid" }) => {
  const photoLabel = (listing.photos && listing.photos[0]) || "photo";
  if (variant === "row") {
    return (
      <div className="listing-card row" onClick={onClick}>
        <ImgPh category={listing.category} label={photoLabel.split(" ").slice(0, 3).join(" ")} />
        <div className="body">
          <div className="title">{listing.title}</div>
          <div className="meta">
            <Icon name="pin" size={11} />
            <span>{listing.village} Â· {formatDistance(listing.distance)}</span>
          </div>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div className="price">{formatINR(listing.price)}<small>/{listing.priceUnit}</small></div>
            {listing.tags && listing.tags[0] && <span className="chip sm gold">{listing.tags[0]}</span>}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="listing-card" onClick={onClick}>
      <ImgPh category={listing.category} label={photoLabel} className="photo" />
      <div className="body">
        <div className="title">{listing.title}</div>
        <div className="price">{formatINR(listing.price)}<small>/{listing.priceUnit}</small></div>
        <div className="meta">
          <Icon name="pin" size={11} />
          <span>{listing.village} Â· {formatDistance(listing.distance)}</span>
        </div>
      </div>
    </div>
  );
};

// ---------- Weather Icon ----------
const WeatherIcon = ({ name, size = 36 }) => {
  const map = { "sunny": "sun", "partly-cloudy": "partlyCloudy", "cloudy": "cloud", "rain": "rain" };
  return <Icon name={map[name] || "sun"} size={size} stroke={1.6} />;
};

// ---------- Toast ----------
const Toast = ({ message, icon, onClose }) => {
  useEffect(() => {
    const id = setTimeout(onClose, 2400);
    return () => clearTimeout(id);
  }, [onClose]);
  return (
    <div className="toast">
      {icon && <Icon name={icon} size={18} color="#9DD5A5" />}
      <span style={{ flex: 1 }}>{message}</span>
    </div>
  );
};

// ---------- Sheet ----------
const Sheet = ({ open, onClose, children, title }) => {
  if (!open) return null;
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        {title && <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 14 }}>{title}</div>}
        {children}
      </div>
    </>
  );
};

// ---------- Empty State ----------
const Empty = ({ icon = "info", title, body, action }) => (
  <div style={{ padding: "48px 28px", textAlign: "center" }}>
    <div style={{
      width: 72, height: 72, borderRadius: 999, margin: "0 auto 16px",
      background: "var(--surface-2)", display: "grid", placeItems: "center", color: "var(--ink-3)"
    }}>
      <Icon name={icon} size={32} stroke={1.6} />
    </div>
    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.5, marginBottom: 16, textWrap: "pretty" }}>{body}</div>
    {action}
  </div>
);

// ---------- Skeleton ----------
const Skel = ({ w = "100%", h = 16, r = 8, style }) => (
  <div className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

// ---------- Animated number (count-up) ----------
const AnimatedNumber = ({ value, duration = 800, format = (n) => Math.round(n), style, className }) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <span style={style} className={className}>{format(display)}</span>;
};

export { T, useT, formatINR, formatDistance, StatusBar, TopBar, Button, Avatar, ImgPh, ListingCard, WeatherIcon, Toast, Sheet, Empty, Skel, AnimatedNumber };

