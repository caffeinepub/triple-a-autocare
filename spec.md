# Triple A AutoCare — Profile System Upgrade

## Current State
- `UserProfile` in Motoko has: userId, name, phone, location, latitude?, longitude?, address?
- `userProfilesV2` is the current stable map storage
- ProfileTab shows name, phone, location fields with edit mode; no profile image
- No mechanic-specific profile fields (yearsOfExperience, specialties)
- No `updateUserProfile` partial-update method
- No `getMechanicPublicProfile` for cross-user lookup
- Mechanic cards in customer view show only initials, no profile image or experience info

## Requested Changes (Diff)

### Add
- New `UserProfile` V3 type in Motoko: adds `profileImage: ?Text`, `role: ?Text`, `yearsOfExperience: ?Nat`, `specialties: ?Text`
- `userProfilesV3` stable map as new primary storage
- Migration from V2 → V3 in `postupgrade`
- `updateUserProfile(name: ?Text, profileImage: ?Text, yearsOfExperience: ?Nat, specialties: ?Text) : async UserProfile` — partial update, respects role for mechanic-only fields
- `getMechanicPublicProfile(mechanicId: Principal) : async ?UserProfile` — query for cross-user lookup
- ProfileTab: circle avatar with tap-to-upload, mechanic-only fields (yearsOfExperience, specialties), save with loading state + success toast
- `useUpdateUserProfile` and `useGetMechanicProfile` hooks in useQueries.ts

### Modify
- `UserProfile` TypeScript interface: add profileImage?, role?, yearsOfExperience?, specialties?
- `backendInterface`: add `updateUserProfile`, `getMechanicPublicProfile`
- `backend.did.js` and `backend.did.d.ts`: update UserProfile IDL record and _SERVICE with new methods
- `backend.ts` wrapper: update `from_candid_opt_n8`, `saveCallerUserProfile`, add new method implementations
- `getCallerUserProfile` in Motoko: read from V3 first, fall back to V2
- `saveCallerUserProfile` in Motoko: write to V3
- MechanicJobsTab ActiveJobCard: show profile image circle instead of initials only
- BookingsTab ActiveRequestCard: show mechanic profile image + experience + specialties when available

### Remove
- Nothing removed

## Implementation Plan
1. Update `main.mo`: add V3 UserProfile type, userProfilesV3 map, migration, updateUserProfile, getMechanicPublicProfile, update getCallerUserProfile and saveCallerUserProfile
2. Update `backend.did.js`: add new UserProfile fields in IDL, add new methods
3. Update `backend.did.d.ts`: update UserProfile interface and _SERVICE
4. Update `backend.d.ts`: update UserProfile interface, add methods to backendInterface
5. Update `backend.ts`: update from_candid_opt_n8, saveCallerUserProfile, add updateUserProfile and getMechanicPublicProfile
6. Frontend: ProfileTab redesign with image upload + mechanic fields; update hooks; update MechanicJobsTab and BookingsTab for profile images
