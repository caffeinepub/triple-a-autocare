# Triple A AutoCare — Mechanic Verification System

## Current State
- `UserProfile` has no verification/approval status field.
- All mechanics can receive and accept job requests immediately upon signup.
- No admin panel exists for managing mechanic approval.
- `getSearchingRequests()` returns all searching requests to any mechanic.
- `acceptServiceRequest()` allows any mechanic to accept any searching request.

## Requested Changes (Diff)

### Add
- `verificationStatus` field (Text: `"pending"` | `"approved"` | `"rejected"`) to `UserProfile` — default `"pending"` for mechanics, `"approved"` for customers.
- Backend method `updateMechanicVerificationStatus(mechanicId: Principal, status: Text)` — admin-only; sets the mechanic's `verificationStatus`.
- Backend method `getAllMechanics()` — admin-only; returns all users with role == `"mechanic"` so admin can see and manage them.
- Admin Panel screen in the frontend (visible only when `isCallerAdmin()` returns true).
  - Lists all mechanics with their name, verification status, and approve/reject buttons.
  - Approve sets status to `"approved"`, Reject sets to `"rejected"`.
- Pending state UI for mechanics:
  - When a mechanic with `verificationStatus == "pending"` or `"rejected"` logs in, show a full-screen or prominent banner:
    - `"pending"`: "Your account is under review. You will be approved shortly."
    - `"rejected"`: "Your application was not approved. Contact support for more information."
  - Mechanic cannot navigate to any other screen (Jobs, Dashboard, etc.) until approved.

### Modify
- `saveCallerUserProfile` / `updateUserProfile`: when `role == "mechanic"` and user is newly registering, set `verificationStatus = "pending"`. Customers get `verificationStatus = "approved"`.
- `getSearchingRequests()`: filter out calls from mechanics whose `verificationStatus != "approved"` — return empty array.
- `acceptServiceRequest()`: reject (trap) if the calling mechanic's `verificationStatus != "approved"`.
- `UserProfile` type (both Motoko and `backend.d.ts`): add `verificationStatus?: string` field.

### Remove
- Nothing removed.

## Implementation Plan
1. **Backend (Motoko `main.mo`)**:
   - Add `verificationStatus : ?Text` to `UserProfile` type (V5 migration preserving V4).
   - In `saveCallerUserProfile`: auto-set `verificationStatus` based on role — `"pending"` for mechanic, `"approved"` for customer/other.
   - In `updateUserProfile`: same auto-set logic when role field changes.
   - Guard `getSearchingRequests()` to return `[]` if caller's mechanic profile has `verificationStatus != "approved"`.
   - Guard `acceptServiceRequest()` to trap with "Account not approved" if mechanic's `verificationStatus != "approved"`.
   - Add `getAllMechanics()` — admin-only — returns all profiles where `role == "mechanic"`.
   - Add `updateMechanicVerificationStatus(mechanicId, status)` — admin-only — updates `verificationStatus` on that mechanic's profile.

2. **Frontend type declarations (`backend.d.ts`)**:
   - Add `verificationStatus?: string` to `UserProfile` interface.
   - Add `getAllMechanics(): Promise<Array<UserProfile>>` to `backendInterface`.
   - Add `updateMechanicVerificationStatus(mechanicId: Principal, status: string): Promise<void>` to `backendInterface`.

3. **Frontend — Mechanic verification gate**:
   - In `App.tsx` (or `MechanicDashboard`): after profile loads, if `role == "mechanic"` and `verificationStatus != "approved"`, show a full-screen pending/rejected message instead of the normal dashboard.
   - Show pending message: "Your account is under review. You will be approved shortly."
   - Show rejected message: "Your application was not approved."
   - Add logout button on this screen.

4. **Frontend — Admin Panel**:
   - New `AdminPanel.tsx` component.
   - Visible via a new tab or a dedicated screen only when `isCallerAdmin()` is true.
   - Calls `getAllMechanics()` to list all mechanic profiles.
   - Each row shows: name, address/location, verification status badge.
   - Buttons: "Approve" (calls `updateMechanicVerificationStatus(id, "approved")`) and "Reject" (calls `updateMechanicVerificationStatus(id, "rejected")`).
   - Refreshes list after each action.
   - Add a "Management" tab in `BottomNav` only for admins, or reveal it inside the existing management panel.
