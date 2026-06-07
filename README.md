# NightHackers
Mymensingh ghurte jabo ayhayyyyyy
# 🎒 The Grand Tour

> *Mukigacha · Shashi Lodge · BAU Maath*

**Built by [Delinquents](https://github.com)** — © 2026 Delinquents. All rights reserved.

---

## ✨ What is this?

A beautiful, pastel-themed day-trip planner and expense tracker built for **5 friends** on a one-day tour. It handles the full itinerary, splits costs per person, and tracks who paid what — in real time, right in the browser.

No backend. No accounts. No nonsense.

---

## 👯 The Crew

| Name | Color |
|------|-------|
| Raisa | 🩷 Pink |
| Salwa | 💜 Violet |
| Farhana | 💚 Mint |
| Nishat | 💛 Amber |
| Maa | 💙 Blue |

---

## 🗺️ Features

**📅 Visual Timetable**
- Full day schedule from 6:00 AM through the all-night BAU Maath card session
- Color-coded sections: Morning · Arrival · Exploration · Evening · Night
- Sub-steps for the Jomidar Bari → Shashi Lodge block
- Highlighted timestamp pills per section color
- Filter by section to focus on any part of the day

**💸 Cost Breakdown**
- Per-person and group total calculated live
- Animated proportional bar chart showing where the money goes
- Click any price to edit it inline
- ✕ to remove a category
- `+ Add category` to add new ones on the fly

**🧾 Payment Tracker**
- One card per person with their own color theme
- Input an amount + optional note → hit `+` or press Enter to log it
- Progress bar shows % of share paid
- Balance indicator: green `+৳` if overpaid, pink `-৳` if still owing
- Full payment log with timestamps, expandable per person
- Group summary: total paid · total due · remaining

**💾 Persistent Storage**
- All data saved to `localStorage` — survives page refreshes
- No login, no sync, works offline

---

## 🛠️ Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 |
| Language | TypeScript |
| Styling | Inline styles + CSS-in-JS |
| Fonts | Playfair Display · DM Sans (Google Fonts) |
| Storage | `localStorage` |
| Hosting | Vercel |

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/your-org/grand-tour.git
cd grand-tour

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Drop `TourTimetable.tsx` into your `src/` folder and render it from `App.tsx`:

```tsx
import TourTimetable from "./TourTimetable";

export default function App() {
  return <TourTimetable />;
}
```

---

## 📦 Deploying to Vercel

```bash
npm run build
# then push to GitHub and connect repo to Vercel
# or use the Vercel CLI:
vercel --prod
```

> Data lives in `localStorage` — it's per-browser, per-device. One person manages the tracker for the group, or everyone tracks their own.

---

## 🗂️ Project Structure

```
src/
├── TourTimetable.tsx   # The whole app — types, data, component
└── App.tsx             # Entry point
```

---

## 📍 The Itinerary (quick look)

```
06:00  🍳  Breakfast
07:30  🚌  ENA Bus Journey  (4 hrs)
12:00  📍  Arrive
01:00  🏠  Check In + Freshen Up
01:30  🚌  Bus to Jomidar Bari
02:30  🏯  Jomidar Bari Visit
03:00  🎁  Buy Monda + Gift
03:05  🏛️  Shashi Lodge Gate
04:05  🎟️  Buy Entry Ticket (৳15)
04:10  🚪  Inside Shashi Lodge
05:00  🍢  Street Food by the Park
06:00  🤝  Friend Meetup
07:00  🍽️  Food Court Dinner
09:00  🃏  BAU Maath — All Night ✨
```

---

## 💰 Cost Breakdown (per person)

| Item | ৳ |
|------|---|
| CNG | 100 |
| Bus | 400 |
| Rent | 320 |
| Breakfast | 100 |
| Lunch | 300 |
| Dinner | 300 |
| Ajaira Khaoya | 300 |
| Monda | 700 |
| Rickshaw | 100 |
| Bus to Muktagacha | 100 |
| **Total** | **৳2,720** |

---

<div align="center">

Made with 💜 for the grand tour

**© 2026 Delinquents. All rights reserved.**

</div>
