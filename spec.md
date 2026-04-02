# Triple A AutoCare — Admin Panel for Mechanic Verification

## Current State

- Backend already has `getAllMechanics()`, `updateMechanicVerificationStatus(mechanicId, status)`, and `isCallerAdmin()` methods, all declared in `backend.d.ts`.
- `AdminPanel.tsx` exists and renders a list of all mechanics with Approve/Reject buttons. It currently uses `(actor as any)` casts for `getAllMechanics` and `updateMechanicVerificationStatus` — these methods ARE already in `backendInterface` so the casts are unnecessary and should be fixed.
- `App.tsx` checks `isCallerAdmin()` from backend to determine if the user is admin, and shows an `AdminMechanicBottomNav` (with Admin tab) only for mechanic-admins.
- `ProfileTab.tsx` does NOT show an "Admin Panel" button anywhere currently.
- The mechanic verification gate (Pending/Rejected screens) already exists in `App.tsx`.
- Customer-side filtering of mechanics by `verificationStatus === 'approved'` is already handled at the backend level via `getSearchingRequests()`.
- `UserProfile.verificationStatus` field is already present in backend type.

## Requested Changes (Diff)

### Add
- Admin detection in the frontend based on `user.email === "mrpaulokeke22@gmail.com"` instead of (or in addition to) backend `isCallerAdmin()`. Since this app uses Internet Identity (not email), the admin check must use the profile's email field OR remain as-is with `isCallerAdmin()`. Because Internet Identity does not expose an email, the admin check should use the profile email field (`profile.email`) from the backend profile. However, looking at `UserProfile`, there is no `email` field in the type. The correct approach: add an `email` field to `UserProfile` in `backend.d.ts` (it may already be on the backend but not typed), and use `profile.email === "mrpaulokeke22@gmail.com"` as the admin check in the frontend. Alternatively, keep using `isCallerAdmin()` backend check (which is already wired) and that is the correct ICP way. The user's intent is clear: only that specific email should be admin. We will keep the existing `isCallerAdmin()` backend gate AND add a frontend check on `profile.email` if it exists. Since Internet Identity doesn't have email, we rely on the backend's `isCallerAdmin()` which is already the correct mechanism.
- **"Admin Panel" button on Profile screen**: When `isAdmin === true`, show a prominent "Admin Panel" button in `ProfileTab.tsx` that navigates the user to the admin tab. Since ProfileTab is rendered inside App.tsx and there's no direct tab-switching callback passed to it, we need to either: (a) add an `onAdminPanel?: () => void` prop to ProfileTab, or (b) use a shared state mechanism. Option (a) is simpler.

### Modify
- `ProfileTab.tsx`: Add an `onAdminPanel?: () => void` prop. If `isAdmin` and the user is a mechanic, show a "Admin Panel" button that calls `onAdminPanel()`.
- `App.tsx`: Pass `onAdminPanel` callback to `ProfileTab` for mechanic-admin users that switches the tab to "admin".
- `AdminPanel.tsx`: Remove `(actor as any)` casts for `getAllMechanics` and `updateMechanicVerificationStatus` — use typed `actor.getAllMechanics()` and `actor.updateMechanicVerificationStatus()` directly since they are already in `backendInterface`.
- `AdminPanel.tsx`: Add a filter/tab UI showing Pending separately from Approved/Rejected (already partially done — ensure it's clear and functional).

### Remove
- `(actor as any)` casts in `AdminPanel.tsx` for the two admin methods.

## Implementation Plan

1. **`backend.d.ts`**: Verify `getAllMechanics` and `updateMechanicVerificationStatus` are typed (they are). No changes needed to backend types.
2. **`AdminPanel.tsx`**: Replace `(actor as any).getAllMechanics()` with `actor.getAllMechanics()` and `(actor as any).updateMechanicVerificationStatus(...)` with `actor.updateMechanicVerificationStatus(...)`. Ensure status badges (Pending=yellow, Approved=green, Rejected=red) and Approve (green) / Reject (red) buttons are clearly styled. Add polling/refetch so changes reflect immediately.
3. **`ProfileTab.tsx`**: Add `isAdmin?: boolean` and `onAdminPanel?: () => void` props. When `isAdmin` is true, show an "Admin Panel" button above the logout button.
4. **`App.tsx`**: Pass `isAdmin={!!isAdmin}` and `onAdminPanel={() => setAdminMechanicTab('admin')}` to the mechanic-role `ProfileTab`. For customer `ProfileTab`, do not pass these.
