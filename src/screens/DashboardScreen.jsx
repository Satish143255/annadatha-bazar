import React from 'react';
import { Icon } from '../icons/Icon.jsx';
import { Avatar, Button, Empty, ImgPh, formatINR, AnimatedNumber } from '../components/index.jsx';

// ===== Seller Dashboard: listings, services, and orders =====

const { useState: useStateD, useMemo: useMemoD } = React;

// ---------- Stage pipeline ----------
const ORDER_STAGES = [
  { id: "new",         label: "New",         color: "var(--terra)" },
  { id: "confirmed",   label: "Confirmed",   color: "#2E4A7F" },
  { id: "in_progress", label: "In Progress", color: "#7A4F9E" },
  { id: "delivered",   label: "Delivered",   color: "var(--primary)" },
  { id: "completed",   label: "Completed",   color: "#5C6650" },
];
const stageIdx = (id) => ORDER_STAGES.findIndex(s => s.id === id);
const stageInfo = (id) => ORDER_STAGES.find(s => s.id === id) || ORDER_STAGES[0];

// ---------- D1: Dashboard ----------
const DashboardScreen = ({ myListings, orders, onBack, onOpenListing, onPostListing }) => {
  const [tab, setTab] = useStateD("overview"); // overview | listings | services | orders
  const [statusFilter, setStatusFilter] = useStateD("active");
  const [orderFilter, setOrderFilter] = useStateD("open"); // open | completed | all
  const [orderDetail, setOrderDetail] = useStateD(null);

  // ----- buckets -----
  const listings = myListings.filter(l => l.kind === "listing");
  const services = myListings.filter(l => l.kind === "service");

  // Money this month sums completed and delivered order totals.
  const monthEarnings = orders
    .filter(o => ["delivered", "completed"].includes(o.stage))
    .reduce((s, o) => s + (o.payment === "Paid in full" ? o.total : (o.advance || 0)), 0);

  const openOrders = orders.filter(o => !["completed", "cancelled"].includes(o.stage));
  const openValue  = openOrders.reduce((s, o) => s + o.total, 0);

  const stats = [
    {
      key: "listings", label: "Active Listings",
      value: listings.filter(l => l.status === "active").length,
      sub: `${listings.length} total`,
      icon: "grid", accent: "var(--primary)",
      onClick: () => setTab("listings"),
    },
    {
      key: "services", label: "Active Services",
      value: services.filter(l => l.status === "active").length,
      sub: `${services.length} offered`,
      icon: "tool", accent: "#7A4F9E",
      onClick: () => setTab("services"),
    },
    {
      key: "orders", label: "Open Orders",
      value: openOrders.length,
      sub: openValue > 0 ? `${formatINR(openValue)} value` : "Nothing pending",
      icon: "truck", accent: "var(--terra)",
      onClick: () => setTab("orders"),
    },
    {
      key: "month", label: "This Month",
      value: formatINR(monthEarnings),
      sub: `${orders.filter(o => ["delivered", "completed"].includes(o.stage)).length} closed`,
      icon: "trendUp", accent: "#2E4A7F",
      onClick: () => setTab("orders"),
      compact: true,
    },
  ];

  return (
    <div className="scroll bg-[var(--bg)]" data-screen-label="P2 Dashboard">
      <div className="topbar border-b border-[var(--border)] flex items-center justify-between px-4 py-2 bg-[var(--surface)]">
        <button className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors active:scale-95 cursor-pointer" onClick={onBack}>
          <Icon name="back" size={20} />
        </button>
        <div className="title font-bold text-[var(--ink)] text-lg">Seller Dashboard</div>
        <button className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors active:scale-95 cursor-pointer" onClick={() => onPostListing("listing")}>
          <Icon name="plus" size={20} color="var(--primary)" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-3 pt-2 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: "overview", label: "Overview" },
            { id: "listings", label: `Listings (${listings.length})` },
            { id: "services", label: `Services (${services.length})` },
            { id: "orders",   label: `Orders (${orders.length})` },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setTab(s.id)}
              className={`px-3 py-3 border-b-2 text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-150 cursor-pointer ${
                tab === s.id 
                  ? "border-[var(--primary)] text-[var(--primary)] font-bold" 
                  : "border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"
              }`}
            >{s.label}</button>
          ))}
        </div>
      </div>

      <div className="scroll p-4 bg-[var(--surface-2)]">
        {tab === "overview" && (
          <OverviewTab
            stats={stats} listings={listings} services={services} orders={orders}
            onJumpTab={setTab}
            onOpenListing={onOpenListing}
            onOpenOrder={(o) => setOrderDetail(o)}
          />
        )}
        {tab === "listings" && (
          <ItemsTab
            kind="listing"
            items={listings}
            orders={orders}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            onOpenListing={onOpenListing}
            onPostListing={() => onPostListing("listing")}
          />
        )}
        {tab === "services" && (
          <ItemsTab
            kind="service"
            items={services}
            orders={orders}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            onOpenListing={onOpenListing}
            onPostListing={() => onPostListing("service")}
          />
        )}
        {tab === "orders" && (
          <OrdersTab
            orders={orders}
            orderFilter={orderFilter} setOrderFilter={setOrderFilter}
            onOpenOrder={(o) => setOrderDetail(o)}
          />
        )}
      </div>

      {orderDetail && (
        <OrderDetailSheet
          order={orderDetail}
          onClose={() => setOrderDetail(null)}
        />
      )}
    </div>
  );
};

// ---------- Overview ----------
const OverviewTab = ({ stats, listings, services, orders, onJumpTab, onOpenListing, onOpenOrder }) => {
  const pipelineCounts = ORDER_STAGES.map(s => ({
    ...s,
    count: orders.filter(o => o.stage === s.id).length,
  }));
  const maxCount = Math.max(1, ...pipelineCounts.map(p => p.count));

  const recentOrders = [...orders].slice(0, 4);
  const topPerformer = [...services, ...listings]
    .filter(l => l.status === "active")
    .sort((a, b) => (b.orders || 0) - (a.orders || 0))[0];

  return (
    <div className="grid gap-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <button 
            key={s.key} 
            onClick={s.onClick} 
            className="group relative flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm text-left active:scale-[0.98] transition-all duration-200 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: s.accent }} />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: `color-mix(in srgb, ${s.accent} 15%, transparent)`, color: s.accent }}>
                <Icon name={s.icon} size={16} />
              </div>
              <div className="text-[11px] font-semibold text-[var(--ink-3)] uppercase tracking-wider">{s.label}</div>
            </div>
            <div className={`font-serif font-bold text-[var(--ink)] tracking-tight leading-none ${s.compact ? 'text-xl' : 'text-3xl'}`}>
              {typeof s.value === "number"
                ? <AnimatedNumber value={s.value} />
                : s.value}
            </div>
            <div className="text-[11px] text-[var(--ink-3)] font-medium mt-2 flex items-center justify-between">
              <span>{s.sub}</span>
              <Icon name="chevron" size={10} color="var(--ink-3)" />
            </div>
          </button>
        ))}
      </div>

      {/* Sales pipeline */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-[var(--ink)]">Sales Pipeline</h4>
          <button onClick={() => onJumpTab("orders")} className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer">See all orders</button>
        </div>
        <div className="grid grid-cols-5 items-end gap-2 pt-4">
          {pipelineCounts.map(p => (
            <div key={p.id} className="flex flex-col items-center gap-1.5 group cursor-pointer">
              <div className="relative w-full flex justify-center">
                {p.count > 0 && (
                  <span className="absolute -top-6 text-[10px] font-bold text-[var(--ink)] bg-[var(--surface-3)] border border-[var(--border)] px-1 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.count}
                  </span>
                )}
                <div 
                  className="w-full max-w-[32px] rounded-t-md transition-all duration-500 hover:brightness-95" 
                  style={{
                    height: `${6 + (p.count / maxCount) * 44}px`,
                    backgroundColor: p.color,
                    opacity: p.count > 0 ? 1 : 0.2,
                  }} 
                />
              </div>
              <div className="font-serif font-bold text-base text-[var(--ink)] leading-none mt-1">{p.count}</div>
              <div className="text-[9px] font-semibold text-[var(--ink-3)] uppercase tracking-tight text-center">{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top performer */}
      {topPerformer && (
        <div className="dash-section">
          <div className="dash-section-head">
            <h4>Top performer</h4>
            <span className="dash-section-meta">
              {topPerformer.kind === "service" ? "Service" : "Listing"}
            </span>
          </div>
          <button
            onClick={() => onOpenListing(topPerformer)}
            className="card tight"
            style={{ width: "100%", textAlign: "left", padding: 12, display: "flex", gap: 12, alignItems: "center" }}
          >
            <ImgPh
              category={topPerformer.category}
              label={topPerformer.photos[0]?.split(" ").slice(0, 2).join(" ")}
              style={{ width: 56, height: 56, borderRadius: 10 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{topPerformer.title}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: "var(--ink-3)" }}>
                <span><Icon name="eye" size={10} /> {topPerformer.views} views</span>
                <span><Icon name="truck" size={10} /> {topPerformer.orders || 0} orders</span>
                {topPerformer.rating && (
                  <span><Icon name="star" size={10} /> {topPerformer.rating}</span>
                )}
              </div>
            </div>
            <Icon name="chevron" size={16} color="var(--ink-3)" />
          </button>
        </div>
      )}

      {/* Recent orders */}
      <div className="dash-section">
        <div className="dash-section-head">
          <h4>Recent orders</h4>
          <button onClick={() => onJumpTab("orders")} className="link">View all</button>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {recentOrders.map(o => <OrderRow key={o.id} order={o} onOpen={onOpenOrder} />)}
        </div>
      </div>
    </div>
  );
};

// ---------- Items tab (listings / services) ----------
const ItemsTab = ({ kind, items, orders, statusFilter, setStatusFilter, onOpenListing, onPostListing }) => {
  const counts = {
    active:    items.filter(l => l.status === "active").length,
    paused:    items.filter(l => l.status === "paused").length,
    fulfilled: items.filter(l => l.status === "fulfilled").length,
  };
  const filtered = items.filter(l => l.status === statusFilter);

  const noun = kind === "service" ? "service" : "listing";

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", scrollbarWidth: "none" }}>
        {["active", "paused", "fulfilled"].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`status-chip ${statusFilter === s ? "active" : ""}`}
          >
            {s} {counts[s] > 0 && <span className="status-chip-count">{counts[s]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon={kind === "service" ? "tool" : "grid"}
          title={`No ${statusFilter} ${noun}s`}
          body={statusFilter === "active"
            ? `Post your first ${noun} to start getting ${kind === "service" ? "bookings" : "orders"}.`
            : `You have no ${statusFilter} ${noun}s yet.`}
          action={statusFilter === "active"
            ? <Button icon="plus" onClick={onPostListing}>Post a {noun === "service" ? "Service" : "Listing"}</Button>
            : null}
        />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {filtered.map(l => {
            const itemOrders = orders.filter(o => o.listingId === l.id);
            const openCount = itemOrders.filter(o => !["completed", "cancelled"].includes(o.stage)).length;
            return (
              <button
                key={l.id}
                onClick={() => onOpenListing(l)}
                className="card tight item-card"
              >
                <ImgPh
                  category={l.category}
                  label={l.photos[0]?.split(" ").slice(0, 2).join(" ")}
                  style={{ width: 64, height: 64, borderRadius: 10, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, flex: 1, minWidth: 0 }}>
                      {l.title}
                    </div>
                    <span className={`status-badge status-${l.status}`}>{l.status}</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--primary)", lineHeight: 1, marginTop: 6 }}>
                    {formatINR(l.price)}<span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-sans)" }}>/{l.priceUnit}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, fontSize: 11, color: "var(--ink-3)" }}>
                    <span><Icon name="eye" size={10} /> {l.views}</span>
                    <span><Icon name="chat" size={10} /> {l.inquiries}</span>
                    <span><Icon name="truck" size={10} /> {l.orders || 0} {kind === "service" ? "bookings" : "orders"}</span>
                    {l.rating && (
                      <span><Icon name="star" size={10} /> {l.rating} ({l.ratingCount})</span>
                    )}
                  </div>
                  {openCount > 0 && (
                    <div style={{
                      marginTop: 10, padding: "6px 10px",
                      background: "var(--primary-soft)", color: "var(--primary)",
                      borderRadius: 8, fontSize: 11, fontWeight: 600,
                      display: "inline-flex", alignItems: "center", gap: 5,
                    }}>
                      <Icon name="info" size={11} />
                      {openCount} open {kind === "service" ? "booking" : "order"}{openCount === 1 ? "" : "s"}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------- Orders tab ----------
const OrdersTab = ({ orders, orderFilter, setOrderFilter, onOpenOrder }) => {
  const filtered = orders.filter(o => {
    if (orderFilter === "open") return !["completed", "cancelled"].includes(o.stage);
    if (orderFilter === "completed") return o.stage === "completed";
    return true;
  });
  const totals = {
    open: orders.filter(o => !["completed", "cancelled"].includes(o.stage)).length,
    completed: orders.filter(o => o.stage === "completed").length,
    all: orders.length,
  };

  // Group by stage when in "open"
  const grouped = useMemoD(() => {
    if (orderFilter !== "open") return null;
    const map = {};
    filtered.forEach(o => {
      (map[o.stage] = map[o.stage] || []).push(o);
    });
    return ORDER_STAGES
      .filter(s => map[s.id])
      .map(s => ({ ...s, items: map[s.id] }));
  }, [filtered, orderFilter]);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[
          { id: "open", label: "Open" },
          { id: "completed", label: "Completed" },
          { id: "all", label: "All" },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setOrderFilter(s.id)}
            className={`status-chip ${orderFilter === s.id ? "active" : ""}`}
          >
            {s.label}
            {totals[s.id] > 0 && <span className="status-chip-count">{totals[s.id]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon="truck"
          title={`No ${orderFilter} orders`}
          body="Orders & bookings against your listings will appear here."
        />
      ) : grouped ? (
        <div style={{ display: "grid", gap: 18 }}>
          {grouped.map(g => (
            <div key={g.id}>
              <div className="orders-group-head" style={{ color: g.color }}>
                <span className="orders-group-dot" style={{ background: g.color }} />
                {g.label}
                <span className="orders-group-count">{g.items.length}</span>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {g.items.map(o => <OrderRow key={o.id} order={o} onOpen={onOpenOrder} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {filtered.map(o => <OrderRow key={o.id} order={o} onOpen={onOpenOrder} />)}
        </div>
      )}
    </div>
  );
};

// ---------- Order row ----------
const OrderRow = ({ order, onOpen }) => {
  const s = stageInfo(order.stage);
  return (
    <button onClick={() => onOpen(order)} className="order-row card tight">
      <div className="order-row-main">
        <div className="order-row-head">
          <Avatar name={order.buyerName} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{order.buyerName}</div>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 1 }}>
              <Icon name="pin" size={9} /> {order.buyerVillage}
            </div>
          </div>
          <span className="order-stage" style={{ color: s.color, borderColor: s.color }}>
            {order.kind === "booking" && <Icon name="calendar" size={9} style={{ marginRight: 3 }} />}
            {s.label}
          </span>
        </div>
        <div className="order-row-title">{order.listingTitle}</div>
        <div className="order-row-meta">
          <span className="order-qty">{order.qty}</span>
          <span className="order-total">{formatINR(order.total)}</span>
          <span className="order-time">{order.placedRel}</span>
        </div>
      </div>
    </button>
  );
};

// ---------- Order detail sheet ----------
const OrderDetailSheet = ({ order, onClose }) => {
  const currentIdx = stageIdx(order.stage);
  const s = stageInfo(order.stage);

  return (
    <div className="news-modal-backdrop" onClick={onClose}>
      <div className="news-modal" onClick={e => e.stopPropagation()} style={{ borderTop: `4px solid ${s.color}`, maxHeight: "85%", overflowY: "auto" }}>
        <div className="news-modal-head">
          <span className="news-kind" style={{ color: s.color, borderColor: s.color }}>
            {order.kind === "booking" ? "Service booking" : "Order"}
          </span>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Header */}
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{order.placed}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1.2, marginTop: 2 }}>
            {formatINR(order.total)}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2 }}>
            {order.qty} - {formatINR(order.unitPrice)}/unit
          </div>
        </div>

        {/* Stage pipeline */}
        <div className="order-stage-pipeline">
          {ORDER_STAGES.slice(0, 5).map((st, i) => {
            const reached = i <= currentIdx;
            return (
              <React.Fragment key={st.id}>
                <div className="order-stage-step" style={{
                  opacity: reached ? 1 : 0.35,
                }}>
                  <div className="order-stage-dot" style={{
                    background: reached ? st.color : "var(--surface-2)",
                    borderColor: reached ? st.color : "var(--border-strong)",
                  }}>
                    {reached && <Icon name="check" size={10} color="white" stroke={3} />}
                  </div>
                  <div className="order-stage-name">{st.label}</div>
                </div>
                {i < 4 && (
                  <div className="order-stage-bar" style={{
                    background: i < currentIdx ? s.color : "var(--border)",
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Buyer + item */}
        <div className="form-group" style={{ marginTop: 16 }}>
          <div className="list-row">
            <Avatar name={order.buyerName} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{order.buyerName}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                <Icon name="pin" size={10} /> {order.buyerVillage}
              </div>
            </div>
            <button className="icon-btn" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
              <Icon name="phone" size={16} />
            </button>
          </div>
          <div className="list-row">
            <Icon name="grid" size={16} color="var(--ink-3)" />
            <span className="row-label">{order.listingTitle}</span>
          </div>
          {order.scheduled && (
            <div className="list-row">
              <Icon name="calendar" size={16} color="var(--ink-3)" />
              <span className="row-label">Scheduled</span>
              <span className="row-meta">{order.scheduled}</span>
            </div>
          )}
          <div className="list-row">
            <Icon name="check2" size={16} color="var(--ink-3)" />
            <span className="row-label">Payment</span>
            <span className="row-meta" style={{ fontWeight: 600 }}>{order.payment}</span>
          </div>
          {order.paymentPct > 0 && order.paymentPct < 100 && (
            <div style={{ padding: "0 16px 12px" }}>
              <div className="pay-bar"><div style={{ width: `${order.paymentPct}%` }} /></div>
              <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 4 }}>
                {order.paymentPct}% received - {formatINR(order.advance || 0)} of {formatINR(order.total)}
              </div>
            </div>
          )}
        </div>

        {order.notes && (
          <div style={{
            background: "var(--surface-2)", borderRadius: 10,
            padding: 12, marginTop: 12,
            fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45,
          }}>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 5 }}>
              Note
            </div>
            {order.notes}
          </div>
        )}

        {/* Actions */}
        {order.stage !== "completed" && order.stage !== "cancelled" && (
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <Button variant="secondary" full icon="chat">Message</Button>
            <Button full icon="check">
              {order.stage === "new" ? "Confirm" :
               order.stage === "confirmed" ? "Start" :
               order.stage === "in_progress" ? "Mark delivered" :
               order.stage === "delivered" ? "Mark complete" : "Update"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export { DashboardScreen };

