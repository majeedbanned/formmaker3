# Enhanced AutocompleteText Component

The `autoCompleteText` field type has been enhanced to support multiple label fields, allowing for more informative dropdown options.

## New Features

- Support for up to three label fields (`labelField`, `labelField2`, `labelField3`)
- Labels are automatically combined with a separator (e.g., "First - Second - Third")
- Still compatible with the existing `customLabel` option for complete customization
- Fully supports searching across all label fields

## Usage

### Basic Configuration

```typescript
const field: FormField = {
  name: "students",
  title: "Students",
  type: "autoCompleteText",
  isShowInList: true,
  isSearchable: true,
  required: false,
  enabled: true,
  visible: true,
  isMultiple: true, // Allow multiple selections

  dataSource: {
    collectionName: "students", // MongoDB collection name
    labelField: "studentName", // Primary label
    valueField: "studentCode", // Value to be stored
    sortField: "studentName",
    sortOrder: "asc",
    filterQuery: { schoolCode: "2295566177" }, // Optional filter
  },

  autoCompleteStyle: {
    allowNew: false, // Don't allow custom values
    maxTags: 5, // Maximum selections
    minLength: 2, // Minimum characters before search
  },
};
```

### Using Multiple Label Fields

```typescript
const field: FormField = {
  name: "studentsMultiLabel",
  title: "Students with Full Details",
  type: "autoCompleteText",
  // ... other properties ...

  dataSource: {
    collectionName: "students",
    labelField: "studentName", // Primary label (First Name)
    labelField2: "studentFamily", // Secondary label (Last Name)
    labelField3: "studentCode", // Third label (Student ID)
    valueField: "studentCode",
    // ... other properties ...
  },
};
```

This will display options as: "John - Smith - 12345"

### Using Custom Label Format

For even more control, you can use the `customLabel` property with placeholders:

```typescript
const field: FormField = {
  name: "customLabelStudents",
  title: "Students (Custom Format)",
  type: "autoCompleteText",
  // ... other properties ...

  dataSource: {
    collectionName: "students",
    labelField: "studentName", // Still required for searching
    valueField: "studentCode",
    customLabel: "{studentName} {studentFamily} ({studentCode})", // Custom format
    // ... other properties ...
  },
};
```

This will display options as: "John Smith (12345)"

## API Reference

### dataSource Properties

| Property         | Type                      | Description                                     |
| ---------------- | ------------------------- | ----------------------------------------------- |
| `collectionName` | `string`                  | MongoDB collection to query                     |
| `labelField`     | `string`                  | Primary field for label and search              |
| `labelField2`    | `string` (optional)       | Secondary field for label                       |
| `labelField3`    | `string` (optional)       | Third field for label                           |
| `valueField`     | `string`                  | Field to use as the value                       |
| `filterQuery`    | `Record<string, unknown>` | MongoDB query filters                           |
| `dependsOn`      | `string` or `string[]`    | Fields this dropdown depends on                 |
| `sortField`      | `string`                  | Field to sort results by                        |
| `sortOrder`      | `"asc"` or `"desc"`       | Sort direction                                  |
| `customLabel`    | `string`                  | Custom label template with {field} placeholders |

### autoCompleteStyle Properties

| Property    | Type      | Description                             |
| ----------- | --------- | --------------------------------------- |
| `allowNew`  | `boolean` | Allow users to create custom values     |
| `maxTags`   | `number`  | Maximum selections for multiple mode    |
| `minLength` | `number`  | Minimum characters before search starts |
| `className` | `string`  | Additional CSS classes                  |

## Demo

A demo page is available at [/admin/autocomplete-demo](/admin/autocomplete-demo) showcasing various configurations of the autocomplete component.

## Implementation Notes

When using `labelField2` or `labelField3`, the backend will automatically combine these fields with a hyphen separator. If you need a custom format, use the `customLabel` property instead.

Search functionality works across all configured label fields. When you type a search term, the backend will search in the primary `labelField`, `labelField2`, and `labelField3` (when provided), returning matches from any of these fields. This makes it easier for users to find items by any part of the label, not just the primary field.
