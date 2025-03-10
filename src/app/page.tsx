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
        />
      </div>
    </main>
  );
}
