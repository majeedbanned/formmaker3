# Notification Sender Implementation

## Summary

Successfully implemented a push notification sender interface at `/admin/sendnotif2` based on the existing SMS sender at `/admin/sendsms2`. The system allows school administrators to send push notifications to students and teachers.

## Changes Made

### 1. API Route Fix
**File:** `formmaker3/src/app/api/notifications/send/route.ts`

- Fixed token field from `data.tokens` to `data.pushTokens` (correct field in database)
- Added filtering for active tokens only (`active !== false`)
- Now correctly reads push tokens from both teachers and students collections

### 2. New API Endpoint
**File:** `formmaker3/src/app/api/notifications/token-count/route.ts`

- Created new endpoint to count active push tokens across all students and teachers
- Used by the UI to display total registered devices
- Returns count, studentCount, and teacherCount

### 3. Notification Sender Page
**File:** `formmaker3/src/app/admin/sendnotif2/page.tsx`

A comprehensive UI for sending push notifications with the following features:

#### Recipient Selection
- Select by **Classes**: Send to all students in selected classes
- Select by **Students**: Individual student selection
- Select by **Teachers**: Individual teacher selection
- Select by **Groups**: Send to all students in selected groups
- **Birthday Feature**: Quick select for people with birthdays today
- Search functionality for all recipient types
- "Select All" and "Clear All" buttons
- Shows device count for each recipient with push tokens

#### Message Composition
- **Title field**: Required field for notification title
- **Message field**: Multi-line text area for notification body
- Character counter for message length
- Real-time display of selected recipients count
- Real-time display of target device count

#### Template Management
- Default templates: 4 pre-configured message templates
- Custom templates: Create, edit, and delete your own templates
- Templates stored in localStorage
- Click template to use it in message field
- Edit/delete buttons for custom templates only

#### UI Features
- Token count display showing total registered devices
- Refresh button to update token count
- Loading states for all async operations
- Success/error toast notifications
- Responsive design (mobile and desktop)
- RTL (right-to-left) support for Persian language
- Consistent with SMS page design

#### Access Control
- Only school administrators can access
- Teachers with `adminAccess` flag can also access
- Unauthorized users see access denied message

#### Additional Features
- Birthday dialog shows people with birthdays today
- Device info display (shows platform, model when available)
- Proper error handling and validation
- Disabled states for send button when required fields missing

## Database Structure

The system reads from existing `pushTokens` field in both collections:

```typescript
data.pushTokens: [
  {
    token: string,              // Expo push token
    deviceInfo: {
      deviceName?: string,
      deviceType?: string,
      osName?: string,
      osVersion?: string,
      modelName?: string,
      brand?: string,
      platform?: string
    },
    registeredAt: Date,
    lastUpdated: Date,
    active: boolean             // Only sends to active tokens
  }
]
```

## Testing

The implementation is ready for user testing:

1. **Access the page**: Navigate to `/admin/sendnotif2`
2. **Select recipients**: Choose classes, students, teachers, or groups
3. **Compose notification**: Enter title and message
4. **Review**: Check recipient count and device count
5. **Send**: Click "ارسال اعلان" button
6. **Verify**: Notifications should arrive on registered devices

## Future Enhancements (Not Implemented)

The following features are marked as placeholders for future implementation:

1. **Notification History**: Tab exists but shows "coming soon" message
   - Would require new collection: `notificationrecords`
   - Similar to `smsrecords` collection

2. **History Details**: View past notifications and delivery status
   - Track which devices received notifications
   - Show delivery success/failure status

3. **Scheduled Notifications**: Send notifications at specific times

4. **Rich Notifications**: Support for images, actions, etc.

## Files Changed

1. ✅ `formmaker3/src/app/api/notifications/send/route.ts` - Fixed token field
2. ✅ `formmaker3/src/app/api/notifications/token-count/route.ts` - New endpoint
3. ✅ `formmaker3/src/app/admin/sendnotif2/page.tsx` - New page (1200+ lines)

## OpenSpec Documentation

All changes documented in:
- `openspec/changes/add-notification-sender-ui/proposal.md`
- `openspec/changes/add-notification-sender-ui/tasks.md`
- `openspec/changes/add-notification-sender-ui/specs/notification-management/spec.md`

Validation: ✅ `openspec validate add-notification-sender-ui --strict` passes

## How to Use

1. Navigate to `/admin/sendnotif2` as school admin
2. Token count displays at the top showing registered devices
3. Select recipient type (classes/students/teachers/groups)
4. Use search to filter recipients
5. Check recipients you want to notify
6. See device count update in real-time
7. Enter notification title (required)
8. Enter message text (required)
9. Optionally use a template or create custom templates
10. Click "ارسال اعلان" to send
11. Notifications delivered via Expo Push Notification service

## Notes

- Uses existing `/api/notifications/send` endpoint
- Notifications sent via Expo Push Notification service
- Only active tokens are used (`active !== false`)
- Duplicate tokens are filtered out
- Templates stored in browser localStorage
- Consistent UX with SMS sender page
- Persian language support throughout


