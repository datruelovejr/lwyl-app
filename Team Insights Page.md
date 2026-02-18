# Team Insights Page

## Before Issues
- Red dashed borders around DISC cards
- Cramped spacing between elements
- Inconsistent card styles

## After Improvements

### Layout
- 4-column grid for DISC distribution cards
- 32px gap between cards
- Full-width Values chart below

### DISC Distribution Cards

**Card Structure:**
```
White card (background: #FFFFFF)
Border-radius: 12px
Padding: 24px
Shadow: 0 1px 3px rgba(0,0,0,0.1)
Left border: 4px solid [DISC color]
```

**Colors:**
- D card: Left border `#C62828`
- I card: Left border `#FFC107`
- S card: Left border `#4CAF50`
- C card: Left border `#29B6F6`

**Content:**
- Title: 24px, semibold, DISC color
- Count: 48px, bold, near-black
- Percentage: 14px, medium gray

### Team Values Chart

**Card:**
- White background
- 24px padding
- Horizontal bar chart
- Each bar uses exact Values color
- Rounded bar ends (4px radius)
- Labels integrated on left
- Values on right

**Bar Colors:**
- Aesthetic: `#7CB342`
- Economic: `#5C8DC4`
- Individualistic: `#F28C4E`
- Political: `#E05252`
- Altruistic: `#FFB74D`
- Regulatory: `#757575`
- Theoretical: `#B8864A`

## Key Changes
- Remove ALL dashed borders
- Use colored left border accent only
- Generous 24px padding
- 32px between sections
- Clean white cards
