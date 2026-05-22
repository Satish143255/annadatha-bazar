import React from 'react';
import { Icon } from '../icons/Icon.jsx';
import { ListingCard, WeatherIcon, useT, formatINR } from '../components/index.jsx';

// ===== H1 Home Feed =====

const { useState } = React;

const HomeScreen = ({ user, listings, prices, pricesState, weather, updates, updatesState, onOpenListing, onNavTab, onOpenNotifs, unreadNotifs, onPostListing, lang }) => {
  const t = useT(lang);
  const hour = new Date().getHours();
  const greet = hour < 12 ? t("greeting.morning") : hour < 17 ? t("greeting.day") : t("greeting.evening");

  // ----- listing buckets (sorted by distance) -----
  const byDistance = (a, b) => a.distance - b.distance;
  const cropsNearby     = listings.filter(l => l.category === "crop").sort(byDistance);
  const livestockNearby = listings.filter(l => l.category === "livestock").sort(byDistance);
  const inputLandNearby = listings.filter(l => l.category === "input" || l.category === "land").sort(byDistance);
  const equipmentNearby = listings.filter(l => l.category === "equipment").sort(byDistance);
  const vetNearby       = listings.filter(l => l.subcategory === "veterinary").sort(byDistance);
  const otherSvcNearby  = listings.filter(l => l.category === "service" && l.subcategory !== "veterinary").sort(byDistance);

  // Matching crops appear as a small "For You" strip.
  const matching = listings.filter(l =>
    user.crops.some(c => l.title.toLowerCase().includes(c)) ||
    user.crops.includes(l.category)
  ).slice(0, 4);

  const availablePrices = prices;
  const userPrices = availablePrices.filter(p =>
    user.crops.some(c => p.commodity.toLowerCase().includes(c))
  );
  const displayPrices = (userPrices.length ? userPrices : availablePrices).slice(0, 6);

  const w = weather?.current;

  return (
    <div className="scroll">
      {/* Brand top bar */}
      <div className="topbar brand">
        <div className="brand-name" style={{ flex: 1 }}>
          Annadata<span className="leaf">.</span>Bazar
        </div>
        <button className="icon-btn" onClick={onOpenNotifs} style={{ position: "relative" }}>
          <Icon name="bell" size={22} />
          {unreadNotifs > 0 && (
            <span style={{
              position: "absolute", top: 6, right: 6,
              minWidth: 16, height: 16, padding: "0 4px",
              background: "var(--terra)", color: "white",
              fontSize: 10, fontWeight: 700, borderRadius: 999,
              display: "grid", placeItems: "center",
              border: "2px solid var(--bg)",
            }}>{unreadNotifs}</span>
          )}
        </button>
      </div>

      {/* Greeting */}
      <div style={{ padding: "0 16px 12px" }}>
        <div style={{ fontSize: 14, color: "var(--ink-3)" }}>{greet}, {user.name.split(" ")[0]}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--ink-2)", marginTop: 2 }}>
          <Icon name="pin" size={12} />
          <span>{user.village}, {user.district}</span>
        </div>
      </div>

      {/* Weather strip */}
      <div style={{ padding: "0 16px 12px" }}>
        <div className="weather-strip" onClick={() => onNavTab("discover", "weather")}>
          {!w && (
            <>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>Weather data unavailable</div>
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>Connect a live provider for production advisories.</div>
              </div>
              <Icon name="chevron" size={18} style={{ opacity: 0.5 }} />
            </>
          )}
          {w && (
          <>
          <div style={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 999, background: "rgba(255,255,255,0.4)" }}>
            <WeatherIcon name={w.icon} size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 26, lineHeight: 1, letterSpacing: "-0.01em" }}>
              {w.temp} C<span style={{ fontSize: 13, fontFamily: "var(--font-sans)", marginLeft: 6, opacity: 0.7 }}>{w.condition}</span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
              <Icon name="drop" size={10} /> {w.rainProb}% rain - <Icon name="wind" size={10} /> {w.wind} km/h
            </div>
          </div>
          <Icon name="chevron" size={18} style={{ opacity: 0.5 }} />
          </>
          )}
        </div>
      </div>

      {/* Mandi prices strip */}
      <div className="section-head">
        <h3>{t("home.prices")}</h3>
        <button className="more" onClick={() => onNavTab("discover", "prices")}>See all</button>
      </div>
      <div className="hscroll">
        {displayPrices.map(p => (
          <div key={p.commodity} onClick={() => onNavTab("discover", "prices")} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "12px 14px", minWidth: 152, flexShrink: 0
          }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 2 }}>{p.commodity}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary)", letterSpacing: "-0.01em", lineHeight: 1 }}>
              {formatINR(p.modal)}<span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-sans)", marginLeft: 2 }}>/qtl</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              <span className="price-pill up">{p.date || "Latest"}</span>
              <span style={{ fontSize: 10, color: "var(--ink-3)" }}>{p.district}</span>
            </div>
          </div>
        ))}
        {displayPrices.length === 0 && (
          <div className="news-card">
            <div className="news-card-title">
              {pricesState === "error" ? "Live mandi prices unavailable" : "Live mandi prices loading"}
            </div>
            <div className="news-card-body">
              {pricesState === "error"
                ? "The app will not substitute demo rates while data.gov.in is unreachable."
                : "Prices come from AGMARKNET through data.gov.in."}
            </div>
          </div>
        )}
      </div>

      {/* Split listing and service posting paths. */}
      <div style={{ padding: "8px 16px 16px" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
        }}>
          <button onClick={() => onPostListing("listing")} className="post-cta primary">
            <div className="post-cta-icon">
              <Icon name="plus" size={20} stroke={2.2} />
            </div>
            <div className="post-cta-body">
              <div className="post-cta-title">Post a Listing</div>
              <div className="post-cta-sub">Crops - Seeds - Pesticides</div>
            </div>
          </button>
          <button onClick={() => onPostListing("service")} className="post-cta secondary">
            <div className="post-cta-icon">
              <Icon name="tool" size={20} stroke={2} />
            </div>
            <div className="post-cta-body">
              <div className="post-cta-title">Post a Service</div>
              <div className="post-cta-sub">Rentals - Vet - Spraying</div>
            </div>
          </button>
        </div>
      </div>

      {/* Trending News & Schemes */}
      <NewsSchemesSection items={updates} state={updatesState} />

      {/* Matching user's crops */}
      {matching.length > 0 && (
        <>
          <div className="section-head">
            <h3>{t("home.matching")}</h3>
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{user.crops.slice(0, 2).join(", ")}</span>
          </div>
          <div className="hscroll stagger-list">
            {matching.map(l => (
              <div key={l.id} style={{ width: 188, flexShrink: 0 }} onClick={() => onOpenListing(l)}>
                <ListingCard listing={l} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* ============ GROUP: POSTS ============ */}
      <GroupHeader title="Marketplace posts" subtitle="Buy & sell from nearby farmers" />

      <NearbySection
        title="Crops nearby"
        icon="wheat"
        items={cropsNearby}
        radius={50}
        onOpenListing={onOpenListing}
        onSeeAll={() => onNavTab("browse", null, { category: "crop" })}
        onOpenMap={() => onNavTab("discover", "nearby", { category: "crop" })}
      />
      <NearbySection
        title="Livestock nearby"
        icon="leaf"
        items={livestockNearby}
        radius={50}
        onOpenListing={onOpenListing}
        onSeeAll={() => onNavTab("browse", null, { category: "livestock" })}
        onOpenMap={() => onNavTab("discover", "nearby", { category: "livestock" })}
      />
      <NearbySection
        title="Land & inputs nearby"
        icon="seed"
        items={inputLandNearby}
        radius={50}
        onOpenListing={onOpenListing}
        onSeeAll={() => onNavTab("browse", null, { category: "input" })}
        onOpenMap={() => onNavTab("discover", "nearby", { category: "input" })}
      />

      {/* ============ GROUP: SERVICES & RENTALS ============ */}
      <GroupHeader title="Services & rentals" subtitle="Hire equipment, vets and other services" />

      <NearbySection
        title="Equipment rentals nearby"
        icon="tractor"
        items={equipmentNearby}
        radius={50}
        onOpenListing={onOpenListing}
        onSeeAll={() => onNavTab("browse", null, { category: "equipment" })}
        onOpenMap={() => onNavTab("discover", "nearby", { category: "equipment" })}
      />
      <NearbySection
        title="Veterinary nearby"
        icon="vet"
        items={vetNearby}
        radius={50}
        onOpenListing={onOpenListing}
        onSeeAll={() => onNavTab("discover", "nearby", { category: "veterinary" })}
        onOpenMap={() => onNavTab("discover", "nearby", { category: "veterinary" })}
      />
      <NearbySection
        title="Other services nearby"
        icon="tool"
        items={otherSvcNearby}
        radius={50}
        onOpenListing={onOpenListing}
        onSeeAll={() => onNavTab("browse", null, { category: "service" })}
        onOpenMap={() => onNavTab("discover", "nearby", { category: "service" })}
      />

      <div style={{ height: 24 }} />
    </div>
  );
};

// ---------- Group header (Posts / Services & Rentals) ----------
const GroupHeader = ({ title, subtitle }) => (
  <div style={{
    margin: "20px 16px 6px",
    paddingTop: 14,
    borderTop: "1px solid var(--border)",
  }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {title}
    </div>
    {subtitle && (
      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{subtitle}</div>
    )}
  </div>
);

// ---------- Reusable nearby section ----------
const NearbySection = ({ title, icon, items, radius, onOpenListing, onSeeAll, onOpenMap }) => {
  const filtered = items.filter(l => l.distance <= radius);
  const display = filtered.slice(0, 6);
  const closest = filtered[0];

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "0 16px 8px",
      }}>
        <span style={{ display: "grid", placeItems: "center", width: 24, height: 24, color: "var(--primary)" }}>
          <Icon name={icon} size={18} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
            {filtered.length > 0
              ? `${filtered.length} within ${radius}km${closest ? ` - closest ${closest.distance}km` : ""}`
              : `None within ${radius}km`}
          </div>
        </div>
        {filtered.length > 0 && (
          <>
            <button
              onClick={onOpenMap}
              aria-label="Map"
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: "var(--surface-2)", border: "1px solid var(--border)",
                display: "grid", placeItems: "center",
                color: "var(--ink-2)", cursor: "pointer",
              }}
            >
              <Icon name="map" size={14} />
            </button>
            <button
              onClick={onSeeAll}
              style={{
                background: "transparent", border: 0,
                fontSize: 12, color: "var(--primary)", fontWeight: 500,
                padding: "6px 4px", cursor: "pointer",
              }}
            >
              See all
            </button>
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "0 16px" }}>
          <div style={{
            background: "var(--surface-2)", border: "1px dashed var(--border-strong)",
            borderRadius: 14, padding: "16px 14px",
            fontSize: 12, color: "var(--ink-3)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <Icon name="pin" size={16} color="var(--ink-4)" />
            <span style={{ flex: 1 }}>Nothing listed within {radius}km right now.</span>
            <button
              onClick={onOpenMap}
              style={{ background: "transparent", border: 0, fontSize: 12, color: "var(--primary)", fontWeight: 500 }}
            >
              Open map
            </button>
          </div>
        </div>
      ) : (
        <div className="hscroll stagger-list">
          {display.map(l => (
            <div key={l.id} style={{ width: 196, flexShrink: 0, position: "relative" }} onClick={() => onOpenListing(l)}>
              <ListingCard listing={l} />
              <div style={{
                position: "absolute", top: 8, right: 8,
                background: "rgba(27,36,24,0.85)", color: "white",
                padding: "3px 8px", borderRadius: 999,
                fontSize: 10, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <Icon name="pin" size={9} /> {l.distance}km
              </div>
            </div>
          ))}
          {/* See-all tail card */}
          <div
            onClick={onSeeAll}
            style={{
              width: 110, flexShrink: 0,
              border: "1px dashed var(--border-strong)",
              borderRadius: 14,
              background: "transparent",
              display: "grid", placeItems: "center",
              cursor: "pointer",
              color: "var(--primary)",
              padding: "12px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 999,
                background: "var(--primary-soft)",
                display: "grid", placeItems: "center",
                margin: "0 auto 8px",
              }}>
                <Icon name="chevron" size={16} color="var(--primary)" />
              </div>
              <div style={{ fontSize: 11, fontWeight: 600 }}>See all</div>
              <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>{filtered.length} listings</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Trending News & Schemes ----------
const NewsSchemesSection = ({ items, state }) => {
  const [filter, setFilter] = useState("all"); // all | scheme | news
  const [openItem, setOpenItem] = useState(null);
  const shown = items.filter(x => filter === "all" || x.kind === filter);

  return (
    <div>
      <div className="section-head">
        <h3>Trending News &amp; Schemes</h3>
        <div className="segmented mini" style={{ background: "var(--surface-2)" }}>
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
          <button className={filter === "scheme" ? "active" : ""} onClick={() => setFilter("scheme")}>Schemes</button>
          <button className={filter === "news" ? "active" : ""} onClick={() => setFilter("news")}>News</button>
        </div>
      </div>
      <div className="hscroll">
        {state === "loading" && (
          <div className="news-card">
            <div className="news-card-title">Loading official agriculture updates</div>
            <div className="news-card-body">Fetching live government sources.</div>
          </div>
        )}
        {state === "error" && items.length === 0 && (
          <div className="news-card">
            <div className="news-card-title">Official updates unavailable</div>
            <div className="news-card-body">The live source could not be reached. Retry after connectivity is restored.</div>
          </div>
        )}
        {shown.map(item => (
          <div
            key={item.id}
            onClick={() => setOpenItem(item)}
            className="news-card"
            style={{ borderLeft: `3px solid ${item.accent}` }}
          >
            <div className="news-card-meta">
              <span className="news-kind" style={{ color: item.accent, borderColor: item.accent }}>
                {item.kind === "scheme" ? "Scheme" : "News"}
              </span>
              <span className="news-date">{item.date}</span>
            </div>
            <div className="news-card-title">{item.title}</div>
            <div className="news-card-body">{item.body}</div>
            <div className="news-card-foot">
              <span className="news-tag">{item.tag}</span>
              {item.deadline && (
                <span className="news-deadline">
                  <Icon name="calendar" size={10} />
                  by {item.deadline}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {openItem && (
        <div className="news-modal-backdrop" onClick={() => setOpenItem(null)}>
          <div className="news-modal" onClick={e => e.stopPropagation()} style={{ borderTop: `4px solid ${openItem.accent}` }}>
            <div className="news-modal-head">
              <span className="news-kind" style={{ color: openItem.accent, borderColor: openItem.accent }}>
                {openItem.kind === "scheme" ? "Scheme" : "News"}
              </span>
              <button className="icon-btn" onClick={() => setOpenItem(null)} aria-label="Close">
                <Icon name="close" size={20} />
              </button>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1.2, marginTop: 6 }}>
              {openItem.title}
            </div>
            <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 12, lineHeight: 1.45 }}>
              {openItem.body}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
              <span className="news-tag">{openItem.tag}</span>
              {openItem.deadline && (
                <span className="news-deadline">
                  <Icon name="calendar" size={10} /> Apply by {openItem.deadline}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 14 }}>
              Source: {openItem.source} - {openItem.date}
            </div>
            <button
              className="news-cta"
              onClick={() => {
                if (openItem.link) window.open(openItem.link, "_blank", "noopener,noreferrer");
                setOpenItem(null);
              }}
              style={{ background: openItem.accent }}
            >
              {openItem.kind === "scheme" ? "View details" : "Read more"}
              <Icon name="chevron" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { HomeScreen };
