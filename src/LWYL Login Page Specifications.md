# LWYL Login Page Specifications

## Overview
Professional Fortune 500-level login page for Love Where You Lead platform.

## Layout

### Container
- Full viewport height (100vh)
- White background (#FFFFFF)
- Centered content (flexbox)

### Login Card
- Max-width: 1000px
- White background (#FFFFFF)
- Border-radius: 12px
- Box-shadow: 0 4px 6px rgba(0,0,0,0.1)
- Padding: 48px
- Display: Grid (2 columns on desktop, 1 on mobile)

## Left Side - Branding & Illustration

### Logo
- "Love Where You Lead" logo at top
- Height: 60px
- Margin-bottom: 16px

### Tagline
- Text: "The Environment You Need. Right Where You Are."
- Font-size: 18px
- Color: #6B7280 (gray)
- Margin-bottom: 32px

### Illustration
- Professional leadership illustration
- Theme: Team climbing upward, growth, collaboration
- Colors: Blue (#29B6F6), Green (#4CAF50), Navy
- Size: 300px × 300px

## Right Side - Login Form

### Email Input
- Label: "Email"
- Font-size: 14px, color: #374151
- Input height: 48px
- Border: 1px solid #D1D5DB
- Border-radius: 8px
- Padding: 12px 16px
- Font-size: 16px
- Focus state: Border #29B6F6, box-shadow: 0 0 0 3px rgba(41,182,246,0.1)

### Password Input
- Same styling as Email
- Label: "Password"
- Margin-top: 24px

### Remember Me & Forgot Password
- Margin-top: 24px
- Display: Flex, space-between
- Checkbox: "Remember me" (14px font, #6B7280)
- Link: "Forgot password?" (14px font, #29B6F6, hover underline)

### Sign In Button
- Text: "Sign In to Your Dashboard"
- Background: #29B6F6
- Color: #FFFFFF
- Font-size: 16px, font-weight: 600
- Padding: 12px 24px
- Border-radius: 8px
- Width: 100%
- Margin-top: 32px
- Hover: Background #1E88E5
- Cursor: pointer

### Secure Login Badge
- Margin-top: 24px
- Text: "🔒 Secure Login"
- Font-size: 12px
- Color: #6B7280
- Text-align: center

## Responsive Design

### Desktop (> 768px)
- Two-column grid
- Illustration visible

### Mobile (< 768px)
- Single column
- Hide illustration
- Reduce padding to 24px
- Full-width card

## Accessibility
- All inputs have labels
- Tab navigation works
- Focus states visible
- ARIA labels on form
- Color contrast WCAG 2.1 AA compliant
