# Triple A AutoCare

## Current State
Chat system is fully functional with sendMessage/getMessages. Unread badge uses a simple message-count comparison approach in App.tsx (not per-message read state). ChatMessage type has: id, requestId, senderId, senderRole, message, createdAt.

## Requested Changes (Diff)

### Add
- `isRead: Bool` field to ChatMessage backend type (V1 migration → V2)
- `markMessagesRead(requestId)` backend method — marks all messages in that request as read for the caller (i.e. messages where sender != caller)
- `useMarkMessagesRead` hook in useQueries.ts
- Per-request unread count computed on frontend from message.isRead === false && sender !== currentUser
- Badge on job cards showing per-request unread count

### Modify
- `sendMessage` — new messages stored with `isRead = false`
- `getMessages` — returns messages with `isRead` field
- `ChatMessage` type in backend.d.ts, backend.did.d.ts, backend.did.js, backend.ts to include `isRead: boolean`
- `backendInterface` in backend.d.ts — add `markMessagesRead(requestId: string): Promise<void>`
- `_SERVICE` in backend.did.d.ts — add `markMessagesRead`
- IDL factory in backend.did.js — add `isRead` field and `markMessagesRead` method
- `backend.ts` wrapper — update getMessages mapper, add markMessagesRead method
- `ChatScreen.tsx` — call markMessagesRead on open and after each message load
- `App.tsx` — replace raw count-based unread logic with isRead-based logic
- `MechanicJobsTab` and `BookingsTab` — pass per-request unread count to job card Chat button badges

### Remove
- Old count-based unread badge polling in App.tsx (replace with isRead-based approach)

## Implementation Plan
1. Update backend main.mo: add ChatMessageV1, new ChatMessage with isRead, migrate, update sendMessage, add markMessagesRead
2. Update backend.did.js IDL: add isRead to ChatMessage record, add markMessagesRead to _SERVICE
3. Update backend.did.d.ts: add isRead to ChatMessage interface, add markMessagesRead to _SERVICE
4. Update backend.d.ts: add isRead to ChatMessage, add markMessagesRead to backendInterface
5. Update backend.ts wrapper: add isRead to getMessages mapper, add markMessagesRead method
6. Update useQueries.ts: add useMarkMessagesRead hook, add useUnreadCount helper
7. Update ChatScreen.tsx: call markMessagesRead when screen opens and when new messages arrive
8. Update App.tsx: use isRead-based unread count derived from message data
9. Update BookingsTab and MechanicJobsTab: show per-request unread badge on Chat button
