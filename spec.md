# Triple A AutoCare

## Current State
The app has a UserProfile model with `name`, `phone`, `location` (plain text). ServiceRequest has a `location` (plain text string). Onboarding collects name, phone, location. No lat/lng coordinates exist anywhere.

## Requested Changes (Diff)

### Add
- `latitude`, `longitude`, `address` optional fields to `UserProfile` backend type
- `latitude`, `longitude`, `address` optional fields to `ServiceRequest` (V4 type + migration)
- `latitude`, `longitude`, `address` optional params to `createServiceRequest` backend method
- Geolocation button ("Use current location") on OnboardingScreen
- Address display in active booking cards (BookingsTab) and active job cards (MechanicJobsTab)

### Modify
- `UserProfile` type in backend: add `latitude : ?Float`, `longitude : ?Float`, `address : ?Text`
- `ServiceRequest` type in backend: add V4 with location coords + migration V3→V4
- `createServiceRequest`: add `latitude : ?Float`, `longitude : ?Float`, `address : ?Text` params
- `OnboardingScreen`: role-aware label ("Workshop Location" for mechanic, "Home Address" for customer), geolocation button, collect lat/lng/address
- `App.tsx`: pass `role` to `OnboardingScreen`, pass lat/lng/address through profile save
- `MechanicRequestModal`: use profile address when available, pass lat/lng/address to createServiceRequest
- `backend.d.ts`: update types for UserProfile, ServiceRequest, createServiceRequest

### Remove
- Nothing removed

## Implementation Plan
1. Update `main.mo`: new UserProfile with optional lat/lng/address, ServiceRequestV4, migration V3→V4, updated createServiceRequest signature
2. Update `backend.d.ts`: sync types
3. Update `OnboardingScreen`: role prop, differentiated label, geolocation button
4. Update `App.tsx`: pass role to OnboardingScreen, pass lat/lng/address in profile save
5. Update `MechanicRequestModal`: attach profile lat/lng/address to service request
6. Update `BookingsTab` + `MechanicJobsTab`: show address field on job cards
