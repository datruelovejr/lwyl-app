# LWYL Visual Implementation Guide

Use these visual examples to implement changes. Each image shows EXACTLY what to change.

## 5 Visual Examples

### 1. Card Borders (01_card_borders.png)
**What to change:**
- Remove red dashed border
- Add subtle shadow: `box-shadow: 0 1px 3px rgba(0,0,0,0.1)`
- Increase padding: 12px → 24px
- Add border-radius: 12px

**Apply to:** All cards throughout the app

---

### 2. DISC Distribution Card (02_disc_card.png)
**What to change:**
- Remove full dashed border
- Add left border accent only: `border-left: 4px solid #C62828` (use DISC color)
- Increase number size: 48px, bold
- Increase title size: 24px, semibold
- Percentage: 14px, gray color

**Apply to:** Team Insights DISC cards (D, I, S, C)

---

### 3. Sidebar Team Cards (03_sidebar.png)
**What to change:**
- Remove yellow background (#FFF59D)
- Change to white background (#FFFFFF)
- Remove red dashed border
- Add selection state: `background: rgba(41,182,246,0.1)` (light blue)

**Apply to:** Sidebar team member list

---

### 4. DISC Bar Chart (04_disc_chart.png)
**What to change:**
- Remove dashed border from card
- Add 8px spacing between bars
- Integrate scores at top of bars (not separate boxes)
- Add rounded bar tops: `border-radius: 4px 4px 0 0`
- Bar colors: D=#C62828, I=#FFC107, S=#4CAF50, C=#29B6F6

**Apply to:** Individual Profile DISC chart

---

### 5. Values Horizontal Bar Chart (05_values_chart.png)
**What to change:**
- Remove dashed borders
- Make bars 32px height
- Add 12px spacing between bars
- Integrate scores on right side of bars
- Round bar ends: `border-radius: 4px`
- Use exact Values colors (see brand-colors.md)

**Apply to:** Individual Profile Values chart, Team Insights Values chart

---

## Implementation Order

1. **Start with #1 (Card Borders)** - This fixes 80% of visual issues
2. **Then #3 (Sidebar)** - Remove yellow background
3. **Then #2 (DISC Cards)** - Team Insights page
4. **Then #4 and #5 (Charts)** - Individual Profile page

---

## Quick Reference

**Remove everywhere:**
- Red dashed borders
- Yellow backgrounds
- Cramped spacing (< 12px)

**Add everywhere:**
- White backgrounds (#FFFFFF)
- Subtle shadows
- 24px padding
- 12px border-radius
- 8px spacing between elements
