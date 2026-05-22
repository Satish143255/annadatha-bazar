import React from 'react';
import { LANGUAGES } from '../referenceData.js';
import { Icon } from '../icons/Icon.jsx';
import { Button, Empty, Sheet, useT } from '../components/index.jsx';

// ===== Utility: U1 Notifications, U2 Settings, U3 Help =====

const { useState: useStateU } = React;

// ---------- U1: Notifications ----------
const NotificationsScreen = ({ notifications: initial, onBack, onOpenNotif, lang }) => {
  const t = useT(lang);
  const [items, setItems] = useStateU(initial);

  const markAll = () => setItems(items.map(n => ({ ...n, unread: false })));
  const handleTap = (n) => {
    setItems(items.map(x => x.id === n.id ? { ...x, unread: false } : x));
    onOpenNotif(n);
  };

  const grouped = items.reduce((acc, n) => {
    acc[n.group] = acc[n.group] || [];
    acc[n.group].push(n);
    return acc;
  }, {});

  const iconFor = (type) => ({
    "new_inquiry": "chat",
    "inquiry_reply": "chat",
    "price_alert": "trendUp",
    "new_nearby_listing": "pin",
    "listing_expiring": "warning",
  })[type] || "bell";

  const colorFor = (type) => ({
    "new_inquiry": "var(--primary)",
    "inquiry_reply": "var(--primary)",
    "price_alert": "var(--gold)",
    "new_nearby_listing": "var(--info)",
    "listing_expiring": "var(--terra)",
  })[type] || "var(--ink-3)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="topbar with-border">
        <button className="icon-btn" onClick={onBack}><Icon name="back" size={22} /></button>
        <div className="title">{t("notifs.title")}</div>
        {items.some(n => n.unread) && (
          <button onClick={markAll} style={{ fontSize: 12, color: "var(--primary)", fontWeight: 500, padding: 8 }}>
            {t("notifs.markAll")}
          </button>
        )}
      </div>

      <div className="scroll">
        {items.length === 0 ? (
          <Empty icon="bell" title={t("notifs.empty")} body="You'll see new inquiries, price alerts, and nearby listings here." />
        ) : (
          Object.entries(grouped).map(([group, list]) => (
            <div key={group}>
              <div style={{ padding: "16px 16px 8px", fontSize: 11, fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {group}
              </div>
              {list.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleTap(n)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "12px 16px",
                    display: "flex", gap: 12, alignItems: "flex-start",
                    background: n.unread ? "rgba(31,90,58,0.04)" : "var(--surface)",
                    borderBottom: "1px solid var(--border)",
                    position: "relative",
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: `${colorFor(n.type)}20`,
                    color: colorFor(n.type),
                    display: "grid", placeItems: "center", flexShrink: 0,
                  }}>
                    <Icon name={iconFor(n.type)} size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: n.unread ? 600 : 500, lineHeight: 1.3 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 4 }}>{n.time}</div>
                  </div>
                  {n.unread && (
                    <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--primary)", marginTop: 8, flexShrink: 0 }} />
                  )}
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ---------- U2: Settings ----------
const SettingsScreen = ({ onBack, user, lang, setLang, theme, setTheme, dark, setDark, density, setDensity, onLogout, onOpenHelp, onResetDemo }) => {
  const t = useT(lang);
  const [langOpen, setLangOpen] = useStateU(false);
  const [logoutConfirm, setLogoutConfirm] = useStateU(false);
  const langName = LANGUAGES.find(l => l.code === lang)?.native || "English";

  const ToggleRow = ({ label, icon, value, onChange, hint }) => (
    <div className="list-row">
      <Icon name={icon} size={18} color="var(--ink-3)" />
      <div style={{ flex: 1 }}>
        <div className="row-label">{label}</div>
        {hint && <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{hint}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 40, height: 24, borderRadius: 999,
          background: value ? "var(--primary)" : "var(--border-strong)",
          position: "relative",
        }}
      >
        <div style={{
          position: "absolute", top: 2, left: value ? 18 : 2,
          width: 20, height: 20, borderRadius: 999, background: "white",
          transition: "left 150ms"
        }} />
      </button>
    </div>
  );

  const NavRow = ({ label, icon, value, onClick, danger }) => (
    <button onClick={onClick} className="list-row" style={{ width: "100%", textAlign: "left", color: danger ? "var(--danger)" : "inherit" }}>
      <Icon name={icon} size={18} color={danger ? "var(--danger)" : "var(--ink-3)"} />
      <span className="row-label" style={{ color: danger ? "var(--danger)" : "inherit" }}>{label}</span>
      {value && <span className="row-meta">{value}</span>}
      {!danger && <Icon name="chevron" size={16} color="var(--ink-3)" />}
    </button>
  );

  const [dataSaver, setDataSaver] = useStateU(false);
  const [hideContact, setHideContact] = useStateU(false);
  const [notif, setNotif] = useStateU({ inquiry: true, price: true, nearby: true, expiring: true });

  const handleNotifToggle = (key, v) => {
    if (v && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setNotif(prev => ({ ...prev, [key]: v }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="topbar with-border">
        <button className="icon-btn" onClick={onBack}><Icon name="back" size={22} /></button>
        <div className="title">{t("settings.title")}</div>
      </div>

      <div className="scroll" style={{ padding: "16px", display: "grid", gap: 16 }}>
        {/* Account */}
        <div>
          <div style={sectionTitleStyle}>Account</div>
          <div className="form-group">
            <NavRow label="Edit Profile" icon="user" value={user.name} onClick={() => {}} />
            <NavRow label="Language" icon="globe" value={langName} onClick={() => setLangOpen(true)} />
            <ToggleRow label="Hide my phone from listings" icon="eye" value={hideContact} onChange={setHideContact} hint="Buyers must request to see number" />
          </div>
        </div>

        {/* Notifications */}
        <div>
          <div style={sectionTitleStyle}>Notifications</div>
          <div className="form-group">
            <ToggleRow label="New inquiries" icon="chat" value={notif.inquiry} onChange={(v) => handleNotifToggle("inquiry", v)} />
            <ToggleRow label="Price alerts" icon="trendUp" value={notif.price} onChange={(v) => handleNotifToggle("price", v)} />
            <ToggleRow label="New nearby listings" icon="pin" value={notif.nearby} onChange={(v) => handleNotifToggle("nearby", v)} />
            <ToggleRow label="Listing expiring" icon="warning" value={notif.expiring} onChange={(v) => handleNotifToggle("expiring", v)} />
          </div>
        </div>

        {/* Appearance */}
        <div>
          <div style={sectionTitleStyle}>Appearance</div>
          <div className="form-group">
            <ToggleRow label="Dark mode" icon="sun" value={dark} onChange={setDark} hint="Saves battery on low-end devices" />
            <div className="list-row">
              <Icon name="image" size={18} color="var(--ink-3)" />
              <span className="row-label">Accent</span>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: "default", color: "#1F5A3A" },
                  { id: "terra", color: "#B05E2E" },
                  { id: "indigo", color: "#2E4A7F" },
                ].map(opt => (
                  <button key={opt.id} onClick={() => setTheme(opt.id)} style={{
                    width: 26, height: 26, borderRadius: 999,
                    background: opt.color,
                    border: theme === opt.id ? "3px solid var(--surface)" : "0",
                    boxShadow: theme === opt.id ? `0 0 0 2px ${opt.color}` : "0 0 0 1px var(--border)",
                  }} />
                ))}
              </div>
            </div>
            <div className="list-row">
              <Icon name="grid" size={18} color="var(--ink-3)" />
              <span className="row-label">Density</span>
              <div className="segmented" style={{ width: 160 }}>
                <button className={density === "comfortable" ? "active" : ""} onClick={() => setDensity("comfortable")}>Comfortable</button>
                <button className={density === "compact" ? "active" : ""} onClick={() => setDensity("compact")}>Compact</button>
              </div>
            </div>
          </div>
        </div>

        {/* App */}
        <div>
          <div style={sectionTitleStyle}>App</div>
          <div className="form-group">
            <ToggleRow label="Data saver mode" icon="download" value={dataSaver} onChange={setDataSaver} hint="Reduces image quality on slow networks" />
            <NavRow label="Clear cache" icon="trash" value="24 MB" onClick={() => {}} />
            <NavRow label="App version" icon="info" value="1.0.2" onClick={() => {}} />
          </div>
        </div>

        {/* Support */}
        <div>
          <div style={sectionTitleStyle}>Support</div>
          <div className="form-group">
            <NavRow label="Help & FAQ" icon="info" onClick={onOpenHelp} />
            <NavRow label="Report a problem" icon="flag" onClick={onOpenHelp} />
            <NavRow label="WhatsApp support" icon="whatsapp" value="+91 98765 00000" onClick={() => {}} />
          </div>
        </div>

        {/* Danger */}
        <div>
          <div style={sectionTitleStyle}>Danger Zone</div>
          <div className="form-group">
            <NavRow label="Reset demo data" icon="refresh" onClick={onResetDemo} />
            <NavRow label="Logout" icon="logout" danger onClick={() => setLogoutConfirm(true)} />
            <NavRow label="Delete account" icon="trash" danger onClick={() => {}} />
          </div>
        </div>

        <div style={{ textAlign: "center", padding: 20, fontSize: 11, color: "var(--ink-4)" }}>
          AnnadathaBazar - v1.0.2 - Made for Indian farmers
        </div>
      </div>

      <Sheet open={langOpen} onClose={() => setLangOpen(false)} title="Choose Language">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              className={`chip${lang === l.code ? " active" : ""}`}
              style={{ height: 48, padding: "0 12px", justifyContent: "flex-start", borderRadius: 12 }}
              onClick={() => { setLang(l.code); setLangOpen(false); }}
            >
              <span style={{ fontWeight: 600 }}>{l.native}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.7 }}>{l.name}</span>
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={logoutConfirm} onClose={() => setLogoutConfirm(false)} title="Logout?">
        <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 18 }}>You'll need to sign in again with your phone number.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" full onClick={() => setLogoutConfirm(false)}>Cancel</Button>
          <Button variant="danger" full onClick={() => { setLogoutConfirm(false); onLogout(); }}>Logout</Button>
        </div>
      </Sheet>
    </div>
  );
};

const sectionTitleStyle = {
  fontSize: 11, fontWeight: 600, color: "var(--ink-3)",
  textTransform: "uppercase", letterSpacing: "0.05em",
  padding: "0 4px 8px"
};

// ---------- U3: Help & Report ----------
const HelpScreen = ({ onBack, lang }) => {
  const t = useT(lang);
  const [openFaq, setOpenFaq] = useStateU(null);
  const [reportOpen, setReportOpen] = useStateU(false);
  const [reportType, setReportType] = useStateU("bug");
  const [reportText, setReportText] = useStateU("");
  const [submitted, setSubmitted] = useStateU(false);

  const faqs = [
    { q: "How do I post a listing?", a: "Tap the green + button on Home or Browse. Pick a category, add a title, set a price, and upload up to 6 photos. Submit and your listing is live for 30 days." },
    { q: "How do I contact a seller?", a: "On any listing detail, tap Message Seller to chat in-app, or WhatsApp to open chat in WhatsApp directly. The seller's phone is hidden until you tap Show Contact." },
    { q: "My listing expired, how do I relist?", a: "Go to Profile, My Listings, Expired, then tap Relist. The form will be pre-filled and you can edit details before posting again." },
    { q: "How do I delete a listing?", a: "Open Profile and My Listings, then tap the trash icon on a listing. Once deleted it cannot be restored." },
    { q: "Is this app free?", a: "Yes. AnnadathaBazar is free to use. We do not take a cut of any transaction; that happens directly between you and the buyer or seller." },
    { q: "How do I change my language?", a: "Open Settings and Language. We support 12 Indian languages including Hindi, Telugu, Kannada, Tamil and Marathi." },
    { q: "How do I report fake listings?", a: "Open the listing, tap the three-dot menu, then Report. We review reports within 24 hours and remove fake listings." },
    { q: "How do I delete my account?", a: "Open Settings, Danger Zone, and Delete Account. This permanently removes your profile and listings." },
  ];

  if (submitted) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div className="topbar with-border">
          <button className="icon-btn" onClick={onBack}><Icon name="back" size={22} /></button>
          <div className="title">Help</div>
        </div>
        <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 88, height: 88, margin: "0 auto 20px",
              background: "var(--primary-soft)", borderRadius: 999,
              display: "grid", placeItems: "center", color: "var(--primary)"
            }}>
              <Icon name="check" size={48} stroke={2.5} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Report sent</div>
            <div style={{ fontSize: 14, color: "var(--ink-3)", maxWidth: 280, marginBottom: 24 }}>
              Thanks. Our team reviews reports within 24 hours.
            </div>
            <Button onClick={() => setSubmitted(false)}>Back to Help</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="topbar with-border">
        <button className="icon-btn" onClick={onBack}><Icon name="back" size={22} /></button>
        <div className="title">{t("help.title")}</div>
      </div>

      <div className="scroll" style={{ padding: "16px 16px 28px" }}>
        {!reportOpen ? (
          <>
            {/* FAQ */}
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0 4px 8px" }}>
              Frequently Asked
            </div>
            <div className="form-group">
              {faqs.map((f, i) => (
                <div key={i} style={{ borderBottom: i < faqs.length - 1 ? "1px solid var(--border)" : "0" }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ width: "100%", textAlign: "left", padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}
                  >
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{f.q}</span>
                    <Icon name={openFaq === i ? "chevronDown" : "chevron"} size={16} color="var(--ink-3)" />
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: "0 16px 14px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55, textWrap: "pretty" }}>
                      {f.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Need help */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0 4px 8px" }}>
                Still need help?
              </div>
              <div className="card" style={{ display: "grid", gap: 10, padding: 14 }}>
                <Button variant="whatsapp" full icon="whatsapp">WhatsApp Support</Button>
                <Button variant="secondary" full icon="phone">Call: 1800-XXX-XXXX</Button>
              </div>
            </div>

            <button
              onClick={() => setReportOpen(true)}
              style={{ marginTop: 18, width: "100%", padding: 14, textAlign: "center", fontSize: 13, color: "var(--primary)", fontWeight: 500 }}
            >
              <Icon name="flag" size={14} /> Report a problem
            </button>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <button onClick={() => setReportOpen(false)} style={{ fontSize: 13, color: "var(--primary)" }}>Back</button>
            </div>

            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Report a problem</div>

            <div className="field">
              <label className="field-label">What's wrong?</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { id: "bug", label: "Bug / Error", icon: "warning" },
                  { id: "fake", label: "Fake Listing", icon: "flag" },
                  { id: "abuse", label: "Inappropriate", icon: "warning" },
                  { id: "other", label: "Other", icon: "info" },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setReportType(opt.id)}
                    style={{
                      padding: "14px 12px",
                      background: reportType === opt.id ? "var(--primary)" : "var(--surface)",
                      color: reportType === opt.id ? "white" : "var(--ink)",
                      border: reportType === opt.id ? "0" : "1px solid var(--border)",
                      borderRadius: 12,
                      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6,
                      fontSize: 13, fontWeight: 500,
                    }}
                  >
                    <Icon name={opt.icon} size={18} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label">Describe the issue</label>
              <textarea
                className="input"
                rows={4}
                placeholder="Tell us what happened..."
                value={reportText}
                onChange={e => setReportText(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field-label">Screenshot <span style={{ color: "var(--ink-3)" }}>(optional)</span></label>
              <button style={{
                width: "100%", padding: 14, borderRadius: 12,
                background: "var(--surface)",
                border: "1px dashed var(--border-strong)",
                color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13
              }}>
                <Icon name="image" size={18} /> Attach screenshot
              </button>
            </div>

            <div style={{ marginTop: 18 }}>
              <Button full disabled={!reportText.trim()} onClick={() => setSubmitted(true)}>
                Submit Report
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export { NotificationsScreen, SettingsScreen, HelpScreen };

