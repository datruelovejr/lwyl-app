# LWYL Go-Live Checklist

**Purpose:** Everything that needs to happen before onboarding your first paying client.

---

## 1. Client Onboarding Experience

What they see and do in their first 48 hours.

### First Login Experience
- [ ] **Welcome screen** — personalized with their name, explains what happens next
- [ ] **Onboarding wizard** — guides them through: upload assessment > see their profile > invite team
- [ ] **Empty state design** — what do they see before any team data exists? (Currently shows mock data)
- [ ] **Progress indicator** — "Step 1 of 3: Upload your assessment"

### Assessment Upload Flow
- [ ] **Clear instructions** — exactly what file format, where to get it, what pages
- [ ] **Error handling** — friendly message if PDF doesn't parse correctly
- [ ] **Manual fallback** — easy way to enter data by hand if upload fails
- [ ] **Confirmation** — "Your profile is ready" moment with first insight

### Team Setup
- [ ] **Invite team flow** — how does a client add their team members?
- [ ] **Pending member experience** — what do pending members see in their email/invite?
- [ ] **Team member onboarding** — do team members create accounts? Or just submit assessments?

---

## 2. "See What They See" Admin View

Your ability to monitor and support clients.

- [ ] **Client impersonation mode** — log in as a client to see their exact view
- [ ] **Admin dashboard** — list of all clients, their status, last login
- [ ] **Usage metrics** — who's active, who's stuck, who hasn't logged in
- [ ] **Support access** — ability to view/edit client data when helping them

---

## 3. Account & Access Management

How clients get in and stay in.

- [ ] **Account creation process** — do you create accounts for them, or self-serve?
- [ ] **Welcome email** — automated email with login link, what to expect
- [ ] **Password requirements** — minimum strength, reset flow tested
- [ ] **Session timeout** — how long before they're logged out?
- [ ] **Multi-device** — can they log in on phone AND laptop simultaneously?

---

## 4. Data & Security

Protecting client information.

- [ ] **Data isolation** — Client A cannot see Client B's data (verify this)
- [ ] **Backup strategy** — how often is Supabase backing up? Can you restore?
- [ ] **Privacy policy** — document explaining what data you collect and why
- [ ] **Terms of service** — legal agreement they accept on signup
- [ ] **Data export** — can clients download their own data if they leave?
- [ ] **Data deletion** — process for removing a client's data on request

---

## 5. Technical Stability

Making sure it works when it matters.

- [ ] **Load testing** — what happens with 50 team members? 100?
- [ ] **Mobile experience** — test critical flows on iPhone/Android
- [ ] **Browser testing** — Chrome, Safari, Firefox, Edge
- [ ] **Error monitoring** — get alerts when something breaks (Sentry, LogRocket)
- [ ] **Uptime monitoring** — get alerts if the app goes down
- [ ] **SSL certificate** — HTTPS working (Vercel handles this)

---

## 6. Support & Documentation

How you help clients when they're stuck.

- [ ] **In-app help** — tooltips, "?" icons, contextual guidance
- [ ] **Quick start guide** — 1-page PDF: "Your first 15 minutes in LWYL"
- [ ] **FAQ document** — common questions and answers
- [ ] **Support email** — where do they reach you? Auto-responder?
- [ ] **Video walkthrough** — 3-5 minute Loom showing the basics

---

## 7. Client Communication

Staying connected after they sign up.

- [ ] **Welcome sequence** — Day 1, Day 3, Day 7 emails
- [ ] **Check-in cadence** — when do you personally reach out?
- [ ] **Progress notifications** — "Your team member uploaded their assessment"
- [ ] **Re-engagement** — what happens if they don't log in for 2 weeks?

---

## 8. Business Operations

The non-technical stuff.

- [ ] **Pricing confirmed** — what are you charging? Per user? Per team? Flat rate?
- [ ] **Payment processing** — Stripe, invoice, manual?
- [ ] **Contract/agreement** — what they sign before starting
- [ ] **Onboarding call script** — what you cover in the kickoff call
- [ ] **Success criteria** — how do you know the engagement is working?

---

## 9. Content & Polish

Making it feel professional.

- [ ] **Loading states** — no blank screens, always show progress
- [ ] **Error messages** — human-friendly, not technical jargon
- [ ] **Empty states** — helpful guidance when no data exists
- [ ] **Favicon** — LWYL icon in browser tab
- [ ] **Page titles** — descriptive titles for each view
- [ ] **Print styling** — reports look good when printed/PDF'd

---

## 10. Launch Day Prep

The week before your first client.

- [ ] **Test account created** — full walkthrough as a fake client
- [ ] **Rollback plan** — what if something breaks? Can you revert?
- [ ] **Support availability** — be reachable during their first 48 hours
- [ ] **Celebration moment** — how do you mark their first insight/connection agreement?

---

## Priority Order

Based on your current state (from PROJECT_STATUS.md):

### Must Have (Week 1)
1. Client impersonation / admin view
2. Welcome screen + onboarding wizard
3. Empty state handling (no mock data for real clients)
4. Data isolation verification
5. Quick start guide

### Should Have (Week 2)
6. Welcome email sequence
7. In-app help / tooltips
8. Error monitoring (Sentry)
9. Mobile critical path testing
10. Terms of service / Privacy policy

### Nice to Have (Week 3+)
11. Admin dashboard with usage metrics
12. Video walkthrough
13. Automated progress notifications
14. Print styling for reports

---

## Current Gaps (from your docs)

| Gap | Impact | Effort |
|-----|--------|--------|
| No onboarding wizard | Client confused on first login | Medium |
| Mock data shows by default | Confusing for real clients | Low |
| No admin view | Can't support clients effectively | Medium |
| No welcome email | Client forgets login info | Low |
| Photo storage in memory only | Photos disappear on refresh | Medium |
| Mobile not optimized | Bad experience on phone | High |

---

*Last updated: March 23, 2026*
