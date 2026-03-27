# Triple A AutoCare

## Current State
The app has a unified ServiceRequest model. Mechanics can accept multiple jobs simultaneously, and customers can create multiple requests at once — no enforcement of one-at-a-time.

## Requested Changes (Diff)

### Add
- Backend: active-job check in `acceptServiceRequest` — if mechanic already has a request with status in ACTIVE_STATUSES, trap with error message
- Backend: active-booking check in `createServiceRequest` — if customer already has a request with status in ACTIVE_STATUSES, trap with error message
- Frontend (MechanicDashboard): banner "You have an ongoing job" + disabled Accept buttons when mechanic has active job
- Frontend (HomeTab): disabled "Request Mechanic" button + inline message "You already have an active service" when customer has active request

### Modify
- `acceptServiceRequest` — add pre-check before updating status
- `createServiceRequest` — add pre-check before inserting new request
- `MechanicDashboard.tsx` — consume `useMechanicActiveJob`, gate UI
- `HomeTab.tsx` — gate Request Mechanic button on `activeRequest` presence

### Remove
- Nothing removed

## Implementation Plan
1. In `main.mo`: define ACTIVE_STATUSES helper inline; add mechanic check in `acceptServiceRequest`; add customer check in `createServiceRequest`
2. In `MechanicDashboard.tsx`: import `useMechanicActiveJob`; show banner and disable Accept buttons when active job exists; log active job count
3. In `HomeTab.tsx`: disable Request Mechanic button and show inline message when `activeRequest` is non-null and non-terminal; log active booking count
