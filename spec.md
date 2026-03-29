# Triple A AutoCare

## Current State
- Backend has `submitRating(requestId, rating, raterRole)` implemented and Candid IDL declares it
- `useSubmitRating` hook exists but uses `(actor as any).submitRating` workaround
- History cards in BookingsTab and MechanicJobsTab already have star UI for rating
- `backend.d.ts` declares `submitRating` in the interface
- `backend.ts` typed wrapper class is missing the `submitRating` method (causing the `any` cast)
- Profile tab does not show any rating stats

## Requested Changes (Diff)

### Add
- `submitRating` method to `Backend` class in `backend.ts`
- Rating stats section on ProfileTab (average rating, total completed jobs)

### Modify
- `useSubmitRating` hook: remove `(actor as any)` cast, use `actor.submitRating` directly

### Remove
- Nothing

## Implementation Plan
1. Add `submitRating(requestId, rating, raterRole)` method to Backend class in backend.ts
2. Fix useSubmitRating hook in useQueries.ts to call `actor.submitRating` directly
3. Add rating stats display to ProfileTab — show average rating and total completed jobs based on completed requests
