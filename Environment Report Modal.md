# Environment Report Modal

## Before Issues
- Red dashed borders everywhere (outer, sections, each DISC item)
- Multiple nested borders
- Cramped spacing

## After Improvements

### Modal Container
- Background: `#FFFFFF`
- Border-radius: `12px`
- Padding: `48px`
- Max-width: `900px`
- Shadow: `0 20px 25px rgba(0,0,0,0.15)`

### Header
- Title: "Environment Report: [Name]" - 32px, bold
- Subtitle: "Natural vs Adaptive" - 16px, gray
- Close button: top-right

### DISC Sections

**Natural Section:**
- Title: "Natural (How you prefer to work)" - 24px, semibold
- Background: light gray `#F9FAFB`
- Padding: `24px`
- Border-radius: `8px`

**Adaptive Section:**
- Title: "Adaptive (How you adjust)" - 24px, semibold
- Background: light gray `#F9FAFB`
- Padding: `24px`
- Border-radius: `8px`

### DISC Items

**Each Item:**
- White card
- Padding: `16px`
- Border-radius: `8px`
- Left border: `4px solid [DISC color]`
- Gap: `12px` between items

**Content:**
- Badge: DISC letter with color (D/I/S/C)
- Title: 18px, semibold
- Description: 16px, line-height 1.5
- Score: 14px, gray

**Badge Colors:**
- D: `#C62828`
- I: `#FFC107`
- S: `#4CAF50`
- C: `#29B6F6`

## Key Changes
- Remove ALL dashed borders
- Use colored left border accent only
- Clean white cards on light gray sections
- Generous spacing
- Clear visual hierarchy
