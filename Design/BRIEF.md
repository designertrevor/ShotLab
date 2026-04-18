# Caddy — Golf Analysis App
## Project Brief

---

## What This Is

A personal golf analysis PWA for Trevor Nielsen (8 handicap, Logan/Cache Valley area). Built first as a personal tool, with the goal of eventually opening it to other golfers.

The gap this fills: existing apps like 18 Birdies and The Grint are great at data collection but terrible at synthesis. They show you numbers but don't tell you what they mean. Caddy's differentiator is the AI-powered post-round analysis layer — not just stats, but actual insight and pattern detection across rounds.

---

## Core Philosophy

- **Mobile first.** Used on the course, in the cart, post-round at the table.
- **Speed over completeness.** You can log just a score and move on. More data = better analysis, but never required.
- **Big tap targets.** Designed for outdoor use, sweaty hands, bright sun. Minimum 56px button heights. Apple Workout app is the UX reference.
- **Post-round is the payoff.** The AI analysis after each round is the core value prop.

---

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS v4
- shadcn/ui
- Claude API (claude-sonnet-4-20250514) for post-round analysis
- Local storage for data persistence (no backend to start)
- PWA (manifest + service worker for installability)

---

## Four Screens

### 1. Home Dashboard
- Greeting with handicap index displayed large
- Quick stats row: avg score, FIR%, GIR%, avg putts, rounds played, weakest club
- Recent rounds list with course name, date, score
- "Start New Round" CTA pinned to bottom
- Desktop: trends charts, scoring by category bar chart, miss pattern breakdown, club performance table

### 2. New Round Setup
- Select course (tap to select, checkmark confirms)
- Select tees (Black / Blue / White / Red)
- Select holes (18 / Front 9 / Back 9)
- "Start Round" CTA pinned to bottom
- Desktop: shows course scorecard and user's history at that course

### 3. Hole Scoring (the main interaction screen)
**Pinned to top:**
- Hole number (very large)
- Par and yardage (right side)
- Running score vs par (center, smaller)
- Progress dots across all 18 holes

**Primary interactions (large tap targets, Apple Workout scale):**
- Score buttons: par centered and slightly larger, numbers fan out left (eagle, birdie) and right (bogey, double, triple). Each button shows the number large and the name small below.
- Putts buttons: 0, 1, 2, 3, 4+ in a full-width row

**Optional shot details (expand below putts):**
- Auto-calculated: score minus putts = number of non-putt shot rows shown
- Each shot row has: shot type label (Drive, Approach, Chip/Pitch), horizontal scrolling club selector, miss tag chips, optional yardage input
- Putting section separate: 1st putt distance range buttons, miss direction chips
- All details are optional. User can tap score + putts and hit Next Hole immediately.

**Pinned to bottom:**
- "Next Hole →" primary button
- "Finish Round" ghost link

**Desktop:** live scorecard showing holes completed, running totals, fairways/GIR/putts so far

### 4. Round Analysis
**Pinned to top:**
- Score large, to-par beside it
- Course name and date below

**Content:**
- Stats grid: total putts, FIR%, GIR%, strokes lost on approach
- AI Analysis card (Claude API): written paragraph identifying what went well, what cost strokes, patterns noticed
- "What Went Well" section with icon rows
- "Focus Areas" section with icon rows
- Hole by hole scorecard (mini table)
- Full scorecard on desktop with all 18 holes, putts per hole

**Desktop:** adds charts — strokes by category donut, putts by distance bar chart (made vs missed stacked), club performance table

---

## Hole Entry Flow (detailed)

1. User taps score (par is default/highlighted center)
2. User taps putts
3. Shot detail rows appear automatically based on (score - putts)
4. Each row: Shot label → Club selector (horizontal scroll) → Miss tags → Optional yardage
5. Putting row: distance range → miss direction
6. Tap "Next Hole" or "Finish Round"

---

## Shot Categories and Miss Tags

**Tee / Full shots:**
Driver, 3W, 5W, 3H, 4H, 4i, 5i, 6i, 7i, 8i, 9i, PW, 52°, 56°, 60°

Miss tags: Fairway ✓, GIR ✓, Left, Right, Slice, Hook, Pull, Push, Thin, Chunk, Topped, Short, Long

**Chip / Pitch shots:**
56°, 60°, 52°, PW, 9i, 8i, 7i

Miss tags: Good ✓, Short, Long, Blade, Chunk, Left, Right

**Putting:**
Distance ranges: <5ft, 5–10ft, 10–20ft, 20–40ft, 40+ft
Miss tags: Made ✓, Left, Right, Short, Long, Pushed, Pulled

---

## Courses (pre-seeded)

### Logan River Golf Course
- Location: Logan, UT
- Par: 71 | Yardage (Black): 6,505 | Rating: 70.1 | Slope: 123
- Holes (Black tees): 
  - H1: Par 5, 519 yds | H2: Par 4, 352 yds | H3: Par 4, 405 yds
  - H4: Par 3, 160 yds | H5: Par 4, 388 yds | H6: Par 4, 369 yds
  - H7: Par 4, 413 yds | H8: Par 3, 185 yds | H9: Par 4, 409 yds
  - H10: Par 4, 294 yds | H11: Par 4, 417 yds | H12: Par 4, 436 yds
  - H13: Par 4, 384 yds | H14: Par 3, 165 yds | H15: Par 4, 390 yds
  - H16: Par 5, 509 yds | H17: Par 3, 194 yds | H18: Par 5, 516 yds
  - OUT: 35 / 3,200 | IN: 36 / 3,305

### Birch Creek Golf Course
- Location: Smithfield, UT
- Par: 72 | Yardage (Blue): 6,722 | Rating: 71.3 | Slope: 125
- Hole data: seed with approximate values, Trevor can correct in app

### Preston Golf & Country Club
- Location: Preston, ID
- Par: 71 | Yardage: ~6,321 | Slope: 123
- Front 9 (Blue): H1: Par 4 370, H2: Par 4 374, H3: Par 4 335, H4: Par 4 375, H5: Par 3 190, H6: Par 4 332, H7: Par 5 525, H8: Par 3 175, H9: Par 4 397 | OUT: 35 / 3,073
- Back 9: seed with approximate values

---

## Data Model (localStorage)

```typescript
// Course
interface Course {
  id: string
  name: string
  location: string
  par: number
  holes: Hole[]
}

interface Hole {
  number: number
  par: number
  yardage: { black: number; blue: number; white: number; red: number }
  handicap: number
}

// Round
interface Round {
  id: string
  courseId: string
  tees: 'black' | 'blue' | 'white' | 'red'
  date: string
  holes: HoleScore[]
  analysis?: RoundAnalysis
}

interface HoleScore {
  hole: number
  score: number
  putts: number
  shots: Shot[]
}

interface Shot {
  number: number
  type: 'tee' | 'approach' | 'chip' | 'pitch' | 'putt'
  club?: string
  yardage?: number
  result?: string // miss tag
  puttDistance?: string // range bucket
}

// Analysis (returned from Claude API)
interface RoundAnalysis {
  generatedAt: string
  summary: string
  wentWell: InsightItem[]
  focusAreas: InsightItem[]
  clubInsights: ClubInsight[]
}

interface InsightItem {
  title: string
  description: string
  severity: 'positive' | 'warning' | 'negative'
}
```

---

## Claude API Integration

**Trigger:** User completes round and taps "Analyze Round"

**Prompt structure:**
- System: "You are a golf coach analyzing a round of golf. Be specific, data-driven, and actionable. Identify patterns, not just individual holes. Reference specific holes and clubs when relevant."
- User: Pass the full round data as JSON including all shot details, miss tags, clubs used, putts per hole, yardages
- Request: Written analysis with three sections — summary paragraph, what went well (array), focus areas (array)
- Response format: JSON with typed fields

**Model:** claude-sonnet-4-20250514
**Max tokens:** 1000

---

## UX Rules

- Minimum button height: 56px for primary tap targets
- Par score button is slightly wider/taller than adjacent score buttons
- Score and putts always visible without scrolling on hole screen
- Shot details scroll below the fold — optional, never blocking
- Bottom bar always pinned, never scrolls away
- Progress dots across top of hole screen show completed/active/remaining
- Running score (vs par) always visible while scoring

---

## Design Reference

- `design/REFERENCE.html` — full 4-screen wireframe built in Claude
- UX inspiration: Apple Workout app (sizing, spacing, tap targets), Airbnb (card patterns, bottom CTAs)
- Typography scale: primary stats at 72–96px, section labels at 11px all-caps, body at 14–15px
- Color: to be decided after wireframe is approved. Wireframe is black and white only.

---

## Build Order

1. Data layer — courses, round storage, TypeScript interfaces
2. New Round Setup screen
3. Hole Scoring screen (most complex, most important)
4. Home Dashboard
5. Round Analysis screen + Claude API integration
6. PWA manifest + service worker
7. Desktop responsive layout

---

## Future (not in v1)

- OCR scorecard scanning (photo import)
- GPS distance tracking
- Real course map overlays
- Multi-user / accounts
- Import from 18 Birdies export
- Handicap calculation
