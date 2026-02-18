# Team Summary Modal

## Before Issues
- Yellow dashed borders
- Red borders around sections
- Cramped member cards

## After Improvements

### Modal Container
- Background: `#FFFFFF`
- Border-radius: `12px`
- Padding: `48px`
- Max-width: `1000px`
- Shadow: `0 20px 25px rgba(0,0,0,0.15)`
- Centered on screen

### Modal Overlay
- Background: `rgba(0,0,0,0.5)`

### Header
- Title: "Team Summary" - 32px, bold
- Close button: top-right, 32px × 32px

### Member Cards Grid
- 3-column grid
- Gap: `24px`
- Each card: white background, 12px radius, 24px padding

### Individual Member Card

**Structure:**
- Header: Dark background `#1F2937`, 16px padding, name in white
- Body: White background, 24px padding
- DISC badges row
- Values list
- Attributes indicators

**DISC Badges:**
- Inline badges with DISC colors
- Padding: `4px 12px`
- Border-radius: `16px`
- Gap: `8px`
- Font: 14px, semibold

**Values List:**
- Each value on separate line
- Color dot (8px circle) + label
- 12px gap between items

**Attributes:**
- External: Blue `#4f92cf`
- Internal: Red `#C62828`
- Simple text or small progress bars

## Key Changes
- Remove ALL dashed borders
- Dark header for contrast
- Clean white body
- Colored badges for DISC
- Generous spacing
