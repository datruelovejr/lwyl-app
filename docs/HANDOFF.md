# LWYL Handoff Document
**Date:** 2026-03-14
**Session Focus:** Blend spec (redesign + current app) → Sidebar strip-down, KRI page, Leader Insights page, Settings page

---

## What Was Done This Session

### 1. Competitive Analysis: lwyl-redesign vs lwyl-app

Read both codebases end to end. The redesign has clean architecture (sidebar as pure nav, feature-module folders, shadcn/ui, dedicated routes). The current app has depth (story-first content, consulting voice, environment health narratives, compound patterns, KRI dashboard, real Supabase backend).

Daniel's core complaint: the sidebar has team management (filter pills, add/edit/delete teams, search, org selector) embedded in navigation. The redesign doesn't. He asked for this removal multiple times across sessions.

### 2. Blend Spec Written

**File:** `production/workflows/02-specs/lwyl-blend-spec.md`

Defines how to merge the redesign's structure with the current app's depth. Key decisions:
- Sidebar = navigation only, no admin
- Every major insight surface gets its own route
- Team/org management moves to Settings page
- Leader Insights becomes a dedicated page
- KRI Dashboard becomes a standalone page (was buried inside Team Insights)
- Voice standard: ConnectionSOPs tone throughout

### 3. Sidebar Strip-Down — `layout.jsx` (REWRITTEN)

**Removed:**
- Org selector dropdown + edit button
- Assessment link actions (Take Assessment, Copy Link)
- Teams section entirely (filter pills, add/edit/delete, hover actions, all 6+ modal states)
- Search bar
- "+ Add Expected Member" button
- All 6 admin modals (New Org, Edit Org, New Team, Edit Team, Delete Team, Delete Person)
- ~20 useState variables for admin state
- hover-reveal star/delete buttons on team members

**Added:**
- Leader Insights nav item (`/app/leader`)
- Retention Risk nav item (`/app/kri`)
- Gear icon → Settings (`/app/settings`)
- Org context as display-only (name, not dropdown)

**Kept:**
- Logo, nav sections (Platform, Tools, Assessments), team member profiles with DISC avatars, user footer, mobile toggle

**Sidebar nav now:**
```
Platform:     Dashboard, Leader Insights, Team Insights, Friction Map, Retention Risk
Tools:        Bridge Wizard, Agreements
Assessments:  Upload Assessment
Team Members: [clickable profiles]
```

### 4. Settings Page — `Settings.jsx` (CREATED) + `/app/settings/page.jsx`

All admin functionality moved here from sidebar:
- Organization: name, assessment link, switch org (if multiple), copy link, take assessment
- Teams: list with member counts, add/rename/delete
- Members: list with leader toggle, remove, add expected member

### 5. Retention Risk Page — `RetentionRisk.jsx` (CREATED) + `/app/kri/page.jsx`

KRI Dashboard extracted from TeamInsights into standalone page:
- Summary metrics: critical indicators count, people at risk, damage signals
- Three KRI cards (Self-Esteem, Role Awareness, Self-Direction) with:
  - Avg score, risk level badge
  - Bias distribution bar (+/=/−)
  - Contextual description in Daniel's voice
  - Names of people undervaluing each dimension
- Frustrated PT AlertCards with per-person narratives
- Per-person risk StoryCards with retention narrative

### 6. Leader Insights Page — `LeaderInsights.jsx` (CREATED) + `/app/leader/page.jsx`

Adapted from redesign's 5-tab structure, written in Daniel's voice:
- **Dark gradient identity card** at top with DISC scores and gap points
- **My Environment tab:** Preference Tax summary, per-dimension gap with direction labels, Natural vs Adaptive dual bar visualization
- **My Values tab:** Sorted by score, top motivator badges, "Passion Signal, not verdict" disclaimer
- **My Attributes tab:** External (Heart/Hand/Head) and Internal (Self-Esteem/Role Awareness/Self-Direction) with bias labels
- **Leadership Gap tab:** Leader vs team aggregate per DISC dimension, friction with each member listed
- **LWYL Framework tab:** 5-step guide (Know Yourself → Understand Team → Name Friction → Build Bridge → Guided Reflections)

---

## Build Verification

`npx next build` — clean compile, all routes registered:

```
Route (app)
├ ○ /app
├ ○ /app/agreements
├ ○ /app/bridge
├ ○ /app/friction
├ ○ /app/kri          ← NEW
├ ○ /app/leader       ← NEW
├ ƒ /app/profile/[id]
├ ○ /app/settings     ← NEW
├ ○ /app/team
└ ○ /app/upload
```

---

## Remaining Blend Spec Items (Not Yet Built)

| # | Item | Spec Section | Status |
|---|------|-------------|--------|
| 5 | Dashboard upgrade — Daily Leadership Lens hero + gauge cards | Dashboard — Insight Hub | Not started |
| 6 | Team Insights restructure — add redesign's visual elements + remove KRI section | Team Insights — Structure + Depth | Not started |
| 7 | Bridge Wizard — adapt redesign's 5-step guided flow | Bridge Wizard | Not started |
| 8 | Individual Profile upgrade — AI coaching panel, redesign layout | Individual Profiles — Blend | Not started |

---

## File Map (Updated)

```
lwyl-app/src/app/
├── knowledge/
│   └── assessmentInsights.js       ← Knowledge base (506 lines)
├── components/
│   ├── LeaderInsights.jsx          ← CREATED: 5-tab leader environment report
│   ├── RetentionRisk.jsx           ← CREATED: Standalone KRI dashboard
│   ├── Settings.jsx                ← CREATED: Org/team/member admin
│   ├── ui.jsx                      ← Shared components (StoryCard, AlertCard, etc.)
│   ├── FrictionMap.jsx             ← Story-first friction (rebuilt prior session)
│   ├── TeamInsights.jsx            ← Story-first team view (rebuilt prior session)
│   ├── EnvironmentReport.jsx       ← KB-powered individual report
│   ├── MeetingRoom.jsx             ← Conversation prep
│   └── ... (remaining components)
├── constants/
│   ├── colors.js                   ← Theme colors (C object)
│   └── data.js                     ← Seed data + helpers
├── utils/
│   ├── friction.js                 ← Pairwise friction calculation
│   └── useIsMobile.js              ← Mobile detection hook
├── contexts/
│   └── LWYLContext.jsx             ← Shared state provider
└── app/                            ← Route pages
    ├── layout.jsx                  ← REWRITTEN: Clean sidebar, no admin
    ├── page.jsx                    ← Dashboard
    ├── leader/page.jsx             ← NEW: Leader Insights
    ├── kri/page.jsx                ← NEW: Retention Risk
    ├── settings/page.jsx           ← NEW: Admin settings
    ├── team/page.jsx               ← Team Insights
    ├── friction/page.jsx           ← Friction Map
    ├── profile/[id]/page.jsx       ← Individual Profile
    ├── upload/page.jsx             ← Upload Assessment
    ├── bridge/page.jsx             ← Bridge Wizard (placeholder)
    └── agreements/page.jsx         ← Agreements (placeholder)
```

---

## Key Technical Context

### BTCG Assessment Framework
- **DISC** (Preference): D, I, S, C. Gap = Adaptive - Natural. Observable at 10+, significant at 20+. totalGap across all 4.
- **Values** (Passion): 7 dimensions. Top Motivator at 55+. Signal, not verdict.
- **Attributes External** (Process): Heart, Hand, Head. Score 0-10. Bias: +/−/=
- **Attributes Internal** (Self-Perception): Self-Esteem, Role Awareness, Self-Direction. Bias: +/−/=
- **Frustrated PT (−)** = environment damage indicator — strongest signal in the assessment
- **Confirmed vs Signal**: DISC gaps = confirmed; Values/Attributes = signals requiring confirmation

### Voice Standard
All user-facing text must sound like ConnectionSOPs. Short sentences. Direct. Conversational. No em dashes. No academic framing. Sounds like a coach in a consulting session.

### Design Standard
- Every feature one click away from sidebar — no hidden modals
- No data without insight — every number has a narrative and a next step
- Story-first: name the person → explain the gap in human terms → give a next step
- Dashboard is an insight hub, not a data dump

### App Patterns
- Named exports, `'use client'` directives
- `C` color object from `constants/colors.js`
- `useIsMobile()` hook for responsive layouts
- `Card`, `StoryCard`, `AlertCard`, `SectionHead`, `MetricCard`, `Expandable` from `ui.jsx`
- Inline styles (not Tailwind) — using C color tokens consistently

### Blend Spec Location
`production/workflows/02-specs/lwyl-blend-spec.md` — full spec for remaining work
