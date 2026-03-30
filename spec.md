# Triple A AutoCare

## Current State
- Chat header shows other party's name as plain text, no profile image
- MechanicJobsTab (ActiveJobCard) shows customer initials in a yellow circle, no profile image fetch, no rating
- BookingsTab (MechanicInfoRow) fetches mechanic profile and shows image/initials, name, experience — but no rating
- No `useGetUserProfile` hook for fetching arbitrary user profiles by principal

## Requested Changes (Diff)

### Add
- `useGetUserProfile(userId: string | undefined)` hook using `actor.getUserProfile(Principal)`
- Profile avatar component (inline) for reuse: shows image if available, else first-letter circle
- Chat header: profile image + name of the other party
- Mechanic job cards: customer profile image fetched via `useGetUserProfile(customerId)`, shown with name and rating if available
- Mechanic info row (bookings): add average/per-request rating display from Mechanic list data

### Modify
- `ChatScreen` props: add `otherPartyId` (optional) so header can fetch and display profile image
- `ActiveJobCard` in MechanicJobsTab: replace static initials circle with dynamic customer profile image (fetch by `job.customerId`)
- `MechanicInfoRow` in BookingsTab: add rating display using `useMechanics` data or mechanic profile
- `App.tsx` / callers: pass `otherPartyId` when opening chat

### Remove
- Nothing removed

## Implementation Plan
1. Add `useGetUserProfile` hook to `useQueries.ts`
2. Update `ChatScreen.tsx`: add `otherPartyId` prop, fetch profile, show avatar + name in header
3. Update `MechanicJobsTab.tsx` (`ActiveJobCard`): fetch customer profile via `useGetUserProfile`, show image or initial fallback + rating
4. Update `BookingsTab.tsx` (`MechanicInfoRow`): add rating display (use `useMechanics` to get rating by mechanicId)
5. Update `App.tsx` to pass `otherPartyId` when opening chat
