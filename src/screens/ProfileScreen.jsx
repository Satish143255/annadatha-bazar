import React from 'react';
import { AGRI_DATA } from '../data.js';
import { Icon } from '../icons/Icon.jsx';
import { TopBar, Button, Avatar, Sheet, useT, formatINR, AnimatedNumber } from '../components/index.jsx';

// ===== Profile: P1, P2 Listings, P3 Inquiries (with chat) =====

const { useState: useStateP, useRef: useRefP, useEffect: useEffectP } = React;

// ---------- P1: My Profile ----------
const ProfileScreen = ({ user, myListings, inquiries, orders = [], onOpenSettings, onOpenListings, onOpenDashboard, onOpenInquiries, onLogout, lang }) => {
  const t = useT(lang);
  const received = inquiries.filter(i => i.type === "received").length;
  const sent = inquiries.filter(i => i.type === "sent").length;
  const activeListings = myListings.filter(l => l.status === "active" && l.kind !== "service").length;
  const activeServices = myListings.filter(l => l.status === "active" && l.kind === "service").length;
  const openOrders = orders.filter(o => !["completed", "cancelled"].includes(o.stage)).length;
  const [editing, setEditing] = useStateP(false);
  const [name, setName] = useStateP(user.name);

  return (
    <div className="scroll">
      <div className="topbar">
        <div className="title">{t("profile.title")}</div>
        <button className="icon-btn" onClick={onOpenSettings}>
          <Icon name="settings" size={20} />
        </button>
      </div>

      {/* Header */}
      <div style={{ padding: "8px 16px 20px", textAlign: "center" }}>
        <Avatar name={user.name} size="lg" />
        {editing ? (
          <input
            value={name} onChange={e => setName(e.target.value)}
            style={{
              fontSize: 22, fontWeight: 600, textAlign: "center", marginTop: 12,
              border: 0, borderBottom: "2px solid var(--primary)", background: "transparent",
              outline: 0, color: "var(--ink)"
            }}
          />
        ) : (
          <div style={{ fontSize: 22, fontWeight: 600, marginTop: 12 }}>{name}</div>
        )}
        <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>
          <Icon name="pin" size={12} /> {user.village}, {user.district}, {user.state}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 4 }}>
          Member since {user.joined}
        </div>
      </div>

      {/* Dashboard hero card */}
      <div style={{ padding: "0 16px 12px" }}>
        <button onClick={onOpenDashboard} className="dashboard-hero">
          <div className="dashboard-hero-icon">
            <Icon name="trendUp" size={20} stroke={2.2} />
          </div>
          <div className="dashboard-hero-body">
            <div className="dashboard-hero-title">Seller Dashboard</div>
            <div className="dashboard-hero-sub">
              {openOrders > 0
                ? `${openOrders} open ${openOrders === 1 ? "order" : "orders"} need attention`
                : "View listings, services & orders"}
            </div>
          </div>
          <Icon name="chevron" size={18} style={{ opacity: 0.7 }} />
        </button>
      </div>

      {/* Stats â€” Listings / Services / Orders */}
      <div style={{ padding: "0 16px 16px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <button onClick={onOpenDashboard} className="card tight" style={{ textAlign: "center", padding: "14px 8px" }}>
          <AnimatedNumber value={activeListings} style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--primary)", lineHeight: 1, display: "block" }} />
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>Listings</div>
        </button>
        <button onClick={onOpenDashboard} className="card tight" style={{ textAlign: "center", padding: "14px 8px" }}>
          <AnimatedNumber value={activeServices} style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "#7A4F9E", lineHeight: 1, display: "block" }} />
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>Services</div>
        </button>
        <button onClick={onOpenDashboard} className="card tight" style={{ textAlign: "center", padding: "14px 8px", position: "relative" }}>
          <AnimatedNumber value={openOrders} style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "#B05E2E", lineHeight: 1, display: "block" }} />
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>Open Orders</div>
          {openOrders > 0 && (
            <span style={{
              position: "absolute", top: 8, right: 8,
              width: 8, height: 8, borderRadius: 999,
              background: "#B05E2E",
            }} />
          )}
        </button>
      </div>

      {/* Crops */}
      <div className="section-head"><h3 style={{ fontSize: 14 }}>My Crops</h3></div>
      <div style={{ padding: "0 16px 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
        {user.crops.map(cId => {
          const c = AGRI_DATA.CROPS.find(x => x.id === cId);
          if (!c) return null;
          return (
            <div key={cId} className="chip" style={{ height: 38, paddingRight: 8 }}>
              <span style={{ fontSize: 14 }}>{c.emoji}</span>
              {c.name}
              {editing && (
                <button style={{ marginLeft: 4, opacity: 0.5 }}>
                  <Icon name="close" size={12} />
                </button>
              )}
            </div>
          );
        })}
        {editing && (
          <button className="chip soft" style={{ height: 38 }}>
            <Icon name="plus" size={14} /> Add
          </button>
        )}
      </div>

      {/* Verification */}
      <div className="section-head"><h3 style={{ fontSize: 14 }}>Verification</h3></div>
      <div style={{ padding: "0 16px 16px" }}>
        <div className="card tight" style={{ display: "flex", gap: 16, padding: 14 }}>
          {[
            { label: "Phone", verified: true, icon: "phone" },
            { label: "Location", verified: true, icon: "pin" },
            { label: "Aadhaar", verified: false, icon: "user" },
          ].map(v => (
            <div key={v.label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                width: 40, height: 40, margin: "0 auto 6px",
                borderRadius: 999,
                background: v.verified ? "var(--primary-soft)" : "var(--surface-2)",
                color: v.verified ? "var(--primary)" : "var(--ink-3)",
                display: "grid", placeItems: "center",
                position: "relative",
              }}>
                <Icon name={v.icon} size={18} />
                {v.verified && (
                  <div style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 16, height: 16, borderRadius: 999,
                    background: "var(--primary)", color: "white",
                    display: "grid", placeItems: "center",
                    border: "2px solid var(--surface)"
                  }}>
                    <Icon name="check" size={9} color="white" stroke={3} />
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, fontWeight: 500 }}>{v.label}</div>
              {!v.verified && <div style={{ fontSize: 9, color: "var(--primary)", marginTop: 2 }}>Verify â†’</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "0 16px 16px", display: "grid", gap: 10 }}>
        <Button variant="secondary" full icon={editing ? "check" : "edit"} onClick={() => setEditing(!editing)}>
          {editing ? "Save Changes" : t("profile.edit")}
        </Button>
        <Button variant="secondary" full icon="share">
          {t("profile.share")}
        </Button>
      </div>

      {/* Menu */}
      <div style={{ padding: "8px 16px 28px" }}>
        <div className="form-group">
          <button className="list-row" onClick={onOpenDashboard} style={{ width: "100%", textAlign: "left" }}>
            <Icon name="trendUp" size={18} color="var(--ink-3)" />
            <span className="row-label">Seller Dashboard</span>
            {openOrders > 0 && (
              <span style={{
                background: "#B05E2E", color: "white", fontSize: 10, fontWeight: 700,
                padding: "2px 7px", borderRadius: 999,
              }}>{openOrders} new</span>
            )}
            <Icon name="chevron" size={16} color="var(--ink-3)" />
          </button>
          <button className="list-row" onClick={onOpenListings} style={{ width: "100%", textAlign: "left" }}>
            <Icon name="grid" size={18} color="var(--ink-3)" />
            <span className="row-label">My Listings &amp; Services</span>
            <span className="row-meta">{myListings.length}</span>
            <Icon name="chevron" size={16} color="var(--ink-3)" />
          </button>
          <button className="list-row" onClick={() => onOpenInquiries("received")} style={{ width: "100%", textAlign: "left" }}>
            <Icon name="chat" size={18} color="var(--ink-3)" />
            <span className="row-label">Inquiries</span>
            <span className="row-meta">{received + sent}</span>
            <Icon name="chevron" size={16} color="var(--ink-3)" />
          </button>
          <button className="list-row" onClick={onOpenSettings} style={{ width: "100%", textAlign: "left" }}>
            <Icon name="settings" size={18} color="var(--ink-3)" />
            <span className="row-label">Settings</span>
            <Icon name="chevron" size={16} color="var(--ink-3)" />
          </button>
          <button className="list-row" onClick={onLogout} style={{ width: "100%", textAlign: "left", color: "var(--danger)" }}>
            <Icon name="logout" size={18} color="var(--danger)" />
            <span className="row-label" style={{ color: "var(--danger)" }}>{t("profile.logout")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- P2: My Listings ----------
const MyListingsScreen = ({ myListings, onBack, onOpenListing, onPostListing, lang }) => {
  const t = useT(lang);
  const [tab, setTab] = useStateP("active");
  const [confirmDelete, setConfirmDelete] = useStateP(null);
  const [listings, setListings] = useStateP(myListings);

  const counts = {
    active: listings.filter(l => l.status === "active").length,
    paused: listings.filter(l => l.status === "paused").length,
    fulfilled: listings.filter(l => l.status === "fulfilled").length,
    expired: listings.filter(l => l.status === "expired").length,
  };
  const items = listings.filter(l => l.status === tab);

  const setStatus = (id, status) => setListings(ls => ls.map(l => l.id === id ? { ...l, status } : l));
  const remove = (id) => { setListings(ls => ls.filter(l => l.id !== id)); setConfirmDelete(null); };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="topbar with-border">
        <button className="icon-btn" onClick={onBack}><Icon name="back" size={22} /></button>
        <div className="title">{t("myListings.title")}</div>
        <button className="icon-btn" onClick={onPostListing}>
          <Icon name="plus" size={22} color="var(--primary)" />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ padding: "12px 16px 0", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
          {["active", "paused", "fulfilled", "expired"].map(s => (
            <button
              key={s}
              onClick={() => setTab(s)}
              style={{
                padding: "10px 4px", borderBottom: tab === s ? "2px solid var(--primary)" : "2px solid transparent",
                color: tab === s ? "var(--ink)" : "var(--ink-3)",
                fontSize: 13, fontWeight: tab === s ? 600 : 500,
                whiteSpace: "nowrap", textTransform: "capitalize",
              }}
            >
              {s} {counts[s] > 0 && <span style={{ color: "var(--ink-3)", marginLeft: 4 }}>({counts[s]})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll" style={{ padding: "16px" }}>
        {items.length === 0 ? (
          <Empty
            icon="grid"
            title={`No ${tab} listings`}
            body={tab === "active" ? "Post your first listing to reach buyers nearby." : `You have no ${tab} listings yet.`}
            action={tab === "active" ? <Button icon="plus" onClick={onPostListing}>Post Listing</Button> : null}
          />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {items.map(l => (
              <div key={l.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div onClick={() => onOpenListing(l)} style={{ display: "flex", padding: 12, gap: 12, alignItems: "center" }}>
                  <ImgPh category={l.category} label={l.photos[0]?.split(" ").slice(0, 2).join(" ")} style={{ width: 64, height: 64, borderRadius: 10 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{l.title}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--primary)", lineHeight: 1, marginTop: 6 }}>
                      {formatINR(l.price)}<span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-sans)" }}>/{l.priceUnit}</span>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 11, color: "var(--ink-3)" }}>
                      <span><Icon name="eye" size={10} /> {l.views}</span>
                      <span><Icon name="chat" size={10} /> {l.inquiries}</span>
                      <span>{l.posted}</span>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", borderTop: "1px solid var(--border)" }}>
                  {tab === "active" && (
                    <>
                      <button onClick={() => onPostListing(l)} style={cellBtn}>
                        <Icon name="edit" size={14} /> Edit
                      </button>
                      <button onClick={() => setStatus(l.id, "paused")} style={cellBtn}>
                        <Icon name="pause" size={14} /> Pause
                      </button>
                      <button onClick={() => setStatus(l.id, "fulfilled")} style={cellBtn}>
                        <Icon name="check" size={14} /> Fulfilled
                      </button>
                      <button onClick={() => setConfirmDelete(l.id)} style={{ ...cellBtn, color: "var(--danger)" }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </>
                  )}
                  {tab === "paused" && (
                    <>
                      <button onClick={() => setStatus(l.id, "active")} style={cellBtn}>
                        <Icon name="play" size={14} /> Activate
                      </button>
                      <button onClick={() => setConfirmDelete(l.id)} style={{ ...cellBtn, color: "var(--danger)" }}>
                        <Icon name="trash" size={14} /> Delete
                      </button>
                    </>
                  )}
                  {(tab === "fulfilled" || tab === "expired") && (
                    <button onClick={() => { setStatus(l.id, "active"); }} style={cellBtn}>
                      <Icon name="refresh" size={14} /> Relist
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete listing?">
        <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 18 }}>
          This will permanently remove the listing. It can't be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" full onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" full onClick={() => remove(confirmDelete)}>
            <Icon name="trash" size={16} /> Delete
          </Button>
        </div>
      </Sheet>
    </div>
  );
};

const cellBtn = {
  flex: 1, padding: "10px 8px",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
  fontSize: 12, fontWeight: 500, color: "var(--ink-2)",
  borderRight: "1px solid var(--border)",
};

// ---------- P3: Inquiries (list + chat) ----------
const InquiriesScreen = ({ inquiries: initialInquiries, onBack, lang, onOpenListing, openInquiry, initialTab = "received" }) => {
  const t = useT(lang);
  const [tab, setTab] = useStateP(initialTab);
  const [open, setOpen] = useStateP(openInquiry || null);
  const [inquiries, setInquiries] = useStateP(initialInquiries);

  const filtered = inquiries.filter(i => i.type === tab);
  const current = open ? inquiries.find(i => i.id === open) : null;

  const sendMessage = (body) => {
    setInquiries(list => list.map(i => i.id === open ? {
      ...i,
      lastMessage: body,
      lastTime: "Just now",
      messages: [...i.messages, { from: "me", body, time: "Just now" }]
    } : i));
  };

  if (current) {
    return <ChatThread inquiry={current} onBack={() => setOpen(null)} onSend={sendMessage} onOpenListing={onOpenListing} lang={lang} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="topbar with-border">
        <button className="icon-btn" onClick={onBack}><Icon name="back" size={22} /></button>
        <div className="title">{t("inquiries.title")}</div>
      </div>

      {/* Tabs */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
        <div className="segmented">
          <button className={tab === "received" ? "active" : ""} onClick={() => setTab("received")}>
            Received ({inquiries.filter(i => i.type === "received").length})
          </button>
          <button className={tab === "sent" ? "active" : ""} onClick={() => setTab("sent")}>
            Sent ({inquiries.filter(i => i.type === "sent").length})
          </button>
        </div>
      </div>

      <div className="scroll">
        {filtered.length === 0 ? (
          <Empty
            icon="chat"
            title={tab === "received" ? "No one has inquired yet" : "You haven't contacted anyone"}
            body={tab === "received"
              ? "When buyers reach out about your listings, they'll appear here."
              : "Browse listings and tap Message to start a conversation."}
          />
        ) : (
          <div>
            {filtered.map(i => (
              <button
                key={i.id}
                onClick={() => setOpen(i.id)}
                style={{
                  width: "100%", textAlign: "left",
                  padding: "14px 16px",
                  display: "flex", gap: 12, alignItems: "center",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--surface)",
                }}
              >
                <Avatar name={i.fromName} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{i.fromName}</span>
                    <span style={{ fontSize: 11, color: "var(--ink-3)", flexShrink: 0 }}>{i.lastTime}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--primary)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    re: {i.listingTitle}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 2, alignItems: "center" }}>
                    <span style={{ flex: 1, fontSize: 13, color: i.unread ? "var(--ink)" : "var(--ink-3)", fontWeight: i.unread ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {i.lastMessage}
                    </span>
                    {i.unread > 0 && (
                      <span style={{
                        minWidth: 18, height: 18, borderRadius: 999,
                        background: "var(--primary)", color: "white",
                        fontSize: 10, fontWeight: 700,
                        display: "grid", placeItems: "center", padding: "0 5px",
                      }}>{i.unread}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Chat Thread ----------
const ChatThread = ({ inquiry, onBack, onSend, onOpenListing, lang }) => {
  const [text, setText] = useStateP("");
  const [contactShown, setContactShown] = useStateP(false);
  const scrollRef = useRefP(null);

  useEffectP(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [inquiry.messages.length]);

  const send = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  const otherPhone = AGRI_DATA.USERS.find(u => u.id === (inquiry.fromUser || inquiry.toUser))?.phone || "9876543210";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="topbar with-border">
        <button className="icon-btn" onClick={onBack}><Icon name="back" size={22} /></button>
        <div style={{ flex: 1, display: "flex", gap: 10, alignItems: "center" }}>
          <Avatar name={inquiry.fromName} size="sm" />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{inquiry.fromName}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{inquiry.fromVillage}</div>
          </div>
        </div>
        <button className="icon-btn">
          <Icon name="phone" size={20} />
        </button>
      </div>

      {/* Listing context strip */}
      <button
        onClick={() => onOpenListing && onOpenListing(inquiry.listingId)}
        style={{
          padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--primary-soft)",
          width: "100%", textAlign: "left",
          borderBottom: "1px solid var(--border)"
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "var(--primary)", color: "white",
          display: "grid", placeItems: "center"
        }}>
          <Icon name="leaf" size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: "var(--primary)", fontWeight: 600 }}>RE: LISTING</div>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {inquiry.listingTitle}
          </div>
        </div>
        <Icon name="chevron" size={16} color="var(--primary)" />
      </button>

      {/* Messages */}
      <div ref={scrollRef} className="scroll" style={{
        background: "var(--surface-2)",
        padding: "16px 12px",
      }}>
        {inquiry.messages.map((m, i) => {
          const mine = m.from === "me";
          const showTime = i === 0 || inquiry.messages[i - 1].time !== m.time;
          return (
            <div key={i}>
              {showTime && (
                <div style={{ textAlign: "center", margin: "12px 0 8px" }}>
                  <span style={{ fontSize: 11, color: "var(--ink-3)", background: "var(--surface-2)", padding: "2px 8px", borderRadius: 999 }}>
                    {m.time}
                  </span>
                </div>
              )}
              <div style={{
                display: "flex",
                justifyContent: mine ? "flex-end" : "flex-start",
                marginBottom: 6,
              }}>
                <div style={{
                  maxWidth: "78%",
                  padding: "10px 14px",
                  background: mine ? "var(--primary)" : "var(--surface)",
                  color: mine ? "white" : "var(--ink)",
                  borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  fontSize: 14, lineHeight: 1.4,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}>
                  {m.body}
                </div>
              </div>
            </div>
          );
        })}

        {/* Contact reveal card in chat */}
        {!contactShown ? (
          <button
            onClick={() => setContactShown(true)}
            style={{
              display: "block", margin: "16px auto",
              padding: "10px 18px",
              background: "var(--surface)", border: "1px dashed var(--border-strong)",
              borderRadius: 999, fontSize: 12, color: "var(--primary)", fontWeight: 500,
            }}
          >
            <Icon name="phone" size={12} /> Show Contact Number
          </button>
        ) : (
          <div style={{
            margin: "16px 8px",
            padding: 14,
            background: "var(--surface)", borderRadius: 14,
            border: "1px solid var(--primary-soft)"
          }}>
            <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Contact</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Icon name="phone" size={18} color="var(--primary)" />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 500 }}>+91 {otherPhone}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button size="sm" full icon="phone">Call</Button>
              <Button size="sm" full variant="whatsapp" icon="whatsapp">WhatsApp</Button>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div style={{
        padding: "10px 12px calc(10px + env(safe-area-inset-bottom))",
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        display: "flex", gap: 8, alignItems: "flex-end"
      }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a messageâ€¦"
          rows={1}
          style={{
            flex: 1, resize: "none",
            padding: "10px 14px",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 22, outline: 0,
            fontSize: 14, lineHeight: 1.4,
            maxHeight: 100,
          }}
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          style={{
            width: 44, height: 44, borderRadius: 999,
            background: text.trim() ? "var(--primary)" : "var(--surface-2)",
            color: text.trim() ? "white" : "var(--ink-4)",
            display: "grid", placeItems: "center", flexShrink: 0,
            transition: "background 120ms",
          }}
        >
          <Icon name="chevron" size={20} stroke={2.5} />
        </button>
      </div>
    </div>
  );
};

export { ProfileScreen, MyListingsScreen, InquiriesScreen, ChatThread };

