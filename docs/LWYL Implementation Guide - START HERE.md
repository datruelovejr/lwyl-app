# LWYL Implementation Guide - START HERE

All files are now small and focused. Reference ONE file at a time in your prompts.

## File Structure

```
lwyl_implementation/
├── START-HERE.md (this file)
├── global/
│   ├── brand-colors.md (35 lines)
│   ├── spacing-system.md (46 lines)
│   └── typography.md (41 lines)
├── components/
│   └── component-library.md (64 lines)
└── pages/
    ├── team-insights.md (67 lines)
    ├── individual-profile.md (73 lines)
    ├── team-summary-modal.md (70 lines)
    ├── upload-assessment.md (54 lines)
    └── environment-report-modal.md (68 lines)
```

## How to Use

### Step 1: Start with Global Files
Read these first to understand the design system:
1. `global/brand-colors.md` - All color hex codes
2. `global/spacing-system.md` - Spacing values
3. `global/typography.md` - Font sizes and weights

### Step 2: Reference Component Library
When building UI elements:
- `components/component-library.md` - Buttons, cards, badges, inputs, modals

### Step 3: Implement Pages One at a Time
Reference ONE page file per prompt:
- `pages/team-insights.md` - Team DISC distribution + Values chart
- `pages/individual-profile.md` - Individual DISC, Values, Attributes charts
- `pages/team-summary-modal.md` - Team member summary cards
- `pages/upload-assessment.md` - File upload interface
- `pages/environment-report-modal.md` - Natural vs Adaptive DISC report

## Example Prompts

**For Team Insights page:**
```
Update the Team Insights page using the specifications in team-insights.md.
Use the brand colors from brand-colors.md and spacing from spacing-system.md.
```

**For Individual Profile:**
```
Redesign the Individual Profile page following individual-profile.md.
Apply the typography system from typography.md and components from component-library.md.
```

**For modals:**
```
Update the Team Summary modal using team-summary-modal.md specifications.
Use component-library.md for card and badge styles.
```

## Key Principles

1. **Remove ALL dashed borders** - Use clean white cards instead
2. **Use exact brand colors** - Never change hex codes
3. **Apply 8px spacing system** - 16px items, 24px padding, 32px sections
4. **Clean typography** - Inter font, clear hierarchy
5. **Strategic color usage** - Each color system in its domain only

## Quick Wins

Start with these for immediate impact:
1. Remove all dashed borders → white cards with subtle shadow
2. Change sidebar from yellow → white
3. Apply 24px padding to all cards
4. Use 32px spacing between sections

## Need Help?

Each page file includes:
- Before Issues (what's wrong now)
- After Improvements (exact specifications)
- Key Changes (summary of what to do)

All files are under 75 lines and can be referenced individually in prompts.
