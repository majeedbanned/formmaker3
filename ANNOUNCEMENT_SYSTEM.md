# Announcement System Documentation

## Overview

The announcement system allows administrators to show important messages to different user roles (student, teacher, school/admin) in a beautiful modal popup. Announcements are displayed on the first load of the application and can be dismissed per user.

## Features

- ✅ Role-based announcements (student, teacher, school)
- ✅ Beautiful modal with image support
- ✅ HTML/Rich text content support
- ✅ Multiple announcements navigation
- ✅ "Don't show again" functionality per announcement
- ✅ Progress indicator for multiple announcements
- ✅ Responsive design with RTL support
- ✅ Persistent dismissal tracking in MongoDB

## Files Structure

```
formmaker3/
├── public/
│   └── announcements.json              # Static JSON file with announcements
├── src/
│   ├── app/api/
│   │   └── announcements/
│   │       ├── route.ts                # GET: Fetch unread announcements
│   │       └── dismiss/
│   │           └── route.ts            # POST: Dismiss announcements
│   └── components/
│       ├── AnnouncementModal.tsx       # Beautiful modal component
│       └── AnnouncementProvider.tsx    # Client wrapper component
```

## Data Structure

### Announcement JSON Format

Located at: `public/announcements.json`

```json
{
  "announcements": [
    {
      "id": "announce-001",
      "version": 1,
      "title": "خوش آمدید به سیستم جدید!",
      "body": "<p>سلام کاربر گرامی...</p>",
      "imageUrl": "/images/placeholder.jpg",
      "roles": ["student", "teacher", "school"],
      "active": true,
      "createdAt": "2025-10-20T10:00:00Z"
    }
  ]
}
```

#### Field Descriptions:

- **id** (required): Unique identifier for the announcement
- **version** (required): Version number for the announcement
- **title** (required): Announcement title (Persian/RTL supported)
- **body** (required): HTML content of the announcement
- **imageUrl** (optional): Path to announcement image
- **roles** (required): Array of user roles ["student", "teacher", "school"]
- **active** (required): Boolean to enable/disable announcement
- **createdAt** (required): ISO timestamp for sorting

### Database Collection

Collection: `user_announcement_preferences`

```javascript
{
  userId: "68222c12e3725232bcfcd3e7",
  username: "6519890517",
  userType: "student",
  schoolCode: "2295566177",
  dismissedAnnouncements: ["announce-001", "announce-002"],
  createdAt: "2025-10-24T10:00:00Z",
  updatedAt: "2025-10-24T11:00:00Z"
}
```

## API Endpoints

### GET /api/announcements

Fetches unread announcements for the logged-in user.

**Authentication:** Required

**Response:**
```json
{
  "announcements": [
    {
      "id": "announce-001",
      "title": "...",
      "body": "...",
      "imageUrl": "...",
      "roles": ["student"],
      "active": true,
      "createdAt": "..."
    }
  ]
}
```

**Logic:**
1. Reads announcements from static JSON file
2. Filters by user role and active status
3. Excludes dismissed announcements from database
4. Sorts by creation date (newest first)

### POST /api/announcements/dismiss

Dismisses one or more announcements for the logged-in user.

**Authentication:** Required

**Request Body:**
```json
{
  "announcementIds": ["announce-001", "announce-002"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Announcements dismissed successfully"
}
```

## Components

### AnnouncementProvider

Client-side provider component that:
- Fetches announcements on mount
- Shows modal if announcements exist
- Handles dismissal API calls

**Usage:**
```tsx
import AnnouncementProvider from "@/components/AnnouncementProvider";

export default function Dashboard() {
  return (
    <>
      <AnnouncementProvider />
      <div>
        {/* Dashboard content */}
      </div>
    </>
  );
}
```

### AnnouncementModal

Beautiful modal component with:
- Image display (optional)
- HTML content rendering
- Navigation between multiple announcements
- Progress indicator
- "Don't show again" checkbox
- Responsive design

**Props:**
```typescript
interface AnnouncementModalProps {
  announcements: Announcement[];
  onClose: () => void;
  onDismiss: (announcementIds: string[]) => void;
}
```

## Integration

The announcement system is integrated into:
- **Dashboard page only** (`/admin/dashboard`) via `src/app/admin/dashboard/page.tsx`

All authenticated users (students, teachers, school admins) will see relevant announcements when they first visit the dashboard page.

## How to Add New Announcements

1. **Edit the JSON file:**
   ```bash
   vi public/announcements.json
   ```

2. **Add your announcement:**
   ```json
   {
     "id": "announce-004",
     "version": 1,
     "title": "اطلاعیه جدید",
     "body": "<p>متن اطلاعیه با پشتیبانی از HTML</p><ul><li>مورد اول</li></ul>",
     "imageUrl": "/images/my-image.jpg",
     "roles": ["student", "teacher"],
     "active": true,
     "createdAt": "2025-10-24T12:00:00Z"
   }
   ```

3. **Upload image (if needed):**
   ```bash
   cp my-image.jpg public/images/
   ```

4. **Users will see the announcement on next login/refresh**

## How to Update an Announcement

To re-show an announcement to users who dismissed it:

1. Change the **id** or increment the **version** number
2. Users who dismissed the old version will see the new one

## How to Disable an Announcement

Set `active: false` in the JSON file:

```json
{
  "id": "announce-001",
  "active": false,
  ...
}
```

## User Experience Flow

1. User logs in or refreshes the page
2. System fetches applicable announcements for user's role
3. System excludes dismissed announcements from database
4. If announcements exist, modal appears automatically
5. User can:
   - Navigate between multiple announcements
   - Check "Don't show again" for current announcement
   - Click "Close all" to dismiss all remaining announcements
   - Click "Next" to see next announcement
6. Dismissed announcements are saved to database
7. User won't see dismissed announcements again

## Styling and Design

- **Colors:** Gradient blue to purple (`from-blue-500 to-purple-600`)
- **Font:** Vazirmatn (Persian font)
- **Direction:** RTL (Right-to-Left)
- **Responsive:** Mobile-friendly with max-width constraints
- **Animation:** Smooth fade and zoom transitions

## Security Considerations

- ✅ Authentication required for all API endpoints
- ✅ User can only dismiss announcements for themselves
- ✅ HTML content is sanitized via React's `dangerouslySetInnerHTML`
- ✅ Database operations use MongoDB upsert for safe updates

## Future Enhancements

Potential improvements:
- [ ] Admin UI to manage announcements
- [ ] Scheduling announcements (start/end dates)
- [ ] Analytics (view counts, dismissal rates)
- [ ] Rich text editor for creating announcements
- [ ] Video support in announcements
- [ ] Priority/urgency levels
- [ ] Email notifications for critical announcements

## Troubleshooting

### Announcements not showing

1. Check if announcements.json exists and is valid JSON
2. Verify user role matches announcement roles array
3. Check if announcement `active: true`
4. Verify user hasn't dismissed it (check database)

### Modal appears but content is empty

1. Verify HTML in body field is valid
2. Check image path in imageUrl field
3. Check browser console for errors

### Database errors

1. Verify MongoDB connection in config
2. Check user authentication is working
3. Ensure collection permissions are correct

## Support

For issues or questions, contact the development team or refer to the project README.

