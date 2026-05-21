import React from 'react';
import { AGRI_DATA } from '../data.js';
import { Icon } from '../icons/Icon.jsx';
import { TopBar, Sheet, useT, formatINR } from '../components/index.jsx';

// ===== Discover: D1 Prices, D2 Weather, D3 Nearby =====

const { useState: useStateD } = React;

// ---------- D1: Mandi Prices ----------
const PRICE_SERIES_COLORS = [
  "#1F5A3A", "#B05E2E", "#C8902C", "#2E5C8A",
  "#7A3A14", "#5E7A3A", "#8A4A6F", "#3A6F6A",
];

const PricesScreen = ({ user, lang }) => {
  const t = useT(lang);
  const [expanded, setExpanded] = useStateD(null);
  const [q, setQ] = useStateD("");
  const [district, setDistrict] = useStateD(user.district);
  const [view, setView] = useStateD("cards");

  const userCropMatch = (commodity) => user.crops.some(c => commodity.toLowerCase().includes(c));
  const all = AGRI_DATA.MANDI_PRICES;
  const sorted = [...all].sort((a, b) => {
    const am = userCropMatch(a.commodity) ? 0 : 1;
    const bm = userCropMatch(b.commodity) ? 0 : 1;
    return am - bm;
  });
  const filtered = q ? sorted.filter(p => p.commodity.toLowerCase().includes(q.toLowerCase())) : sorted;

  // Graph view: which series are visible
  const initialSel = filtered.slice(0, 5).map(p => p.commodity);
  const [selected, setSelected] = useStateD(initialSel);
  const toggleSeries = (c) => {
    setSelected(sel => sel.includes(c) ? sel.filter(x => x !== c) : [...sel, c]);
  };
  const seriesColor = (commodity) => {
    const idx = filtered.findIndex(p => p.commodity === commodity);
    return PRICE_SERIES_COLORS[idx % PRICE_SERIES_COLORS.length];
  };

  return (
    <div className="scroll">
      <div className="topbar">
        <div className="title">{t("prices.title")}</div>
        <button className="chip soft" style={{ height: 32 }}>
          <Icon name="pin" size={12} />
          {district}
          <Icon name="chevronDown" size={12} />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "0 16px 10px", position: "relative" }}>
        <input
          className="input"
          style={{ paddingLeft: 44, height: 44 }}
          placeholder="Search cropâ€¦"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <div style={{ position: "absolute", left: 30, top: 13, color: "var(--ink-3)" }}>
          <Icon name="search" size={18} />
        </div>
      </div>

      {/* View toggle */}
      <div style={{ padding: "0 16px 14px" }}>
        <div className="segmented">
          <button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")}>
            <Icon name="grid" size={14} /> Cards
          </button>
          <button className={view === "table" ? "active" : ""} onClick={() => setView("table")}>
            <Icon name="sort" size={14} /> Table
          </button>
          <button className={view === "graph" ? "active" : ""} onClick={() => setView("graph")}>
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
              const emoji = AGRI_DATA.CROPS.find(c => p.commodity.toLowerCase().includes(c.id))?.emoji || "ðŸŒ¾";
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
                    <span className={`price-pill ${p.trend > 0 ? "up" : "down"}`} style={{ padding: "2px 6px", fontSize: 10 }}>
                      <Icon name={p.trend > 0 ? "trendUp" : "trendDown"} size={9} />
                      {p.trend > 0 ? "+" : ""}{p.trend}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 10, textAlign: "center" }}>
            All prices in â‚¹/Quintal Â· Tap row for details
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
            <MultiPriceChart
              series={filtered.filter(p => selected.includes(p.commodity))}
              colorOf={seriesColor}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
              {filtered.map(p => {
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
            {filtered.filter(p => selected.includes(p.commodity)).map(p => {
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

      {/* ===== CARDS VIEW (original) ===== */}
      {view === "cards" && (
      <div style={{ padding: "0 16px 24px" }}>
        {filtered.map((p, i) => {
          const isOpen = expanded === p.commodity;
          const matched = userCropMatch(p.commodity);
          return (
            <div key={p.commodity} className="card" style={{ marginBottom: 10, padding: 0, overflow: "hidden", borderColor: matched ? "var(--primary-soft)" : "var(--border)" }}>
              <div
                onClick={() => setExpanded(isOpen ? null : p.commodity)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 14px",
                  background: matched ? "var(--primary-soft)" : "transparent",
                  cursor: "pointer"
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: matched ? "rgba(255,255,255,0.6)" : "var(--surface-2)",
                  display: "grid", placeItems: "center",
                  fontSize: 22,
                }}>
                  {AGRI_DATA.CROPS.find(c => p.commodity.toLowerCase().includes(c.id))?.emoji || "ðŸŒ¾"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, display: "flex", gap: 6, alignItems: "center" }}>
                    {p.commodity}
                    {matched && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "var(--primary)", color: "white" }}>Your crop</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{p.market} Â· {p.variety}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary)", lineHeight: 1, letterSpacing: "-0.01em" }}>
                    {formatINR(p.modal)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 4 }}>
                    <span className={`price-pill ${p.trend > 0 ? "up" : "down"}`}>
                      <Icon name={p.trend > 0 ? "trendUp" : "trendDown"} size={10} />
                      {p.trend > 0 ? "+" : ""}{p.trend}%
                    </span>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
                  {/* Chart */}
                  <div style={{ padding: "14px 0 8px" }}>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 6 }}>7-day price trend</div>
                    <PriceChart history={p.history} />
                  </div>

                  {/* Min/Max/Modal table */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
                    {[
                      { label: "Min", val: p.min, color: "var(--terra)" },
                      { label: "Modal", val: p.modal, color: "var(--primary)" },
                      { label: "Max", val: p.max, color: "var(--ink)" },
                    ].map(stat => (
                      <div key={stat.label} style={{ background: "var(--surface-2)", padding: "10px 12px", borderRadius: 10 }}>
                        <div style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: stat.color, lineHeight: 1.1 }}>{formatINR(stat.val)}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <button
                      className="btn secondary sm full"
                      style={{ width: "100%" }}
                    >
                      <Icon name="bell" size={14} />
                      Set Price Alert
                      <span style={{ fontSize: 10, padding: "2px 6px", background: "var(--gold-soft)", color: "#6B4E14", borderRadius: 4, marginLeft: 6 }}>Soon</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      <div style={{ padding: "0 16px 28px", fontSize: 11, color: "var(--ink-3)", textAlign: "center" }}>
        <Icon name="refresh" size={12} /> Updated 6 hrs ago Â· Source: Agmarknet
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
const WeatherScreen = ({ user, lang }) => {
  const t = useT(lang);
  const w = AGRI_DATA.WEATHER;

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
          background: "linear-gradient(135deg, #DBE7F0 0%, #B3CDDE 100%)",
          color: "#1B3854",
          position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: -10, right: -10, opacity: 0.25 }}>
            <WeatherIcon name={w.current.icon} size={140} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 72, lineHeight: 0.9, letterSpacing: "-0.03em" }}>
            {w.current.temp}Â°
          </div>
          <div style={{ fontSize: 18, marginTop: 4 }}>{w.current.condition}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Feels like {w.current.feelsLike}Â°</div>

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
            <div style={{ fontSize: 16, fontWeight: 600 }}>{h.temp}Â°</div>
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
                <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{d.low}Â°</span>
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
                <span style={{ fontSize: 13, fontWeight: 500 }}>{d.high}Â°</span>
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
            warn: { bg: "var(--terra-soft)", color: "#7A3A14", icon: "warning" },
            info: { bg: "#D6E2F0", color: "#1B3854", icon: "info" },
            tip: { bg: "var(--gold-soft)", color: "#6B4E14", icon: "leaf" },
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
const NearbyScreen = ({ listings, onOpenListing, initialCategory = "all", lang }) => {
  const t = useT(lang);
  const [radius, setRadius] = useStateD(20);
  const [cat, setCat] = useStateD(initialCategory);
  const [view, setView] = useStateD("list");
  const [activePin, setActivePin] = useStateD(null);

  React.useEffect(() => { setCat(initialCategory); }, [initialCategory]);

  const serviceCats = ["service", "equipment", "input", "livestock", "crop", "land"];
  const services = listings.filter(l => {
    if (l.distance > radius) return false;
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
          <FauxMap pins={filtered} activePin={activePin} setActivePin={setActivePin} onOpenListing={onOpenListing} />
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
                background: "var(--primary)", color: "white",
                padding: "3px 8px", borderRadius: 999,
                fontSize: 11, fontWeight: 600
              }}>
                {l.distance}km
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Faux map
const FauxMap = ({ pins, activePin, setActivePin, onOpenListing }) => {
  const catColors = { service: "#B05E2E", equipment: "#1F5A3A", input: "#2E5C8A", crop: "#C8902C", land: "#7A8B5C", livestock: "#8A4A6F", other: "#6B7763" };
  const positions = pins.slice(0, 12).map((p, i) => {
    const angle = (i / pins.length) * Math.PI * 2;
    const dist = (p.distance / 50) * 38 + 8;
    const x = 50 + Math.cos(angle + i * 0.5) * dist;
    const y = 50 + Math.sin(angle + i * 0.5) * dist;
    return { ...p, x, y };
  });
  const active = positions.find(p => p.id === activePin);

  return (
    <div style={{
      position: "relative",
      width: "100%", aspectRatio: "4/3",
      borderRadius: 18, overflow: "hidden",
      background: `
        radial-gradient(circle at 50% 50%, #E5F0DC 0%, #C7DBA8 60%, #B0CB8C 100%)
      `,
      backgroundImage: `
        radial-gradient(circle at 25% 30%, rgba(124,159,86,0.35) 0%, transparent 30%),
        radial-gradient(circle at 75% 65%, rgba(170,140,90,0.28) 0%, transparent 25%),
        radial-gradient(circle at 50% 50%, #DDE9CC 0%, #C0D49E 70%)
      `,
      border: "1px solid var(--border)",
    }}>
      {/* Mock roads */}
      <svg viewBox="0 0 100 75" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <path d="M 0 38 Q 30 35, 50 42 T 100 38" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" fill="none" />
        <path d="M 0 38 Q 30 35, 50 42 T 100 38" stroke="rgba(0,0,0,0.12)" strokeWidth="0.18" fill="none" />
        <path d="M 50 0 Q 47 30, 50 42 T 48 75" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" fill="none" />
        <path d="M 18 0 Q 25 25, 32 50 T 35 75" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" fill="none" />
        {/* river */}
        <path d="M 0 60 Q 20 55, 40 62 T 80 58 L 100 64" stroke="#7AAACB" strokeWidth="0.6" fill="none" opacity="0.5" />
      </svg>

      {/* User position */}
      <div style={{
        position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 999,
          background: "rgba(31, 90, 58, 0.2)",
          animation: "pulse 2s infinite",
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 14, height: 14, borderRadius: 999,
          background: "var(--primary)",
          border: "3px solid white",
          transform: "translate(-50%, -50%)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }} />
      </div>

      {/* Pins */}
      {positions.map((p) => (
        <button
          key={p.id}
          onClick={() => setActivePin(p.id)}
          style={{
            position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
            transform: "translate(-50%, -100%)",
            zIndex: activePin === p.id ? 5 : 1,
          }}
        >
          <Icon name="pin" size={activePin === p.id ? 30 : 24} color={catColors[p.category]} fill={catColors[p.category]} />
        </button>
      ))}

      {/* Mini card popup */}
      {active && (
        <div onClick={() => onOpenListing(active)} style={{
          position: "absolute", bottom: 8, left: 8, right: 8,
          background: "white", borderRadius: 12, padding: 10,
          display: "flex", gap: 10, alignItems: "center",
          boxShadow: "var(--shadow-lg)", animation: "scaleIn 180ms"
        }}>
          <ImgPh category={active.category} label={active.photos[0]?.split(" ")[0]} style={{ width: 48, height: 48, borderRadius: 8, fontSize: 9 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{active.title}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{active.distance}km Â· {formatINR(active.price)}/{active.priceUnit}</div>
          </div>
          <Icon name="chevron" size={16} color="var(--ink-3)" />
        </div>
      )}
      <style>{`@keyframes pulse { 0% { transform: scale(0.8); opacity: 0.7; } 100% { transform: scale(2); opacity: 0; } }`}</style>
    </div>
  );
};

export { PricesScreen, WeatherScreen, NearbyScreen };

