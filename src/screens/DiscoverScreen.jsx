import React from 'react';
import { CROPS, STATES_DISTRICTS } from '../referenceData.js';
import { Icon } from '../icons/Icon.jsx';
import { Empty, ImgPh, WeatherIcon, useT, formatINR } from '../components/index.jsx';
import { fetchOfficialUpdates } from '../services/agricultureData.js';

// ===== Discover: D1 Prices, D2 Weather, D3 Nearby =====

const { useState: useStateD } = React;

// ---------- D1: Mandi Prices ----------
const PRICE_SERIES_COLORS = [
  "#1F5A3A", "#B05E2E", "#C8902C", "#2E5C8A",
  "#7A3A14", "#5E7A3A", "#8A4A6F", "#3A6F6A",
];

const MiniSparkline = ({ history, isUp }) => {
  if (!history || history.length < 2) return null;
  const w = 80, h = 24, pad = 2;
  const max = Math.max(...history);
  const min = Math.min(...history);
  const range = max - min || 1;
  const points = history.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (history.length - 1);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y];
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const strokeColor = isUp ? "#1F5A3A" : "#B05E2E"; // Forest Green or Clay/Terra
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-7" style={{ display: "block" }}>
      <path d={path} stroke={strokeColor} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2" fill={strokeColor} />
    </svg>
  );
};

const PricesScreen = ({ user, prices, state, onRetry, onToast, lang }) => {
  const t = useT(lang);
  const [expanded, setExpanded] = useStateD(null);
  const [q, setQ] = useStateD("");
  const [district] = useStateD(user.district);
  const [view, setView] = useStateD("cards");

  const userCropMatch = (commodity) => user.crops.some(c => commodity.toLowerCase().includes(c));
  const all = prices;
  const sorted = [...all].sort((a, b) => {
    const am = userCropMatch(a.commodity) ? 0 : 1;
    const bm = userCropMatch(b.commodity) ? 0 : 1;
    return am - bm;
  });
  const filtered = q ? sorted.filter(p => p.commodity.toLowerCase().includes(q.toLowerCase())) : sorted;

  // Graph view: which series are visible
  const [selected, setSelected] = useStateD([]);
  // Prices arrive async — seed the selection once data lands and prune
  // any commodity that no longer exists, but never wipe a user's picks.
  React.useEffect(() => {
    setSelected((sel) => {
      const stillValid = sel.filter(c => all.some(p => p.commodity === c));
      if (stillValid.length) return stillValid;
      return all.filter(p => p.history?.length > 1).slice(0, 5).map(p => p.commodity);
    });
  }, [all, setSelected]);
  const toggleSeries = (c) => {
    setSelected(sel => sel.includes(c) ? sel.filter(x => x !== c) : [...sel, c]);
  };
  const seriesColor = (commodity) => {
    const idx = filtered.findIndex(p => p.commodity === commodity);
    return PRICE_SERIES_COLORS[idx % PRICE_SERIES_COLORS.length];
  };

  return (
    <div className="scroll bg-[var(--surface-2)] text-[var(--ink)]">
      <div className="topbar with-border flex items-center justify-between px-4 py-2 bg-[var(--surface)]">
        <div className="title font-bold text-[var(--ink)] text-lg">{t("prices.title")}</div>
        <button className="h-9 px-3.5 rounded-full flex items-center gap-1 text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink-2)] hover:bg-[var(--surface-3)] transition-all cursor-pointer">
          <Icon name="pin" size={12} color="var(--ink-3)" />
          {district}
          <Icon name="chevronDown" size={12} color="var(--ink-3)" />
        </button>
      </div>

      {state === "loading" && (
        <div className="px-4 py-2 text-xs text-[var(--ink-3)] font-medium">
          Loading live AGMARKNET mandi prices from data.gov.in.
        </div>
      )}
      {state === "error" && (
        <div className="px-4 py-2 text-xs text-[var(--terra)] font-medium bg-[var(--terra-soft)] border-y border-[var(--border)] flex items-center justify-between gap-3">
          <span>Live mandi prices are unavailable right now. The app will not substitute demo rates.</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-2)] font-semibold cursor-pointer"
            >
              <Icon name="refresh" size={12} color="var(--ink-2)" /> Retry
            </button>
          )}
        </div>
      )}

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative flex items-center">
          <input
            className="w-full h-11 pl-11 pr-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--ink)] placeholder-[var(--ink-4)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)] transition-all font-sans text-sm"
            placeholder="Search crop..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-3)] pointer-events-none">
            <Icon name="search" size={18} color="var(--ink-3)" />
          </div>
        </div>
      </div>

      {/* View toggle */}
      <div className="px-4 pb-3.5">
        <div className="h-11 p-1 bg-[var(--surface-3)] rounded-full flex items-center gap-1">
          <button 
            className={`flex-1 h-9 rounded-full flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
              view === "cards" ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm" : "text-[var(--ink-3)] hover:text-[var(--ink)]"
            }`} 
            onClick={() => setView("cards")}
          >
            <Icon name="grid" size={14} /> Cards
          </button>
          <button 
            className={`flex-1 h-9 rounded-full flex-items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
              view === "table" ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm" : "text-[var(--ink-3)] hover:text-[var(--ink)]"
            }`} 
            onClick={() => setView("table")}
          >
            <Icon name="sort" size={14} /> Table
          </button>
          <button 
            className={`flex-1 h-9 rounded-full flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
              view === "graph" ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm" : "text-[var(--ink-3)] hover:text-[var(--ink)]"
            }`} 
            onClick={() => setView("graph")}
          >
            <Icon name="trendUp" size={14} /> Graph
          </button>
        </div>
      </div>

      {/* ===== TABLE VIEW ===== */}
      {view === "table" && (
        <div style={{ padding: "0 16px 24px" }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 0.7fr 0.7fr 0.7fr 0.7fr",
              gap: 0,
              padding: "10px 12px",
              background: "var(--surface-2)",
              borderBottom: "1px solid var(--border)",
              fontSize: 10,
              fontWeight: 600,
              color: "var(--ink-3)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              <div>Commodity</div>
              <div style={{ textAlign: "right" }}>Min</div>
              <div style={{ textAlign: "right" }}>Modal</div>
              <div style={{ textAlign: "right" }}>Max</div>
              <div style={{ textAlign: "right" }}>7d</div>
            </div>
            {filtered.map((p, i) => {
              const matched = userCropMatch(p.commodity);
              const emoji = CROPS.find(c => p.commodity.toLowerCase().includes(c.id))?.emoji || "Crop";
              return (
                <div
                  key={p.commodity}
                  onClick={() => setExpanded(expanded === p.commodity ? null : p.commodity)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 0.7fr 0.7fr 0.7fr 0.7fr",
                    gap: 0,
                    padding: "12px 12px",
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "0",
                    background: matched ? "var(--primary-soft)" : "transparent",
                    cursor: "pointer",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{emoji}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.commodity}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.market}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-2)" }}>
                    {p.min.toLocaleString("en-IN")}
                  </div>
                  <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>
                    {p.modal.toLocaleString("en-IN")}
                  </div>
                  <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-2)" }}>
                    {p.max.toLocaleString("en-IN")}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="price-pill up" style={{ padding: "2px 6px", fontSize: 10 }}>
                      {p.date || "Latest"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 10, textAlign: "center" }}>
            All prices in Rs/quintal - tap a row for details
          </div>
        </div>
      )}

      {/* ===== GRAPH VIEW ===== */}
      {view === "graph" && (
        <div style={{ padding: "0 16px 24px" }}>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>7-day price trend</div>
              <div style={{ fontSize: 10, color: "var(--ink-3)" }}>% change from May 14</div>
            </div>
            {filtered.some(p => p.history?.length > 1) ? (
              <MultiPriceChart
                series={filtered.filter(p => selected.includes(p.commodity) && p.history?.length > 1)}
                colorOf={seriesColor}
              />
            ) : (
              <div style={{ height: 180, display: "grid", placeItems: "center", background: "var(--surface-2)", borderRadius: 10, fontSize: 12, color: "var(--ink-3)", textAlign: "center", padding: 20 }}>
                The official daily feed provides current mandi prices. Historical series require a stored backend history.
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
              {filtered.filter(p => p.history?.length > 1).map(p => {
                const on = selected.includes(p.commodity);
                const color = seriesColor(p.commodity);
                return (
                  <button
                    key={p.commodity}
                    onClick={() => toggleSeries(p.commodity)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      borderRadius: 999,
                      border: `1px solid ${on ? color : "var(--border)"}`,
                      background: on ? color : "var(--surface)",
                      color: on ? "white" : "var(--ink-2)",
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: "pointer",
                      opacity: on ? 1 : 0.7,
                    }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: 999,
                      background: on ? "white" : color,
                      flexShrink: 0,
                    }} />
                    {p.commodity}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Per-commodity strip */}
          <div className="section-head" style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 14 }}>Current modal price</h3>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {filtered.filter(p => selected.includes(p.commodity) && p.history?.length > 1).map(p => {
              const color = seriesColor(p.commodity);
              const pctFromStart = ((p.history[p.history.length - 1] - p.history[0]) / p.history[0]) * 100;
              return (
                <div key={p.commodity} className="card tight" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px" }}>
                  <div style={{ width: 4, height: 28, borderRadius: 2, background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.1 }}>{p.commodity}</div>
                    <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>{p.market}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "var(--primary)", lineHeight: 1 }}>
                      {formatINR(p.modal)}
                    </div>
                    <div style={{ fontSize: 10, color: pctFromStart >= 0 ? "var(--primary)" : "var(--terra)", marginTop: 3, fontFamily: "var(--font-mono)" }}>
                      {pctFromStart >= 0 ? "+" : ""}{pctFromStart.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
            {selected.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "var(--ink-3)" }}>
                Select a commodity above to see its trend
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== CARDS VIEW ===== */}
      {view === "cards" && (
        <div className="px-4 pb-6">
          {filtered.map((p) => {
            const isOpen = expanded === p.commodity;
            const matched = userCropMatch(p.commodity);
            const pct = p.history && p.history.length > 1 
              ? ((p.history[p.history.length - 1] - p.history[0]) / p.history[0]) * 100 
              : 0;
            const isUp = pct >= 0;
            const emoji = CROPS.find(c => p.commodity.toLowerCase().includes(c.id))?.emoji || "🌾";

            return (
              <div 
                key={p.commodity} 
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm mb-3 active:scale-[0.99] transition-all duration-200"
              >
                <div
                  onClick={() => setExpanded(isOpen ? null : p.commodity)}
                  className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-[var(--surface-2)] transition-colors gap-3 ${
                    matched ? "bg-[var(--primary-soft)]/20" : "bg-[var(--surface)]"
                  }`}
                >
                  {/* Crop Icon + details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                      matched ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "bg-[var(--surface-3)] text-[var(--ink-2)]"
                    }`}>
                      {emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--ink)] flex items-center gap-1.5 flex-wrap">
                        <span>{p.commodity}</span>
                        {matched && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-[var(--primary)] text-[var(--primary-ink)] px-1.5 py-0.5 rounded">
                            Your Crop
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--ink-3)] truncate font-medium mt-0.5">
                        {p.market} • {p.variety}
                      </div>
                    </div>
                  </div>

                  {/* Sparkline in the middle */}
                  <div className="flex-1 flex justify-center">
                    <MiniSparkline history={p.history} isUp={isUp} />
                  </div>

                  {/* Price and trend on the right */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-serif font-bold text-xl text-[var(--primary)] tracking-tight leading-none">
                      {formatINR(p.modal)}
                      <span className="font-sans font-normal text-[10px] text-[var(--ink-3)] ml-0.5">/q</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {p.history && p.history.length > 1 ? (
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isUp 
                            ? "bg-[var(--primary-soft)] text-[var(--primary)]" 
                            : "bg-[var(--terra-soft)] text-[var(--terra)]"
                        }`}>
                          <Icon name={isUp ? "trendUp" : "trendDown"} size={8} color={isUp ? "var(--primary)" : "var(--terra)"} stroke={3} />
                          {isUp ? "+" : ""}{pct.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="bg-[var(--surface-3)] text-[var(--ink-3)] px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {p.date || "Latest"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="p-3.5 border-t border-[var(--border)] bg-[var(--surface-2)]/30">
                    {/* Detailed Chart */}
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-[var(--ink-3)] mb-2">7-day price trend details</div>
                      {p.history?.length > 1 ? (
                        <PriceChart history={p.history} />
                      ) : (
                        <div className="bg-[var(--surface-3)] text-[var(--ink-3)] rounded-xl p-3 text-xs text-center font-medium">
                          Current official snapshot only. Historical price tracking is not available yet.
                        </div>
                      )}
                    </div>

                    {/* Min/Max/Modal stats */}
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { label: "Min Price", val: p.min, color: "text-[var(--terra)]", bg: "bg-[var(--terra-soft)]" },
                        { label: "Modal Rate", val: p.modal, color: "text-[var(--primary)]", bg: "bg-[var(--primary-soft)]" },
                        { label: "Max Price", val: p.max, color: "text-[var(--ink)]", bg: "bg-[var(--surface-3)]" },
                      ].map(stat => (
                        <div key={stat.label} className={`p-3 rounded-xl border border-[var(--border)] ${stat.bg}`}>
                          <div className="text-[10px] font-semibold text-[var(--ink-3)] uppercase tracking-wider mb-1">{stat.label}</div>
                          <div className={`font-serif font-bold text-base leading-tight ${stat.color}`}>{formatINR(stat.val)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={() => onToast?.(`We'll alert you when ${p.commodity} prices move`, "bell")}
                        className="w-full h-11 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--ink-2)] hover:bg-[var(--surface-2)] cursor-pointer transition-colors"
                      >
                        <Icon name="bell" size={14} color="var(--ink-2)" />
                        Set Price Alert
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-gold-soft)] text-[var(--gold)] px-1.5 py-0.5 rounded ml-1">Soon</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="py-6 text-center text-xs text-slate-400 font-medium">
        <Icon name="refresh" size={12} /> Source: AGMARKNET via data.gov.in
      </div>
    </div>
  );
};

// Multi-commodity normalized line chart (% from history[0])
const MultiPriceChart = ({ series, colorOf }) => {
  const w = 320, h = 180, padL = 32, padR = 8, padT = 10, padB = 22;
  const days = ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"];

  if (!series.length) {
    return (
      <div style={{
        height: 180, display: "grid", placeItems: "center",
        background: "var(--surface-2)", borderRadius: 10,
        fontSize: 12, color: "var(--ink-3)"
      }}>
        No commodities selected
      </div>
    );
  }

  // Normalize each series to % from first day
  const norm = series.map(s => s.history.map(v => ((v - s.history[0]) / s.history[0]) * 100));
  const flat = norm.flat();
  let minY = Math.min(...flat, 0);
  let maxY = Math.max(...flat, 0);
  // pad y-range a little
  const padding = Math.max(1, (maxY - minY) * 0.1);
  minY -= padding; maxY += padding;
  const rangeY = maxY - minY || 1;

  const N = series[0].history.length;
  const xAt = (i) => padL + (i * (w - padL - padR)) / (N - 1);
  const yAt = (v) => padT + (h - padT - padB) - ((v - minY) / rangeY) * (h - padT - padB);
  const zeroY = yAt(0);

  // y-axis ticks
  const ticks = [minY, (minY + maxY) / 2, maxY];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 200, display: "block" }}>
      {/* horizontal grid + tick labels */}
      {ticks.map((tv, i) => {
        const y = yAt(tv);
        return (
          <g key={i}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray={tv === 0 ? "0" : "2 3"} />
            <text x={padL - 6} y={y + 3} fontSize="9" fill="var(--ink-3)" textAnchor="end" fontFamily="var(--font-mono)">
              {tv > 0 ? "+" : ""}{tv.toFixed(0)}%
            </text>
          </g>
        );
      })}
      {/* zero baseline emphasis */}
      <line x1={padL} x2={w - padR} y1={zeroY} y2={zeroY} stroke="var(--ink-3)" strokeWidth="0.6" opacity="0.5" />

      {/* x-axis labels */}
      {days.map((d, i) => (
        <text key={d} x={xAt(i)} y={h - 6} fontSize="9" fill="var(--ink-3)" textAnchor="middle">{d}</text>
      ))}

      {/* lines */}
      {series.map((s, si) => {
        const color = colorOf(s.commodity);
        const pts = s.history.map((v, i) => [xAt(i), yAt(((v - s.history[0]) / s.history[0]) * 100)]);
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
        const last = pts[pts.length - 1];
        return (
          <g key={s.commodity}>
            <path d={path} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"
              pathLength="1" strokeDasharray="1" className="chart-path-animated"
              style={{ animationDelay: `${si * 120}ms` }} />
            {pts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3 : 1.8} fill={i === pts.length - 1 ? color : "white"} stroke={color} strokeWidth="1.2" />
            ))}
            <circle cx={last[0]} cy={last[1]} r="5" fill={color} opacity="0.18" />
          </g>
        );
      })}
    </svg>
  );
};

// Simple SVG line+bar chart
const PriceChart = ({ history }) => {
  const w = 320, h = 80, pad = 12;
  const max = Math.max(...history);
  const min = Math.min(...history);
  const range = max - min || 1;
  const points = history.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (history.length - 1);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y];
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const area = `${path} L ${points[points.length - 1][0]} ${h - pad} L ${pad} ${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 88 }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartGrad)" />
      <path d={path} stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
        pathLength="1" strokeDasharray="1" className="chart-path-animated" />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === points.length - 1 ? 4 : 2.5} fill={i === points.length - 1 ? "var(--primary)" : "var(--surface)"} stroke="var(--primary)" strokeWidth="1.5" />
      ))}
    </svg>
  );
};

// ---------- D2: Weather ----------
const WeatherScreen = ({ weather, lang }) => {
  const t = useT(lang);
  const w = weather;

  if (!w) {
    return <Empty icon="sun" title="Weather data unavailable" body="Production weather requires a live weather provider and farmer location." />;
  }

  return (
    <div className="scroll">
      <div className="topbar">
        <div className="title">{t("weather.title")}</div>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
          <Icon name="pin" size={12} /> {w.location}
        </span>
      </div>

      {/* Big current */}
      <div style={{ padding: "8px 16px 16px" }}>
        <div style={{
          padding: "24px 20px",
          borderRadius: 22,
          background: "var(--weather-banner-bg)",
          color: "var(--weather-banner-text)",
          position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: -10, right: -10, opacity: 0.25 }}>
            <WeatherIcon name={w.current.icon} size={140} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 72, lineHeight: 0.9, letterSpacing: "-0.03em" }}>
            {w.current.temp} C
          </div>
          <div style={{ fontSize: 18, marginTop: 4 }}>{w.current.condition}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Feels like {w.current.feelsLike} C</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 24 }}>
            {[
              { label: "Humidity", val: `${w.current.humidity}%`, icon: "drop" },
              { label: "Wind", val: `${w.current.wind} km/h`, icon: "wind" },
              { label: "Rain", val: `${w.current.rainProb}%`, icon: "rain" },
              { label: "UV", val: `${w.current.uv}/10`, icon: "sun" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <Icon name={s.icon} size={16} stroke={1.6} />
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{s.val}</div>
                <div style={{ fontSize: 10, opacity: 0.7 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly */}
      <div className="section-head"><h3>Next 12 hours</h3></div>
      <div className="hscroll">
        {w.hourly.map((h, i) => (
          <div key={i} style={{
            background: i === 0 ? "var(--primary)" : "var(--surface)",
            color: i === 0 ? "white" : "var(--ink)",
            border: i === 0 ? "0" : "1px solid var(--border)",
            borderRadius: 14, padding: "12px 8px",
            minWidth: 60, textAlign: "center", flexShrink: 0
          }}>
            <div style={{ fontSize: 11, opacity: 0.75 }}>{h.time}</div>
            <div style={{ margin: "8px 0" }}>
              <WeatherIcon name={h.icon} size={26} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{h.temp} C</div>
            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
              <Icon name="drop" size={8} /> {h.rain}%
            </div>
          </div>
        ))}
      </div>

      {/* 5-day */}
      <div className="section-head"><h3>5-day forecast</h3></div>
      <div style={{ padding: "0 16px 16px" }}>
        <div className="card" style={{ padding: 0 }}>
          {w.daily.map((d, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "70px 36px 1fr 70px",
              alignItems: "center", padding: "12px 16px",
              borderBottom: i < w.daily.length - 1 ? "1px solid var(--border)" : "0",
              gap: 12
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{d.day}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{d.date}</div>
              </div>
              <WeatherIcon name={d.icon} size={22} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{d.low} C</span>
                <div style={{ flex: 1, height: 4, background: "var(--surface-2)", borderRadius: 999, position: "relative" }}>
                  <div style={{
                    position: "absolute",
                    left: `${((d.low - 22) / 18) * 100}%`,
                    right: `${100 - ((d.high - 22) / 18) * 100}%`,
                    top: 0, bottom: 0,
                    background: "linear-gradient(90deg, #6AB0E0 0%, var(--gold) 100%)",
                    borderRadius: 999,
                  }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{d.high} C</span>
              </div>
              <div style={{ textAlign: "right", fontSize: 11, color: d.rain >= 50 ? "var(--info)" : "var(--ink-3)" }}>
                <Icon name="drop" size={10} /> {d.rain}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advisory */}
      <div className="section-head"><h3>Farming Advisory</h3></div>
      <div style={{ padding: "0 16px 28px", display: "grid", gap: 10 }}>
        {w.advisory.map((a, i) => {
          const cfg = {
            warn: { bg: "var(--advisory-warn-bg)", color: "var(--advisory-warn-text)", icon: "warning" },
            info: { bg: "var(--advisory-info-bg)", color: "var(--advisory-info-text)", icon: "info" },
            tip: { bg: "var(--advisory-tip-bg)", color: "var(--advisory-tip-text)", icon: "leaf" },
          }[a.type];
          return (
            <div key={i} className="card tight" style={{ background: cfg.bg, border: 0, display: "flex", gap: 12 }}>
              <Icon name={cfg.icon} size={20} color={cfg.color} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{a.title}</div>
                <div style={{ fontSize: 12, color: cfg.color, opacity: 0.85, marginTop: 2, lineHeight: 1.4 }}>{a.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- D3: Nearby Services ----------
const NearbyScreen = ({ user, listings, onOpenListing, initialCategory = "all", lang }) => {
  const t = useT(lang);
  const [radius, setRadius] = useStateD(20);
  const [cat, setCat] = useStateD(initialCategory);
  const [view, setView] = useStateD("list");
  const [activePin, setActivePin] = useStateD(null);
  const profilePoint = pointOf(user);
  const [mapCenter, setMapCenter] = useStateD(profilePoint);
  const [locationState, setLocationState] = useStateD(profilePoint ? "profile" : "idle");

  React.useEffect(() => { setCat(initialCategory); }, [initialCategory, setCat]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationState("unsupported");
      return;
    }

    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setMapCenter({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationState("device");
      },
      () => setLocationState(profilePoint ? "profile" : "denied"),
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 8000 }
    );
  };

  const enrichedListings = listings.map((listing) => {
    const listingPoint = pointOf(listing);
    const liveDistance = mapCenter && listingPoint ? kmBetween(mapCenter, listingPoint) : null;
    return { ...listing, distance: liveDistance == null ? listing.distance : Number(liveDistance.toFixed(1)) };
  });

  const serviceCats = ["service", "equipment", "input", "livestock", "crop", "land"];
  const services = enrichedListings.filter(l => {
    if (Number.isFinite(l.distance) && l.distance > radius) return false;
    if (cat === "veterinary") return l.subcategory === "veterinary";
    return serviceCats.includes(l.category);
  });
  const filtered = cat === "all" || cat === "veterinary" ? services : services.filter(l => l.category === cat);

  return (
    <div className="scroll">
      <div className="topbar">
        <div className="title">{t("nearby.title")}</div>
        <select
          value={radius}
          onChange={e => setRadius(+e.target.value)}
          className="chip soft"
          style={{ height: 32, paddingRight: 24 }}
        >
          <option value={10}>10 km</option>
          <option value={20}>20 km</option>
          <option value={50}>50 km</option>
        </select>
      </div>

      {/* Map view */}
      {view === "map" && (
        <div style={{ padding: "0 16px 12px" }}>
          <HeatMap
            pins={filtered}
            center={mapCenter}
            radius={radius}
            activePin={activePin}
            setActivePin={setActivePin}
            onOpenListing={onOpenListing}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 11, color: "var(--ink-3)" }}>
            <button className="chip soft" onClick={useCurrentLocation} style={{ height: 30 }}>
              <Icon name="pin" size={13} />
              {locationState === "loading" ? "Locating..." : "Use my location"}
            </button>
            <span style={{ flex: 1 }}>
              {locationState === "device" && "Using this device location."}
              {locationState === "profile" && "Using the saved profile location."}
              {locationState === "idle" && "Enable location to map listings by GPS."}
              {locationState === "denied" && "Location permission is off. Map uses available listing distances."}
              {locationState === "unsupported" && "Browser location is unavailable."}
            </span>
          </div>
        </div>
      )}

      {/* Toggle */}
      <div style={{ padding: "0 16px 12px" }}>
        <div className="segmented">
          <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
            <Icon name="sort" size={14} /> List
          </button>
          <button className={view === "map" ? "active" : ""} onClick={() => setView("map")}>
            <Icon name="map" size={14} /> Map
          </button>
        </div>
      </div>

      {/* Category */}
      <div className="hscroll" style={{ padding: "0 16px 12px" }}>
        {[
          { id: "all", label: "All" },
          { id: "crop", label: "Crops" },
          { id: "equipment", label: "Equipment" },
          { id: "livestock", label: "Livestock" },
          { id: "veterinary", label: "Veterinary" },
          { id: "service", label: "Services" },
          { id: "input", label: "Inputs" },
          { id: "land", label: "Land" },
        ].map(c => (
          <button key={c.id} className={`chip${cat === c.id ? " active" : ""}`} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ padding: "0 16px 24px", display: "grid", gap: 10 }}>
        {filtered.length === 0 ? (
          <Empty
            icon="pin"
            title="Nothing nearby"
            body={`No ${cat === "all" ? "services" : cat} listings within ${radius}km. Try a wider radius.`}
          />
        ) : filtered.map(l => (
          <div key={l.id} onClick={() => onOpenListing(l)}>
            <div className="listing-card row" style={{ position: "relative" }}>
              <ImgPh category={l.category} label={l.photos[0]?.split(" ").slice(0, 2).join(" ")} />
              <div className="body">
                <div className="title">{l.title}</div>
                <div className="meta">
                  <Icon name="pin" size={11} />
                  <span>{l.village}, {l.district}</span>
                </div>
                <div style={{ marginTop: "auto", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <div className="price">{formatINR(l.price)}<small>/{l.priceUnit}</small></div>
                </div>
              </div>
              <div style={{
                position: "absolute", top: 8, right: 8,
                background: "var(--primary)", color: "var(--primary-ink)",
                padding: "3px 8px", borderRadius: 999,
                fontSize: 11, fontWeight: 600
              }}>
                {Number.isFinite(l.distance) ? `${l.distance}km` : "Nearby"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const pointOf = (item) => {
  const latitude = Number(item?.latitude);
  const longitude = Number(item?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
};

const kmBetween = (a, b) => {
  const radians = (value) => value * Math.PI / 180;
  const latDelta = radians(b.latitude - a.latitude);
  const lngDelta = radians(b.longitude - a.longitude);
  const latA = radians(a.latitude);
  const latB = radians(b.latitude);
  const h = Math.sin(latDelta / 2) ** 2
    + Math.cos(latA) * Math.cos(latB) * Math.sin(lngDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const categoryMarker = (listing) => {
  if (listing.subcategory === "veterinary") return { icon: "vet", color: "#B05E2E", label: "Veterinary" };
  const categories = {
    equipment: { icon: "tractor", color: "#1F5A3A", label: "Equipment" },
    input: { icon: "seed", color: "#2E5C8A", label: "Inputs" },
    crop: { icon: "wheat", color: "#C8902C", label: "Crops" },
    land: { icon: "field", color: "#7A8B5C", label: "Land" },
    livestock: { icon: "leaf", color: "#8A4A6F", label: "Livestock" },
    service: { icon: "tool", color: "#3A6F6A", label: "Service" },
  };
  return categories[listing.category] || { icon: "pin", color: "#6B7763", label: "Listing" };
};



const loadLeaflet = () => {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L);
      return;
    }
    
    let link = document.querySelector('link[href*="leaflet.css"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    let script = document.querySelector('script[src*="leaflet.js"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        if (window.L) resolve(window.L);
        else reject(new Error("Leaflet L is not available on window"));
      };
      script.onerror = () => reject(new Error("Failed to load Leaflet script"));
      document.body.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L) {
          clearInterval(interval);
          resolve(window.L);
        }
      }, 100);
    }
  });
};

const createCustomMarkerIcon = (L, marker, isActive) => {
  const size = isActive ? 34 : 29;
  const iconSize = isActive ? 18 : 15;

  const getIconSvg = (name) => {
    const icons = {
      wheat: '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22 22 2M8.5 13.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/><path d="M11.5 16.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/><path d="M15.5 16.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/><path d="M8 12a4 4 0 0 1 8 0"/></svg>',
      tractor: '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15h11M16 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><circle cx="6" cy="18" r="2"/><path d="M16 14V9h-3V5h-3v4H6"/></svg>',
      tool: '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
      leaf: '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8A7 7 0 0 1 11 20z"/><path d="M19 2c-2.26 4.33-5.27 7.14-8 10"/></svg>',
      seed: '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v12M6 12h12"/></svg>',
      field: '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',
      vet: '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0z"/></svg>',
      pin: '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'
    };
    return icons[name] || icons.pin;
  };

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${marker.color};
      color: white;
      border: 2px solid white;
      display: grid;
      place-items: center;
      box-shadow: 0 3px 10px rgba(27,36,24,0.3);
      transition: all 0.2s ease-in-out;
    ">
      <div style="width: ${iconSize}px; height: ${iconSize}px; display: flex; align-items: center; justify-content: center;">
        ${getIconSvg(marker.icon)}
      </div>
    </div>
  `;
  
  return L.divIcon({
    html,
    className: 'custom-map-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const HeatMap = ({ pins, center, radius, activePin, setActivePin, onOpenListing }) => {
  const mapRef = React.useRef(null);
  const mapInstance = React.useRef(null);
  const markersGroupRef = React.useRef(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);

  const active = pins.find(p => p.id === activePin);

  React.useEffect(() => {
    let active = true;
    loadLeaflet().then(() => {
      if (active) setMapLoaded(true);
    }).catch(console.error);
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const L = window.L;
    
    if (!mapInstance.current) {
      const centerLatLng = center && center.latitude && center.longitude
        ? [center.latitude, center.longitude]
        : [17.3850, 78.4867];

      mapInstance.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView(centerLatLng, 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInstance.current);

      markersGroupRef.current = L.layerGroup().addTo(mapInstance.current);
    }

    const map = mapInstance.current;
    const markersGroup = markersGroupRef.current;

    markersGroup.clearLayers();

    if (center && center.latitude && center.longitude) {
      const centerLatLng = [center.latitude, center.longitude];
      
      map.setView(centerLatLng, map.getZoom());

      L.circle(centerLatLng, {
        color: 'var(--primary)',
        fillColor: 'var(--primary)',
        fillOpacity: 0.12,
        radius: radius * 1000,
        weight: 1.5
      }).addTo(markersGroup);

      L.circleMarker(centerLatLng, {
        color: '#ffffff',
        fillColor: 'var(--primary)',
        fillOpacity: 1,
        radius: 8,
        weight: 3,
        pane: 'markerPane'
      }).addTo(markersGroup);
    }

    pins.forEach((pin) => {
      const point = pointOf(pin);
      if (point && point.latitude && point.longitude) {
        const markerInfo = categoryMarker(pin);
        const isActive = activePin === pin.id;
        const icon = createCustomMarkerIcon(L, markerInfo, isActive);
        
        const marker = L.marker([point.latitude, point.longitude], { icon })
          .addTo(markersGroup);

        marker.on('click', () => {
          setActivePin(pin.id);
        });
      }
    });

  }, [mapLoaded, center, pins, radius, activePin, setActivePin]);

  React.useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", borderRadius: 18, overflow: "hidden", border: "1px solid var(--border)" }}>
      {!mapLoaded ? (
        <div style={{ height: "100%", display: "grid", placeItems: "center", background: "var(--surface-2)", color: "var(--ink-3)", fontSize: 13 }}>
          <div className="skel" style={{ width: "80%", height: "80%", borderRadius: 12, display: "grid", placeItems: "center" }}>
            Loading Interactive Map...
          </div>
        </div>
      ) : (
        <div ref={mapRef} style={{ width: "100%", height: "100%", zIndex: 1 }} />
      )}

      {active && (
        <div onClick={() => onOpenListing(active)} style={{
          position: "absolute", bottom: 12, left: 12, right: 12,
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 10,
          display: "flex", gap: 10, alignItems: "center",
          boxShadow: "var(--shadow-lg)", animation: "scaleIn 180ms",
          zIndex: 1000, cursor: "pointer"
        }}>
          <ImgPh category={active.category} label={active.photos[0]?.split(" ")[0]} style={{ width: 48, height: 48, borderRadius: 8, fontSize: 9 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ink)" }}>{active.title}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
              {Number.isFinite(active.distance) ? `${active.distance}km - ` : ""}
              {formatINR(active.price)}/{active.priceUnit}
            </div>
          </div>
          <Icon name="chevron" size={16} color="var(--ink-3)" />
        </div>
      )}
    </div>
  );
};

const SchemesScreen = ({ user, initialUpdates = [], initialState = "loading" }) => {
  const [selectedState, setSelectedState] = useStateD(user?.state || "Telangana");
  const [items, setItems] = useStateD(initialUpdates);
  const [state, setState] = useStateD(initialState);
  const [searchQuery, setSearchQuery] = useStateD("");
  const [filterType, setFilterType] = useStateD("all"); // all | central-schemes | state-schemes | news
  const [openItem, setOpenItem] = useStateD(null);

  React.useEffect(() => {
    if (selectedState === user?.state && initialUpdates && initialUpdates.length > 0) {
      setItems(initialUpdates);
      setState(initialState);
      return;
    }

    let active = true;
    setState("loading");
    
    fetchOfficialUpdates({ state: selectedState })
      .then((updates) => {
        if (!active) return;
        setItems(updates);
        setState("ready");
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to fetch updates:", err);
        setState("error");
      });

    return () => {
      active = false;
    };
  }, [selectedState, user?.state, initialUpdates, initialState, setItems, setState]);


  const filtered = items.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.title || "").toLowerCase().includes(q);
      const matchBody = (item.body || "").toLowerCase().includes(q);
      const matchTag = (item.tag || "").toLowerCase().includes(q);
      const matchSource = (item.source || "").toLowerCase().includes(q);
      if (!matchTitle && !matchBody && !matchTag && !matchSource) return false;
    }

    if (filterType === "news") {
      return item.kind === "news";
    }
    if (filterType === "central-schemes") {
      return item.kind === "scheme" && (
        item.id.includes("pmkisan") || 
        item.id.includes("pmfby") || 
        item.id.includes("kcc") || 
        item.id.includes("soil") || 
        (!item.id.includes("-ts-") && 
         !item.id.includes("-mh-") && 
         !item.id.includes("-ka-") && 
         !item.id.includes("-pb-") && 
         !item.id.includes("-up-") && 
         !item.id.includes("-gj-") && 
         !item.tag.toLowerCase().includes("state"))
      );
    }
    if (filterType === "state-schemes") {
      return item.kind === "scheme" && (
        item.id.includes("-ts-") || 
        item.id.includes("-mh-") || 
        item.id.includes("-ka-") || 
        item.id.includes("-pb-") || 
        item.id.includes("-up-") || 
        item.id.includes("-gj-") || 
        item.tag.toLowerCase().includes("state") || 
        item.source.toLowerCase().includes("govt of") || 
        item.source.toLowerCase().includes("dept")
      );
    }

    return true;
  });

  const stateNames = Object.keys(STATES_DISTRICTS);

  return (
    <div className="scroll">
      {/* Topbar */}
      <div className="topbar">
        <div className="title">Govt Schemes</div>
        <select
          value={selectedState}
          onChange={e => setSelectedState(e.target.value)}
          className="chip soft"
          style={{ height: 32, paddingRight: 24, fontWeight: 600 }}
        >
          {stateNames.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Info Banner */}
      <div style={{ padding: "0 16px 12px", fontSize: 12, color: "var(--ink-3)", lineHeight: 1.4 }}>
        Real-time central and state agriculture programs with verified links to official portals.
      </div>

      {/* Search Input */}
      <div style={{ padding: "0 16px 12px", position: "relative" }}>
        <input
          className="input"
          style={{ paddingLeft: 44, height: 44 }}
          placeholder="Search schemes or news..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <div style={{ position: "absolute", left: 30, top: 13, color: "var(--ink-3)" }}>
          <Icon name="search" size={18} />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{
              position: "absolute", right: 28, top: 12,
              background: "transparent", border: 0,
              color: "var(--ink-3)", padding: 4, cursor: "pointer"
            }}
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ padding: "0 16px 12px" }}>
        <div className="segmented">
          <button className={filterType === "all" ? "active" : ""} onClick={() => setFilterType("all")}>All</button>
          <button className={filterType === "central-schemes" ? "active" : ""} onClick={() => setFilterType("central-schemes")}>Central Schemes</button>
          <button className={filterType === "state-schemes" ? "active" : ""} onClick={() => setFilterType("state-schemes")}>State Schemes</button>
          <button className={filterType === "news" ? "active" : ""} onClick={() => setFilterType("news")}>News</button>
        </div>
      </div>

      {/* Main List */}
      <div style={{ padding: "0 16px 28px", display: "grid", gap: 12 }}>
        {state === "loading" && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink-3)" }}>
            <div style={{ display: "inline-block", width: 24, height: 24, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 12 }}></div>
            <div style={{ fontSize: 13 }}>Fetching official government releases...</div>
          </div>
        )}

        {state === "error" && filtered.length === 0 && (
          <Empty
            icon="warning"
            title="Unable to load updates"
            body="We couldn't connect to the PIB news server. Please check your internet connection."
          />
        )}

        {state !== "loading" && filtered.length === 0 && (
          <Empty
            icon="search"
            title="No matching updates"
            body={`No results found for "${searchQuery}" in ${selectedState}.`}
          />
        )}

        {state !== "loading" && filtered.map(item => {
          const isScheme = item.kind === "scheme";
          const isCentral = item.id.includes("pmkisan") || item.id.includes("pmfby") || item.id.includes("kcc") || item.id.includes("soil") || (!item.id.includes("-ts-") && !item.id.includes("-mh-") && !item.id.includes("-ka-") && !item.id.includes("-pb-") && !item.id.includes("-up-") && !item.id.includes("-gj-") && !item.tag.toLowerCase().includes("state"));
          
          return (
            <div
              key={item.id}
              onClick={() => setOpenItem(item)}
              className="card"
              style={{
                padding: "16px 14px",
                borderLeft: `4px solid ${item.accent || "var(--primary)"}`,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "transform 140ms ease, box-shadow 140ms ease",
                position: "relative"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    padding: "2px 8px",
                    borderRadius: 99,
                    border: `1px solid ${item.accent || "var(--primary)"}`,
                    color: item.accent || "var(--primary)"
                  }}
                >
                  {isScheme ? "Scheme" : "News"}
                </span>

                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: isCentral ? "var(--primary)" : "var(--gold)",
                    background: isCentral ? "var(--primary-soft)" : "var(--gold-soft)",
                    padding: "2px 8px",
                    borderRadius: 4
                  }}
                >
                  {isCentral ? "Central Govt" : `${selectedState} State`}
                </span>
              </div>

              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", lineHeight: 1.25 }}>
                {item.title}
              </div>

              <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {item.body}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--primary)", fontSize: 11, fontWeight: 600 }}>
                  <Icon name="checkCircle" size={13} color="var(--primary)" />
                  <span>Verified Link</span>
                </div>
                <span style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{item.date}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Details Sheet Modal */}
      {openItem && (
        <div className="news-modal-backdrop" onClick={() => setOpenItem(null)}>
          <div className="news-modal" onClick={e => e.stopPropagation()} style={{ borderTop: `4px solid ${openItem.accent || "var(--primary)"}` }}>
            <div className="news-modal-head">
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: 99,
                  border: `1px solid ${openItem.accent || "var(--primary)"}`,
                  color: openItem.accent || "var(--primary)"
                }}
              >
                {openItem.kind === "scheme" ? "Government Scheme" : "Press Release"}
              </span>
              <button className="icon-btn" onClick={() => setOpenItem(null)} aria-label="Close">
                <Icon name="close" size={20} />
              </button>
            </div>

            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginTop: 12, color: "var(--ink)" }}>
              {openItem.title}
            </div>

            <div
              style={{
                background: "var(--primary-soft)",
                border: "1px solid color-mix(in srgb, var(--primary) 15%, transparent)",
                borderRadius: 10,
                padding: "10px 12px",
                marginTop: 12,
                display: "flex",
                alignItems: "flex-start",
                gap: 10
              }}
            >
              <div style={{ color: "var(--primary)", display: "grid", placeItems: "center", marginTop: 1 }}>
                <Icon name="checkCircle" size={18} color="var(--primary)" />
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.35 }}>
                <div style={{ fontWeight: 700, color: "var(--primary)" }}>Official Source Verified</div>
                <div style={{ marginTop: 2 }}>This link directs to the authorized government portal:</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--primary)", marginTop: 4, wordBreak: "break-all", background: "var(--surface)", padding: "4px 8px", borderRadius: 4, border: "1px solid var(--border)" }}>
                  {openItem.link}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 16, lineHeight: 1.5, whiteSpace: "pre-line" }}>
              {openItem.body}
            </div>

            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              Source: {openItem.source} ({openItem.date})
            </div>

            <button
              className="news-cta"
              onClick={() => {
                if (openItem.link) window.open(openItem.link, "_blank", "noopener,noreferrer");
                setOpenItem(null);
              }}
              style={{
                background: openItem.accent || "var(--primary)",
                color: "white",
                border: 0,
                borderRadius: 12,
                padding: 12,
                width: "100%",
                marginTop: 16,
                fontWeight: 600,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer"
              }}
            >
              <span>{openItem.kind === "scheme" ? "Apply on Official Portal" : "Read full official release"}</span>
              <Icon name="chevron" size={16} />
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export { PricesScreen, WeatherScreen, NearbyScreen, SchemesScreen };


