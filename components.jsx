// ===== AnnadathaBazar — Shared Components =====

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
    "browse.title": "Browse", "browse.search": "Search crops, services, equipment…",
    "browse.cat.all": "All", "browse.results": "listings",
    "sort.nearest": "Nearest", "sort.newest": "Newest", "sort.priceAsc": "Price ↑", "sort.priceDesc": "Price ↓",
    "post.title": "Post a Listing", "post.submit": "Post Listing", "post.draft": "Saving draft…",
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
    "app.name": "अन्नदाता बाज़ार",
    "greeting.morning": "सुप्रभात",
    "greeting.day": "नमस्ते",
    "greeting.evening": "शुभ संध्या",
    "tab.home": "होम", "tab.browse": "खोजें", "tab.discover": "जानकारी", "tab.profile": "प्रोफ़ाइल",
    "home.weather": "मौसम", "home.prices": "मंडी भाव", "home.actions.post": "लिस्टिंग डालें",
    "home.actions.browse": "खोजें", "home.actions.nearby": "आस-पास", "home.actions.prices": "भाव",
    "home.near": "आपके पास", "home.matching": "आपकी फ़सलें", "home.recent": "नई लिस्टिंग",
    "browse.title": "खोजें", "browse.search": "फ़सल, सेवा, उपकरण खोजें…",
    "browse.cat.all": "सभी", "browse.results": "लिस्टिंग",
    "sort.nearest": "नज़दीकी", "sort.newest": "नई", "sort.priceAsc": "भाव ↑", "sort.priceDesc": "भाव ↓",
    "post.title": "नई लिस्टिंग", "post.submit": "पोस्ट करें", "post.draft": "ड्राफ्ट सहेजा…",
    "listing.message": "संदेश भेजें", "listing.whatsapp": "व्हाट्सऐप", "listing.show": "नंबर देखें",
    "listing.similar": "ऐसी ही लिस्टिंग", "listing.posted": "पोस्ट किया",
    "prices.title": "मंडी भाव",
    "weather.title": "मौसम",
    "nearby.title": "आस-पास सेवाएँ",
    "profile.title": "प्रोफ़ाइल", "profile.edit": "बदलें", "profile.share": "शेयर करें",
    "profile.logout": "लॉग आउट",
    "myListings.title": "मेरी लिस्टिंग", "inquiries.title": "पूछताछ",
    "notifs.title": "सूचनाएँ", "notifs.markAll": "सभी पढ़े", "notifs.empty": "सब देख लिया!",
    "settings.title": "सेटिंग्स", "help.title": "मदद",
    "common.back": "वापस", "common.next": "आगे", "common.cancel": "रद्द",
    "common.save": "सहेजें", "common.send": "भेजें", "common.km": "किमी", "common.away": "दूर",
    "auth.signup": "शुरू करें", "auth.phone": "मोबाइल नंबर",
    "auth.terms": "मैं नियमों से सहमत हूँ",
    "auth.sendOtp": "OTP भेजें",
    "auth.otp.title": "नंबर सत्यापित करें",
    "auth.otp.sub": "6-अंकीय कोड भेजा गया",
    "auth.otp.resend": "नया कोड", "auth.otp.voice": "कॉल पर कोड पाएँ",
    "auth.profile.title": "अपने बारे में बताएँ",
    "auth.profile.name": "आपका नाम",
    "auth.profile.village": "गाँव / शहर",
    "auth.profile.district": "ज़िला",
    "auth.profile.state": "राज्य",
    "auth.profile.crops": "आप क्या उगाते हैं",
    "auth.profile.cropSub": "अपनी फ़सलें चुनें।",
    "auth.profile.finish": "जारी रखें",
    "auth.profile.skip": "बाद में करें",
  },
};

const useT = (lang = "en") => (key) => (T[lang] && T[lang][key]) || T.en[key] || key;

// ---------- format helpers ----------
const formatINR = (n) => {
  if (n == null) return "—";
  const s = Math.round(n).toString();
  if (s.length <= 3) return "₹" + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const withCommas = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return "₹" + withCommas + "," + last3;
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
        Annadatha<span className="leaf">Bazar</span>
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
            <span>{listing.village} · {formatDistance(listing.distance)}</span>
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
          <span>{listing.village} · {formatDistance(listing.distance)}</span>
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

Object.assign(window, {
  T, useT, formatINR, formatDistance,
  StatusBar, TopBar, Button, Avatar, ImgPh, ListingCard, WeatherIcon,
  Toast, Sheet, Empty, Skel, AnimatedNumber,
});
