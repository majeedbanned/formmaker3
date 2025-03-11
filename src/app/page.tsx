"use client";

import CRUDComponent from "@/components/CRUDComponent";
import { DocumentIcon, ShareIcon } from "@heroicons/react/24/outline";
import { FormField, LayoutSettings } from "@/types/crud";

const sampleFormStructure: FormField[] = [
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
  //   name: "gender",
  //   title: "Gender",
  //   type: "radio",
  //   isShowInList: true,
  //   isSearchable: true,
  //   required: true,
  //   enabled: true,
  //   visible: true,
  //   readonly: false,
  //   layout: "inline",
  //   options: [
  //     { label: "Male", value: "male" },
  //     { label: "Female", value: "female" },
  //     { label: "Other", value: "other" },
  //   ],
  //   validation: {
  //     requiredMessage: "Please select your gender",
  //   },
  // },

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
    type: "text",
    required: false,
    fields: [
      {
        name: "street",
        title: "Street",
        type: "text",
        enabled: true,
        visible: true,
        isSearchable: true,
        isShowInList: true,
        required: false,
      },
      {
        name: "city",
        title: "City",
        type: "text",
        enabled: true,
        visible: true,
        isSearchable: true,
        isShowInList: true,
        required: false,
      },
      {
        name: "country",
        title: "Country",
        type: "dropdown",
        enabled: true,
        visible: true,
        isSearchable: true,
        isShowInList: true,
        required: true,
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
    type: "text",
    required: false,
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
        required: false,
      },
    ],
    orientation: "horizontal",
    isOpen: false,
  },

  {
    name: "section1",
    title: "Personal Information",
    type: "label",
    required: false,
    enabled: true,
    visible: true,
    isShowInList: false,
    isSearchable: false,
    labelStyle: {
      fontSize: "xl",
      fontWeight: "bold",
      color: "blue-600",
      textAlign: "left",
    },
  },
  {
    name: "darkMode",
    title: "Dark Mode",
    type: "switch",
    isShowInList: true,
    isSearchable: false,
    required: false,
    enabled: true,
    visible: true,
    readonly: false,
    defaultValue: false,
    switchStyle: {
      size: "md",
      color: "blue",
      thumbColor: "white",
    },
  },
  {
    name: "interests",
    title: "Interests",
    type: "togglegroup",
    isShowInList: true,
    isSearchable: true,
    required: true,
    enabled: true,
    visible: true,
    readonly: false,
    defaultValue: [],
    layout: "stacked",
    options: [
      { value: "sports", label: "Sports" },
      { value: "music", label: "Music" },
      { value: "reading", label: "Reading" },
      { value: "travel", label: "Travel" },
    ],
    validation: {
      requiredMessage: "Please select at least one interest",
    },
  },
  {
    name: "birthDate",
    title: "تاریخ تولد",
    type: "datepicker",
    isShowInList: true,
    isSearchable: true,
    required: true,
    enabled: true,
    visible: true,
    readonly: false,
    displayFormat: (value: string | number | Date) => {
      if (!value) return "";
      const date = new Date(value);
      const formatter = new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      return formatter.format(date);
    },
    datepickerStyle: {
      format: "YYYY/MM/DD",
      className: "custom-datepicker",
      calendar: "persian",
      locale: "fa",
      calendarPosition: "bottom",
      weekStartDayIndex: 6,
      hideWeekDays: false,
      hideMonth: false,
      hideYear: false,
    },
    validation: {
      requiredMessage: "لطفا تاریخ تولد را وارد کنید",
    },
  },
  // {
  //   name: "availableDates",
  //   title: "Available Dates",
  //   type: "datepicker",
  //   isShowInList: true,
  //   isSearchable: true,
  //   required: true,
  //   enabled: true,
  //   visible: true,
  //   readonly: false,
  //   isMultiple: true,
  //   datepickerStyle: {
  //     format: "YYYY-MM-DD",
  //     className: "custom-datepicker",
  //   },
  //   validation: {
  //     requiredMessage: "Please select at least one available date",
  //   },
  // },
  {
    name: "skills",
    title: "Skills",
    type: "autocomplete",
    isShowInList: true,
    isSearchable: true,
    required: true,
    enabled: true,
    visible: true,
    readonly: false,
    isMultiple: true,
    options: [
      { label: "JavaScript", value: "js" },
      { label: "TypeScript", value: "ts" },
      { label: "React", value: "react" },
      { label: "Node.js", value: "node" },
      { label: "Python", value: "python" },
      { label: "Java", value: "java" },
      { label: "C++", value: "cpp" },
      { label: "Ruby", value: "ruby" },
      { label: "Go", value: "go" },
      { label: "Rust", value: "rust" },
    ],
    validation: {
      requiredMessage: "Please select at least one skill",
    },
    autocompleteStyle: {
      allowNew: true,
      allowBackspace: true,
      maxTags: 10,
      minLength: 1,
      className: "min-h-[38px]",
      tagClassName: "bg-blue-500",
    },
  },
] as const;

const layout: LayoutSettings = {
  direction: "rtl",
  width: "100%",
  texts: {
    addButton: "افزودن",
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
    deleteConfirmationMessage:
      "Are you sure you want to delete this item? This action cannot be undone.",
    noResultsMessage: "No results found",
    loadingMessage: "Loading...",
    processingMessage: "Processing...",
    actionsColumnTitle: "Actions",
    showEntriesText: "Show",
    pageText: "Page",
    ofText: "of",
    searchPlaceholder: "Search all fields...",
    selectPlaceholder: "Select an option",
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
              link: "/document",
              icon: DocumentIcon,
            },
            {
              label: "Share",
              action: (rowId) => {
                console.log("Share clicked for row:", rowId);
              },
              icon: ShareIcon,
            },
          ]}
          onAfterAdd={(entity) => {
            console.log("Entity added:", entity);
            // You can perform additional actions here, like showing a notification
          }}
          onAfterEdit={(entity) => {
            console.log("Entity updated:", entity);
            // You can perform additional actions here, like showing a notification
          }}
          onAfterDelete={(id) => {
            console.log("Entity deleted:", id);
            // You can perform additional actions here, like showing a notification
          }}
          onAfterGroupDelete={(ids) => {
            console.log("Entities deleted:", ids);
            // You can perform additional actions here, like showing a notification
          }}
        />
      </div>
    </main>
  );
}
