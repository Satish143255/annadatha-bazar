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
  const locationLabel = [user.village, user.district].filter(Boolean).join(", ")
    || (user.latitude != null && user.longitude != null ? "GPS location saved" : "Add your location");

  const w = weather?.current;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-none bg-[var(--surface-2)] text-[var(--ink)]">
      {/* Brand top bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[var(--surface)] sticky top-0 z-10 border-b border-[var(--border)]">
        <div className="font-sans font-extrabold text-2xl text-[var(--primary)] tracking-tight">
          Annadatha<span className="text-[var(--gold)]">Bazar</span>
        </div>
        <button
          className="w-[44px] h-[44px] flex items-center justify-center rounded-full hover:bg-[var(--surface-2)] transition-colors relative animate-none"
          onClick={onOpenNotifs}
        >
          <Icon name="bell" size={22} color="var(--ink)" />
          {unreadNotifs > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[var(--terra)] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--surface)]">
              {unreadNotifs}
            </span>
          )}
        </button>
      </div>

      {/* Greeting */}
      <div className="px-4 pb-3 pt-2">
        <div className="text-sm font-semibold text-[var(--ink-2)]">{greet}, {user.name.split(" ")[0]}</div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--ink-3)] mt-1 font-medium">
          <Icon name="pin" size={12} color="var(--ink-3)" />
          <span>{locationLabel}</span>
        </div>
      </div>

      {/* Weather strip */}
      <div className="px-4 pb-3">
        <div
          className="flex items-center gap-4 p-3 bg-gradient-to-br from-[#DBE7F0] to-[#C3D6E2] dark:from-[#1E2D38] dark:to-[#243B4A] rounded-xl text-[#1B3854] dark:text-[#D4E4EF] cursor-pointer min-h-[52px] transition-opacity hover:opacity-95"
          onClick={() => onNavTab("discover", "weather")}
        >
          {!w && (
            <>
              <div className="flex-1">
                <div className="font-semibold text-sm">Weather data unavailable</div>
                <div className="text-[11px] opacity-80 mt-0.5">Connect a live provider for production advisories.</div>
              </div>
              <Icon name="chevron" size={18} className="opacity-60" />
            </>
          )}
          {w && (
            <>
              <div className="flex items-center justify-center w-11 h-11 rounded-full bg-white/40">
                <WeatherIcon name={w.icon} size={26} />
              </div>
              <div className="flex-1">
                <div className="font-serif font-bold text-2xl leading-none">
                  {w.temp} C<span className="text-xs font-sans font-medium ml-1.5 opacity-80">{w.condition}</span>
                </div>
                <div className="text-[11px] opacity-80 mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-0.5"><Icon name="drop" size={10} /> {w.rainProb}% rain</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5"><Icon name="wind" size={10} /> {w.wind} km/h</span>
                </div>
              </div>
              <Icon name="chevron" size={18} className="opacity-60" />
            </>
          )}
        </div>
      </div>

      {/* Mandi prices strip */}
      <div className="flex items-baseline justify-between px-4 py-2">
        <h3 className="font-sans font-bold text-base text-[var(--ink)]">{t("home.prices")}</h3>
        <button
          className="text-xs text-[var(--primary)] font-bold px-2 py-1.5 h-[44px] flex items-center"
          onClick={() => onNavTab("discover", "prices")}
        >
          See all
        </button>
      </div>
      <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-none">
        {displayPrices.map(p => (
          <div
            key={p.commodity}
            onClick={() => onNavTab("discover", "prices")}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 min-w-[152px] shrink-0 cursor-pointer shadow-sm hover:shadow active:scale-[0.98] transition-all"
          >
            <div className="text-xs text-[var(--ink-3)] font-semibold mb-1 truncate">{p.commodity}</div>
            <div className="font-serif font-bold text-xl text-[var(--primary)] leading-none">
              {formatINR(p.modal)}<span className="text-[10px] font-sans font-normal text-[var(--ink-3)] ml-0.5">/qtl</span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-3">
              <span className="inline-block text-[10px] font-bold text-[var(--primary)] bg-[var(--primary-soft)] px-1.5 py-0.5 rounded-full truncate">
                {p.date || "Latest"}
              </span>
              <span className="text-[10px] text-[var(--ink-3)] font-semibold truncate">{p.district}</span>
            </div>
          </div>
        ))}
        {displayPrices.length === 0 && (
          <div className="w-[240px] shrink-0 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="text-sm font-bold text-[var(--ink)]">
              {pricesState === "error" ? "Live mandi prices unavailable" : "Live mandi prices loading"}
            </div>
            <div className="text-xs text-[var(--ink-3)] mt-1.5 leading-relaxed">
              {pricesState === "error"
                ? "The app will not substitute demo rates while data.gov.in is unreachable."
                : "Prices come from AGMARKNET through data.gov.in."}
            </div>
          </div>
        )}
      </div>

      {/* Split listing and service posting paths */}
      <div className="px-4 py-2">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onPostListing("listing")}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer bg-[var(--primary)] text-[var(--primary-ink)] hover:opacity-90 min-h-[48px] w-full transition-transform active:scale-[0.97] outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Icon name="plus" size={20} stroke={2.2} />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight">Post Listing</div>
              <div className="text-[10px] opacity-80 mt-0.5">Crops · Seeds</div>
            </div>
          </button>
          <button
            onClick={() => onPostListing("service")}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer bg-[var(--surface)] text-[var(--ink)] border border-[var(--border-strong)] hover:bg-[var(--surface-2)] min-h-[48px] w-full transition-transform active:scale-[0.97] outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <Icon name="tool" size={20} stroke={2} />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight">Post Service</div>
              <div className="text-[10px] text-[var(--ink-3)] mt-0.5">Rentals · Vet</div>
            </div>
          </button>
        </div>
      </div>

      {/* Trending News & Schemes */}
      <NewsSchemesSection items={updates} state={updatesState} />

      {/* Matching user's crops */}
      {matching.length > 0 && (
        <>
          <div className="flex items-baseline justify-between px-4 py-2 mt-2">
            <h3 className="font-sans font-bold text-base text-[var(--ink)]">{t("home.matching")}</h3>
            <span className="text-xs text-[var(--ink-3)] font-semibold">{user.crops.slice(0, 2).join(", ")}</span>
          </div>
          <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-none stagger-list">
            {matching.map(l => (
              <div key={l.id} className="w-[188px] shrink-0">
                <ListingCard listing={l} onClick={() => onOpenListing(l)} />
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
        onSeeAll={() => onNavTab("browse", null, { category: "veterinary" })}
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

      <div className="h-6" />
    </div>
  );
};

// ---------- Group header (Posts / Services & Rentals) ----------
const GroupHeader = ({ title, subtitle }) => (
  <div className="mx-4 mt-6 mb-2 pt-4 border-t border-[var(--border)]">
    <div className="text-[11px] font-bold text-[var(--ink-3)] uppercase tracking-wider">
      {title}
    </div>
    {subtitle && (
      <div className="text-xs text-[var(--ink-3)] mt-0.5">{subtitle}</div>
    )}
  </div>
);

// ---------- Reusable nearby section ----------
const NearbySection = ({ title, icon, items, radius, onOpenListing, onSeeAll, onOpenMap }) => {
  const filtered = items.filter(l => l.distance <= radius);
  const display = filtered.slice(0, 6);
  const closest = filtered[0];

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 px-4 pb-2">
        <span className="w-6 h-6 flex items-center justify-center text-[var(--primary)] shrink-0">
          <Icon name={icon} size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-[var(--ink)] leading-tight">{title}</div>
          <div className="text-[11px] text-[var(--ink-3)] mt-0.5 font-medium">
            {filtered.length > 0
              ? `${filtered.length} within ${radius}km${closest ? ` · closest ${closest.distance}km` : ""}`
              : `None within ${radius}km`}
          </div>
        </div>
        {filtered.length > 0 && (
          <>
            <button
              onClick={onOpenMap}
              aria-label="Map"
              className="w-11 h-11 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--ink-2)] cursor-pointer transition-transform active:scale-95"
            >
              <Icon name="map" size={14} />
            </button>
            <button
              onClick={onSeeAll}
              className="text-xs font-bold text-[var(--primary)] h-[44px] px-2 flex items-center justify-center cursor-pointer transition-opacity active:opacity-70"
            >
              See all
            </button>
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="px-4">
          <div className="bg-[var(--surface-2)] border border-dashed border-[var(--border-strong)] rounded-xl p-4 text-xs text-[var(--ink-3)] flex items-center gap-3">
            <Icon name="pin" size={16} className="text-[var(--ink-4)]" />
            <span className="flex-1 leading-normal">Nothing listed within {radius}km right now.</span>
            <button
              onClick={onOpenMap}
              className="text-xs font-bold text-[var(--primary)] px-1.5 h-[44px] flex items-center"
            >
              Open map
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-none stagger-list">
          {display.map(l => (
            <div key={l.id} className="w-[196px] shrink-0 relative">
              <ListingCard listing={l} onClick={() => onOpenListing(l)} />
              <div className="absolute top-2 right-2 bg-[#1b2418]/85 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 pointer-events-none">
                <Icon name="pin" size={9} /> {l.distance}km
              </div>
            </div>
          ))}
          {/* See-all tail card */}
          <div
            onClick={onSeeAll}
            className="w-[110px] shrink-0 border border-dashed border-[var(--border-strong)] rounded-xl bg-transparent flex items-center justify-center cursor-pointer p-3 text-[var(--primary)] transition-transform active:scale-95"
          >
            <div className="text-center">
              <div className="w-9 h-9 rounded-full bg-[var(--primary-soft)] flex items-center justify-center mx-auto mb-2">
                <Icon name="chevron" size={16} color="var(--primary)" />
              </div>
              <div className="text-xs font-bold">See all</div>
              <div className="text-[10px] text-[var(--ink-3)] mt-0.5 font-semibold">{filtered.length} listings</div>
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
      <div className="flex items-baseline justify-between px-4 py-2">
        <h3 className="font-sans font-bold text-base text-[var(--ink)]">Trending News &amp; Schemes</h3>
        <div className="flex bg-[var(--surface-2)] rounded-lg p-0.5 gap-0.5">
          <button
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all h-[32px] flex items-center ${filter === "all" ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--ink-2)]"}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all h-[32px] flex items-center ${filter === "scheme" ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--ink-2)]"}`}
            onClick={() => setFilter("scheme")}
          >
            Schemes
          </button>
          <button
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all h-[32px] flex items-center ${filter === "news" ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--ink-2)]"}`}
            onClick={() => setFilter("news")}
          >
            News
          </button>
        </div>
      </div>
      <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-none">
        {state === "loading" && (
          <div className="w-[248px] shrink-0 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="text-sm font-bold text-[var(--ink)] leading-tight">Loading official agriculture updates</div>
            <div className="text-xs text-[var(--ink-3)] mt-1.5">Fetching live government sources.</div>
          </div>
        )}
        {state === "error" && items.length === 0 && (
          <div className="w-[248px] shrink-0 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="text-sm font-bold text-[var(--terra)] leading-tight">Official updates unavailable</div>
            <div className="text-xs text-[var(--ink-3)] mt-1.5">The live source could not be reached. Retry after connectivity is restored.</div>
          </div>
        )}
        {shown.map(item => (
          <div
            key={item.id}
            onClick={() => setOpenItem(item)}
            className="w-[248px] shrink-0 bg-[var(--surface)] border border-[var(--border)] p-3.5 flex flex-col gap-2 cursor-pointer shadow-sm hover:shadow hover:-translate-y-0.5 active:scale-[0.98] transition-all border-l-4"
            style={{ borderLeftColor: item.accent }}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[9.5px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-[var(--surface)]"
                style={{ color: item.accent, borderColor: item.accent }}
              >
                {item.kind === "scheme" ? "Scheme" : "News"}
              </span>
              <span className="text-[10.5px] text-[var(--ink-3)] font-semibold">{item.date}</span>
            </div>
            <div className="font-serif text-sm font-bold leading-snug text-[var(--ink)] line-clamp-2">{item.title}</div>
            <div className="text-xs text-[var(--ink-2)] leading-relaxed line-clamp-2">{item.body}</div>
            <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-dashed border-[var(--border)]">
              <span className="text-[10px] font-bold text-[var(--ink-2)] bg-[var(--surface-2)] px-2 py-0.5 rounded">{item.tag}</span>
              {item.deadline && (
                <span className="text-[10px] font-bold text-[var(--terra)] bg-[var(--accent-terra-soft)] px-2 py-0.5 rounded flex items-center gap-1">
                  <Icon name="calendar" size={10} /> by {item.deadline}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {openItem && (
        <div className="news-modal-backdrop" onClick={() => setOpenItem(null)}>
          <div className="news-modal bg-[var(--bg)]" onClick={e => e.stopPropagation()} style={{ borderTop: `4px solid ${openItem.accent}` }}>
            <div className="news-modal-head">
              <span className="news-kind" style={{ color: openItem.accent, borderColor: openItem.accent }}>
                {openItem.kind === "scheme" ? "Scheme" : "News"}
              </span>
              <button
                className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-[var(--surface-2)] cursor-pointer"
                onClick={() => setOpenItem(null)}
                aria-label="Close"
              >
                <Icon name="close" size={20} color="var(--ink)" />
              </button>
            </div>
            <div className="font-serif font-bold text-2xl leading-snug text-[var(--ink)] mt-3">
              {openItem.title}
            </div>
            <div className="text-sm text-[var(--ink-2)] leading-relaxed mt-3 whitespace-pre-wrap">
              {openItem.body}
            </div>
            <div className="flex gap-2 flex-wrap mt-4">
              <span className="text-[11px] font-bold text-[var(--ink-2)] bg-[var(--surface-2)] px-2.5 py-1 rounded">{openItem.tag}</span>
              {openItem.deadline && (
                <span className="text-[11px] font-bold text-[var(--terra)] bg-[var(--accent-terra-soft)] px-2.5 py-1 rounded flex items-center gap-1.5">
                  <Icon name="calendar" size={11} /> Apply by {openItem.deadline}
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--ink-3)] mt-4 font-semibold">
              Source: {openItem.source} · {openItem.date}
            </div>
            <button
              className="news-cta text-white"
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
