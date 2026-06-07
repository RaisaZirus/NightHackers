import { useState, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface CostItem {
  id: number;
  label: string;
  perPerson: number;
  icon: string;
}

interface ScheduleItem {
  time: string;
  title: string;
  note?: string;
  cost?: string;
  icon: string;
  sub?: boolean;
}

interface ScheduleSection {
  section: string;
  color: string;
  items: ScheduleItem[];
}

interface PaymentEntry {
  id: number;
  amount: number;
  note: string | null;
  time: string;
}

interface PersonColor {
  bg: string;
  border: string;
  text: string;
  dot: string;
}

type PersonName = "Raisa" | "Salwa" | "Farhana" | "Nishat" | "Maa";
type PaymentMap = Record<PersonName, PaymentEntry[]>;
type StringMap   = Record<PersonName, string>;

// ── Static data ───────────────────────────────────────────────────────────────

const DEFAULT_COSTS: CostItem[] = [
  { id: 1,  label: "CNG",               perPerson: 100, icon: "🛺" },
  { id: 2,  label: "Bus",               perPerson: 400, icon: "🚌" },
  { id: 3,  label: "Rent",              perPerson: 320, icon: "🏠" },
  { id: 4,  label: "Breakfast",         perPerson: 100, icon: "🍳" },
  { id: 5,  label: "Lunch",             perPerson: 300, icon: "🍛" },
  { id: 6,  label: "Dinner",            perPerson: 300, icon: "🍽️" },
  { id: 7,  label: "Ajaira Khaoya",     perPerson: 300, icon: "🍟" },
  { id: 8,  label: "Monda",             perPerson: 700, icon: "🍬" },
  { id: 9,  label: "Rickshaw",          perPerson: 100, icon: "🚲" },
  { id: 10, label: "Bus to Muktagacha", perPerson: 100, icon: "🚍" },
];

const schedule: ScheduleSection[] = [
  {
    section: "Morning",
    color: "#C8722A",
    items: [
      { time: "6:00 – 7:30",  title: "Breakfast",        note: "Morning meal before departure",          cost: "৳250 / person", icon: "🍳" },
      { time: "7:30 – 11:30", title: "ENA Bus Journey",  note: "4 hours on the road to the destination", cost: "৳100 / person", icon: "🚌" },
    ],
  },
  {
    section: "Arrival",
    color: "#2E9E82",
    items: [
      { time: "12:00 pm",     title: "Arrive at Destination", note: "Welcome to the tour location!",  icon: "📍" },
      { time: "1:00 pm",      title: "Check In",              note: "Settle into accommodation",       cost: "৳320 / person", icon: "🏠" },
      { time: "1:00 – 1:30",  title: "Freshen Up",            note: "Eat, shower, rest a bit",         icon: "🚿" },
    ],
  },
  {
    section: "Exploration",
    color: "#5558C8",
    items: [
      { time: "1:30 – 2:30", title: "Bus to Jomidar Bari",      note: "Head to Mukigacha Zamindar House",   icon: "🚌" },
      { time: "2:30 – 3:00", title: "Jomidar Bari Visit",       note: "Explore the heritage manor",         icon: "🏯",  sub: true },
      { time: "3:00 – 3:05", title: "Buy Monda + Gift",         note: "Local monda sweets & friend's gift", icon: "🎁",  sub: true },
      { time: "3:05 – 4:05", title: "Shashi Lodge Gate",        note: "Explore the area outside",           icon: "🏛️", sub: true },
      { time: "4:05 – 4:10", title: "Buy Entry Ticket",         note: "৳15 ticket at the counter",          cost: "৳15 / person", icon: "🎟️", sub: true },
      { time: "4:10 – 5:00", title: "Inside Shashi Lodge",      note: "Explore until closing time",         icon: "🚪",  sub: true },
      { time: "5:00 pm",     title: "Street Food by the Park",  note: "Snacks & chill near the park",       icon: "🍢",  sub: true },
    ],
  },
  {
    section: "Evening",
    color: "#C8407E",
    items: [
      { time: "6:00 – 7:00", title: "Friend Meetup",      note: "Special meetup hour with the crew", icon: "🤝" },
      { time: "7:00 – 9:00", title: "Food Court Dinner",  note: "Big group dinner — eat, eat, eat!", icon: "🍽️" },
    ],
  },
  {
    section: "Night",
    color: "#7C52B8",
    items: [
      { time: "9:00 pm →", title: "BAU Maath — All Night", note: "Sit on the field, play cards till dawn 🌙", icon: "🃏" },
    ],
  },
];

const PEOPLE: PersonName[] = ["Raisa", "Salwa", "Farhana", "Nishat", "Maa"];

const PERSON_COLORS: Record<PersonName, PersonColor> = {
  Raisa:   { bg: "#fce7f3", border: "#e879a8", text: "#9d174d", dot: "#e879a8" },
  Salwa:   { bg: "#ede9fe", border: "#8b5cf6", text: "#5b21b6", dot: "#8b5cf6" },
  Farhana: { bg: "#d1fae5", border: "#34d399", text: "#065f46", dot: "#34d399" },
  Nishat:  { bg: "#fef3c7", border: "#fbbf24", text: "#92400e", dot: "#fbbf24" },
  Maa:     { bg: "#dbeafe", border: "#60a5fa", text: "#1e40af", dot: "#60a5fa" },
};

const FRIENDS = 5;

// ── Component ─────────────────────────────────────────────────────────────────

export default function TourTimetable(): JSX.Element {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [costs, setCosts] = useState<CostItem[]>(() => {
    try {
      const saved = localStorage.getItem("tour_costs");
      return saved ? JSON.parse(saved) : DEFAULT_COSTS;
    } catch { return DEFAULT_COSTS; }
  });
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [newLabel, setNewLabel] = useState<string>("");
  const [newPrice, setNewPrice] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");

  const [payments, setPayments] = useState<PaymentMap>(() => {
    try {
      const saved = localStorage.getItem("tour_payments");
      return saved
        ? JSON.parse(saved)
        : (Object.fromEntries(PEOPLE.map((p) => [p, []])) as PaymentMap);
    } catch { return Object.fromEntries(PEOPLE.map((p) => [p, []])) as PaymentMap; }
  });
  const [payInput, setPayInput] = useState<StringMap>(
    Object.fromEntries(PEOPLE.map((p) => [p, ""])) as StringMap
  );
  const [payNote, setPayNote] = useState<StringMap>(
    Object.fromEntries(PEOPLE.map((p) => [p, ""])) as StringMap
  );
  const [expandedLog, setExpandedLog] = useState<PersonName | null>(null);

  useEffect(() => {
    localStorage.setItem("tour_costs", JSON.stringify(costs));
  }, [costs]);

  useEffect(() => {
    localStorage.setItem("tour_payments", JSON.stringify(payments));
  }, [payments]);

  const totalPerPerson = costs.reduce((s, c) => s + c.perPerson, 0);

  // ── Cost handlers ───────────────────────────────────────────────────────────

  const addCategory = (): void => {
    const price = parseInt(newPrice);
    if (!newLabel.trim() || isNaN(price) || price <= 0) return;
    setCosts((prev) => [...prev, { id: Date.now(), label: newLabel.trim(), perPerson: price, icon: "✨" }]);
    setNewLabel(""); setNewPrice(""); setShowAdd(false);
  };

  const removeCategory = (id: number): void =>
    setCosts((prev) => prev.filter((c) => c.id !== id));

  const startEdit = (c: CostItem): void => {
    setEditingId(c.id);
    setEditPrice(String(c.perPerson));
  };

  const saveEdit = (id: number): void => {
    const price = parseInt(editPrice);
    if (!isNaN(price) && price >= 0)
      setCosts((prev) => prev.map((c) => (c.id === id ? { ...c, perPerson: price } : c)));
    setEditingId(null);
  };

  // ── Payment handlers ────────────────────────────────────────────────────────

  const recordPayment = (person: PersonName): void => {
    const amount = parseInt(payInput[person]);
    if (isNaN(amount) || amount <= 0) return;
    const entry: PaymentEntry = {
      id: Date.now(),
      amount,
      note: payNote[person].trim() || null,
      time: new Date().toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" }),
    };
    setPayments((prev) => ({ ...prev, [person]: [...prev[person], entry] }));
    setPayInput((prev) => ({ ...prev, [person]: "" }));
    setPayNote((prev) => ({ ...prev, [person]: "" }));
  };

  const removePayment = (person: PersonName, id: number): void =>
    setPayments((prev) => ({ ...prev, [person]: prev[person].filter((e) => e.id !== id) }));

  const paidTotal = (person: PersonName): number =>
    payments[person].reduce((s, e) => s + e.amount, 0);

  const balance = (person: PersonName): number => paidTotal(person) - totalPerPerson;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #f5ede4 0%, #e8e3f5 50%, #e0f0ea 100%)",
      fontFamily: "'Georgia', serif",
      padding: "2rem 1rem",
      color: "#1e1830",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        .tour-title { font-family: 'Playfair Display', serif; }
        .tour-body { font-family: 'DM Sans', sans-serif; }
        .cost-card:hover { transform: translateY(-4px); transition: transform 0.2s ease; }
        .event-row:hover .event-card { border-color: rgba(120,100,160,0.3) !important; }
        .section-btn:hover { opacity: 1 !important; }
        input { color: #1e1830 !important; }
        input::placeholder { color: #8878a8 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{
          display: "inline-block",
          background: "rgba(155,158,226,0.15)",
          border: "1px solid rgba(155,158,226,0.35)",
          borderRadius: "99px",
          padding: "4px 16px",
          fontSize: "12px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#5558C8",
          marginBottom: "1rem",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          5 friends · 1 day trip
        </div>
        <h1 className="tour-title" style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 900,
          margin: 0,
          background: "linear-gradient(90deg, #c084b8, #9B9EE2, #7ECBB5)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1.1,
        }}>
          The Grand Tour
        </h1>
        <p className="tour-body" style={{ color: "#6655a0", marginTop: "0.5rem", fontSize: "15px" }}>
          Mukigacha · Shashi Lodge · BAU Maath
        </p>
      </div>

      {/* ── Cost Breakdown ── */}
      <div className="tour-body" style={{
        background: "rgba(255,255,255,0.6)",
        border: "1px solid rgba(155,158,226,0.2)",
        borderRadius: "16px",
        padding: "1.25rem",
        maxWidth: "680px",
        margin: "0 auto 2rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6655a0" }}>
            Cost breakdown — per person
          </div>
          <button onClick={() => setShowAdd((v) => !v)} style={{
            background: showAdd ? "rgba(155,158,226,0.15)" : "rgba(155,158,226,0.08)",
            border: `1px solid ${showAdd ? "#9B9EE2" : "rgba(155,158,226,0.3)"}`,
            borderRadius: "99px",
            padding: "4px 12px",
            fontSize: "12px",
            color: showAdd ? "#9B9EE2" : "#a99cc0",
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: "5px",
          }}>
            {showAdd ? "✕ Cancel" : "+ Add category"}
          </button>
        </div>

        {showAdd && (
          <div style={{
            background: "rgba(155,158,226,0.08)",
            border: "1px solid rgba(155,158,226,0.25)",
            borderRadius: "10px",
            padding: "12px",
            marginBottom: "1rem",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
          }}>
            <input
              placeholder="Category name"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
              style={{ flex: "2 1 130px", background: "rgba(255,255,255,0.8)", border: "1px solid rgba(155,158,226,0.3)", borderRadius: "8px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
            />
            <div style={{ flex: "1 1 100px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "13px", color: "#a99cc0" }}>৳</span>
              <input
                placeholder="Per person"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
                type="number"
                min="0"
                style={{ flex: 1, background: "rgba(255,255,255,0.8)", border: "1px solid rgba(155,158,226,0.3)", borderRadius: "8px", padding: "7px 10px", fontSize: "13px", outline: "none" }}
              />
            </div>
            <button onClick={addCategory} style={{ background: "rgba(155,158,226,0.2)", border: "1px solid #9B9EE2", borderRadius: "8px", padding: "7px 16px", fontSize: "13px", color: "#6b6ea8", cursor: "pointer", fontWeight: 500 }}>Add</button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "8px", marginBottom: "1rem" }}>
          {costs.map((c) => (
            <div key={c.id} className="cost-card" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(155,158,226,0.2)", borderRadius: "10px", padding: "10px 10px 8px", transition: "transform 0.2s ease", position: "relative" }}>
              <button onClick={() => removeCategory(c.id)} title="Remove" style={{ position: "absolute", top: "5px", right: "6px", background: "none", border: "none", color: "#9880b8", cursor: "pointer", fontSize: "13px", padding: "0", lineHeight: 1 }}>✕</button>
              <div style={{ fontSize: "18px", marginBottom: "4px" }}>{c.icon}</div>
              <div style={{ fontSize: "11px", color: "#5e5280", marginBottom: "4px", paddingRight: "12px" }}>{c.label}</div>
              {editingId === c.id ? (
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(c.id); if (e.key === "Escape") setEditingId(null); }}
                    autoFocus
                    style={{ width: "60px", background: "rgba(255,255,255,0.9)", border: "1px solid #9B9EE2", borderRadius: "5px", padding: "3px 5px", fontSize: "13px", outline: "none" }}
                  />
                  <button onClick={() => saveEdit(c.id)} style={{ background: "none", border: "none", color: "#9B9EE2", cursor: "pointer", fontSize: "14px" }}>✓</button>
                </div>
              ) : (
                <div onClick={() => startEdit(c)} style={{ cursor: "pointer" }} title="Click to edit">
                  <div style={{ fontSize: "17px", fontWeight: 500, color: "#1e1830" }}>৳{c.perPerson}</div>
                  <div style={{ fontSize: "10px", color: "#6655a0" }}>Total ৳{(c.perPerson * FRIENDS).toLocaleString()}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(155,158,226,0.15)", paddingTop: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "#5e5280" }}>Total per person</span>
            <span style={{ fontSize: "24px", fontWeight: 700, color: "#5558C8", fontFamily: "'Playfair Display', serif" }}>
              ৳{totalPerPerson.toLocaleString()}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", color: "#5e5280" }}>Total for {FRIENDS} friends</span>
            <span style={{ fontSize: "15px", fontWeight: 500, color: "#3d3450" }}>৳{(totalPerPerson * FRIENDS).toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", height: "8px", gap: "1px" }}>
            {costs.map((c, i) => {
              const hues = ["#8880D8","#3AA880","#D07830","#C04890","#4880C8","#B89020","#3A9850","#B050C0","#30A8C0","#A89800"];
              const pct = totalPerPerson > 0 ? (c.perPerson / totalPerPerson) * 100 : 0;
              return <div key={c.id} style={{ width: `${pct}%`, background: hues[i % hues.length], transition: "width 0.4s ease" }} title={`${c.label}: ৳${c.perPerson}`} />;
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
            {costs.map((c, i) => {
              const hues = ["#8880D8","#3AA880","#D07830","#C04890","#4880C8","#B89020","#3A9850","#B050C0","#30A8C0","#A89800"];
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#4a4070" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "2px", background: hues[i % hues.length], flexShrink: 0 }} />
                  {c.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Payment Tracker ── */}
      <div className="tour-body" style={{ maxWidth: "680px", margin: "0 auto 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
          <span style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6655a0", fontWeight: 600 }}>💸 Payment tracker</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(155,158,226,0.3)" }} />
          <span style={{ fontSize: "11px", color: "#5e5280" }}>Due per person: <strong style={{ color: "#5558C8" }}>৳{totalPerPerson.toLocaleString()}</strong></span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "12px" }}>
          {PEOPLE.map((person) => {
            const col = PERSON_COLORS[person];
            const paid = paidTotal(person);
            const bal = balance(person);
            const pct = totalPerPerson > 0 ? Math.min((paid / totalPerPerson) * 100, 100) : 0;
            const isExpanded = expandedLog === person;
            return (
              <div key={person} style={{ background: "rgba(255,255,255,0.72)", border: `1px solid ${col.border}55`, borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${col.border}33` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: col.bg, border: `2px solid ${col.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: col.text }}>
                        {person[0]}
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e1830" }}>{person}</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: bal >= 0 ? "#2E9E82" : "#C8407E" }}>
                      {bal >= 0 ? `+৳${bal}` : `-৳${Math.abs(bal)}`}
                    </span>
                  </div>
                  <div style={{ height: "5px", background: "rgba(0,0,0,0.07)", borderRadius: "99px", overflow: "hidden", marginBottom: "5px" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: col.dot, borderRadius: "99px", transition: "width 0.4s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#6655a0" }}>
                    <span>Paid: <strong style={{ color: "#1e1830" }}>৳{paid.toLocaleString()}</strong></span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                </div>
                <div style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "5px" }}>
                    <input
                      type="number"
                      min="0"
                      placeholder="৳ amount"
                      value={payInput[person]}
                      onChange={(e) => setPayInput((prev) => ({ ...prev, [person]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && recordPayment(person)}
                      style={{ flex: 1, background: col.bg, border: `1px solid ${col.border}66`, borderRadius: "8px", padding: "6px 8px", fontSize: "13px", outline: "none", minWidth: 0 }}
                    />
                    <button onClick={() => recordPayment(person)} style={{ background: col.dot, border: "none", borderRadius: "8px", padding: "6px 10px", fontSize: "13px", color: "#fff", cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>+</button>
                  </div>
                  <input
                    type="text"
                    placeholder="Note (optional)"
                    value={payNote[person]}
                    onChange={(e) => setPayNote((prev) => ({ ...prev, [person]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && recordPayment(person)}
                    style={{ width: "100%", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(155,158,226,0.25)", borderRadius: "8px", padding: "5px 8px", fontSize: "12px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                {payments[person].length > 0 && (
                  <div style={{ borderTop: `1px solid ${col.border}22` }}>
                    <button onClick={() => setExpandedLog(isExpanded ? null : person)} style={{ width: "100%", background: "none", border: "none", padding: "7px 14px", fontSize: "11px", color: col.text, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between" }}>
                      <span>{payments[person].length} payment{payments[person].length > 1 ? "s" : ""} logged</span>
                      <span>{isExpanded ? "▲ hide" : "▼ show"}</span>
                    </button>
                    {isExpanded && (
                      <div style={{ padding: "0 14px 10px", display: "flex", flexDirection: "column", gap: "5px" }}>
                        {payments[person].map((entry) => (
                          <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: col.bg, borderRadius: "7px", padding: "5px 8px", fontSize: "12px" }}>
                            <div>
                              <span style={{ fontWeight: 600, color: col.text }}>৳{entry.amount.toLocaleString()}</span>
                              {entry.note && <span style={{ color: "#5e5280", marginLeft: "5px" }}>· {entry.note}</span>}
                              <span style={{ color: "#9988b8", fontSize: "10px", marginLeft: "5px" }}>{entry.time}</span>
                            </div>
                            <button onClick={() => removePayment(person, entry.id)} style={{ background: "none", border: "none", color: "#b090b0", cursor: "pointer", fontSize: "13px", padding: "0 0 0 6px", lineHeight: 1 }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "14px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(155,158,226,0.25)", borderRadius: "12px", padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "12px", color: "#5e5280" }}>Group total paid: <strong style={{ fontSize: "15px", color: "#1e1830" }}>৳{PEOPLE.reduce((s, p) => s + paidTotal(p), 0).toLocaleString()}</strong></span>
          <span style={{ fontSize: "12px", color: "#5e5280" }}>Group total due: <strong style={{ fontSize: "15px", color: "#5558C8" }}>৳{(totalPerPerson * FRIENDS).toLocaleString()}</strong></span>
          <span style={{ fontSize: "12px", color: "#5e5280" }}>Remaining: <strong style={{ fontSize: "15px", color: "#C8407E" }}>৳{Math.max(0, totalPerPerson * FRIENDS - PEOPLE.reduce((s, p) => s + paidTotal(p), 0)).toLocaleString()}</strong></span>
        </div>
      </div>

      {/* ── Section filter ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", maxWidth: "680px", margin: "0 auto 1.5rem" }}>
        <button className="section-btn tour-body" onClick={() => setActiveSection(null)} style={{ background: activeSection === null ? "rgba(155,158,226,0.15)" : "rgba(155,158,226,0.06)", border: `1px solid ${activeSection === null ? "#9B9EE2" : "rgba(155,158,226,0.25)"}`, borderRadius: "99px", padding: "5px 14px", fontSize: "12px", color: activeSection === null ? "#5558C8" : "#5e5280", cursor: "pointer", opacity: 0.9 }}>All</button>
        {schedule.map((s) => (
          <button key={s.section} className="section-btn tour-body" onClick={() => setActiveSection(activeSection === s.section ? null : s.section)} style={{ background: activeSection === s.section ? `${s.color}25` : "rgba(155,158,226,0.06)", border: `1px solid ${activeSection === s.section ? s.color : "rgba(155,158,226,0.25)"}`, borderRadius: "99px", padding: "5px 14px", fontSize: "12px", color: activeSection === s.section ? s.color : "#5e5280", cursor: "pointer", opacity: 0.9 }}>{s.section}</button>
        ))}
      </div>

      {/* ── Timeline ── */}
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        {schedule
          .filter((s) => !activeSection || s.section === activeSection)
          .map((section) => (
            <div key={section.section} style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: section.color, flexShrink: 0 }} />
                <span className="tour-title" style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: section.color, fontWeight: 700 }}>{section.section}</span>
                <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, ${section.color}44, transparent)` }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {section.items.map((item, i) => (
                  <div key={i} className="event-row" style={{ display: "grid", gridTemplateColumns: "85px 20px 1fr", alignItems: "stretch" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start", paddingRight: "10px", paddingTop: "8px" }}>
                      <span className="tour-body" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.03em", color: item.sub ? `${section.color}99` : section.color, background: item.sub ? `${section.color}10` : `${section.color}22`, border: `1px solid ${item.sub ? section.color + "30" : section.color + "55"}`, borderRadius: "6px", padding: "3px 7px", lineHeight: 1.5, textAlign: "right", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {item.time.replace(" – ", "\n")}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: item.sub ? 7 : 10, height: item.sub ? 7 : 10, borderRadius: "50%", background: item.sub ? "rgba(155,158,226,0.3)" : section.color, border: item.sub ? `1px solid ${section.color}` : "none", marginTop: 10, flexShrink: 0 }} />
                      {i < section.items.length - 1 && (
                        <div style={{ flex: 1, width: "1px", background: `linear-gradient(180deg, ${section.color}55, ${section.color}11)`, minHeight: "12px" }} />
                      )}
                    </div>
                    <div style={{ padding: "4px 0 10px 12px" }}>
                      <div className="event-card" style={{ background: item.sub ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.7)", border: `1px solid ${item.sub ? "rgba(155,158,226,0.12)" : "rgba(155,158,226,0.22)"}`, borderLeft: item.sub ? `2px solid ${section.color}88` : `2px solid ${section.color}`, borderRadius: "0 10px 10px 0", padding: "8px 12px", transition: "border-color 0.2s ease" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                          <span style={{ fontSize: "15px" }}>{item.icon}</span>
                          <span className="tour-body" style={{ fontSize: "14px", fontWeight: 500, color: "#1e1830" }}>{item.title}</span>
                        </div>
                        {item.note && (
                          <div className="tour-body" style={{ fontSize: "12px", color: "#5e5280", marginTop: "2px", paddingLeft: "22px" }}>{item.note}</div>
                        )}
                        {item.cost && (
                          <div className="tour-body" style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: `${section.color}20`, color: section.color, fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "99px", marginTop: "5px", marginLeft: "22px" }}>
                            💰 {item.cost}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* ── Footer ── */}
      <footer className="tour-body" style={{ maxWidth: "680px", margin: "3rem auto 0", borderTop: "1px solid rgba(155,158,226,0.3)", paddingTop: "2rem", paddingBottom: "2rem", textAlign: "center" }}>
        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #e8e3f5, #d0f0e8)", border: "1px solid rgba(155,158,226,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", marginBottom: "2px" }}>🎒</div>
          <span className="tour-title" style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "0.06em", background: "linear-gradient(90deg, #C8407E, #5558C8, #2E9E82)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Delinquents
          </span>
          <span style={{ fontSize: "11px", color: "#9988b8", letterSpacing: "0.04em" }}>
            © {new Date().getFullYear()} Delinquents. All rights reserved.
          </span>
          <span style={{ fontSize: "11px", color: "#b0a8c4", fontStyle: "italic" }}>
            Made with 💜 for the grand tour
          </span>
          <div style={{ marginTop: "6px", fontSize: "10px", color: "#c4b8d8", borderTop: "1px solid rgba(155,158,226,0.2)", paddingTop: "8px" }}>
            Click any price to edit · ✕ to remove · + Add category
          </div>
        </div>
      </footer>
    </div>
  );
}