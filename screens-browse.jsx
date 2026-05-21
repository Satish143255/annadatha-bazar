// ===== Browse: B1 List, B2 Detail, B3 Post =====

const { useState: useStateB, useMemo: useMemoB, useEffect: useEffectB, useRef: useRefB } = React;

// ---------- B1: Browse / Search ----------
const BrowseScreen = ({ listings, onOpenListing, onPostListing, initialCategory = "all", lang }) => {
  const t = useT(lang);
  const [q, setQ] = useStateB("");
  const [cat, setCat] = useStateB(initialCategory);
  const [sort, setSort] = useStateB("nearest");
  const [view, setView] = useStateB("grid");
  const [filtersOpen, setFiltersOpen] = useStateB(false);
  const [voiceOpen, setVoiceOpen] = useStateB(false);
  const voiceRecRef = useRefB(null);
  const [distance, setDistance] = useStateB(50);
  const [priceMin, setPriceMin] = useStateB("");
  const [priceMax, setPriceMax] = useStateB("");

  useEffectB(() => { setCat(initialCategory); }, [initialCategory]);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceOpen(true);
    if (!SR) return;
    const rec = new SR();
    voiceRecRef.current = rec;
    rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const t = e.results[0]?.[0]?.transcript || "";
      if (t) setQ(t);
      setVoiceOpen(false);
    };
    rec.onerror = () => setVoiceOpen(false);
    rec.onend = () => setVoiceOpen(false);
    rec.start();
  };

  const stopVoice = () => {
    voiceRecRef.current?.stop();
    setVoiceOpen(false);
  };

  const filtered = useMemoB(() => {
    let r = listings;
    if (cat !== "all") r = r.filter(l => l.category === cat);
    if (q) r = r.filter(l => l.title.toLowerCase().includes(q.toLowerCase()) || l.description.toLowerCase().includes(q.toLowerCase()));
    r = r.filter(l => l.distance <= distance);
    if (priceMin) r = r.filter(l => l.price >= +priceMin);
    if (priceMax) r = r.filter(l => l.price <= +priceMax);
    const sorted = [...r];
    if (sort === "nearest") sorted.sort((a, b) => a.distance - b.distance);
    if (sort === "newest") {/* keep order */}
    if (sort === "priceAsc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "priceDesc") sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }, [listings, q, cat, sort, distance, priceMin, priceMax]);

  return (
    <div className="scroll">
      <div className="topbar" style={{ paddingBottom: 8 }}>
        <div className="title">{t("browse.title")}</div>
      </div>

      {/* Search */}
      <div style={{ padding: "0 16px 12px" }}>
        <div style={{ position: "relative" }}>
          <input
            className="input"
            style={{ paddingLeft: 44, paddingRight: 48, height: 48 }}
            placeholder={t("browse.search")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div style={{ position: "absolute", left: 14, top: 15, color: "var(--ink-3)", pointerEvents: "none" }}>
            <Icon name="search" size={18} color="var(--ink-3)" />
          </div>
          <button
            onClick={startVoice}
            style={{ position: "absolute", right: 8, top: 8, width: 32, height: 32, borderRadius: 999, display: "grid", placeItems: "center", color: "var(--primary)" }}
          >
            <Icon name="mic" size={18} />
          </button>
        </div>
      </div>

      {/* Category chips */}
      <div className="hscroll" style={{ padding: "0 16px 12px" }}>
        <button className={`chip${cat === "all" ? " active" : ""}`} onClick={() => setCat("all")}>All</button>
        {AGRI_DATA.CATEGORIES.map(c => (
          <button key={c.id} className={`chip${cat === c.id ? " active" : ""}`} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Sort + view */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px 12px", justifyContent: "space-between" }}>
        <button onClick={() => setFiltersOpen(true)} className="chip soft" style={{ height: 32 }}>
          <Icon name="filter" size={14} />
          Filters
          {(distance !== 50 || priceMin || priceMax) && <span className="dot" style={{ background: "var(--primary)" }} />}
        </button>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <select
            value={sort} onChange={e => setSort(e.target.value)}
            style={{
              height: 32, border: "1px solid var(--border)", background: "var(--surface)",
              borderRadius: 999, fontSize: 12, fontWeight: 500, padding: "0 8px"
            }}
          >
            <option value="nearest">Sort: {t("sort.nearest")}</option>
            <option value="newest">Sort: {t("sort.newest")}</option>
            <option value="priceAsc">Sort: {t("sort.priceAsc")}</option>
            <option value="priceDesc">Sort: {t("sort.priceDesc")}</option>
          </select>
          <div className="segmented" style={{ height: 32, padding: 2 }}>
            <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} style={{ height: 28, width: 32 }}>
              <Icon name="grid" size={14} />
            </button>
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")} style={{ height: 28, width: 32 }}>
              <Icon name="sort" size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div style={{ padding: "0 16px 12px", fontSize: 12, color: "var(--ink-3)" }}>
        <strong style={{ color: "var(--ink-2)", fontWeight: 600 }}>{filtered.length}</strong> {t("browse.results")} {distance < 50 ? `within ${distance}km` : "near you"}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <Empty
          icon="search"
          title="No listings match"
          body="Try clearing filters or broadening your search."
          action={<Button variant="secondary" onClick={() => { setQ(""); setCat("all"); setPriceMin(""); setPriceMax(""); setDistance(50); }}>Clear all</Button>}
        />
      ) : view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px 90px" }}>
          {filtered.map(l => <ListingCard key={l.id} listing={l} onClick={() => onOpenListing(l)} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10, padding: "0 16px 90px" }}>
          {filtered.map(l => <ListingCard key={l.id} listing={l} variant="row" onClick={() => onOpenListing(l)} />)}
        </div>
      )}

      {/* FAB */}
      <button className="fab" onClick={onPostListing}>
        <Icon name="plus" size={24} stroke={2.5} />
      </button>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <div className="field">
          <label className="field-label">Distance: within {distance} km</label>
          <input
            type="range" min="5" max="100" step="5"
            value={distance}
            onChange={e => setDistance(+e.target.value)}
            style={{ width: "100%", accentColor: "var(--primary)" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)" }}>
            <span>5km</span><span>100km</span>
          </div>
        </div>
        <div className="field">
          <label className="field-label">Price range (₹)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" type="number" placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
            <input className="input" type="number" placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <Button variant="secondary" onClick={() => { setDistance(50); setPriceMin(""); setPriceMax(""); }}>Reset</Button>
          <Button full onClick={() => setFiltersOpen(false)}>Apply Filters</Button>
        </div>
      </Sheet>

      <Sheet open={voiceOpen} onClose={stopVoice}>
        <div style={{ textAlign: "center", padding: "12px 0 24px" }}>
          <div style={{
            width: 96, height: 96, margin: "0 auto 20px",
            borderRadius: 999, background: "var(--primary-soft)",
            display: "grid", placeItems: "center", color: "var(--primary)",
            animation: "pulse 1.2s ease-in-out infinite"
          }}>
            <Icon name="mic" size={42} stroke={1.8} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Listening…</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Try saying "rice in Warangal"</div>
        </div>
        <Button full variant="secondary" onClick={stopVoice}>Cancel</Button>
      </Sheet>
    </div>
  );
};

// ---------- B2: Listing Detail ----------
const ListingDetailScreen = ({ listing, listings, onBack, onMessage, onUserTap, onOpenListing, lang, onToast }) => {
  const t = useT(lang);
  const [photoIdx, setPhotoIdx] = useStateB(0);
  const [contactRevealed, setContactRevealed] = useStateB(false);
  const seller = AGRI_DATA.USERS.find(u => u.id === listing.userId);
  const similar = listings.filter(l => l.id !== listing.id && (l.category === listing.category)).slice(0, 4);

  const openWhatsapp = () => {
    const msg = encodeURIComponent(`Hi! I'm interested in your listing: "${listing.title}" — ${formatINR(listing.price)}/${listing.priceUnit}`);
    window.open(`https://wa.me/91${seller.phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
    onToast("Opening WhatsApp…");
  };

  const handleShare = async () => {
    const text = `${listing.title} — ${formatINR(listing.price)}/${listing.priceUnit} in ${listing.village}`;
    if (navigator.share) {
      try { await navigator.share({ title: listing.title, text, url: window.location.href }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text);
        onToast("Copied to clipboard");
      } catch { onToast("Share: " + text); }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="topbar with-border">
        <button className="icon-btn" onClick={onBack}><Icon name="back" size={22} /></button>
        <div className="title" style={{ fontSize: 15 }}>Listing</div>
        <button className="icon-btn" onClick={handleShare}><Icon name="share" size={20} /></button>
      </div>
      <div className="scroll" style={{ paddingBottom: 16 }}>
        {/* Photo carousel */}
        <div style={{ position: "relative", aspectRatio: "4/3", background: "var(--surface-2)" }}>
          <ImgPh
            category={listing.category}
            label={listing.photos[photoIdx]}
            style={{ width: "100%", height: "100%", fontSize: 12 }}
          />
          {listing.photos.length > 1 && (
            <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", gap: 4, justifyContent: "center" }}>
              {listing.photos.map((_, i) => (
                <button key={i} onClick={() => setPhotoIdx(i)} style={{
                  width: i === photoIdx ? 20 : 6, height: 6, borderRadius: 999,
                  background: i === photoIdx ? "#fff" : "rgba(255,255,255,0.6)",
                  transition: "all 120ms"
                }} />
              ))}
            </div>
          )}
          <div style={{ position: "absolute", top: 12, left: 12 }}>
            <span className="chip green" style={{ height: 26, fontSize: 11, textTransform: "capitalize" }}>
              {AGRI_DATA.CATEGORIES.find(c => c.id === listing.category)?.label || listing.category}
            </span>
          </div>
        </div>

        {/* Title + price */}
        <div style={{ padding: "20px 16px 16px" }}>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3, marginBottom: 8, textWrap: "pretty" }}>
            {listing.title}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 38, color: "var(--primary)", lineHeight: 1, letterSpacing: "-0.02em" }}>
              {formatINR(listing.price)}
            </div>
            <span style={{ color: "var(--ink-3)", fontSize: 14 }}>/ {listing.priceUnit}</span>
            {listing.negotiable && <span className="chip sm gold">Negotiable</span>}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 14, fontSize: 12, color: "var(--ink-3)" }}>
            <span><Icon name="eye" size={12} /> {listing.views} views</span>
            <span><Icon name="chat" size={12} /> {listing.inquiries} inquiries</span>
            <span>{listing.posted}</span>
          </div>
        </div>

        {/* Quantity / Available */}
        <div style={{ padding: "0 16px 16px" }}>
          <div className="card tight" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>Quantity</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{listing.quantity}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>Available</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{listing.available}</div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ padding: "0 16px 16px" }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--ink-2)" }}>Description</h4>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", textWrap: "pretty" }}>
            {listing.description}
          </p>
          {listing.tags && listing.tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              {listing.tags.map(tag => <span key={tag} className="chip sm gold">{tag}</span>)}
            </div>
          )}
        </div>

        {/* Seller */}
        <div style={{ padding: "0 16px 16px" }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--ink-2)" }}>Seller</h4>
          <div className="card tight" onClick={() => onUserTap && onUserTap(seller)} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={seller.name} size="md" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{seller.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                {seller.village}, {seller.district}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 11, color: "var(--ink-3)" }}>
                <span>{seller.listings} listings</span>
                <span>Member since {seller.joined}</span>
              </div>
            </div>
            <Icon name="chevron" size={16} color="var(--ink-3)" />
          </div>
        </div>

        {/* Location */}
        <div style={{ padding: "0 16px 16px" }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--ink-2)" }}>Location</h4>
          <div className="card tight" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{
              height: 120, position: "relative",
              background: "linear-gradient(135deg, #DCE9D2 0%, #C5D8A8 100%)",
              backgroundImage:
                "radial-gradient(circle at 30% 50%, rgba(31,90,58,0.08) 1px, transparent 2px), radial-gradient(circle at 70% 30%, rgba(31,90,58,0.08) 1px, transparent 2px), repeating-linear-gradient(45deg, rgba(31,90,58,0.04) 0 1px, transparent 1px 18px)",
            }}>
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -100%)" }}>
                <Icon name="pin" size={32} color="var(--primary)" fill="var(--primary)" />
              </div>
            </div>
            <div style={{ padding: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="pin" size={14} color="var(--ink-3)" />
              <span style={{ fontSize: 13, flex: 1 }}>{listing.village}, {listing.district}, {listing.state}</span>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{formatDistance(listing.distance)}</span>
            </div>
          </div>
        </div>

        {/* Contact reveal */}
        {!contactRevealed ? (
          <div style={{ padding: "0 16px 16px" }}>
            <button
              onClick={() => { setContactRevealed(true); onToast("Contact revealed · logged for safety"); }}
              style={{
                width: "100%", padding: "14px",
                background: "var(--surface)", border: "1px dashed var(--border-strong)",
                borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                color: "var(--primary)", fontWeight: 500, fontSize: 14
              }}
            >
              <Icon name="phone" size={16} />
              {t("listing.show")} — 98●●●●●●{seller.phone.slice(-2)}
            </button>
          </div>
        ) : (
          <div style={{ padding: "0 16px 16px" }}>
            <div className="card tight" style={{ background: "var(--primary-soft)", border: "0" }}>
              <div style={{ fontSize: 11, color: "var(--primary)", marginBottom: 4, fontWeight: 500 }}>CONTACT</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="phone" size={18} color="var(--primary)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 500, flex: 1 }}>+91 {seller.phone}</span>
                <Button size="sm" onClick={openWhatsapp}>Call</Button>
              </div>
            </div>
          </div>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <>
            <div className="section-head">
              <h3 style={{ fontSize: 14 }}>{t("listing.similar")}</h3>
            </div>
            <div className="hscroll">
              {similar.map(l => (
                <div key={l.id} style={{ width: 168, flexShrink: 0 }} onClick={() => onOpenListing(l)}>
                  <ListingCard listing={l} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom actions */}
      <div className="bottom-action">
        <Button variant="secondary" full icon="chat" onClick={onMessage}>{t("listing.message")}</Button>
        <Button variant="whatsapp" full icon="whatsapp" onClick={openWhatsapp}>{t("listing.whatsapp")}</Button>
      </div>
    </div>
  );
};

// ---------- B3: Post a Listing / Service ----------
const PostListingScreen = ({ onBack, onPost, lang, prefill }) => {
  const t = useT(lang);
  const mode = prefill?.mode === "service" ? "service" : "listing";

  // Pick the right category set based on mode
  const categoryOptions = mode === "service"
    ? AGRI_DATA.SERVICE_TYPES
    : AGRI_DATA.LISTING_CATEGORIES;

  const [category, setCategory] = useStateB(prefill?.category || "");
  const [title, setTitle] = useStateB(prefill?.title || "");
  const [desc, setDesc] = useStateB(prefill?.description || "");
  const [negotiable, setNegotiable] = useStateB(prefill?.negotiable ?? true);
  const [price, setPrice] = useStateB(prefill?.price || "");
  const [priceUnit, setPriceUnit] = useStateB(
    prefill?.priceUnit || (mode === "service" ? "hour" : "quintal")
  );
  const [quantity, setQuantity] = useStateB(prefill?.quantity || "");
  const [photos, setPhotos] = useStateB(prefill?.photos || []);
  const fileInputRef = useRefB(null);
  const [village, setVillage] = useStateB(prefill?.village || "Hanamkonda");
  const [district, setDistrict] = useStateB(prefill?.district || "Warangal");
  const [stateVal, setStateVal] = useStateB(prefill?.state || "Telangana");
  const [whatsappEnabled, setWhatsappEnabled] = useStateB(true);
  const [submitting, setSubmitting] = useStateB(false);
  const [submitted, setSubmitted] = useStateB(false);

  useEffectB(() => {
    if (!title && !category) return;
    // Draft autosave indication
  }, [title, desc]);

  const placeholderByCat = mode === "service" ? {
    rental:     "eg. Mahindra 575 Tractor on Hire — ₹650/hr",
    harvesting: "eg. Combine Harvester — ₹2,200/acre",
    spraying:   "eg. Drone Spraying — ₹400/acre",
    veterinary: "eg. Mobile Vet — AI & Vaccination",
    transport:  "eg. Mini Truck for Mandi Pickup",
    labour:     "eg. 5 Daily Wage Workers Available",
    soil:       "eg. Soil Testing — ₹250 per sample",
    other:      "eg. Custom service you offer",
  } : {
    crop:       "eg. 50 Quintal Rice for Sale",
    seeds:      "eg. Hybrid Tomato Seeds — 1000 packets",
    fertilizer: "eg. Organic Vermicompost — 50 kg bags",
    pesticide:  "eg. Neem-based Pesticide — 5L cans",
    livestock:  "eg. Murrah Buffalo — 12L/day",
    land:       "eg. 3 Acres Irrigated Land — Lease",
    equipment:  "eg. Sonalika Rotavator (good condition)",
    other:      "eg. ",
  };

  const canSubmit = category && title.length >= 6;
  const submit = () => {
    if (!canSubmit) return;
    setSubmitting(true);

    // Map mode + selected category back into the canonical category/subcategory
    let outCat = category;
    let outSub = null;
    if (mode === "service") {
      outCat = "service";
      outSub = category;
      // Equipment-rental services live as "equipment" in the existing data model
      if (category === "rental") outCat = "equipment";
    } else if (["seeds", "fertilizer", "pesticide"].includes(category)) {
      outCat = "input";
      outSub = category;
    }

    setTimeout(() => {
      setSubmitted(true);
      setTimeout(() => {
        onPost({
          category: outCat, subcategory: outSub,
          title, description: desc, price: +price || null,
          priceUnit, negotiable, quantity, photos,
          village, district, state: stateVal, whatsappEnabled
        });
      }, 800);
    }, 800);
  };

  if (submitted) {
    return (
      <div style={{ height: "100%", display: "grid", placeItems: "center", background: "var(--bg)" }}>
        <div style={{ textAlign: "center", animation: "scaleIn 240ms" }}>
          <div style={{
            width: 96, height: 96, margin: "0 auto 20px",
            background: "var(--primary)", borderRadius: 999,
            display: "grid", placeItems: "center", color: "white",
            boxShadow: "0 12px 30px -8px var(--primary)"
          }}>
            <Icon name="check" size={48} color="white" stroke={3} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28 }}>Posted!</div>
          <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 6 }}>
            Your {mode === "service" ? "service" : "listing"} is now live
          </div>
        </div>
      </div>
    );
  }

  const title_text = mode === "service" ? "Post a Service" : "Post a Listing";
  const cat_label = mode === "service" ? "Type of service" : "Category";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="topbar with-border">
        <button className="icon-btn" onClick={onBack}><Icon name="close" size={22} /></button>
        <div className="title">{title_text}</div>
        <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Draft saved</span>
      </div>

      <div className="scroll" style={{ padding: "16px 16px 24px" }}>
        {/* Mode chip — orients the user */}
        <div style={{ marginBottom: 14 }}>
          <span className="post-mode-chip">
            <Icon name={mode === "service" ? "tool" : "wheat"} size={12} />
            {mode === "service" ? "Service offering" : "Item for sale"}
          </span>
        </div>

        {/* Category selector */}
        <div className="field">
          <label className="field-label">{cat_label} <span className="req">*</span></label>
          <div style={{
            display: "grid",
            gridTemplateColumns: mode === "service" ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
            gap: 8
          }}>
            {categoryOptions.map(c => {
              const active = category === c.id;
              const isServiceCat = mode === "service";
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  style={{
                    minHeight: isServiceCat ? 76 : 84,
                    background: active ? "var(--primary)" : "var(--surface)",
                    color: active ? "var(--primary-ink)" : "var(--ink)",
                    border: active ? "0" : "1px solid var(--border)",
                    borderRadius: 14,
                    display: "flex",
                    flexDirection: isServiceCat ? "row" : "column",
                    alignItems: "center",
                    justifyContent: isServiceCat ? "flex-start" : "center",
                    gap: isServiceCat ? 10 : 6,
                    padding: isServiceCat ? "10px 12px" : "8px",
                    textAlign: isServiceCat ? "left" : "center",
                    cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: isServiceCat ? 36 : 36,
                    height: isServiceCat ? 36 : 36,
                    borderRadius: 10,
                    background: active ? "rgba(255,255,255,0.18)" : "var(--surface-2)",
                    display: "grid", placeItems: "center", flexShrink: 0,
                  }}>
                    <Icon name={c.icon} size={20} stroke={1.8} />
                  </div>
                  <div style={{ flex: isServiceCat ? 1 : "none", minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.15 }}>{c.label}</div>
                    {isServiceCat && c.hint && (
                      <div style={{
                        fontSize: 10, lineHeight: 1.3, marginTop: 2,
                        opacity: 0.72,
                      }}>{c.hint}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <label className="field-label">Title <span className="req">*</span></label>
          <input
            className="input"
            placeholder={placeholderByCat[category] || "What are you listing?"}
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={120}
          />
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6, textAlign: "right" }}>{title.length}/120</div>
        </div>

        <div className="field">
          <label className="field-label">Description</label>
          <textarea
            className="input"
            placeholder="Variety, quality, storage details, where buyers should visit…"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows={3}
          />
        </div>

        {/* Price */}
        <div className="field">
          <label className="field-label">Price</label>
          <div style={{ display: "flex", gap: 8 }}>
            <div className="input-row" style={{ flex: 2 }}>
              <div className="prefix">₹</div>
              <input className="input" type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
            <select className="input" style={{ flex: 1, height: 52 }} value={priceUnit} onChange={e => setPriceUnit(e.target.value)}>
              <option value="quintal">/ quintal</option>
              <option value="kg">/ kg</option>
              <option value="acre">/ acre</option>
              <option value="day">/ day</option>
              <option value="hour">/ hour</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13 }}>
            <button
              onClick={() => setNegotiable(!negotiable)}
              style={{
                width: 36, height: 22, borderRadius: 999,
                background: negotiable ? "var(--primary)" : "var(--border-strong)",
                position: "relative", transition: "background 150ms",
              }}
            >
              <div style={{
                position: "absolute", top: 2, left: negotiable ? 16 : 2,
                width: 18, height: 18, borderRadius: 999, background: "white",
                transition: "left 150ms"
              }} />
            </button>
            <span>Price is negotiable</span>
          </label>
        </div>

        <div className="field">
          <label className="field-label">Quantity / Amount</label>
          <input className="input" placeholder="eg. 50 Quintals" value={quantity} onChange={e => setQuantity(e.target.value)} />
        </div>

        {/* Photos */}
        <div className="field">
          <label className="field-label">Photos <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>(up to 6)</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: "relative", aspectRatio: 1 }}>
                <ImgPh category={category || "other"} label={p} style={{ width: "100%", height: "100%", borderRadius: 12 }} />
                <button
                  onClick={() => setPhotos(photos.filter((_, x) => x !== i))}
                  style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 999, background: "rgba(0,0,0,0.6)", color: "white", display: "grid", placeItems: "center" }}
                >
                  <Icon name="close" size={12} />
                </button>
              </div>
            ))}
            {photos.length < 6 && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  style={{ display: "none" }}
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    const names = files.map((f, i) => f.name || `photo ${photos.length + i + 1}`);
                    setPhotos(p => [...p, ...names].slice(0, 6));
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    aspectRatio: 1, background: "var(--surface)", borderRadius: 12,
                    border: "2px dashed var(--border-strong)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                    color: "var(--ink-3)"
                  }}
                >
                  <Icon name="camera" size={22} stroke={1.6} />
                  <span style={{ fontSize: 10 }}>Add photo</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="field">
          <label className="field-label">Location</label>
          <div className="form-group">
            <div className="list-row">
              <span className="row-label">Village</span>
              <input value={village} onChange={e => setVillage(e.target.value)} style={{ textAlign: "right", border: 0, background: "transparent", outline: 0, color: "var(--ink-2)", fontSize: 14, width: "60%" }} />
            </div>
            <div className="list-row">
              <span className="row-label">District</span>
              <span className="row-meta">{district}</span>
            </div>
            <div className="list-row">
              <span className="row-label">State</span>
              <span className="row-meta">{stateVal}</span>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="field">
          <label className="field-label">Contact preferences</label>
          <div className="form-group">
            <div className="list-row">
              <Icon name="phone" size={18} color="var(--ink-3)" />
              <span className="row-label">+91 98●●●●●●00</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Default</span>
            </div>
            <div className="list-row">
              <Icon name="whatsapp" size={18} color="var(--whatsapp)" />
              <span className="row-label">Allow WhatsApp contact</span>
              <button
                onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                style={{
                  width: 40, height: 24, borderRadius: 999,
                  background: whatsappEnabled ? "var(--primary)" : "var(--border-strong)",
                  position: "relative",
                }}
              >
                <div style={{
                  position: "absolute", top: 2, left: whatsappEnabled ? 18 : 2,
                  width: 20, height: 20, borderRadius: 999, background: "white",
                  transition: "left 150ms"
                }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-action">
        <Button full disabled={!canSubmit || submitting} onClick={submit}>
          {submitting ? "Posting…" : t("post.submit")}
        </Button>
      </div>
    </div>
  );
};

Object.assign(window, { BrowseScreen, ListingDetailScreen, PostListingScreen });
