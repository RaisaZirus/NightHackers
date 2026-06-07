import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CostItem     { id: number; label: string; perPerson: number; icon: string; }
interface ScheduleItem { id: number; time: string; title: string; note?: string; cost?: string; icon: string; sub?: boolean; }
interface ScheduleSection { section: string; color: string; items: ScheduleItem[]; }
interface PaymentEntry { id: number; amount: number; note: string | null; time: string; }
interface PersonColor  { bg: string; border: string; text: string; dot: string; }

type PersonName = "Raisa" | "Salwa" | "Farhana" | "Nishat" | "Maa";
type PaymentMap = Record<PersonName, PaymentEntry[]>;
type StringMap  = Record<PersonName, string>;

// ── Light / Dark tokens ───────────────────────────────────────────────────────

const LIGHT = {
  bg:            "linear-gradient(160deg, #f5ede4 0%, #e8e3f5 50%, #e0f0ea 100%)",
  surface:       "rgba(255,255,255,0.72)",
  surfaceSolid:  "#ffffff",
  border:        "rgba(155,158,226,0.22)",
  accent:        "#5558C8",
  accentSoft:    "rgba(155,158,226,0.12)",
  textPrimary:   "#1e1830",
  textSecondary: "#5e5280",
  textMuted:     "#b0a8c4",
  sectionColors: ["#C8722A","#2E9E82","#5558C8","#C8407E","#7C52B8"],
  inputBg:       "rgba(255,255,255,0.85)",
  syncBg:        "rgba(255,255,255,0.9)",
  titleGradient: "linear-gradient(90deg, #be185d, #5558C8, #0f766e)",
};

const DARK = {
  bg:            "linear-gradient(160deg, #0f0c1a 0%, #1a1730 50%, #0c1a14 100%)",
  surface:       "rgba(255,255,255,0.06)",
  surfaceSolid:  "#1e1b2e",
  border:        "rgba(155,158,226,0.18)",
  accent:        "#a78bfa",
  accentSoft:    "rgba(167,139,250,0.14)",
  textPrimary:   "#f0ecff",
  textSecondary: "#c4b8d8",
  textMuted:     "#9d8ec0",
  sectionColors: ["#E8A87C","#5ECFB0","#9B9EE2","#E896B8","#B8A0D8"],
  inputBg:       "rgba(255,255,255,0.07)",
  syncBg:        "rgba(30,27,46,0.95)",
  titleGradient: "linear-gradient(90deg, #f9a8d4, #c4b5fd, #6ee7b7)",
};

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

const DEFAULT_SCHEDULE: ScheduleSection[] = [
  { section: "Morning",     color: "#C8722A", items: [
    { id: 101, time: "6:00 – 7:30",  title: "Breakfast",       note: "Morning meal before departure",          cost: "৳250 / person", icon: "🍳" },
    { id: 102, time: "7:30 – 11:30", title: "ENA Bus Journey", note: "4 hours on the road to the destination", cost: "৳100 / person", icon: "🚌" },
  ]},
  { section: "Arrival",     color: "#2E9E82", items: [
    { id: 201, time: "12:00 pm",    title: "Arrive at Destination", note: "Welcome to the tour location!", icon: "📍" },
    { id: 202, time: "1:00 pm",     title: "Check In",              note: "Settle into accommodation",     cost: "৳320 / person", icon: "🏠" },
    { id: 203, time: "1:00 – 1:30", title: "Freshen Up",            note: "Eat, shower, rest a bit",       icon: "🚿" },
  ]},
  { section: "Exploration", color: "#5558C8", items: [
    { id: 301, time: "1:30 – 2:30", title: "Bus to Jomidar Bari",     note: "Head to Mukigacha Zamindar House",   icon: "🚌" },
    { id: 302, time: "2:30 – 3:00", title: "Jomidar Bari Visit",      note: "Explore the heritage manor",         icon: "🏯",  sub: true },
    { id: 303, time: "3:00 – 3:05", title: "Buy Monda + Gift",        note: "Local monda sweets & friend's gift", icon: "🎁",  sub: true },
    { id: 304, time: "3:05 – 4:05", title: "Shashi Lodge Gate",       note: "Explore the area outside",           icon: "🏛️", sub: true },
    { id: 305, time: "4:05 – 4:10", title: "Buy Entry Ticket",        note: "৳15 ticket at the counter",          cost: "৳15 / person", icon: "🎟️", sub: true },
    { id: 306, time: "4:10 – 5:00", title: "Inside Shashi Lodge",     note: "Explore until closing time",         icon: "🚪",  sub: true },
    { id: 307, time: "5:00 pm",     title: "Street Food by the Park", note: "Snacks & chill near the park",       icon: "🍢",  sub: true },
  ]},
  { section: "Evening",     color: "#C8407E", items: [
    { id: 401, time: "6:00 – 7:00", title: "Friend Meetup",     note: "Special meetup hour with the crew", icon: "🤝" },
    { id: 402, time: "7:00 – 9:00", title: "Food Court Dinner", note: "Big group dinner — eat, eat, eat!", icon: "🍽️" },
  ]},
  { section: "Night",       color: "#7C52B8", items: [
    { id: 501, time: "9:00 pm →", title: "BAU Maath — All Night", note: "Sit on the field, play cards till dawn 🌙", icon: "🃏" },
  ]},
];

const DEFAULT_PAYMENTS: PaymentMap =
  Object.fromEntries(["Raisa","Salwa","Farhana","Nishat","Maa"].map((p) => [p, []])) as PaymentMap;

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
  const [dark, setDark]                     = useState<boolean>(false);
  const [activeSection, setActiveSection]   = useState<string | null>(null);
  const [costs, setCosts]                   = useState<CostItem[]>(DEFAULT_COSTS);
  const [scheduleData, setScheduleData]     = useState<ScheduleSection[]>(DEFAULT_SCHEDULE);
  const [showAdd, setShowAdd]               = useState<boolean>(false);
  const [newLabel, setNewLabel]             = useState<string>("");
  const [newPrice, setNewPrice]             = useState<string>("");
  const [editingId, setEditingId]           = useState<number | null>(null);
  const [editPrice, setEditPrice]           = useState<string>("");
  const [payments, setPayments]             = useState<PaymentMap>(DEFAULT_PAYMENTS);
  const [payInput, setPayInput]             = useState<StringMap>(Object.fromEntries(PEOPLE.map(p => [p, ""])) as StringMap);
  const [payNote, setPayNote]               = useState<StringMap>(Object.fromEntries(PEOPLE.map(p => [p, ""])) as StringMap);
  const [expandedLog, setExpandedLog]       = useState<PersonName | null>(null);
  const [ready, setReady]                   = useState<boolean>(false);
  const [syncing, setSyncing]               = useState<boolean>(false);
  const [addItemOpen, setAddItemOpen]       = useState<string | null>(null);
  const [newItemTime, setNewItemTime]       = useState<string>("");
  const [newItemTitle, setNewItemTitle]     = useState<string>("");
  const [newItemNote, setNewItemNote]       = useState<string>("");

  const T = dark ? DARK : LIGHT;

  // Persist dark mode preference locally
  useEffect(() => {
    const saved = localStorage.getItem("tour_dark");
    if (saved === "true") setDark(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("tour_dark", String(dark));
  }, [dark]);

  // ── Firestore sync ────────────────────────────────────────────────────────

  useEffect(() => {
    const ref = doc(db, "tour", "shared");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.costs)        setCosts(data.costs);
        if (data.payments)     setPayments(data.payments);
        if (data.scheduleData) setScheduleData(data.scheduleData);
      }
      setReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!ready) return;
    setSyncing(true);
    setDoc(doc(db, "tour", "shared"), { costs, payments, scheduleData }, { merge: true })
      .finally(() => setTimeout(() => setSyncing(false), 800));
  }, [costs, payments, scheduleData, ready]);

  const totalPerPerson = costs.reduce((s, c) => s + c.perPerson, 0);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const addCategory = () => {
    const price = parseInt(newPrice);
    if (!newLabel.trim() || isNaN(price) || price <= 0) return;
    setCosts(prev => [...prev, { id: Date.now(), label: newLabel.trim(), perPerson: price, icon: "✨" }]);
    setNewLabel(""); setNewPrice(""); setShowAdd(false);
  };
  const removeCategory = (id: number) => setCosts(prev => prev.filter(c => c.id !== id));
  const startEdit      = (c: CostItem) => { setEditingId(c.id); setEditPrice(String(c.perPerson)); };
  const saveEdit       = (id: number) => {
    const price = parseInt(editPrice);
    if (!isNaN(price) && price >= 0) setCosts(prev => prev.map(c => c.id === id ? { ...c, perPerson: price } : c));
    setEditingId(null);
  };
  const deleteScheduleItem = (sectionName: string, itemId: number) =>
    setScheduleData(prev => prev.map(s => s.section === sectionName ? { ...s, items: s.items.filter(it => it.id !== itemId) } : s));
  const addScheduleItem = (sectionName: string) => {
    if (!newItemTitle.trim()) return;
    const newItem: ScheduleItem = { id: Date.now(), time: newItemTime.trim() || "—", title: newItemTitle.trim(), note: newItemNote.trim() || undefined, icon: "📌" };
    setScheduleData(prev => prev.map(s => s.section === sectionName ? { ...s, items: [...s.items, newItem] } : s));
    setNewItemTime(""); setNewItemTitle(""); setNewItemNote(""); setAddItemOpen(null);
  };
  const recordPayment = (person: PersonName) => {
    const amount = parseInt(payInput[person]);
    if (isNaN(amount) || amount <= 0) return;
    const entry: PaymentEntry = { id: Date.now(), amount, note: payNote[person].trim() || null, time: new Date().toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" }) };
    setPayments(prev => ({ ...prev, [person]: [...prev[person], entry] }));
    setPayInput(prev => ({ ...prev, [person]: "" }));
    setPayNote(prev => ({ ...prev, [person]: "" }));
  };
  const removePayment = (person: PersonName, id: number) =>
    setPayments(prev => ({ ...prev, [person]: prev[person].filter(e => e.id !== id) }));
  const paidTotal = (person: PersonName) => payments[person].reduce((s, e) => s + e.amount, 0);
  const balance   = (person: PersonName) => paidTotal(person) - totalPerPerson;

  // ── Loading ────────────────────────────────────────────────────────────────

  if (!ready) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #f5ede4, #e8e3f5, #e0f0ea)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontSize: "32px", animation: "spin 1.5s linear infinite" }}>🎒</div>
      <div style={{ fontSize: "14px", color: "#6655a0" }}>Loading the grand tour…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Georgia', serif", padding: "2rem 1rem", color: T.textPrimary, transition: "background 0.5s ease, color 0.4s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        .tour-title { font-family: 'Playfair Display', serif; }
        .tour-body  { font-family: 'DM Sans', sans-serif; }
        .cost-card  { transition: transform 0.2s ease, box-shadow 0.2s ease !important; }
        .cost-card:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 6px 24px rgba(0,0,0,0.1); }
        .event-card { transition: transform 0.2s ease, border-color 0.2s ease !important; }
        .event-row:hover .event-card { transform: translateX(3px); }
        .event-row:hover .del-btn { opacity: 1 !important; }
        .section-btn { transition: all 0.18s ease !important; }
        .section-btn:hover { transform: translateY(-2px); box-shadow: 0 3px 10px rgba(0,0,0,0.1); }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes moonrise { from { transform: translateY(8px) rotate(-20deg); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes sunrise  { from { transform: translateY(8px) rotate(20deg);  opacity: 0; } to { transform: none; opacity: 1; } }
        .animate-in { animation: fadeSlideUp 0.4s ease both; }
        input { font-family: 'DM Sans', sans-serif !important; }
      `}</style>

      {/* ── Dark mode toggle ── */}
      <button
        onClick={() => setDark(d => !d)}
        title={dark ? "Switch to light mode" : "Switch to dark mode"}
        style={{
          position: "fixed", top: "16px", right: "16px", zIndex: 300,
          width: "52px", height: "28px",
          background: dark ? "linear-gradient(135deg, #1e1b2e, #2e2648)" : "linear-gradient(135deg, #e0eaff, #c7d9f8)",
          border: `1.5px solid ${dark ? "#a78bfa55" : "#9B9EE266"}`,
          borderRadius: "99px",
          cursor: "pointer",
          padding: "3px",
          display: "flex",
          alignItems: "center",
          transition: "background 0.4s ease, border-color 0.3s ease",
          boxShadow: dark ? "0 0 12px rgba(167,139,250,0.3)" : "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {/* Track icons */}
        <span style={{ position: "absolute", left: "6px", fontSize: "11px", opacity: dark ? 0 : 0.6, transition: "opacity 0.3s" }}>☀️</span>
        <span style={{ position: "absolute", right: "6px", fontSize: "11px", opacity: dark ? 0.8 : 0, transition: "opacity 0.3s" }}>🌙</span>
        {/* Thumb */}
        <div style={{
          width: "22px", height: "22px", borderRadius: "50%",
          background: dark ? "linear-gradient(135deg, #a78bfa, #7c52b8)" : "linear-gradient(135deg, #ffffff, #f0f4ff)",
          boxShadow: dark ? "0 2px 8px rgba(167,139,250,0.5)" : "0 2px 6px rgba(0,0,0,0.15)",
          transform: dark ? "translateX(24px)" : "translateX(0px)",
          transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.4s ease, box-shadow 0.3s ease",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px",
        }}>
          <span key={String(dark)} style={{ animation: dark ? "moonrise 0.3s ease" : "sunrise 0.3s ease" }}>
            {dark ? "🌙" : "☀️"}
          </span>
        </div>
      </button>

      {/* ── Sync indicator ── */}
      {syncing && (
        <div style={{ position: "fixed", top: "16px", right: "80px", background: T.syncBg, border: `1px solid ${T.accent}44`, borderRadius: "99px", padding: "4px 12px", fontSize: "11px", color: T.accent, fontFamily: "'DM Sans', sans-serif", zIndex: 200, animation: "pulse 1.2s ease infinite", backdropFilter: "blur(8px)" }}>
          ☁️ Saving…
        </div>
      )}

      {/* ── Header ── */}
      <div className="animate-in" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{ display: "inline-block", background: T.accentSoft, border: `1px solid ${T.accent}55`, borderRadius: "99px", padding: "4px 16px", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: T.accent, marginBottom: "1rem", fontFamily: "'DM Sans', sans-serif" }}>
          5 friends · 1 day trip
        </div>
        <h1 key={String(dark)} className="tour-title" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, margin: 0, background: T.titleGradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1 }}>
          The Grand Tour
        </h1>
        <p className="tour-body" style={{ color: T.textSecondary, marginTop: "0.5rem", fontSize: "15px" }}>
          Mukigacha · Shashi Lodge · BAU Maath
        </p>
      </div>

      {/* ── Cost Breakdown ── */}
      <div className="tour-body animate-in" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "1.25rem", maxWidth: "680px", margin: "0 auto 2rem", animationDelay: "0.05s", backdropFilter: "blur(8px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: T.textSecondary }}>Cost breakdown — per person</div>
          <button onClick={() => setShowAdd(v => !v)} style={{ background: showAdd ? T.accentSoft : "transparent", border: `1px solid ${showAdd ? T.accent : T.accent + "55"}`, borderRadius: "99px", padding: "4px 12px", fontSize: "12px", color: T.accent, cursor: "pointer" }}>
            {showAdd ? "✕ Cancel" : "+ Add category"}
          </button>
        </div>
        {showAdd && (
          <div style={{ background: T.accentSoft, border: `1px solid ${T.accent}33`, borderRadius: "10px", padding: "12px", marginBottom: "1rem", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", animation: "fadeSlideIn 0.2s ease" }}>
            <input placeholder="Category name" value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === "Enter" && addCategory()} style={{ flex: "2 1 130px", background: T.inputBg, border: `1px solid ${T.accent}33`, borderRadius: "8px", padding: "7px 10px", fontSize: "13px", outline: "none", color: T.textPrimary }} />
            <div style={{ flex: "1 1 100px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "13px", color: T.textMuted }}>৳</span>
              <input placeholder="Per person" value={newPrice} onChange={e => setNewPrice(e.target.value)} onKeyDown={e => e.key === "Enter" && addCategory()} type="number" min="0" style={{ flex: 1, background: T.inputBg, border: `1px solid ${T.accent}33`, borderRadius: "8px", padding: "7px 10px", fontSize: "13px", outline: "none", color: T.textPrimary }} />
            </div>
            <button onClick={addCategory} style={{ background: T.accent, border: "none", borderRadius: "8px", padding: "7px 16px", fontSize: "13px", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Add</button>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "8px", marginBottom: "1rem" }}>
          {costs.map(c => (
            <div key={c.id} className="cost-card" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "10px 10px 8px", position: "relative" }}>
              <button onClick={() => removeCategory(c.id)} style={{ position: "absolute", top: "5px", right: "6px", background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "13px", padding: "0", lineHeight: 1 }}>✕</button>
              <div style={{ fontSize: "18px", marginBottom: "4px" }}>{c.icon}</div>
              <div style={{ fontSize: "11px", color: T.textSecondary, marginBottom: "4px", paddingRight: "12px" }}>{c.label}</div>
              {editingId === c.id ? (
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveEdit(c.id); if (e.key === "Escape") setEditingId(null); }} autoFocus style={{ width: "60px", background: T.inputBg, border: `1px solid ${T.accent}`, borderRadius: "5px", padding: "3px 5px", fontSize: "13px", outline: "none", color: T.textPrimary }} />
                  <button onClick={() => saveEdit(c.id)} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: "14px" }}>✓</button>
                </div>
              ) : (
                <div onClick={() => startEdit(c)} style={{ cursor: "pointer" }} title="Click to edit">
                  <div style={{ fontSize: "17px", fontWeight: 500, color: T.textPrimary }}>৳{c.perPerson}</div>
                  <div style={{ fontSize: "10px", color: T.textSecondary }}>Total ৳{(c.perPerson * FRIENDS).toLocaleString()}</div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: T.textSecondary }}>Total per person</span>
            <span style={{ fontSize: "24px", fontWeight: 700, color: T.accent, fontFamily: "'Playfair Display', serif" }}>৳{totalPerPerson.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", color: T.textSecondary }}>Total for {FRIENDS} friends</span>
            <span style={{ fontSize: "15px", fontWeight: 500, color: T.textPrimary }}>৳{(totalPerPerson * FRIENDS).toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", height: "8px", gap: "1px" }}>
            {costs.map((c, i) => {
              const pct = totalPerPerson > 0 ? (c.perPerson / totalPerPerson) * 100 : 0;
              return <div key={c.id} style={{ width: `${pct}%`, background: T.sectionColors[i % T.sectionColors.length], transition: "width 0.5s ease" }} title={`${c.label}: ৳${c.perPerson}`} />;
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
            {costs.map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: T.textSecondary }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "2px", background: T.sectionColors[i % T.sectionColors.length], flexShrink: 0 }} />
                {c.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Payment Tracker ── */}
      <div className="tour-body animate-in" style={{ maxWidth: "680px", margin: "0 auto 2rem", animationDelay: "0.1s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
          <span style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: T.textSecondary, fontWeight: 600 }}>💸 Payment tracker</span>
          <div style={{ flex: 1, height: "1px", background: `${T.accent}33` }} />
          <span style={{ fontSize: "11px", color: T.textSecondary }}>Due per person: <strong style={{ color: T.accent }}>৳{totalPerPerson.toLocaleString()}</strong></span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "12px" }}>
          {PEOPLE.map(person => {
            const col = PERSON_COLORS[person];
            const paid = paidTotal(person);
            const bal  = balance(person);
            const pct  = totalPerPerson > 0 ? Math.min((paid / totalPerPerson) * 100, 100) : 0;
            const isExpanded = expandedLog === person;
            return (
              <div key={person} style={{ background: T.surface, border: `1px solid ${col.border}55`, borderRadius: "14px", overflow: "hidden", backdropFilter: "blur(6px)" }}>
                <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${col.border}33` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: col.bg, border: `2px solid ${col.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: col.text }}>{person[0]}</div>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: T.textPrimary }}>{person}</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: bal >= 0 ? "#34d399" : "#f472b6" }}>
                      {bal >= 0 ? `+৳${bal}` : `-৳${Math.abs(bal)}`}
                    </span>
                  </div>
                  <div style={{ height: "5px", background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)", borderRadius: "99px", overflow: "hidden", marginBottom: "5px" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: col.dot, borderRadius: "99px", transition: "width 0.6s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: T.textSecondary }}>
                    <span>Paid: <strong style={{ color: T.textPrimary }}>৳{paid.toLocaleString()}</strong></span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                </div>
                <div style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "5px" }}>
                    <input type="number" min="0" placeholder="৳ amount" value={payInput[person]} onChange={e => setPayInput(prev => ({ ...prev, [person]: e.target.value }))} onKeyDown={e => e.key === "Enter" && recordPayment(person)} style={{ flex: 1, background: col.bg, border: `1px solid ${col.border}66`, borderRadius: "8px", padding: "6px 8px", fontSize: "13px", outline: "none", minWidth: 0, color: col.text }} />
                    <button onClick={() => recordPayment(person)} style={{ background: col.dot, border: "none", borderRadius: "8px", padding: "6px 10px", fontSize: "13px", color: "#fff", cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>+</button>
                  </div>
                  <input type="text" placeholder="Note (optional)" value={payNote[person]} onChange={e => setPayNote(prev => ({ ...prev, [person]: e.target.value }))} onKeyDown={e => e.key === "Enter" && recordPayment(person)} style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: "8px", padding: "5px 8px", fontSize: "12px", outline: "none", boxSizing: "border-box", color: T.textPrimary }} />
                </div>
                {payments[person].length > 0 && (
                  <div style={{ borderTop: `1px solid ${col.border}22` }}>
                    <button onClick={() => setExpandedLog(isExpanded ? null : person)} style={{ width: "100%", background: "none", border: "none", padding: "7px 14px", fontSize: "11px", color: col.text, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between" }}>
                      <span>{payments[person].length} payment{payments[person].length > 1 ? "s" : ""} logged</span>
                      <span style={{ transition: "transform 0.2s", display: "inline-block", transform: isExpanded ? "rotate(180deg)" : "none" }}>▼</span>
                    </button>
                    {isExpanded && (
                      <div style={{ padding: "0 14px 10px", display: "flex", flexDirection: "column", gap: "5px", animation: "fadeSlideIn 0.2s ease" }}>
                        {payments[person].map(entry => (
                          <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: dark ? "rgba(255,255,255,0.05)" : col.bg, borderRadius: "7px", padding: "5px 8px", fontSize: "12px" }}>
                            <div>
                              <span style={{ fontWeight: 600, color: col.text }}>৳{entry.amount.toLocaleString()}</span>
                              {entry.note && <span style={{ color: T.textSecondary, marginLeft: "5px" }}>· {entry.note}</span>}
                              <span style={{ color: T.textMuted, fontSize: "10px", marginLeft: "5px" }}>{entry.time}</span>
                            </div>
                            <button onClick={() => removePayment(person, entry.id)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "13px", padding: "0 0 0 6px" }}>✕</button>
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
        <div style={{ marginTop: "14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "12px", color: T.textSecondary }}>Group total paid: <strong style={{ fontSize: "15px", color: T.textPrimary }}>৳{PEOPLE.reduce((s, p) => s + paidTotal(p), 0).toLocaleString()}</strong></span>
          <span style={{ fontSize: "12px", color: T.textSecondary }}>Group total due: <strong style={{ fontSize: "15px", color: T.accent }}>৳{(totalPerPerson * FRIENDS).toLocaleString()}</strong></span>
          <span style={{ fontSize: "12px", color: T.textSecondary }}>Remaining: <strong style={{ fontSize: "15px", color: dark ? "#f472b6" : "#e11d48" }}>৳{Math.max(0, totalPerPerson * FRIENDS - PEOPLE.reduce((s, p) => s + paidTotal(p), 0)).toLocaleString()}</strong></span>
        </div>
      </div>

      {/* ── Section filter ── */}
      <div className="animate-in" style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", maxWidth: "680px", margin: "0 auto 1.5rem", animationDelay: "0.15s" }}>
        <button className="section-btn tour-body" onClick={() => setActiveSection(null)} style={{ background: activeSection === null ? T.accentSoft : T.surface, border: `1px solid ${activeSection === null ? T.accent : T.accent + "44"}`, borderRadius: "99px", padding: "5px 14px", fontSize: "12px", color: activeSection === null ? T.accent : T.textSecondary, cursor: "pointer" }}>All</button>
        {scheduleData.map((s, idx) => {
          const sc = T.sectionColors[idx % T.sectionColors.length];
          return (
            <button key={s.section} className="section-btn tour-body" onClick={() => setActiveSection(activeSection === s.section ? null : s.section)} style={{ background: activeSection === s.section ? `${sc}22` : T.surface, border: `1px solid ${activeSection === s.section ? sc : sc + "55"}`, borderRadius: "99px", padding: "5px 14px", fontSize: "12px", color: activeSection === s.section ? sc : T.textSecondary, cursor: "pointer" }}>{s.section}</button>
          );
        })}
      </div>

      {/* ── Timeline ── */}
      <div className="animate-in" style={{ maxWidth: "680px", margin: "0 auto", animationDelay: "0.2s" }}>
        {scheduleData.filter(s => !activeSection || s.section === activeSection).map((section, idx) => {
          const sc = T.sectionColors[idx % T.sectionColors.length];
          return (
            <div key={section.section} style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: sc, flexShrink: 0 }} />
                <span className="tour-title" style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: sc, fontWeight: 700 }}>{section.section}</span>
                <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, ${sc}55, transparent)` }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {section.items.map((item, i) => (
                  <div key={item.id} className="event-row" style={{ display: "grid", gridTemplateColumns: "85px 20px 1fr", alignItems: "stretch" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start", paddingRight: "10px", paddingTop: "8px" }}>
                      <span className="tour-body" style={{ fontSize: "10px", fontWeight: 600, color: item.sub ? `${sc}88` : sc, background: item.sub ? `${sc}12` : `${sc}22`, border: `1px solid ${item.sub ? sc + "25" : sc + "55"}`, borderRadius: "6px", padding: "3px 7px", lineHeight: 1.5, textAlign: "right", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {item.time.replace(" – ", "\n")}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: item.sub ? 7 : 10, height: item.sub ? 7 : 10, borderRadius: "50%", background: item.sub ? `${sc}44` : sc, border: item.sub ? `1px solid ${sc}` : "none", marginTop: 10, flexShrink: 0 }} />
                      {i < section.items.length - 1 && <div style={{ flex: 1, width: "1px", background: `linear-gradient(180deg, ${sc}55, ${sc}11)`, minHeight: "12px" }} />}
                    </div>
                    <div style={{ padding: "4px 0 10px 12px" }}>
                      <div className="event-card" style={{ position: "relative", background: item.sub ? (dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.45)") : T.surface, border: `1px solid ${item.sub ? sc + "18" : T.border}`, borderLeft: `2px solid ${item.sub ? sc + "66" : sc}`, borderRadius: "0 10px 10px 0", padding: "8px 12px", backdropFilter: "blur(6px)" }}>
                        <button className="del-btn" onClick={() => deleteScheduleItem(section.section, item.id)} style={{ position: "absolute", top: "6px", right: "8px", background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "13px", padding: 0, opacity: 0, transition: "opacity 0.15s" }}>✕</button>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", paddingRight: "18px" }}>
                          <span style={{ fontSize: "15px" }}>{item.icon}</span>
                          <span className="tour-body" style={{ fontSize: "14px", fontWeight: 500, color: T.textPrimary }}>{item.title}</span>
                        </div>
                        {item.note && <div className="tour-body" style={{ fontSize: "12px", color: T.textSecondary, marginTop: "2px", paddingLeft: "22px" }}>{item.note}</div>}
                        {item.cost && <div className="tour-body" style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: `${sc}20`, color: sc, fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "99px", marginTop: "5px", marginLeft: "22px" }}>💰 {item.cost}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginLeft: "105px", marginTop: "6px" }}>
                {addItemOpen === section.section ? (
                  <div style={{ background: `${sc}12`, border: `1px solid ${sc}33`, borderRadius: "10px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "7px", animation: "fadeSlideIn 0.2s ease" }}>
                    <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
                      <input placeholder="Time (e.g. 2:00 pm)" value={newItemTime} onChange={e => setNewItemTime(e.target.value)} style={{ flex: "1 1 110px", background: T.inputBg, border: `1px solid ${sc}44`, borderRadius: "7px", padding: "6px 9px", fontSize: "12px", outline: "none", color: T.textPrimary }} />
                      <input placeholder="Title *" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && addScheduleItem(section.section)} style={{ flex: "2 1 150px", background: T.inputBg, border: `1px solid ${sc}44`, borderRadius: "7px", padding: "6px 9px", fontSize: "12px", outline: "none", color: T.textPrimary }} />
                    </div>
                    <div style={{ display: "flex", gap: "7px" }}>
                      <input placeholder="Note (optional)" value={newItemNote} onChange={e => setNewItemNote(e.target.value)} onKeyDown={e => e.key === "Enter" && addScheduleItem(section.section)} style={{ flex: 1, background: T.inputBg, border: `1px solid ${sc}44`, borderRadius: "7px", padding: "6px 9px", fontSize: "12px", outline: "none", color: T.textPrimary }} />
                      <button onClick={() => addScheduleItem(section.section)} style={{ background: sc, border: "none", borderRadius: "7px", padding: "6px 14px", fontSize: "12px", color: "#fff", cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>Add</button>
                      <button onClick={() => { setAddItemOpen(null); setNewItemTime(""); setNewItemTitle(""); setNewItemNote(""); }} style={{ background: "none", border: `1px solid ${sc}44`, borderRadius: "7px", padding: "6px 10px", fontSize: "12px", color: sc, cursor: "pointer", flexShrink: 0 }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setAddItemOpen(section.section); setNewItemTime(""); setNewItemTitle(""); setNewItemNote(""); }} style={{ background: "none", border: `1px dashed ${sc}55`, borderRadius: "8px", padding: "5px 14px", fontSize: "11px", color: sc, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    + Add to {section.section}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <footer className="tour-body animate-in" style={{ maxWidth: "680px", margin: "3rem auto 0", borderTop: `1px solid ${T.accent}33`, paddingTop: "2rem", paddingBottom: "2rem", textAlign: "center", animationDelay: "0.25s" }}>
        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: T.accentSoft, border: `1px solid ${T.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", marginBottom: "2px" }}>🎒</div>
          <span key={String(dark)} className="tour-title" style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "0.06em", background: T.titleGradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Delinquents</span>
          <span style={{ fontSize: "11px", color: T.textMuted, letterSpacing: "0.04em" }}>© {new Date().getFullYear()} Delinquents. All rights reserved.</span>
          <span style={{ fontSize: "11px", color: T.textMuted, fontStyle: "italic" }}>Made with 💜 for the grand tour</span>
          <div style={{ marginTop: "6px", fontSize: "10px", color: T.textMuted, borderTop: `1px solid ${T.accent}22`, paddingTop: "8px" }}>
            Hover a schedule item to delete it · + Add to any section
          </div>
        </div>
      </footer>
    </div>
  );
}