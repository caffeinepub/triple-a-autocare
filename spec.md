# Triple A AutoCare

## Current State
The `LoginScreen.tsx` component handles both login and signup via email. The sign-up form (emailMode === "signup") shows email, password, and a "Create Account" submit button with no terms acknowledgment. There are no legal agreement checkboxes or disclaimers.

## Requested Changes (Diff)

### Add
- Checkbox above the "Create Account" button (signup mode only): `[ ] I agree to the Terms of Service and Privacy Policy`
- "Terms of Service" and "Privacy Policy" as anchor tags opening in a new tab
- Disclaimer text below the checkbox: "By continuing, you acknowledge that TRIPLE A is a platform connecting users with independent mechanics."
- State variable `termsAccepted` (boolean, default false)
- Error state: if user taps "Create Account" without checking → show "Please accept the Terms and Privacy Policy to continue"
- "Create Account" button disabled when `termsAccepted` is false

### Modify
- `handleEmailSubmit`: add guard that checks `termsAccepted` before proceeding (only when `emailMode === "signup"`)
- Submit button: add `disabled={isEmailLoading || (emailMode === 'signup' && !termsAccepted)}` condition

### Remove
- Nothing removed

## Implementation Plan
1. Add `termsAccepted` useState (boolean, false) to LoginScreen
2. In the signup form section (after password field, before submit button), insert:
   - Checkbox row with inline label text; "Terms of Service" and "Privacy Policy" are `<a>` tags with `target="_blank"` linking to placeholder URLs (`/terms` and `/privacy`), styled in yellow/primary color
   - Disclaimer paragraph below checkbox
3. Wire checkbox `onChange` to `setTermsAccepted`
4. In `handleEmailSubmit`, when `emailMode === "signup"` and `!termsAccepted`, set `emailError` to "Please accept the Terms and Privacy Policy to continue" and return early
5. Disable submit button when `emailMode === 'signup' && !termsAccepted`
6. Style: small text (text-xs/text-sm), checkbox vertically aligned with first line of label text, links in `text-primary` (yellow) color
