# Triple A AutoCare

## Current State

Full-featured on-demand mechanic platform for Nigerian car owners. The app is fully implemented with:
- Real-time two-sided service request system (customer ↔ mechanic)
- Role-based onboarding (customer / mechanic) with email/password and Internet Identity auth
- Complete profile system with profile images, years of experience, specialties, location
- Real-time chat with unread message badges and notification sounds
- Cancellation system with reasons and attribution
- History system (active and completed/cancelled tabs)
- Pricing & approval workflow (mechanic submits price, customer accepts/rejects)
- Rating system (1–5 stars post-completion, mutual ratings)
- Car parts marketplace (NGN pricing)
- Premium black/white/yellow mobile-first UI

The backend (main.mo) is fully implemented with all V1–V4 migration logic, all service request status variants, chat, ratings, profiles, and cancellations.

## Requested Changes (Diff)

### Add
- Nothing new to add — this is a full rebuild/redeploy of the existing app

### Modify
- Fix rating submission bug: `customerRating` and `mechanicRating` must be correctly deserialized from backend responses in `ServiceRequest` IDL
- Ensure the `idlFactory` function in `backend.did.js` includes `latitude`, `longitude`, `address`, `customerRating`, `mechanicRating` fields in `ServiceRequest`
- Ensure `ChatMessage` with `isRead` field is fully included in both `idlService` and `idlFactory`
- Rebuild frontend ensuring all existing pages/features are intact and working

### Remove
- Nothing to remove

## Implementation Plan

1. **Generate fresh Motoko backend** with all features:
   - UserProfile (V4): name, phone, location, latitude, longitude, address, profileImage, role, yearsOfExperience, specialties, totalRatings, ratingsSum
   - ServiceRequest (V5): all status variants (searching, accepted, on_the_way, arrived, price_sent, approved, completed, cancelled), all fields including customerRating, mechanicRating, cancelledBy, cancelReason, latitude, longitude, address
   - ChatMessage: id, requestId, senderId, senderRole, message, isRead, createdAt
   - All backend methods: createServiceRequest, getSearchingRequests, acceptServiceRequest, getServiceRequests, getMechanicActiveJob, getCustomerActiveRequest, updateServiceRequestStatus, submitServicePrice, customerRespondToPrice, completeJob, cancelServiceRequest, getMechanicCompletedJobs, getCustomerCompletedRequests, sendMessage, getMessages, markMessagesRead, submitRating, updateUserProfile, getCurrentUserProfile/getCallerUserProfile, getMechanicPublicProfile, saveCallerUserAppRole, seedData

2. **Rebuild frontend** using existing pages/components as the source:
   - App.tsx: two-step auth (role selection → login), email/II identity, onboarding, routing
   - BookingsTab: active requests with mechanic info, price accept/reject, cancel, history, ratings
   - MechanicJobsTab: active jobs with status updates, price submission, chat, cancel, history, ratings
   - MechanicDashboard: incoming request cards with customer ratings
   - ChatScreen: real-time chat with proper message alignment, keyboard handling, unread badges
   - ProfileTab: photo upload, mechanic fields, rating display
   - OnboardingScreen: name, phone, address/location with GPS option
   - LoginScreen: Google (II) and email/password options after role selection
   - BottomNav: role-specific tabs with unread badge support
   - Sounds utility: Web Audio API notification sounds
   - Email identity store: persisted email auth across reloads
