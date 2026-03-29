# Triple A AutoCare

## Current State
- Backend `main.mo` already has `UserProfile` V3 with `profileImage`, `role`, `yearsOfExperience`, `specialties` fields
- `updateUserProfile()` and `getMechanicPublicProfile()` methods exist in backend and `backend.ts`
- `ProfileTab.tsx` already has avatar upload, mechanic fields, save logic
- `BookingsTab.tsx` already has `MechanicInfoRow` showing mechanic profile image + experience
- `useQueries.ts` already has `useUpdateUserProfile` and `useGetMechanicProfile` hooks
- `backend.d.ts` is STALE — `UserProfile` interface missing `profileImage`, `role`, `yearsOfExperience`, `specialties`; also missing `updateUserProfile` and `getMechanicPublicProfile` in `backendInterface`
- `MechanicJobsTab.tsx` shows customer initials only, not profile images

## Requested Changes (Diff)

### Add
- `updateUserProfile` and `getMechanicPublicProfile` to `backendInterface` in `backend.d.ts`

### Modify
- `UserProfile` in `backend.d.ts` to include `profileImage?`, `role?`, `yearsOfExperience?`, `specialties?`
- `MechanicJobsTab` customer avatar to show profile image if available (via `useGetMechanicProfile` hook keyed on customer principal... actually customer profile lookup is not exposed publicly; keep initials for now but ensure the existing implementation is clean)

### Remove
- Nothing

## Implementation Plan
1. Update `backend.d.ts` `UserProfile` interface with new fields
2. Add `updateUserProfile` and `getMechanicPublicProfile` to `backendInterface` in `backend.d.ts`
3. Validate frontend builds cleanly
