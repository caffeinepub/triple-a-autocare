# Triple A AutoCare

## Current State

`LoginScreen.tsx` handles the two-step auth flow. When `emailMode === 'signup'`, it already shows a Terms of Service + Privacy Policy checkbox. The `selectedRole` prop ('customer' | 'mechanic') is passed in but currently only affects display labels — not the legal acknowledgment content.

## Requested Changes (Diff)

### Add
- `MechanicPartnerAgreementModal` component: scrollable modal with the full TRIPLE A Mechanic Partner Agreement text (7 sections + final text), animated open/close, X / "Done" close button.
- In `LoginScreen.tsx`, when `emailMode === 'signup'` AND `selectedRole === 'mechanic'`: render a second checkbox row "I agree to the Mechanic Partner Agreement" with a clickable link on "Mechanic Partner Agreement" that opens the modal. Below the checkbox, render small disclaimer text: "By continuing, you agree to the Mechanic Partner Agreement."
- State: `mechanicAgreementAccepted` (boolean) and `showMechanicAgreement` (boolean) added to `LoginScreen`.
- Validation: if role is mechanic and `emailMode === 'signup'` and `mechanicAgreementAccepted` is false, block submit with error "Please accept the Mechanic Partner Agreement to continue".
- Disable "Create Account" button if mechanic and agreement not accepted (in addition to existing terms check).

### Modify
- `LoginScreen.tsx`: add mechanic agreement state, render extra checkbox section for mechanic signup, extend `handleEmailSubmit` validation, extend the submit button disabled condition.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `MechanicPartnerAgreementModal.tsx` with:
   - Animated overlay (AnimatePresence + motion.div)
   - Scrollable inner container with the full agreement text
   - Bold section headings (1–7)
   - Final acceptance text at the bottom
   - X button top-right and "Done" button at the bottom
2. In `LoginScreen.tsx`:
   - Import and add `showMechanicAgreement` / `mechanicAgreementAccepted` state
   - Render `<MechanicPartnerAgreementModal>` inside AnimatePresence alongside existing ToS/Privacy overlays
   - In the signup form, after the existing ToS checkbox (when `selectedRole === 'mechanic'`), add the mechanic agreement checkbox and disclaimer
   - Extend `handleEmailSubmit` to check `mechanicAgreementAccepted` when `selectedRole === 'mechanic'`
   - Extend submit button disabled condition
   - Reset `mechanicAgreementAccepted` on `handleEmailBack` and on tab switch
