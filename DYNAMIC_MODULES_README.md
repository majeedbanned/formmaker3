# Dynamic Module System for Landing Pages

## Overview

This dynamic module system allows users to easily add, remove, and reorder sections (modules) on their home page through an intuitive interface. Each section is treated as a module that can be managed independently, making the page design completely customizable.

## Key Features

- ✅ **Add/Remove Modules**: Users can add or remove any section from their page
- ✅ **Drag & Drop Reordering**: Intuitive drag-and-drop interface for reordering modules
- ✅ **Visibility Control**: Toggle modules on/off without removing them
- ✅ **Live Preview**: See changes in real-time as you edit
- ✅ **Persistent Configuration**: Module configurations are saved to database
- ✅ **User Authentication**: Only authenticated school admins can edit modules
- ✅ **Performance Optimized**: Components are loaded dynamically only when needed

## Architecture

### Core Components

1. **ModuleConfig Interface** (`src/types/modules.ts`)

   - Defines the structure of module configurations
   - Includes order, visibility, and custom config data

2. **Module Registry** (`src/lib/moduleRegistry.ts`)

   - Central registry mapping module types to their components
   - Defines default configurations and metadata for each module

3. **Dynamic Module Component** (`src/components/DynamicModule.tsx`)

   - Wrapper component that renders individual modules
   - Handles admin controls and edit modes

4. **Module Manager** (`src/components/ModuleManager.tsx`)

   - Main interface for managing modules
   - Provides drag-and-drop functionality for reordering
   - Modal interface for adding new modules

5. **Dynamic Home Page** (`src/components/DynamicHomePage.tsx`)
   - Orchestrates the entire module system
   - Loads configurations from API
   - Renders modules in the correct order

### Available Modules

| Module       | Icon | Category     | Required | Edit Support |
| ------------ | ---- | ------------ | -------- | ------------ |
| Navbar       | 🧭   | Header       | Yes      | No           |
| Hero         | 🚀   | Hero         | No       | Yes          |
| Features     | ⭐   | Content      | No       | Yes          |
| About        | 👥   | Content      | No       | Yes          |
| Teachers     | 👨‍🏫   | Content      | No       | No           |
| Gallery      | 🖼️   | Content      | No       | Yes          |
| News         | 📰   | Content      | No       | No           |
| Articles     | 📝   | Content      | No       | Yes          |
| App Download | 📱   | Content      | No       | Yes          |
| Testimonials | 💬   | Social Proof | No       | Yes          |
| Pricing      | 💰   | Content      | No       | No           |
| Contact      | 📞   | Contact      | No       | Yes          |
| Footer       | 🦶   | Footer       | Yes      | Yes          |

## Usage Guide

### For Administrators

1. **Login**: Only authenticated school admins can access edit functionality
2. **Edit Mode**: Click the settings button (⚙️) to enter edit mode
3. **Add Modules**: Click the plus button (+) to open the module manager
4. **Reorder**: Drag and drop modules to reorder them
5. **Visibility**: Use the eye icon to toggle module visibility
6. **Save**: Changes are automatically saved when you make them

### For Developers

#### Adding a New Module

1. **Define Module Type** in `src/types/modules.ts`:

```typescript
export enum ModuleType {
  // ... existing types
  MY_NEW_MODULE = "my_new_module",
}
```

2. **Create Component** in `src/components/landing/MyNewModuleSection.tsx`:

```typescript
export default function MyNewModuleSection() {
  // Your module component
}
```

3. **Create Edit Modal** in `src/components/landing/MyNewModuleEditModal.tsx`:

```typescript
export default function MyNewModuleEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}) {
  // Your edit interface
}
```

4. **Register Module** in `src/lib/moduleRegistry.ts`:

```typescript
[ModuleType.MY_NEW_MODULE]: {
  type: ModuleType.MY_NEW_MODULE,
  name: 'My New Module',
  description: 'Description of what this module does',
  icon: '🆕',
  component: MyNewModuleSection,
  editModal: MyNewModuleEditModal,
  category: ModuleCategory.CONTENT,
  isRequired: false,
  defaultConfig: {
    isVisible: true,
    // Your default configuration
  },
},
```

#### Customizing Module Behavior

Each module can define its own configuration structure in the `defaultConfig` property. This configuration is passed to the component as props, allowing for flexible customization.

## API Endpoints

- `GET /api/admin/modules?pageId=home` - Fetch module configuration
- `POST /api/admin/modules` - Update module configuration
- `DELETE /api/admin/modules?pageId=home` - Reset to default configuration

## Database Schema

Module configurations are stored in the `pageModules` collection:

```javascript
{
  _id: ObjectId,
  schoolId: String,           // School identifier
  pageId: String,             // Page identifier (e.g., 'home')
  pageName: String,           // Human-readable page name
  modules: [                  // Array of module configurations
    {
      id: String,             // Unique module instance ID
      type: String,           // Module type from ModuleType enum
      order: Number,          // Display order (0-based)
      isVisible: Boolean,     // Whether module is visible
      isEnabled: Boolean,     // Whether module is enabled
      config: Object,         // Module-specific configuration
      createdAt: Date,
      updatedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

## Performance Considerations

- **Dynamic Imports**: Module components are only loaded when needed
- **Memoization**: Components use React.memo to prevent unnecessary re-renders
- **Optimistic Updates**: UI updates immediately while saving in background
- **Error Boundaries**: Failed modules don't crash the entire page

## Security

- **Authentication**: Only authenticated school admins can edit modules
- **Authorization**: Users can only edit modules for their own school
- **Validation**: All module configurations are validated before saving
- **XSS Protection**: All user input is properly sanitized

## Future Enhancements

- [ ] Module templates and presets
- [ ] Undo/redo functionality
- [ ] Module duplication
- [ ] Advanced styling options
- [ ] A/B testing support
- [ ] Analytics integration
- [ ] Export/import configurations

## Troubleshooting

### Common Issues

1. **Modules not loading**: Check browser console for API errors
2. **Drag and drop not working**: Ensure @dnd-kit dependencies are installed
3. **Changes not saving**: Verify user authentication and permissions
4. **Missing modules**: Check module registry for proper component imports

### Debug Mode

Set `localStorage.debug = 'modules:*'` in browser console to enable debug logging.

## Contributing

When contributing new modules:

1. Follow the established naming conventions
2. Include proper TypeScript types
3. Add tests for new functionality
4. Update this documentation
5. Ensure accessibility compliance

## License

This module system is part of the FormMaker3 project and follows the same license terms.
