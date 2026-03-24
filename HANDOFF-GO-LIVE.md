# LWYL Go-Live Handoff

**Date:** March 23, 2026
**Goal:** Make LWYL ready for paying clients TODAY
**Time Estimate:** ~1 hour total

---

## How To Start The Next Session

Run this command:

```bash
claude --dangerously-skip-permissions
```

Then paste this:

```
Read /Users/Daniel/Desktop/workspace-blueprint/lwyl-app/HANDOFF-GO-LIVE.md and execute all tasks. Run agents in parallel where possible. Skip permission prompts.
```

---

## What We're Doing (Plain English)

1. **Lock the data** - Each client only sees their own stuff. You see everyone's.
2. **Remove fake data** - New accounts start empty, not with demo people.
3. **Add welcome message** - Friendly banner for first-time login.
4. **Clean up** - Delete the duplicate codebase.

---

## The Tasks

### Task 1: Run Security SQL in Supabase (MANUAL - Daniel does this)

**You need to do this yourself. Claude cannot access your Supabase dashboard.**

1. Go to: https://supabase.com/dashboard
2. Open your LWYL project
3. Click "SQL Editor" in the left sidebar
4. Copy the contents of this file:
   `/Users/Daniel/Desktop/workspace-blueprint/lwyl-app/supabase-migration-security-hardening.sql`
5. Paste into SQL Editor
6. Click "Run"

Then paste this additional SQL and run it:

```sql
-- Give Daniel (you) access to see ALL clients
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT auth.email() = 'hello@danieltruelove.com'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Update policies to include super-admin check
DROP POLICY IF EXISTS "org_select_member" ON organizations;
CREATE POLICY "org_select_member" ON organizations FOR SELECT
USING (
  is_super_admin()
  OR EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid() AND organization_id = organizations.id
  )
);

DROP POLICY IF EXISTS "team_select_member" ON teams;
CREATE POLICY "team_select_member" ON teams FOR SELECT
USING (is_super_admin() OR user_belongs_to_org(org_id));

DROP POLICY IF EXISTS "people_select_member" ON people;
CREATE POLICY "people_select_member" ON people FOR SELECT
USING (
  is_super_admin()
  OR EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = people.team_id
      AND user_belongs_to_org(teams.org_id)
  )
);
```

---

### Task 2: Edit LWYLContext.jsx (Claude does this)

**File:** `/Users/Daniel/Desktop/workspace-blueprint/lwyl-app/src/app/contexts/LWYLContext.jsx`

**Change 1 - Line 64-65:** Change initial state from demo data to empty

```javascript
// FROM:
const [orgs, setOrgs] = useState(initOrgs);
const [people, setPeople] = useState(initPeople);

// TO:
const [orgs, setOrgs] = useState([]);
const [people, setPeople] = useState([]);
```

**Change 2 - Lines 297-299:** Stop auto-seeding demo data

```javascript
// FROM:
} else if (!servedFromCache) {
  await seedDataToSupabase();
}

// TO:
} else if (!servedFromCache) {
  // New clients see empty state - no demo data
  setOrgs([]);
  setPeople([]);
}
```

**Change 3 - Lines 316-358:** Delete the entire `seedDataToSupabase` function

---

### Task 3: Add Welcome Banner (Claude does this)

**File:** `/Users/Daniel/Desktop/workspace-blueprint/lwyl-app/src/app/app/page.jsx`

Add a dismissible welcome banner that shows on first visit.

---

### Task 4: Deploy (Claude does this)

```bash
cd /Users/Daniel/Desktop/workspace-blueprint/lwyl-app && git add -A && git commit -m "Go-live: data isolation, remove demo seeding, add welcome banner" && git push
```

---

### Task 5: Delete Old Codebase (Claude does this)

```bash
rm -rf /Users/Daniel/Desktop/workspace-blueprint/lwyl-merged
```

---

## Parallel Execution Instructions

Claude should run these in parallel where possible:

**Parallel Group 1 (can run together):**
- Edit LWYLContext.jsx (Task 2)
- Edit page.jsx (Task 3)

**Sequential (must wait):**
- Git commit/push (Task 4) - after edits complete
- Delete lwyl-merged (Task 5) - after deploy confirmed

---

## Verification After Deploy

1. Go to https://lwyl-app.vercel.app
2. Sign up with a NEW test email
3. Confirm you see empty org list (no fake data)
4. Create an organization
5. Log out
6. Sign up with ANOTHER new email
7. Confirm you cannot see the first org
8. Log in as hello@danieltruelove.com
9. Confirm you CAN see all orgs

---

## Files Being Changed

| File | What Changes |
|------|--------------|
| `src/app/contexts/LWYLContext.jsx` | Remove demo seeding, empty initial state |
| `src/app/app/page.jsx` | Add welcome banner |
| `lwyl-merged/` | Deleted entirely |

---

## What Daniel Must Do Manually

1. Run SQL in Supabase (Claude cannot access your dashboard)
2. Verify the app works after deploy

---

## Reference Files

- Full plan: `/Users/Daniel/.claude/plans/rustling-singing-parrot.md`
- RLS migration: `/Users/Daniel/Desktop/workspace-blueprint/lwyl-app/supabase-migration-security-hardening.sql`
- Go-live checklist: `/Users/Daniel/Desktop/workspace-blueprint/lwyl-app/docs/GO-LIVE-CHECKLIST.md`
