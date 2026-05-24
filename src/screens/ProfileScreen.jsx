import React from 'react';
import { CROPS } from '../referenceData.js';
import { Icon } from '../icons/Icon.jsx';
import { Button, Avatar, Empty, ImgPh, Sheet, useT, formatINR, AnimatedNumber } from '../components/index.jsx';

// ===== Profile: P1, P2 Listings, P3 Inquiries (with chat) =====

const { useState: useStateP, useRef: useRefP, useEffect: useEffectP } = React;

// ---------- P1: My Profile ----------
const ProfileScreen = ({ user, myListings, inquiries, orders = [], onOpenSettings, onOpenListings, onOpenDashboard, onOpenInquiries, onLogout, onUpdateProfile, editing, setEditing, lang }) => {
  const t = useT(lang);
  const received = inquiries.filter(i => i.type === "received").length;
  const sent = inquiries.filter(i => i.type === "sent").length;
  const activeListings = myListings.filter(l => l.status === "active" && l.kind !== "service").length;
  const activeServices = myListings.filter(l => l.status === "active" && l.kind === "service").length;
  const openOrders = orders.filter(o => !["completed", "cancelled"].includes(o.stage)).length;
  const [name, setName] = useStateP(user.name);
  const [crops, setCrops] = useStateP(user.crops || []);
  const [addCropOpen, setAddCropOpen] = useStateP(false);

  useEffectP(() => {
    setName(user.name);
    setCrops(user.crops || []);
  }, [user]);

  const locationLabel = [user.village, user.district, user.state].filter(Boolean).join(", ")
    || (user.latitude != null && user.longitude != null ? "GPS location saved" : "Location not added");

  const handleRemoveCrop = (cropId) => {
    setCrops(prev => prev.filter(c => c !== cropId));
  };

  const handleAddCrop = (cropId) => {
    if (!crops.includes(cropId)) {
      setCrops([...crops, cropId]);
    }
    setAddCropOpen(false);
  };

  const handleSave = () => {
    onUpdateProfile?.({ name, crops });
    setEditing(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="topbar with-border flex items-center justify-between">
        <div className="title font-bold text-[var(--ink)] text-lg">{t("profile.title")}</div>
        <button className="icon-btn flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors active:scale-95 cursor-pointer" onClick={onOpenSettings}>
          <Icon name="settings" size={20} color="var(--ink)" />
        </button>
      </div>

      <div className="scroll bg-[var(--surface-2)]">
        {/* Header Card */}
        <div className="px-4 pt-6 pb-4">
          <div className="bg-gradient-to-b from-[var(--primary)]/5 to-transparent border border-[var(--border)] rounded-3xl p-6 flex flex-col items-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.01)] bg-[var(--surface)]">
            <Avatar name={user.name} size="lg" className="ring-4 ring-[var(--surface)] shadow-sm" />
            {editing ? (
              <input
                value={name} onChange={e => setName(e.target.value)}
                className="text-xl font-bold text-center mt-4 border-b-2 border-[var(--primary)] bg-transparent outline-none text-[var(--ink)] pb-1 w-full max-w-[200px]"
              />
            ) : (
              <div className="text-xl font-bold text-[var(--ink)] mt-4">{name}</div>
            )}
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-[var(--ink-3)] font-medium max-w-[280px]">
              <Icon name="pin" size={12} color="var(--ink-3)" className="flex-shrink-0" />
              <span className="truncate">{locationLabel}</span>
            </div>
            <div className="text-[10px] text-[var(--ink-3)] font-semibold mt-2.5 bg-[var(--surface-2)] px-2.5 py-1 rounded-full uppercase tracking-wider">
              Member since {user.joined}
            </div>
          </div>
        </div>

        {/* Dashboard hero card */}
        <div className="px-4 pb-4">
          <button 
            onClick={onOpenDashboard} 
            className="w-full bg-[var(--primary)] text-[var(--primary-ink)] p-4 rounded-2xl flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform duration-100 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-black/10 flex items-center justify-center">
                <Icon name="trendUp" size={20} stroke={2.2} />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold">Seller Dashboard</div>
                <div className="text-[11px] opacity-80 font-medium mt-0.5">
                  {openOrders > 0
                    ? `${openOrders} open ${openOrders === 1 ? "order" : "orders"} need attention`
                    : "View listings, services & orders"}
                </div>
              </div>
            </div>
            <Icon name="chevron" size={18} className="opacity-80" />
          </button>
        </div>

        {/* Stats for listings, services, and orders. */}
        <div className="px-4 pb-4 grid grid-cols-3 gap-3">
          <button onClick={onOpenListings} className="flex flex-col items-center bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
            <AnimatedNumber value={activeListings} className="font-serif font-bold text-2xl text-[var(--primary)] leading-none mb-1.5" />
            <div className="text-[10px] font-bold text-[var(--ink-3)] uppercase tracking-wide">Listings</div>
          </button>
          <button onClick={onOpenListings} className="flex flex-col items-center bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
            <AnimatedNumber value={activeServices} className="font-serif font-bold text-2xl text-purple-600 dark:text-purple-400 leading-none mb-1.5" />
            <div className="text-[10px] font-bold text-[var(--ink-3)] uppercase tracking-wide">Services</div>
          </button>
          <button onClick={onOpenDashboard} className="flex flex-col items-center bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 shadow-sm active:scale-[0.98] transition-transform relative cursor-pointer">
            <AnimatedNumber value={openOrders} className="font-serif font-bold text-2xl text-[var(--terra)] leading-none mb-1.5" />
            <div className="text-[10px] font-bold text-[var(--ink-3)] uppercase tracking-wide">Orders</div>
            {openOrders > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--terra)]" />
            )}
          </button>
        </div>

        {/* Crops */}
        <div className="px-4 py-1.5 flex items-baseline justify-between">
          <h3 className="text-xs font-bold text-[var(--ink-3)] uppercase tracking-wider">My Crops</h3>
        </div>
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {crops.length === 0 ? (
            <div className="text-xs text-[var(--ink-3)] font-semibold italic py-1">No crops selected</div>
          ) : (
            crops.map(cId => {
              const c = CROPS.find(x => x.id === cId);
              if (!c) return null;
              return (
                <div key={cId} className="h-9 px-4 rounded-full border border-[var(--border)] bg-[var(--surface)] flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-2)]">
                  <span className="text-sm">{c.emoji}</span>
                  <span>{c.name}</span>
                  {editing && (
                    <button onClick={() => handleRemoveCrop(cId)} className="ml-1.5 opacity-55 hover:opacity-100 transition-opacity cursor-pointer">
                      <Icon name="close" size={10} color="var(--ink)" />
                    </button>
                  )}
                </div>
              );
            })
          )}
          {editing && (
            <button onClick={() => setAddCropOpen(true)} className="h-9 px-3.5 rounded-full bg-[var(--surface-3)] hover:bg-[var(--surface-4)] text-[var(--ink-2)] flex items-center gap-1 text-xs font-bold transition-all cursor-pointer">
              <Icon name="plus" size={12} color="var(--ink)" /> Add
            </button>
          )}
        </div>

        {/* Verification */}
        <div className="px-4 py-1.5 flex items-baseline justify-between">
          <h3 className="text-xs font-bold text-[var(--ink-3)] uppercase tracking-wider">Verification</h3>
        </div>
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-3 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm">
            {[
              { label: "Phone", verified: true, icon: "phone" },
              { label: "Location", verified: true, icon: "pin" },
              { label: "Aadhaar", verified: false, icon: "user" },
            ].map(v => (
              <div key={v.label} className="flex-1 flex flex-col items-center p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] relative">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center relative mb-2 transition-colors ${
                  v.verified 
                    ? "bg-[var(--primary-soft)] text-[var(--primary)]" 
                    : "bg-[var(--surface-3)] text-[var(--ink-3)]"
                }`}>
                  <Icon name={v.icon} size={18} />
                  {v.verified && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center border-2 border-[var(--surface)] shadow-sm">
                      <Icon name="check" size={10} color="white" stroke={3} />
                    </div>
                  )}
                </div>
                <div className="text-[11px] font-bold text-[var(--ink-2)]">{v.label}</div>
                {!v.verified ? (
                  <button className="text-[10px] font-bold text-[var(--primary)] hover:underline mt-1 cursor-pointer">Verify</button>
                ) : (
                  <div className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-wider mt-1">Verified</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-3">
          <button 
            onClick={editing ? handleSave : () => setEditing(true)}
            className="h-11 w-full bg-[var(--primary)] text-[var(--primary-ink)] rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs shadow-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Icon name={editing ? "check" : "edit"} size={14} />
            {editing ? "Save Changes" : t("profile.edit")}
          </button>
          <button className="h-11 w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-2)] rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs shadow-sm hover:bg-[var(--surface-2)] active:scale-[0.98] transition-all cursor-pointer">
            <Icon name="share" size={14} />
            {t("profile.share")}
          </button>
        </div>

        {/* Menu */}
        <div className="px-4 pb-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden divide-y divide-[var(--border)] shadow-sm">
            <button className="w-full h-[52px] px-4 flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors text-left cursor-pointer" onClick={onOpenDashboard}>
              <div className="text-[var(--primary)]"><Icon name="trendUp" size={18} /></div>
              <span className="flex-1 text-sm font-semibold text-[var(--ink-2)]">Seller Dashboard</span>
              {openOrders > 0 && (
                <span className="bg-[var(--terra)] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{openOrders} new</span>
              )}
              <Icon name="chevron" size={16} color="var(--ink-3)" />
            </button>
            <button className="w-full h-[52px] px-4 flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors text-left cursor-pointer" onClick={onOpenListings}>
              <div className="text-[var(--primary)]"><Icon name="grid" size={18} /></div>
              <span className="flex-1 text-sm font-semibold text-[var(--ink-2)]">My Listings &amp; Services</span>
              <span className="text-xs font-bold text-[var(--ink-3)] bg-[var(--surface-2)] px-2 py-0.5 rounded">{myListings.length}</span>
              <Icon name="chevron" size={16} color="var(--ink-3)" />
            </button>
            <button className="w-full h-[52px] px-4 flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors text-left cursor-pointer" onClick={() => onOpenInquiries("received")}>
              <div className="text-[var(--primary)]"><Icon name="chat" size={18} /></div>
              <span className="flex-1 text-sm font-semibold text-[var(--ink-2)]">Inquiries</span>
              <span className="text-xs font-bold text-[var(--ink-3)] bg-[var(--surface-2)] px-2 py-0.5 rounded">{received + sent}</span>
              <Icon name="chevron" size={16} color="var(--ink-3)" />
            </button>
            <button className="w-full h-[52px] px-4 flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors text-left cursor-pointer" onClick={onOpenSettings}>
              <div className="text-[var(--primary)]"><Icon name="settings" size={18} /></div>
              <span className="flex-1 text-sm font-semibold text-[var(--ink-2)]">Settings</span>
              <Icon name="chevron" size={16} color="var(--ink-3)" />
            </button>
            <button className="w-full h-[52px] px-4 flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors text-left cursor-pointer" onClick={onLogout}>
              <div className="text-[var(--terra)]"><Icon name="logout" size={18} /></div>
              <span className="flex-1 text-sm font-semibold text-[var(--terra)]">{t("profile.logout")}</span>
              <Icon name="chevron" size={16} color="var(--ink-3)" />
            </button>
          </div>
        </div>
      </div>

      <Sheet open={addCropOpen} onClose={() => setAddCropOpen(false)} title="Add Crop">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: "300px", overflowY: "auto" }}>
          {CROPS.filter(c => !crops.includes(c.id)).map(c => (
            <button
              key={c.id}
              className="chip bg-[var(--surface-2)] text-[var(--ink-2)] hover:bg-[var(--surface-3)]"
              style={{ height: 44, padding: "0 12px", justifyContent: "flex-start", borderRadius: 10, cursor: "pointer" }}
              onClick={() => handleAddCrop(c.id)}
            >
              <span className="text-sm mr-2">{c.emoji}</span>
              <span className="font-semibold text-xs text-[var(--ink)]">{c.name}</span>
            </button>
          ))}
        </div>
      </Sheet>
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
    return <ChatThread inquiry={current} onBack={() => setOpen(null)} onSend={sendMessage} onOpenListing={onOpenListing} />;
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
const ChatThread = ({ inquiry, onBack, onSend, onOpenListing }) => {
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

  const otherPhone = inquiry.otherPhone || "";

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
          placeholder="Type a message..."
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

