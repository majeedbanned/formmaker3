# Dynamic Menu System

The dynamic menu system generates navigation menus based on user permissions and admin system configurations.

## How it Works

1. **User Permission Fetch**: Retrieves user permissions from the appropriate collection (students/teachers/schools) based on `user.userType`
2. **Permission Filtering**: Filters permissions to only include systems where user has "show" access
3. **System Data Fetch**: Queries the `adminsystems` collection to get menu configuration data for allowed systems
4. **Access Control**: Filters systems to only include those the user has explicit permission for
5. **Menu Items Fetch**: Fetches actual menu items from the `adminsystemmenus` collection
6. **Structure Building**: Groups and orders menus by `menuID` and `menuIDOrder`, hiding empty menu sections

## Data Flow

```
User Login → User Permissions (students/teachers/schools)
           ↓
           Extract systemIDs from permissions
           ↓
           Query adminsystems collection (systemName, mainUrl, menuID, menuIDOrder)
           ↓
           Query adminsystemmenus collection (menu items)
           ↓
           Build & cache menu structure
           ↓
           Render dynamic menus in sidebar
```

## Database Collections Structure

### User Collections (students/teachers/schools)

```typescript
{
  _id: string,
  data: {
    premisions: [
      {
        systems: "systemID1",
        access: ["show", "create", "edit", "delete"]
      }
    ]
  }
}
```

### AdminSystems Collection

```typescript
{
  _id: string,
  data: {
    systemID: "systemID1",
    systemName: "System Name",
    mainUrl: "/admin/system",
    menuID: "menu1",
    menuIDOrder: 1
  }
}
```

### AdminSystemMenus Collection

```typescript
{
  _id: string,
  data: {
    menuID: "menu1",
    title: "Menu Item Title",
    url: "/admin/item",
    icon: "icon-name",
    order: 1
  }
}
```

## Performance Features

- **10-minute caching** to minimize database calls
- **Concurrent API calls** for better performance
- **Efficient filtering** using MongoDB `$in` operator
- **Smart cache management** with user-specific keys

## Usage in Components

```typescript
import { useDynamicMenu } from "@/hooks/useDynamicMenu";

function MyComponent() {
  const { menus, isLoading, error } = useDynamicMenu();

  if (isLoading) return <div>Loading menus...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <nav>
      {menus.map((section) => (
        <div key={section.menuID}>
          <h3>{section.title}</h3>
          <ul>
            {section.items.map((item) => (
              <li key={item.url}>
                <a href={item.url}>{item.title}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
```

## Cache Management

```typescript
import { clearMenuCache } from "@/hooks/useDynamicMenu";

// Clear cache for specific user
clearMenuCache("teacher", "teacher123");

// Clear all cache
clearMenuCache();
```

## Integration with AppSidebar

The `AppSidebar` component now automatically uses the dynamic menu system:

- Fetches menus based on user permissions
- Shows loading state during fetch
- Displays error state if fetch fails
- Groups menus by `menuID` and orders by `menuIDOrder`
- Renders menu items ordered by their `order` field
