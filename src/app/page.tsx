"use client";

import CRUDComponent from "@/components/CRUDComponent";

const sampleFormStructure = [
  {
    name: "firstName",
    title: "First Name",
    type: "text",
    required: true,
    enabled: true,
    visible: true,
    validation: {
      requiredMessage: "First name is required",
    },
  },

  {
    name: "fa",
    title: "fa Name",
    type: "text",
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
    required: true,
    enabled: true,
    visible: true,
    validation: {
      requiredMessage: "Last name is required",
    },
  },
  {
    name: "email",
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
    required: true,
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
        />
      </div>
    </main>
  );
}
