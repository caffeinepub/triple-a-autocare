# Triple A AutoCare

## Current State
Auth is handled exclusively via Internet Identity. LoginScreen shows two buttons: Customer and Mechanic, both triggering II. The useInternetIdentity hook manages identity state. Backend AccessControl assigns #user role on first initializeAccessControl call.

## Requested Changes (Diff)

### Add
- Email + password auth alongside Internet Identity
- utils/emailAuth.ts: derives deterministic Ed25519 identity from email+password via PBKDF2
- loginWithEmailIdentity on InternetIdentityContext
- Email auth form in LoginScreen with login/signup toggle

### Modify
- useInternetIdentity.ts: add loginWithEmailIdentity, handle clear for both auth methods
- LoginScreen.tsx: show both Continue with Google and Continue with Email

### Remove
- Nothing; all existing II flows stay intact

## Implementation Plan
1. Create utils/emailAuth.ts with PBKDF2 + Ed25519KeyIdentity derivation
2. Extend useInternetIdentity.ts context with loginWithEmailIdentity
3. Rewrite LoginScreen.tsx with email form + login/signup toggle
4. Email signup defaults pending-role to customer
