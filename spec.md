# Triple A AutoCare

## Current State
- ChatScreen.tsx renders messages with `bg-primary` for own messages and `bg-card border border-border` for others
- No spacing differentiation between messages beyond `gap-3`
- BottomNav has no badge/notification indicator support
- App.tsx manages chat state; no unread message tracking exists
- MechanicJobsTab and BookingsTab show Chat buttons but no badge

## Requested Changes (Diff)

### Add
- Notification badge on Jobs tab (mechanic) and Bookings tab (customer) when a new chat message arrives
- Unread message count tracking in App.tsx: poll `getMessages` for active chat requests and track last-seen count per requestId
- Badge prop on BottomNav tabs so Jobs/Bookings can show a red dot or count bubble

### Modify
- ChatScreen.tsx message bubbles:
  - Own messages: align right, bright yellow background (`bg-yellow-400 text-black`), `rounded-2xl rounded-br-sm`
  - Other messages: align left, dark gray background (`bg-zinc-700 text-white`) or light yellow (`bg-yellow-50 text-zinc-900`), `rounded-2xl rounded-bl-sm`
  - Add `mb-2` or `gap-3` spacing between messages
  - Keep timestamps small (`text-[10px] text-muted-foreground`)
- BottomNav: accept optional `badges` prop (Record of tab id → number) to show a small red circle badge on the tab icon

### Remove
- Nothing removed

## Implementation Plan
1. Update ChatScreen.tsx: own messages bright yellow bg + black text, other messages dark gray bg + white text, spacing mb-2 between bubbles, timestamps unchanged
2. Update BottomNav: add optional `badges` prop to NavBar and customer/mechanic nav components; render a small absolute-positioned red dot/count on icon when badge > 0
3. In App.tsx: track `unreadChatCount` for active requestId using a polling interval on getMessages — compare to last-seen count; clear when chat is opened; pass badge count to BottomNav
