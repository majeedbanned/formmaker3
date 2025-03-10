"use client";

import CRUDComponent from "@/components/CRUDComponent";

const sampleFormStructure = [
  {
    name: "firstName",
    title: "First Name",
    type: "text",
    isShowInList: true,
    isSearchable: true,
    required: true,
    enabled: true,
    visible: true,
    listLabelColor: "#2563eb",
    defaultValue: "hasani",
    validation: {
      requiredMessage: "First name is required",
    },
  },

  {
    name: "fa",
    title: "fa Name",
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

  {
    name: "maaa",
    title: "maa Name",
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
  {
    name: "lastName",
    title: "Last Name",
    type: "text",
    isShowInList: true,
    isSearchable: true,

    required: true,
    enabled: true,
    visible: true,
    validation: {
      requiredMessage: "Last name is required",
    },
  },
  {
    name: "email",
    isShowInList: true,
    isSearchable: true,

    title: "Email",
    type: "email",
    required: true,
    enabled: true,
    visible: true,
    validation: {
      regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      requiredMessage: "Email is required",
      validationMessage: "Please enter a valid email address",
    },
  },
  {
    name: "role",
    title: "Role",
    type: "dropdown",
    isSearchable: true,

    required: true,
    isShowInList: true,
    enabled: true,
    visible: true,
    options: [
      { label: "Admin", value: "admin" },
      { label: "User", value: "user" },
      { label: "Guest", value: "guest" },
    ],
    validation: {
      requiredMessage: "Please select a role",
    },
  },

  {
    name: "sex",
    title: "Sex",
    type: "dropdown",
    isSearchable: true,

    required: true,
    isShowInList: true,
    enabled: true,
    visible: true,
    options: [
      { label: "Man", value: "man" },
      { label: "Woman", value: "woman" },
    ],
    validation: {
      requiredMessage: "Please select a sex",
    },
  },

  {
    name: "notes",
    title: "Notes",
    type: "textarea",
    isShowInList: true,
    isSearchable: true,

    required: false,
    enabled: true,
    visible: true,
  },
];

const layout = {
  direction: "rtl", // or 'ltr'
  width: "100%", // or '800px' or any valid CSS width
  texts: {
    // Button texts
    addButton: "افزودن",
    editButton: "Edit",
    deleteButton: "Delete",
    cancelButton: "Cancel",
    clearButton: "Clear",
    searchButton: "Search",
    advancedSearchButton: "Advanced Search",
    applyFiltersButton: "Apply Filters",

    // Modal titles
    addModalTitle: "Add New Entry",
    editModalTitle: "Edit Entry",
    deleteModalTitle: "Delete Confirmation",
    advancedSearchModalTitle: "Advanced Search",

    // Messages
    deleteConfirmationMessage:
      "Are you sure you want to delete this item? This action cannot be undone.",
    noResultsMessage: "No results found",
    loadingMessage: "Loading...",
    processingMessage: "Processing...",

    // Table texts
    actionsColumnTitle: "Actions",
    showEntriesText: "Show",
    pageText: "Page",
    ofText: "of",

    // Search
    searchPlaceholder: "Search all fields...",
    selectPlaceholder: "Select an option",

    // Filter indicators
    filtersAppliedText: "Advanced search filters applied",
    clearFiltersText: "Clear filters",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Dynamic Form CRUD Example
        </h1>

        <CRUDComponent
          formStructure={sampleFormStructure}
          collectionName="users2"
          connectionString={process.env.NEXT_PUBLIC_MONGODB_URI || ""}
          initialFilter={{ role: "guest", firstName: "hasani" }}
          permissions={{
            canList: true,
            canAdd: true, // Users can't add new items
            canEdit: true,
            canDelete: true, // Users can't delete items
            canAdvancedSearch: true,
            canSearchAllFields: true,
          }}
          layout={layout}
        />
      </div>
    </main>
  );
}
