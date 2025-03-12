# Dynamic Form CRUD Component

A powerful and flexible CRUD (Create, Read, Update, Delete) component for React applications that supports dynamic form generation, advanced search, and various field types.

## Features

- 🎯 Dynamic form generation based on configuration
- 🔍 Advanced search with multiple field types
- 📱 Responsive design
- 🌐 RTL support
- 🔒 Permission-based access control
- 📊 Customizable layout and styling
- 🔄 Real-time validation
- 📁 File upload support
- 🎨 Multiple field types support
- 🔄 Nested fields support

## Installation

```bash
npm install @your-package/dynamic-form-crud
# or
yarn add @your-package/dynamic-form-crud
```

## Basic Usage

```tsx
import CRUDComponent from "@/components/CRUDComponent";

const formStructure = [
  {
    name: "firstName",
    title: "First Name",
    type: "text",
    isShowInList: true,
    isSearchable: true,
    required: true,
    enabled: true,
    visible: true,
    validation: {
      requiredMessage: "First name is required",
    },
  },
  // ... more fields
];

const layout = {
  direction: "rtl",
  width: "100%",
  texts: {
    addButton: "افزودن",
    editButton: "ویرایش",
    deleteButton: "حذف",
    // ... more text customizations
  },
};

export default function App() {
  return (
    <CRUDComponent
      formStructure={formStructure}
      collectionName="users"
      connectionString="your-mongodb-connection-string"
      layout={layout}
      permissions={{
        canList: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canGroupDelete: true,
        canAdvancedSearch: true,
        canSearchAllFields: true,
      }}
    />
  );
}
```

## Field Types

### 1. Text Input

```tsx
{
  name: "firstName",
  title: "First Name",
  type: "text",
  isShowInList: true,
  isSearchable: true,
  required: true,
  enabled: true,
  visible: true,
  validation: {
    requiredMessage: "First name is required",
  },
}
```

### 2. Email Input

```tsx
{
  name: "email",
  title: "Email",
  type: "email",
  required: true,
  validation: {
    regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    requiredMessage: "Email is required",
    validationMessage: "Please enter a valid email address",
  },
}
```

### 3. Checkbox

```tsx
{
  name: "isActive",
  title: "Active Status",
  type: "checkbox",
  defaultValue: true,
}

// Multiple checkboxes
{
  name: "notifications",
  title: "Notification Settings",
  type: "checkbox",
  isMultiple: true,
  defaultValue: [],
  options: [
    { label: "Email", value: "email" },
    { label: "SMS", value: "sms" },
    { label: "Push", value: "push" },
  ],
}
```

### 4. Dropdown

```tsx
{
  name: "role",
  title: "Role",
  type: "dropdown",
  required: true,
  options: [
    { label: "Admin", value: "admin" },
    { label: "User", value: "user" },
    { label: "Guest", value: "guest" },
  ],
  validation: {
    requiredMessage: "Please select a role",
  },
}
```

### 5. Radio Buttons

```tsx
{
  name: "gender",
  title: "Gender",
  type: "radio",
  required: true,
  layout: "inline", // or "stacked"
  options: [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
  ],
}
```

### 6. Switch

```tsx
{
  name: "darkMode",
  title: "Dark Mode",
  type: "switch",
  defaultValue: false,
  switchStyle: {
    size: "md",
    color: "blue",
    thumbColor: "white",
  },
}
```

### 7. ToggleGroup

```tsx
{
  name: "interests",
  title: "Interests",
  type: "togglegroup",
  required: true,
  defaultValue: [],
  layout: "stacked",
  options: [
    { value: "sports", label: "Sports" },
    { value: "music", label: "Music" },
    { value: "reading", label: "Reading" },
  ],
}
```

### 8. DatePicker

```tsx
{
  name: "birthDate",
  title: "Birth Date",
  type: "datepicker",
  required: true,
  datepickerStyle: {
    format: "YYYY/MM/DD",
    calendar: "persian",
    locale: "fa",
    calendarPosition: "bottom",
  },
  // Multiple dates
  isMultiple: true,
}
```

### 9. Autocomplete

```tsx
{
  name: "skills",
  title: "Skills",
  type: "autocomplete",
  required: true,
  isMultiple: true,
  options: [
    { label: "JavaScript", value: "js" },
    { label: "TypeScript", value: "ts" },
    { label: "React", value: "react" },
  ],
  autocompleteStyle: {
    allowNew: true,
    maxTags: 10,
    minLength: 1,
  },
}
```

### 10. File Upload

```tsx
{
  name: "avatar",
  title: "Profile Picture",
  type: "file",
  required: false,
  fileConfig: {
    allowedTypes: ["image/*"],
    maxSize: 5 * 1024 * 1024, // 5MB
    directory: "avatars",
    multiple: false,
  },
}

// Multiple files
{
  name: "documents",
  title: "Documents",
  type: "file",
  isMultiple: true,
  fileConfig: {
    allowedTypes: ["application/pdf", "application/msword"],
    maxSize: 10 * 1024 * 1024, // 10MB
    directory: "documents",
    multiple: true,
  },
}
```

### 11. Nested Fields

```tsx
{
  name: "address",
  title: "Address",
  type: "text",
  fields: [
    {
      name: "street",
      title: "Street",
      type: "text",
      required: true,
    },
    {
      name: "city",
      title: "City",
      type: "text",
      required: true,
    },
    {
      name: "country",
      title: "Country",
      type: "dropdown",
      options: [
        { label: "USA", value: "usa" },
        { label: "Canada", value: "canada" },
      ],
    },
  ],
  orientation: "horizontal",
}
```

### 12. Array Fields

```tsx
{
  name: "phones",
  title: "Phone Numbers",
  type: "text",
  nestedType: "array",
  fields: [
    {
      name: "type",
      title: "Type",
      type: "dropdown",
      options: [
        { label: "Home", value: "home" },
        { label: "Work", value: "work" },
        { label: "Mobile", value: "mobile" },
      ],
    },
    {
      name: "number",
      title: "Number",
      type: "text",
      required: true,
    },
  ],
  orientation: "horizontal",
}
```

## Form Structure Fields

Each field in the form structure can have the following properties:

### Common Properties

| Property       | Type              | Required | Description                                     |
| -------------- | ----------------- | -------- | ----------------------------------------------- |
| `name`         | `string`          | Yes      | Unique identifier for the field                 |
| `title`        | `string`          | Yes      | Display label for the field                     |
| `type`         | `string`          | Yes      | Type of the field (text, email, checkbox, etc.) |
| `isShowInList` | `boolean`         | No       | Whether to show this field in the list view     |
| `isSearchable` | `boolean`         | No       | Whether this field can be used in search        |
| `required`     | `boolean`         | No       | Whether this field is required                  |
| `enabled`      | `boolean`         | No       | Whether this field is enabled/editable          |
| `visible`      | `boolean`         | No       | Whether this field is visible                   |
| `readonly`     | `boolean`         | No       | Whether this field is read-only                 |
| `defaultValue` | `any`             | No       | Default value for the field                     |
| `validation`   | `ValidationRules` | No       | Validation rules for the field                  |

### Validation Rules

```tsx
const validation = {
  requiredMessage: "This field is required",
  regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
  validationMessage: "Invalid format",
  minLength: 3,
  maxLength: 50,
  min: 0,
  max: 100,
  custom: (value: any) => boolean | string,
};
```

### Field-Specific Properties

#### Text Input

```tsx
{
  type: "text",
  placeholder: "Enter text",
  maxLength: 100,
  minLength: 3,
  pattern: "^[a-zA-Z0-9]+$",
}
```

#### Email Input

```tsx
{
  type: "email",
  validation: {
    regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    validationMessage: "Please enter a valid email address",
  },
}
```

#### Checkbox

```tsx
{
  type: "checkbox",
  isMultiple: boolean,
  options: Array<{ label: string, value: any }>,
  layout: "inline" | "stacked",
}
```

#### Dropdown

```tsx
{
  type: "dropdown",
  options: Array<{ label: string, value: any }>,
  dataSource: {
    collectionName: string,
    labelField: string,
    valueField: string,
    sortField: string,
    sortOrder: "asc" | "desc",
  },
}
```

#### File Upload

```tsx
{
  type: "file",
  isMultiple: boolean,
  fileConfig: {
    allowedTypes: string[],
    maxSize: number,
    directory: string,
    multiple: boolean,
  },
}
```

## Filtering Mechanisms

The component supports three types of filters:

### 1. Hardcoded Filters

Hardcoded filters are predefined filters that are always applied to the list view:

```tsx
const hardcodedFilter = {
  isActive: true, // Only show active users
  role: "admin", // Only show admin users
  status: "approved", // Only show approved items
};

<CRUDComponent
  // ... other props
  initialFilter={hardcodedFilter}
/>;
```

### 2. Posted Filters

Posted filters are filters that are sent to the server with each request:

```tsx
const postedFilter = {
  search: "john",
  status: ["active", "pending"],
  dateRange: {
    start: "2024-01-01",
    end: "2024-12-31",
  },
};

<CRUDComponent
  // ... other props
  postedFilter={postedFilter}
/>;
```

### 3. Query String Filters

Query string filters are filters that are encoded in the URL, allowing for shareable filtered views:

```tsx
// Example URL with filters
// /users?filter=eyJzZWFyY2giOiJqb2huIiwic3RhdHVzIjpbImFjdGl2ZSIsInBlbmRpbmciXX0=

// Implementation
import { useInitialFilter } from "@/hooks/useInitialFilter";
import { encryptFilter } from "@/utils/encryption";

export default function App() {
  const initialFilter = useInitialFilter({
    postedFilter,
    hardcodedFilter,
  });

  // Function to update URL with encrypted filter
  const updateFilterInURL = (filter: Record<string, unknown>) => {
    const encryptedFilter = encryptFilter(filter);
    const newURL = new URL(window.location.href);
    newURL.searchParams.set("filter", encryptedFilter);
    router.push(newURL.toString());
  };

  return (
    <CRUDComponent
      // ... other props
      initialFilter={initialFilter}
    />
  );
}
```

### Filter Examples

```tsx
// Filter helper functions
export const filterExamples = {
  // Show only admin users
  adminUsers: () => ({
    role: "admin",
  }),

  // Show only active users
  activeUsers: () => ({
    isActive: true,
  }),

  // Show active admin users
  activeAdmins: () => ({
    role: "admin",
    isActive: true,
  }),

  // Show users in a specific city
  usersInCity: (city: string) => ({
    "address.city": city,
  }),

  // Show users with specific skills
  usersWithSkills: (skills: string[]) => ({
    skills: { $in: skills },
  }),

  // Advanced filter with multiple conditions
  advancedFilter: () => ({
    $and: [
      { isActive: true },
      { role: "admin" },
      { "address.country": "USA" },
      { skills: { $in: ["react", "typescript"] } },
    ],
  }),
};
```

### Filter Usage Examples

```tsx
// Apply filter and navigate
const applyFilter = (filterUrl: string) => {
  router.push(filterUrl);
};

// Share with combined filters
const shareWithFilters = (rowId: string) => {
  const combinedFilter = {
    ...hardcodedFilter,
    _id: rowId,
  };
  updateFilterInURL(combinedFilter);
};

// Example buttons
<button onClick={() => applyFilter(filterExamples.adminUsers())}>
  Show Admins
</button>
<button onClick={() => applyFilter(filterExamples.activeUsers())}>
  Show Active Users
</button>
<button onClick={() => applyFilter(filterExamples.advancedFilter())}>
  Advanced Filter
</button>
```

## Props

### Required Props

| Prop               | Type          | Description                    |
| ------------------ | ------------- | ------------------------------ |
| `formStructure`    | `FormField[]` | Array of field configurations  |
| `collectionName`   | `string`      | Name of the MongoDB collection |
| `connectionString` | `string`      | MongoDB connection string      |

### Optional Props

| Prop                 | Type                      | Default   | Description                       |
| -------------------- | ------------------------- | --------- | --------------------------------- |
| `layout`             | `LayoutSettings`          | See below | Layout and text customizations    |
| `permissions`        | `Permissions`             | See below | Access control settings           |
| `initialFilter`      | `Record<string, unknown>` | `{}`      | Initial filter for the list view  |
| `rowActions`         | `RowAction[]`             | `[]`      | Custom actions for each row       |
| `onAfterAdd`         | `(entity: any) => void`   | -         | Callback after adding an entity   |
| `onAfterEdit`        | `(entity: any) => void`   | -         | Callback after editing an entity  |
| `onAfterDelete`      | `(id: string) => void`    | -         | Callback after deleting an entity |
| `onAfterGroupDelete` | `(ids: string[]) => void` | -         | Callback after group deletion     |

### Layout Settings

```tsx
const layout = {
  direction: "rtl", // or "ltr"
  width: "100%",
  texts: {
    addButton: "Add",
    editButton: "Edit",
    deleteButton: "Delete",
    cancelButton: "Cancel",
    clearButton: "Clear",
    searchButton: "Search",
    advancedSearchButton: "Advanced Search",
    applyFiltersButton: "Apply Filters",
    addModalTitle: "Add New Entry",
    editModalTitle: "Edit Entry",
    deleteModalTitle: "Delete Confirmation",
    advancedSearchModalTitle: "Advanced Search",
    deleteConfirmationMessage: "Are you sure?",
    noResultsMessage: "No results found",
    loadingMessage: "Loading...",
    processingMessage: "Processing...",
    actionsColumnTitle: "Actions",
    showEntriesText: "Show",
    pageText: "Page",
    ofText: "of",
    searchPlaceholder: "Search...",
    selectPlaceholder: "Select an option",
    filtersAppliedText: "Filters applied",
    clearFiltersText: "Clear filters",
  },
};
```

### Permissions

```tsx
const permissions = {
  canList: true, // View the list
  canAdd: true, // Add new entries
  canEdit: true, // Edit existing entries
  canDelete: true, // Delete entries
  canGroupDelete: true, // Delete multiple entries
  canAdvancedSearch: true, // Use advanced search
  canSearchAllFields: true, // Search across all fields
};
```

### Row Actions

```tsx
const rowActions = [
  {
    label: "View",
    link: "/view",
    icon: ViewIcon,
  },
  {
    label: "Share",
    action: (rowId: string) => {
      // Custom action
      console.log("Share clicked for row:", rowId);
    },
    icon: ShareIcon,
  },
];
```

## Styling

The component uses Tailwind CSS for styling and supports custom class names through the `className` prop. You can also customize the appearance of specific elements using the style props in the field configurations.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
