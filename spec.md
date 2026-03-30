# Triple A AutoCare

## Current State
The app has a sign-up screen (`LoginScreen.tsx`) with a Terms of Service checkbox that links to `/terms` in a new browser tab (external link). There is no in-app Terms of Service screen. The App.tsx routing does not include a ToS route.

## Requested Changes (Diff)

### Add
- New `TermsOfServiceScreen.tsx` component with the full legal text (9 sections + effective date + final note), scrollable, with bold headings, padded, and a back button at the top

### Modify
- `LoginScreen.tsx`: Change the "Terms of Service" link from `href="/terms" target="_blank"` to an in-app navigation that shows `TermsOfServiceScreen` as an overlay, with a back button returning to the sign-up form. The Privacy Policy link can remain as an external link or also show an in-app screen (keep as external for now).

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/components/TermsOfServiceScreen.tsx` — full-screen overlay component with:
   - Header: back button (ArrowLeft icon) + title "TRIPLE A – Terms of Service"
   - Scrollable body with all 9 sections, effective date, intro, and final note
   - Bold section headings, bulleted lists, proper spacing and padding
   - Styled to match the app's black/yellow theme
2. Update `LoginScreen.tsx`:
   - Add `showTerms` boolean state
   - When `showTerms` is true, render `<TermsOfServiceScreen onBack={() => setShowTerms(false)} />` as an overlay
   - Change the "Terms of Service" anchor from external link to a button/span that sets `showTerms = true`
