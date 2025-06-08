# Page Permission Hooks

This document describes the page permission hooks available for checking user access to pages and systems.

## usePagePermission Hook

The `usePagePermission` hook checks if the current user has permission to access a specific page based on the system access control mechanism. **It fetches permissions live from the database** to ensure the most up-to-date access control.

### How it Works

1. **Page Detection**: Automatically extracts the page name from the current URL path
2. **Live Permission Fetch**: Retrieves user permissions from the appropriate collection (students/teachers/schools) based on user type
3. **System Lookup**: Queries the `adminsystems` collection to find which system contains this page in its `urls` array
4. **Permission Check**: Verifies if the user has the required permission for that system using fresh database data
5. **Auto Redirect**: Automatically redirects to `/noaccess` if permission is denied

### Basic Usage

```tsx
import { usePagePermission } from "@/hooks/usePagePermission";

function ExamPage() {
  const { isLoading, hasAccess, error } = usePagePermission("show");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!hasAccess) {
    return <div>Redirecting...</div>; // Hook will redirect to /noaccess
  }

  return <div>Your page content here</div>;
}
```

### Parameters

- `requiredPermission` (string, default: "show"): The permission level required to access the page
  - Common values: "show", "list", "create", "edit", "delete", "groupDelete", "search"

### Return Values

- `isLoading` (boolean): Whether the permission check is in progress
- `hasAccess` (boolean): Whether the user has access to the current page
- `error` (string | null): Any error that occurred during permission checking

## usePermissionCheck Hook

A lightweight hook for simple permission checking without redirect functionality. Useful for showing/hiding UI elements.

### Usage

```tsx
import { usePermissionCheck } from "@/hooks/usePagePermission";

function SomeComponent() {
  const canEdit = usePermissionCheck("exam", "edit");
  const canDelete = usePermissionCheck("exam", "delete");

  return (
    <div>
      {canEdit && <button>Edit</button>}
      {canDelete && <button>Delete</button>}
    </div>
  );
}
```

## useMultiPagePermission Hook

Check permissions for multiple pages at once.

### Usage

```tsx
import { useMultiPagePermission } from "@/hooks/usePagePermission";

function NavigationComponent() {
  const { results, isLoading, error } = useMultiPagePermission([
    { page: "exam", permission: "show" },
    { page: "students", permission: "list" },
    { page: "teachers", permission: "edit" },
  ]);

  if (isLoading) return <div>Loading navigation...</div>;

  return (
    <nav>
      {results.exam && <a href="/admin/exam">Exams</a>}
      {results.students && <a href="/admin/students">Students</a>}
      {results.teachers && <a href="/admin/teachers">Teachers</a>}
    </nav>
  );
}
```

## useUserSystems Hook

Get all systems that the current user has access to.

### Usage

```tsx
import { useUserSystems } from "@/hooks/usePagePermission";

function UserProfile() {
  const { systems, isLoading, error } = useUserSystems();

  if (isLoading) return <div>Loading user systems...</div>;

  return (
    <div>
      <h3>Available Systems:</h3>
      <ul>
        {systems.map((system) => (
          <li key={system.systemID}>
            {system.systemName} - Permissions: {system.permissions.join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Data Structure

### Admin System Collection

The permission system relies on the `adminsystems` collection with this structure:

```javascript
{
  _id: "system_id",
  data: {
    systemID: "exam",
    systemName: "Exam Management",
    urls: [
      { url: "exam" },
      { url: "onlineexam" },
      { url: "questionbank" }
    ]
  }
}
```

### User Permissions

Users have permissions in this format:

```javascript
{
  permissions: [
    {
      systems: "exam",
      access: ["show", "list", "create", "edit"],
    },
    {
      systems: "student",
      access: ["show", "list"],
    },
  ];
}
```

## Performance Considerations

- **Smart Caching**: User permissions are cached for 5 minutes to minimize database calls
- **Concurrent Fetching**: Admin systems and user permissions are fetched in parallel for better performance
- **Efficient Queries**: Uses optimized database queries with proper filtering
- Use `usePermissionCheck` for simple UI visibility checks
- Use `usePagePermission` for page-level access control
- The system is designed to be performant and reusable across components

### Cache Management

You can manually clear the permissions cache when needed:

```tsx
import { clearPermissionsCache } from "@/hooks/usePagePermission";

// Clear cache for specific user
clearPermissionsCache("student", "6519890517");

// Clear all cached permissions
clearPermissionsCache();
```

## Error Handling

The hooks provide comprehensive error handling:

- Network errors when fetching admin systems
- Invalid page paths
- Missing system configurations
- Permission validation errors

All errors are logged to the console and returned in the hook's error state.
