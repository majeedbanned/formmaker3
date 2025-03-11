"use client";

import CRUDComponent from "@/components/CRUDComponent";
import { DocumentIcon, ShareIcon } from "@heroicons/react/24/outline";

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
    readonly: false,
    listLabelColor: "#2563eb",
    defaultValue: "hasani",
    validation: {
      requiredMessage: "First name is required",
    },
  },

  // {
  //   name: "fa",
  //   title: "fa Name",
  //   type: "text",
  //   isShowInList: true,
  //   isSearchable: true,

  //   required: true,
  //   enabled: true,
  //   visible: true,
  //   validation: {
  //     requiredMessage: "First name is required",
  //   },
  // },

  // {
  //   name: "maaa",
  //   title: "maa Name",
  //   type: "text",
  //   isShowInList: true,
  //   isSearchable: true,

  //   required: true,
  //   enabled: true,
  //   visible: true,
  //   validation: {
  //     requiredMessage: "First name is required",
  //   },
  // },
  // {
  //   name: "lastName",
  //   title: "Last Name",
  //   type: "text",
  //   isShowInList: true,
  //   isSearchable: true,

  //   required: true,
  //   enabled: true,
  //   visible: true,
  //   validation: {
  //     requiredMessage: "Last name is required",
  //   },
  // },
  // {
  //   name: "email",
  //   isShowInList: true,
  //   isSearchable: true,

  //   title: "Email",
  //   type: "email",
  //   required: true,
  //   enabled: true,
  //   visible: true,
  //   validation: {
  //     regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
  //     requiredMessage: "Email is required",
  //     validationMessage: "Please enter a valid email address",
  //   },
  // },
  {
    name: "isActive",
    title: "Active Status",
    type: "checkbox",
    isShowInList: true,
    isSearchable: true,
    required: false,
    enabled: true,
    visible: true,
    readonly: false,
    defaultValue: true,
  },
  {
    name: "notifications",
    title: "Notification Settings",
    type: "checkbox",
    isShowInList: true,
    isSearchable: true,
    required: false,
    enabled: true,
    visible: true,
    readonly: false,
    defaultValue: [],
    isMultiple: true,
    options: [
      { label: "Email", value: "email" },
      { label: "SMS", value: "sms" },
      { label: "Push", value: "push" },
    ],
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
    readonly: false,
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

    dataSource: {
      collectionName: "form_entries22",
      labelField: "email",
      valueField: "_id",
      sortField: "email",
      sortOrder: "asc",
      // filterQuery: { isActive: true }
    },

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

  // {
  //   name: "notes",
  //   title: "Notes",
  //   type: "textarea",
  //   isShowInList: true,
  //   isSearchable: true,

  //   required: false,
  //   enabled: true,
  //   visible: true,
  // },

  {
    enabled: true,
    visible: true,
    isSearchable: true,
    isShowInList: true,
    name: "address",
    title: "Address",
    fields: [
      {
        name: "street",
        title: "Street",
        type: "text",
        enabled: true,
        visible: true,
        isSearchable: true,
        isShowInList: true,
      },
      {
        name: "city",
        title: "City",
        type: "text",
        enabled: true,
        visible: true,
        isSearchable: true,
        isShowInList: true,
      },
      {
        enabled: true,
        visible: true,
        isSearchable: true,
        isShowInList: true,
        name: "country",
        title: "Country",
        type: "dropdown",
        required: true,
        // dataSource: {
        //   collectionName: "Student",
        //   labelField: "email",
        //   valueField: "_id",
        //   sortField: "email",
        //   sortOrder: "asc",
        // },
      },
    ],
    orientation: "horizontal",
    isOpen: false,
  },

  {
    enabled: true,
    visible: true,
    isShowInList: true,
    isSearchable: true,
    name: "phones",
    title: "Phone Numbers",
    nestedType: "array",
    fields: [
      {
        enabled: true,
        visible: true,
        isSearchable: true,
        required: true,
        isShowInList: true,
        name: "type",
        title: "Type",
        type: "dropdown",
        options: [
          { label: "Admin", value: "admin" },
          { label: "User", value: "user" },
          { label: "Guest", value: "guest" },
        ],
      },
      {
        name: "number",
        title: "Number",
        type: "text",
        enabled: true,
        visible: true,
        isSearchable: true,
        isShowInList: true,
      },
    ],
    orientation: "horizontal",
    isOpen: true,
  },
] as const;

const layout = {
  direction: "rtl" as const, // or 'ltr'
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
} as const;

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
          initialFilter={
            {
              // role: "guest", firstName: "hasani"
            }
          }
          permissions={{
            canList: true,
            canAdd: true,
            canEdit: true,
            canDelete: true,
            canGroupDelete: true,
            canAdvancedSearch: true,
            canSearchAllFields: true,
          }}
          layout={layout}
          rowActions={[
            {
              label: "View Document",
              link: "/document", // This will become /document?id=123 when clicked
              icon: DocumentIcon,
            },
            {
              label: "Share",
              action: (rowId) => {
                // Handle share action
                console.log("Share clicked for row:", rowId);
              },
              icon: ShareIcon,
            },
          ]}
        />
      </div>
    </main>
  );
}
