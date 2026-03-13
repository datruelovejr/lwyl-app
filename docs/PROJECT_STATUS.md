# LWYL Project Status

**Last Updated:** February 28, 2026
**Live URL:** https://lwyl-app.vercel.app

---

## Executive Summary

Love Where You Lead (LWYL) is a leadership assessment platform that combines DISC behavioral analysis, Values/Driving Forces assessment, and Attributes evaluation into a unified team intelligence dashboard. The app transforms assessment data into actionable leadership insights.

**Current State:** Functional MVP with core team analytics, individual profiles, and assessment upload capabilities. Authentication and database persistence are working. Several advanced features are partially implemented or planned.

**Competitive Position:** Best-designed multi-science assessment dashboard in market (7.4/10). Primary gaps: no in-app assessment, no AI coaching layer, limited mobile experience.

---

## Part 1: Current Capabilities

### Fully Functional Features

#### Authentication & User Management
| Feature | Description | Status |
|---------|-------------|--------|
| Email/Password Sign Up | Create account with email and password | ✅ Working |
| Email/Password Sign In | Authenticate existing users | ✅ Working |
| Password Reset | Email-based password recovery flow | ✅ Working |
| Session Persistence | Stay logged in across browser sessions | ✅ Working |
| Sign Out | End session and return to login | ✅ Working |

#### Organization & Team Management
| Feature | Description | Status |
|---------|-------------|--------|
| Create Organization | Add new organizations to the system | ✅ Working |
| Create Team | Add teams within an organization | ✅ Working |
| Edit Team Name | Rename existing teams | ✅ Working |
| Delete Team | Remove team with confirmation modal | ✅ Working |
| Team Filter Pills | Filter sidebar by team with member counts | ✅ Working |
| Organization Selector | Dropdown to switch between organizations | ✅ Working |

#### People/Member Management
| Feature | Description | Status |
|---------|-------------|--------|
| Add Pending Member | Create placeholder for team member without assessment | ✅ Working |
| Upload Single Assessment | Manual entry form with 21 fields | ✅ Working |
| Upload Single PDF (Auto-Extract) | Parse Innermetrix PDF pages 2-4 automatically | ✅ Working |
| Bulk Upload (ZIP) | Process 5+ PDFs simultaneously | ✅ Working |
| View Individual Profile | Full DISC, Values, Attributes display | ✅ Working |
| Set Team Leader | Star icon designation with visual indicator | ✅ Working |
| Remove Team Member | Delete with confirmation modal | ✅ Working |
| Search Members | Filter sidebar list by name | ✅ Working |
| Upload Photo | Click avatar to upload/change photo | ✅ Working |

#### Assessment Data Display
| Feature | Description | Status |
|---------|-------------|--------|
| DISC Natural Profile | Bar chart of natural behavioral tendencies | ✅ Working |
| DISC Adaptive Profile | Bar chart of adapted behavioral style | ✅ Working |
| Natural vs. Adaptive Comparison | Side-by-side gap visualization | ✅ Working |
| Values/Driving Forces | 7 motivational values with scores (Aesthetic, Economic, Individualistic, Political, Altruistic, Regulatory, Theoretical) | ✅ Working |
| Attributes - External | Empathy, Practical Thinking, Systems Judgment with bias indicators | ✅ Working |
| Attributes - Internal | Self-Esteem, Role Awareness, Self-Direction with bias indicators | ✅ Working |
| Decision Order | Heart/Hand/Head ranking based on attribute scores | ✅ Working |

#### Team Insights & Analytics
| Feature | Description | Status |
|---------|-------------|--------|
| DISC Distribution | Pie chart showing team style composition | ✅ Working |
| Values Distribution | Bar chart of values prevalence across team | ✅ Working |
| Attributes Decision Order | Team-level Heart/Hand/Head tendency | ✅ Working |
| Team Member Grid | Card layout of all team members | ✅ Working |
| Leader Comparison View | Your Style vs. Team Tendency analysis | ✅ Working |
| Values Alignment | Shared values, blind spots, unmet needs | ✅ Working |
| Pending Members Counter | Visual indicator of incomplete assessments | ✅ Working |

#### Friction Map (Recently Added)
| Feature | Description | Status |
|---------|-------------|--------|
| Pairwise Friction Calculation | 3-factor algorithm (Preference, Passion, Process) | ✅ Working |
| Heatmap Visualization | Color-coded grid of all team member pairs | ✅ Working |
| Detailed Friction Breakdown | Click any cell for pillar-by-pillar analysis | ✅ Working |
| Top 3 Friction Pairs | Ranked list of highest friction relationships | ✅ Working |
| Friction Tiers | Low/Moderate/High color coding | ✅ Working |

#### Voice Journal (Recently Added)
| Feature | Description | Status |
|---------|-------------|--------|
| Speech-to-Text Recording | Web Speech API voice capture | ✅ Working |
| Real-Time Transcript | Live display of spoken words | ✅ Working |
| Save Reflections | Persist to Supabase database | ✅ Working |
| View Previous Reflections | Chronological list of entries | ✅ Working |
| Edit/Delete Reflections | Modify or remove saved entries | ✅ Working |
| Filter by Team Member | Optional context linking | ✅ Working |

#### Reports & Modals
| Feature | Description | Status |
|---------|-------------|--------|
| Environment Report | 5-section formatted profile report | ✅ Working |
| Leadership Tips | Context-specific guidance based on DISC | ✅ Working |
| Compare with Others | Side-by-side comparison modal | ✅ Working |
| Team Summary Modal | Grid view of all team members | ✅ Working |

---

### Partially Functional Features

| Feature | What Works | What's Missing | Status |
|---------|------------|----------------|--------|
| **Bridge Wizard** | Dialog structure renders, "Build a Bridge" button exists | Agreement form submission unclear, no persistence confirmed | ⚠️ Partial |
| **PDF Auto-Extract** | Works for standard Innermetrix format | May fail on non-standard PDFs, requires exact page numbers | ⚠️ Partial |
| **Photo Persistence** | Photos display correctly in session | Photos stored in browser memory only (DataURL), not persisted to database | ⚠️ Partial |
| **Individual Comparison** | Leader-to-person view exists | Some comparison elements may be incomplete | ⚠️ Partial |

---

### UI-Only / Placeholder Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Individual Mode / Audit Dashboard** | 86-line component stub, minimal content renders | ❌ Placeholder |
| **WeekCard Component** | 216 lines of code for weekly challenge tracking | ❌ Not rendered anywhere |
| **4-Week Environment Audit** | Referenced in CLAUDE.md sprint plan | ❌ Not built |
| **Video Content Sections** | Tier 2 journey video placeholders | ❌ Not built |

---

### Backend & Infrastructure

| Component | Description | Status |
|-----------|-------------|--------|
| **Supabase Auth** | Email/password authentication | ✅ Working |
| **Supabase Database** | PostgreSQL with organizations, teams, people, reflections tables | ✅ Working |
| **Vercel Deployment** | Automatic deploys from GitHub | ✅ Working |
| **Environment Variables** | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ Configured |
| **Mock Data Fallback** | 15 hardcoded profiles if database unavailable | ✅ Working |

---

## Part 2: Discussed & Planned Features

### Priority 1 — Critical Gaps (Competitive Necessity)

| Feature | Description | Source | Impact |
|---------|-------------|--------|--------|
| **In-App Self-Assessment** | 24-question DISC assessment directly in platform, eliminating file upload dependency | Competitive Audit | Transforms from "demo tool" to "live SaaS" — unlocks self-serve |
| **AI Coaching Layer** | AI chat panel on Individual Profile answering questions like "How should I communicate feedback to this person?" based on verified assessment data | Competitive Audit | Leapfrogs Crystal Knows' AI with grounded insights |
| **Real User Accounts** | Currently working, but ensure robust session management and data isolation | Competitive Audit | Table stakes for production SaaS |
| **Mobile Responsiveness** | App is desktop-focused, sidebar fixed width causes mobile issues | Competitive Audit | All 5 competitors have mobile experiences |

### Priority 2 — Engagement Architecture Features

| Feature | Description | Source | Impact |
|---------|-------------|--------|--------|
| **Onboarding Sequence** | First 5 minutes: Recognition → Endowed Progress → First Insight → Micro-Commitment → Team Reveal | User Engagement | Determines if leader becomes regular user or one-time visitor |
| **"Did You Know?" Insights** | Rotating personalized behavioral insights based on team composition | User Engagement | Variable reward that pulls leaders back |
| **Session Prep Reminders** | Notifications before scheduled 1-on-1s with relevant team member insights | User Engagement | Creates external trigger tied to behavioral context |
| **Progress Tracking** | Visual journey progress with endowed progress effect | User Engagement | "You've invested 3 weeks — Week 4 brings it all together" |
| **Reflection Storage** | Save notes and observations that accumulate value over time | User Engagement | Investment that makes leaving costly |

### Priority 3 — Tier 2 Individual Journey

| Feature | Description | Source | Impact |
|---------|-------------|--------|--------|
| **Week 1: Who You Really Are** | Personal profile through LWYL lens, elevation moment | User Engagement | Easy entry point, endowed progress |
| **Week 2: Who They Really Are** | Team composition reveals patterns, insight moment | User Engagement | New data, familiar context |
| **Week 3: The Gap Between You** | Leader-to-team gap reveal, confrontation moment | User Engagement | "Do you love the place you lead, or do you love that you're the leader?" |
| **Week 4: Building the Bridge** | Complete first Connection Agreement, pride + connection | User Engagement | Mastery application, everything converges |
| **Video Content** | Daniel's mentor-voice videos for each week with specific engagement beats | Skills to Add | Core Tier 2 delivery mechanism |
| **Weekly Challenges** | Bridge Builder Challenges with documentation | User Engagement | Creates implementation intentions |

### Priority 4 — Team Intelligence Features

| Feature | Description | Source | Impact |
|---------|-------------|--------|--------|
| **Team Dynamics Interpretation Engine** | Generate narrative that connects data to lived experience (e.g., "Your High S team needs advance notice before changes") | Skills to Add | Powers in-app interpretive content, AI insights |
| **Connection Agreement Template Engine** | Pre-populated agreement language based on two people's friction points | Skills to Add | Transforms blank-page problem into editing problem |
| **Conflict Report** | Structured analysis of specific friction pair with recommendations | Current Code | Referenced in recent commits |
| **Shareable Profile Links** | Public read-only URL for each person's profile | Competitive Audit | Viral distribution mechanism |

### Priority 5 — Platform & Integration

| Feature | Description | Source | Impact |
|---------|-------------|--------|--------|
| **Hiring Fit Assessment** | Compare candidate against team aggregate, generate fit analysis | Skills to Add | Natural product extension, ongoing decision support |
| **Slack/Teams Integration** | Surface DISC summary when name mentioned in message | Competitive Audit | Most defensible moat in category |
| **Team Member Experience** | What team members receive after assessment, acknowledgment, Tier 2 preview | Skills to Add | Viral loop — team members become advocates |
| **Export Functionality** | PDF export for profiles, team summaries, reports | General Need | Enterprise requirement |
| **Permission/Role System** | Org-scoped access, role-based permissions | General Need | Multi-tenant security |

### Priority 6 — Experience Polish

| Feature | Description | Source | Impact |
|---------|-------------|--------|--------|
| **Behavioral Nudge Copywriting** | Well-timed micro-interactions using Daniel's voice | Skills to Add | Every notification becomes act of service |
| **Loading States** | Intentional progress messages ("Building your team profile...") | User Engagement | Disney "bump the lamp" attention to detail |
| **Error States** | Human-feeling error messages | User Engagement | "Something went sideways. We're on it." |
| **Client Onboarding Sequence** | 48-hour post-purchase experience to prevent buyer's remorse | Skills to Add | Highest-risk moment in customer lifecycle |

---

## Part 3: Technical Debt & Architecture Notes

### Current Architecture
- **Single File:** Main app is 4,809 lines in `src/app/page.jsx`
- **Component Structure:** All components defined as functions within page.jsx
- **State Management:** React useState at BTCGSystem level
- **Styling:** Inline styles + Tailwind CSS

### Recommended Improvements
1. **Modularize Components** — Extract components to separate files
2. **State Management** — Consider Context or Zustand for complex state
3. **Photo Persistence** — Store photos in Supabase Storage instead of memory
4. **Error Boundaries** — Add React error boundaries for graceful failures
5. **TypeScript Migration** — Layout is .tsx but main app is .jsx

### Known Limitations
- No offline support or local caching
- No real-time collaboration
- Assessment PDF parsing requires exact Innermetrix format
- Mobile layout not optimized

---

## Part 4: Competitive Positioning

### What LWYL Has That Competitors Don't

1. **Environment Tax Framework** — Quantifies energy cost of misalignment (Preference Tax, Process Tax)
2. **Multi-Science Dashboard** — DISC + Values + Attributes in modern UI (vs. TTI's 60-page PDF)
3. **Decision Order Visualization** — "How Your Team Decides" ranked by Heart/Hand/Head
4. **Bridge Wizard** — Leader-to-person gap navigation with actionable agreements
5. **4-Week Self-Guided Journey** — No competitor has embedded self-directed experience
6. **Visual Design** — Best UI among science-depth competitors

### Primary Gaps vs. Competitors

1. **Assessment Delivery** — Must upload CSV/file vs. take assessment in platform
2. **AI Features** — Zero AI capabilities vs. Crystal Knows' AI coaching
3. **Integration Ecosystem** — No Salesforce/HubSpot vs. competitors' integrations
4. **Mobile Experience** — Desktop-only vs. responsive/native mobile

### Path to 9+/10 Score
1. Build in-app self-assessment (Priority 1)
2. Add AI coaching layer (Priority 1)
3. Implement mobile responsiveness (Priority 1)

---

## Part 5: Design System Reference

### Brand Colors
```
DISC: D=#C62828 (Red), I=#FFC107 (Amber), S=#4CAF50 (Green), C=#29B6F6 (Blue)
Values: Aesthetic=#7CB342, Economic=#5C8DC4, Individualistic=#F28C4E,
        Political=#E05252, Altruistic=#FFB74D, Regulatory=#757575, Theoretical=#B8864A
Attributes: External=#4f92cf, Internal=#C62828
Grayscale: bg=#F9FAFB, card=#FFFFFF, border=#E5E7EB, text=#111827, muted=#6B7280
```

### Typography
- **Primary Font:** DM Sans (from Google Fonts)
- **Weights:** 400, 500, 600, 700

### Component Standards
- Card padding: 24px
- Border radius: 12px
- Shadow: `box-shadow: 0 1px 3px rgba(0,0,0,0.1)`
- Spacing between elements: 8px minimum

---

## Appendix: Feature Source Legend

| Source | Description |
|--------|-------------|
| Competitive Audit | `/src/Knowledge/Competitive Audit .md` |
| User Engagement | `/src/Knowledge/User Engagement.md` |
| Skills to Add | `/src/Knowledge/Skills to Add.md` |
| Current Code | Existing implementation in codebase |
| General Need | Standard SaaS requirements |

---

*Document generated by analyzing codebase, knowledge files, and competitive research.*
